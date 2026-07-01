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

  function sumByLine(records, month) {
    return (records || [])
      .filter((row) => row.month === month && row.lineId)
      .reduce((map, row) => {
        map[row.lineId] = (map[row.lineId] || 0) + Number(row.amount || 0);
        return map;
      }, {});
  }

  function calculateBusinessAccounting(data, month) {
    const payrollRows = calculateGroupPayroll(
      data.employees,
      data.monthlyContributionSnapshots,
      month,
      data.monthlyPerformanceRecords
    );

    const lineMap = Object.fromEntries(data.productLines.map((line) => [line.id, line]));
    const revenueByLine = sumByLine(data.monthlyRevenueRecords, month);
    const directCostByLine = sumByLine(data.monthlyDirectCostRecords, month);
    const directExpenseByLine = sumByLine((data.monthlyExpenseRecords || []).filter((row) => row.allocationMode === "direct"), month);
    const sharedExpenses = (data.monthlyExpenseRecords || [])
      .filter((row) => row.month === month && row.allocationMode === "shared")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const laborByLine = {};
    let sharedLaborPool = 0;

    payrollRows.forEach((row) => {
      const employee = data.employees.find((item) => item.id === row.id);
      const laborCost = Number(row.employerCost || row.salaryTotal || 0);
      if (employee.costAttribution === "sharedLaborPool") {
        sharedLaborPool += laborCost;
        return;
      }
      (employee.allocations || []).forEach((allocation) => {
        laborByLine[allocation.lineId] = (laborByLine[allocation.lineId] || 0) + laborCost * allocation.percent / 100;
      });
    });

    const totalRevenue = Object.values(revenueByLine).reduce((sum, value) => sum + value, 0);
    const sharedPool = sharedExpenses + sharedLaborPool;

    const rows = data.productLines.map((line) => {
      const revenue = revenueByLine[line.id] || 0;
      const directCost = directCostByLine[line.id] || 0;
      const laborCost = laborByLine[line.id] || 0;
      const departmentExpense = directExpenseByLine[line.id] || 0;
      const allocatedExpense = totalRevenue ? sharedPool * revenue / totalRevenue : 0;
      const profit = revenue - directCost - laborCost - departmentExpense - allocatedExpense;
      const grossProfit = revenue - directCost;
      const expense = departmentExpense + allocatedExpense;
      const costAndExpense = directCost + laborCost + departmentExpense + allocatedExpense;
      return {
        lineId: line.id,
        lineName: line.name,
        color: line.color,
        revenue: toMoney(revenue),
        directCost: toMoney(directCost),
        laborCost: toMoney(laborCost),
        departmentExpense: toMoney(departmentExpense),
        allocatedExpense: toMoney(allocatedExpense),
        profit: toMoney(profit),
        grossProfit: toMoney(grossProfit),
        grossProfitRate: revenue ? grossProfit / revenue : 0,
        expense: toMoney(expense),
        netProfit: toMoney(profit),
        netProfitRate: revenue ? profit / revenue : 0,
        profitRate: revenue ? profit / revenue : 0,
        laborCostRate: revenue ? laborCost / revenue : 0,
        costExpenseRate: revenue ? costAndExpense / revenue : 0
      };
    });

    const totals = rows.reduce((sum, row) => ({
      revenue: sum.revenue + row.revenue,
      directCost: sum.directCost + row.directCost,
      laborCost: sum.laborCost + row.laborCost,
      departmentExpense: sum.departmentExpense + row.departmentExpense,
      allocatedExpense: sum.allocatedExpense + row.allocatedExpense,
      profit: sum.profit + row.profit
    }), { revenue:0, directCost:0, laborCost:0, departmentExpense:0, allocatedExpense:0, profit:0 });

    Object.keys(totals).forEach((key) => { totals[key] = toMoney(totals[key]); });
    totals.profitRate = totals.revenue ? totals.profit / totals.revenue : 0;
    totals.laborCostRate = totals.revenue ? totals.laborCost / totals.revenue : 0;
    totals.grossProfit = toMoney(totals.revenue - totals.directCost);
    totals.grossProfitRate = totals.revenue ? totals.grossProfit / totals.revenue : 0;
    totals.expense = toMoney(totals.departmentExpense + totals.allocatedExpense);
    totals.netProfit = totals.profit;
    totals.netProfitRate = totals.profitRate;

    return {
      month,
      rows,
      totals,
      sharedExpenses: toMoney(sharedExpenses),
      sharedLaborPool: toMoney(sharedLaborPool),
      allocationMethod: "revenue",
      lineMap
    };
  }

  function calculateCostManagement(data, month) {
    const accounting = calculateBusinessAccounting(data, month);
    const totalCost = toMoney(accounting.totals.directCost + accounting.totals.laborCost + accounting.totals.departmentExpense + accounting.totals.allocatedExpense);
    const rows = accounting.rows.map((row) => {
      const rowTotalCost = toMoney(row.directCost + row.laborCost + row.departmentExpense + row.allocatedExpense);
      return Object.assign({}, row, {
        totalCost: rowTotalCost,
        totalCostRate: row.revenue ? rowTotalCost / row.revenue : 0
      });
    });
    return {
      month,
      rows,
      totals: Object.assign({}, accounting.totals, {
        totalCost,
        totalCostRate: accounting.totals.revenue ? totalCost / accounting.totals.revenue : 0
      }),
      sharedLaborPool: accounting.sharedLaborPool,
      sharedExpenses: accounting.sharedExpenses
    };
  }

  function calculateExecutiveReport(data, month) {
    const cost = calculateCostManagement(data, month);
    const exceptionCount = (data.collectionExceptionRows || []).length;
    const budgetRows = (data.executiveBudgetRows || []).filter((row) => row.month === month);
    const budgetMap = Object.fromEntries(budgetRows.map((row) => [row.lineId, row]));

    const alertRows = cost.rows.map((row) => {
      const totalCostRate = row.totalCostRate || 0;
      let warningLevel = "green";
      let warningReason = "经营状态健康";
      let actionSuggestion = "保持当前经营节奏，持续跟踪成本率";
      if (row.netProfit < 0 || row.netProfitRate < 0) {
        warningLevel = "red";
        warningReason = "净利为负";
        actionSuggestion = "复核收入确认、直接成本和费用投放，形成专项改善动作";
      } else if (row.netProfitRate < 0.12 || totalCostRate > 0.65) {
        warningLevel = "yellow";
        warningReason = "净利率偏低或成本率偏高";
        actionSuggestion = "重点检查成本结构和公共成本分摊占比";
      }
      return Object.assign({}, row, { warningLevel, warningReason, actionSuggestion });
    });

    const budgetAttainmentRows = cost.rows.map((row) => {
      const budget = budgetMap[row.lineId] || {};
      const revenueBudget = Number(budget.revenueBudget || 0);
      const netProfitTarget = Number(budget.netProfitTarget || 0);
      const budgetCompletionRate = revenueBudget ? row.revenue / revenueBudget : 0;
      const varianceAmount = row.revenue - revenueBudget;
      const netProfitVariance = row.netProfit - netProfitTarget;
      return Object.assign({}, row, budget, {
        revenueBudget,
        netProfitTarget,
        budgetCompletionRate,
        varianceAmount: toMoney(varianceAmount),
        netProfitVariance: toMoney(netProfitVariance),
        attainmentStatus: budgetCompletionRate >= 1 ? "达成" : budgetCompletionRate >= 0.8 ? "基本达成" : "未达成"
      });
    });

    const redCount = alertRows.filter((row) => row.warningLevel === "red").length;
    const yellowCount = alertRows.filter((row) => row.warningLevel === "yellow").length;
    const topLine = [...cost.rows].sort((a, b) => b.netProfit - a.netProfit)[0];
    const executiveSummary = [
      `本月集团收入 ${formatCurrency(cost.totals.revenue)}，净利 ${formatCurrency(cost.totals.netProfit)}，净利率 ${(cost.totals.netProfitRate * 100).toFixed(1)}%。`,
      `本月毛利 ${formatCurrency(cost.totals.grossProfit)}，毛利率 ${(cost.totals.grossProfitRate * 100).toFixed(1)}%，费用及公共分摊合计 ${formatCurrency(cost.totals.expense)}。`,
      `净利贡献最高的产品线为 ${topLine?.lineName || "—"}，贡献净利 ${formatCurrency(topLine?.netProfit || 0)}。`,
      `当前共有 ${redCount} 条红色预警、${yellowCount} 条黄色关注，异常数据 ${exceptionCount} 条。`,
      "建议下月重点复核低净利率产品线的成本结构，并持续跟进公共人工成本分摊。"
    ];

    return {
      month,
      totals: Object.assign({}, cost.totals, {
        exceptionCount,
        alertCount: redCount + yellowCount,
        budgetCompletionRate: budgetAttainmentRows.length ? budgetAttainmentRows.reduce((sum, row) => sum + row.budgetCompletionRate, 0) / budgetAttainmentRows.length : 0
      }),
      alertRows,
      budgetAttainmentRows,
      executiveSummary
    };
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
    calculateGroupPayroll, calculateBusinessAccounting, calculateCostManagement, calculateExecutiveReport, summarizePayrollByCompany, updateContributionSnapshots,
    getMonthlyPerformanceScore, updateMonthlyPerformanceScore,
    toMoney, formatCurrency
  };
}());
