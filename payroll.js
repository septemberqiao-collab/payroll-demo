(function () {
  const taxBrackets = [
    { limit: 36000, rate: 0.03, deduction: 0 },
    { limit: 144000, rate: 0.10, deduction: 2520 },
    { limit: 300000, rate: 0.20, deduction: 16920 },
    { limit: 420000, rate: 0.25, deduction: 31920 },
    { limit: 660000, rate: 0.30, deduction: 52920 },
    { limit: 960000, rate: 0.35, deduction: 85920 },
    { limit: Infinity, rate: 0.45, deduction: 181920 }
  ];
  const toMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const formatCurrency = (value) => "¥" + Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function calculateTax(taxableIncome, previousTax) {
    const taxable = Math.max(0, taxableIncome);
    const bracket = taxBrackets.find((item) => taxable <= item.limit);
    return Math.max(0, toMoney(taxable * bracket.rate - bracket.deduction - (previousTax || 0)));
  }

  function validateAllocations(allocations) {
    return toMoney((allocations || []).reduce((sum, item) => sum + Number(item.percent || 0), 0)) === 100;
  }

  function clampContributionBase(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value || 0)));
  }

  function calculateShanghaiContributions(employee, socialPolicy, housingPolicy, snapshot) {
    const effectiveSocialBase = Number(snapshot?.socialBase ?? employee.socialBase);
    const effectiveHousingFundBase = Number(snapshot?.housingFundBase ?? employee.socialBase);
    return {
      effectiveSocialBase,
      effectiveHousingFundBase,
      socialBaseRisk: effectiveSocialBase < socialPolicy.baseMin || effectiveSocialBase > socialPolicy.baseMax,
      housingFundBaseRisk: effectiveHousingFundBase < housingPolicy.baseMin || effectiveHousingFundBase > housingPolicy.baseMax,
      pension: toMoney(effectiveSocialBase * socialPolicy.employeeRates.pension),
      medical: toMoney(effectiveSocialBase * socialPolicy.employeeRates.medical),
      unemployment: toMoney(effectiveSocialBase * socialPolicy.employeeRates.unemployment),
      housingFund: toMoney(effectiveHousingFundBase * housingPolicy.employeeRate)
    };
  }

  function allocateProductLineCosts(employee, totalCost) {
    if (!validateAllocations(employee.allocations)) return [];
    return employee.allocations.map((item) => ({
      lineId: item.lineId,
      percent: item.percent,
      amount: toMoney(totalCost * item.percent / 100)
    }));
  }

  function getMonthlyPerformanceScore(records, employeeId, month) {
    return records.find((item)=>item.employeeId===employeeId&&item.month===month)?.score;
  }

  function updateMonthlyPerformanceScore(records, employeeId, month, score, reason) {
    const current=records.find((item)=>item.employeeId===employeeId&&item.month===month);
    if(current) Object.assign(current,{score,source:"手工录入",reason,operator:"财务管理员",operatedAt:"刚刚",version:`R${Number(current.version.slice(1)||1)+1}`});
    else records.push({employeeId,month,score,source:"手工录入",reason,operator:"财务管理员",operatedAt:"刚刚",version:"R1"});
    return current||records[records.length-1];
  }

  function calculatePayroll(employee, snapshot, performanceRecord) {
    const shanghaiContributions = calculateShanghaiContributions(
      employee,
      window.PayrollGroupData.shanghaiSocialPolicy,
      window.PayrollGroupData.shanghaiHousingFundPolicy,
      snapshot
    );
    const performanceScore = Number(performanceRecord?.score ?? 0);
    const performanceScoreRisk = performanceScore < 0 || performanceScore > 1.5;
    const performancePay = performanceScoreRisk ? 0 : toMoney(employee.performanceBase * performanceScore);
    const grossIncome = toMoney(employee.baseSalary + performancePay + employee.bonus + employee.allowance + employee.mealAllowance);
    const salaryTotal = toMoney(grossIncome - employee.attendanceDeduction);
    const socialSecurityTotal = toMoney(shanghaiContributions.pension + shanghaiContributions.medical + shanghaiContributions.unemployment + shanghaiContributions.housingFund + employee.socialAdjustment);
    const monthlyDeduction = toMoney(5000 + socialSecurityTotal + employee.specialDeduction);
    const taxableIncome = Math.max(0, toMoney(salaryTotal - monthlyDeduction));
    const cumulativeTaxableIncome = Math.max(0, toMoney(employee.previousTaxableIncome + taxableIncome));
    const withholdingTax = calculateTax(cumulativeTaxableIncome, employee.previousTax);
    const netPay = toMoney(salaryTotal - socialSecurityTotal - withholdingTax);
    const bankAmount = toMoney(netPay + employee.afterTaxSubsidy + employee.compensation);
    const employerCost = toMoney(salaryTotal + socialSecurityTotal * 1.35);
    return Object.assign({}, employee, {
      performanceScore, performanceScoreRisk, performancePay, grossIncome, salaryTotal, socialSecurityTotal, monthlyDeduction,
      taxableIncome, cumulativeTaxableIncome, withholdingTax, netPay, bankAmount, employerCost,
      effectiveSocialBase: shanghaiContributions.effectiveSocialBase,
      effectiveHousingFundBase: shanghaiContributions.effectiveHousingFundBase,
      pension: shanghaiContributions.pension,
      medical: shanghaiContributions.medical,
      unemployment: shanghaiContributions.unemployment,
      housingFund: shanghaiContributions.housingFund,
      socialBaseRisk: shanghaiContributions.socialBaseRisk,
      housingFundBaseRisk: shanghaiContributions.housingFundBaseRisk,
      allocatedCosts: allocateProductLineCosts(employee, employerCost)
    });
  }

  function calculateGroupPayroll(employees, snapshots, month, performanceRecords = window.PayrollGroupData.monthlyPerformanceRecords) {
    return employees.map((employee) => {
      const snapshot = snapshots.find((item) => item.employeeId === employee.id && item.month === month);
      const performanceRecord = performanceRecords.find((item)=>item.employeeId===employee.id&&item.month===month);
      return calculatePayroll(employee, snapshot, performanceRecord);
    });
  }

  function summarizePayrollByCompany(results, companies) {
    return companies.map((company) => {
      const rows = results.filter((item) => item.companyId === company.id);
      return {
        companyId:company.id,
        people:rows.length,
        gross:toMoney(rows.reduce((sum,row)=>sum+row.salaryTotal,0)),
        social:toMoney(rows.reduce((sum,row)=>sum+row.socialSecurityTotal,0)),
        special:toMoney(rows.reduce((sum,row)=>sum+row.specialDeduction,0)),
        taxable:toMoney(rows.reduce((sum,row)=>sum+row.taxableIncome,0)),
        tax:toMoney(rows.reduce((sum,row)=>sum+row.withholdingTax,0)),
        net:toMoney(rows.reduce((sum,row)=>sum+row.netPay,0)),
        exceptions:rows.filter((row)=>row.socialBaseRisk||row.housingFundBaseRisk).length
      };
    });
  }

  function updateContributionSnapshots(snapshots, employeeId, effectiveMonth, socialBase, housingFundBase, reason) {
    const affected = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"].filter((month)=>month>=effectiveMonth);
    affected.forEach((month) => {
      const target = snapshots.find((item)=>item.employeeId===employeeId&&item.month===month);
      if (target) {
        Object.assign(target,{socialBase,housingFundBase,reason,source:"批量修改",operator:"财务管理员",operatedAt:"刚刚",version:`B${Number(target.version.slice(1)||1)+1}`});
      } else {
        snapshots.push({employeeId,month,socialBase,housingFundBase,reason,source:"批量修改",operator:"财务管理员",operatedAt:"刚刚",version:"B1"});
      }
    });
    return affected;
  }

  window.PayrollDemo = {
    calculatePayroll, calculateTax, validateAllocations, allocateProductLineCosts,
    clampContributionBase, calculateShanghaiContributions,
    calculateGroupPayroll, summarizePayrollByCompany, updateContributionSnapshots,
    getMonthlyPerformanceScore, updateMonthlyPerformanceScore,
    toMoney, formatCurrency
  };
}());
