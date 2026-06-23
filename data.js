(function () {
  const companies = [
    { id: "company-tech", name: "星云科技有限公司", shortName: "星云科技", taxNo: "91310000DEMO00001A", taxOffice: "上海市浦东新区税务局", status: "启用" },
    { id: "company-interactive", name: "星云互动有限公司", shortName: "星云互动", taxNo: "91310000DEMO00002B", taxOffice: "上海市徐汇区税务局", status: "启用" },
    { id: "company-digital", name: "星云数字服务有限公司", shortName: "星云数服", taxNo: "91310000DEMO00003C", taxOffice: "上海市静安区税务局", status: "启用" }
  ];

  const productLines = [
    { id: "line-cloud", name: "云游戏平台", color: "#2d6cdf", owner: "产品中心" },
    { id: "line-overseas", name: "海外发行", color: "#7a5ce5", owner: "海外事业部" },
    { id: "line-ads", name: "广告商业化", color: "#f1983c", owner: "商业化中心" },
    { id: "line-enterprise", name: "企业服务", color: "#21a179", owner: "企业服务部" }
  ];

  const specialDeductionPolicies = [
    { id:"infant-care", name:"3 岁以下婴幼儿照护", standard:2000, unit:"每名婴幼儿/月", note:"父母一方 100% 或双方各 50%" },
    { id:"child-education", name:"子女教育", standard:2000, unit:"每名子女/月", note:"父母一方 100% 或双方各 50%" },
    { id:"continuing-degree", name:"继续教育（学历）", standard:400, unit:"每月", note:"同一学历最长 48 个月" },
    { id:"continuing-certificate", name:"继续教育（职业资格）", standard:3600, unit:"取得证书当年", note:"一次性年度扣除" },
    { id:"medical", name:"大病医疗", standard:null, unit:"年度汇算", note:"按政策范围内实际支出申报" },
    { id:"mortgage", name:"住房贷款利息", standard:1000, unit:"每月", note:"符合条件的首套住房贷款，最长 240 个月" },
    { id:"shanghai-rent", name:"住房租金（上海）", standard:1500, unit:"每月", note:"上海适用档位", marker:"policy-shanghai-rent" },
    { id:"elderly", name:"赡养老人", standard:3000, unit:"每月", note:"非独生子女个人分摊上限 1,500 元" }
  ];

  const shanghaiSocialPolicy = {
    id:"policy-shanghai-social-demo-2025", marker:"policy-shanghai", name:"上海社会保险参数",
    location:"上海", effectiveFrom:"2025-07-01", effectiveTo:"2026-06-30",
    baseMin:7460, baseMax:37302,
    employeeRates:{ pension:0.08, medical:0.02, unemployment:0.005 },
    employerRates:{ pension:0.16, medical:0.095, unemployment:0.005, injury:0.002 },
    status:"Demo 待复核", reviewMarker:"policy-review-pending"
  };

  const shanghaiHousingFundPolicy = {
    id:"policy-shanghai-housing-demo-2025", marker:"policy-shanghai", name:"上海住房公积金参数",
    location:"上海", effectiveFrom:"2025-07-01", effectiveTo:"2026-06-30",
    baseMin:2690, baseMax:37302, employeeRate:0.07, employerRate:0.07,
    optionalRateRange:"5%–7%", status:"Demo 待复核", reviewMarker:"policy-review-pending"
  };

  const policyVersions = [
    { id:"policy-cn-tax-current", name:"中国个人所得税专项附加扣除", region:"中国", effectiveFrom:"2023-01-01", effectiveTo:null, status:"现行标准", marker:"policy-cn-tax" },
    shanghaiSocialPolicy,
    shanghaiHousingFundPolicy
  ];

  const employees = [
    { id:"001", name:"林悦", department:"产品部", jobTitle:"产品经理", employmentType:"全日制", hireDate:"2025-07-01", regularDate:"2025-10-01", employeeStatus:"在职", companyId:"company-tech", baseSalary:14000, performanceBase:1000, socialBase:11895, bonus:1200, allowance:300, mealAllowance:450, attendanceDeduction:0, pension:951.6, medical:237.9, unemployment:59.48, housingFund:713.7, socialAdjustment:0, specialDeduction:2000, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:0, compensation:0, bank:"招商银行 · 8842", status:"正常", allocations:[{lineId:"line-cloud",percent:70},{lineId:"line-overseas",percent:30}] },
    { id:"002", name:"周航", department:"研发部", jobTitle:"高级工程师", employmentType:"全日制", hireDate:"2025-06-16", regularDate:"2025-09-16", employeeStatus:"在职", companyId:"company-tech", baseSalary:18000, performanceBase:2500, socialBase:12800, bonus:3000, allowance:500, mealAllowance:450, attendanceDeduction:0, pension:1024, medical:256, unemployment:64, housingFund:768, socialAdjustment:0, specialDeduction:1000, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:0, compensation:0, bank:"工商银行 · 3167", status:"波动异常", allocations:[{lineId:"line-cloud",percent:100}] },
    { id:"003", name:"陈思", department:"运营部", jobTitle:"运营主管", employmentType:"全日制", hireDate:"2025-08-04", regularDate:"2025-11-04", employeeStatus:"在职", companyId:"company-interactive", baseSalary:10500, performanceBase:1500, socialBase:10804, bonus:600, allowance:300, mealAllowance:420, attendanceDeduction:0, pension:864.32, medical:216.08, unemployment:54.02, housingFund:648.24, socialAdjustment:0, specialDeduction:1500, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:0, compensation:0, bank:"建设银行 · 0925", status:"正常", allocations:[{lineId:"line-ads",percent:60},{lineId:"line-enterprise",percent:40}] },
    { id:"004", name:"顾宁", department:"财务部", jobTitle:"财务经理", employmentType:"全日制", hireDate:"2025-05-12", regularDate:"2025-08-12", employeeStatus:"在职", companyId:"company-digital", baseSalary:12500, performanceBase:1800, socialBase:10664, bonus:1000, allowance:400, mealAllowance:450, attendanceDeduction:0, pension:853.12, medical:213.28, unemployment:53.32, housingFund:639.84, socialAdjustment:0, specialDeduction:3000, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:0, compensation:0, bank:"中国银行 · 7719", status:"正常", allocations:[{lineId:"line-enterprise",percent:100}] },
    { id:"005", name:"唐可", department:"市场部", jobTitle:"市场专员", employmentType:"全日制", hireDate:"2025-11-10", regularDate:"2026-02-10", employeeStatus:"试用期", companyId:"company-interactive", baseSalary:9500, performanceBase:2000, socialBase:9751, bonus:4800, allowance:300, mealAllowance:400, attendanceDeduction:0, pension:780.08, medical:195.02, unemployment:48.76, housingFund:585.06, socialAdjustment:0, specialDeduction:1000, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:500, compensation:0, bank:"浦发银行 · 4506", status:"波动异常", allocations:[{lineId:"line-overseas",percent:50},{lineId:"line-ads",percent:50}] },
    { id:"006", name:"许安", department:"行政部", jobTitle:"行政专员", employmentType:"全日制", hireDate:"2025-12-01", regularDate:"2026-03-01", employeeStatus:"试用期", companyId:"company-digital", baseSalary:8500, performanceBase:1000, socialBase:7460, bonus:0, allowance:300, mealAllowance:390, attendanceDeduction:0, pension:596.8, medical:149.2, unemployment:37.3, housingFund:447.6, socialAdjustment:0, specialDeduction:0, previousTaxableIncome:0, previousTax:0, afterTaxSubsidy:0, compensation:0, bank:"交通银行 · 6281", status:"正常", allocations:[{lineId:"line-enterprise",percent:100}] }
  ];

  const monthlyPerformanceRecords = [
    {employeeId:"001",month:"2026-01",score:.92,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"},
    {employeeId:"002",month:"2026-01",score:.88,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"},
    {employeeId:"003",month:"2026-01",score:.81,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"},
    {employeeId:"004",month:"2026-01",score:.95,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"},
    {employeeId:"005",month:"2026-01",score:.76,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"},
    {employeeId:"006",month:"2026-01",score:.86,source:"表格导入",reason:"绩效汇总表",operator:"人事专员",operatedAt:"2026-02-03 10:00",version:"R1"}
  ];

  const monthlyContributionSnapshots = employees.map((employee) => ({
    employeeId:employee.id,
    month:"2026-01",
    socialBase:employee.socialBase,
    housingFundBase:employee.socialBase,
    source:"自动带入",
    reason:"2026 年 1 月初始快照",
    operator:"财务管理员",
    operatedAt:"2026-01-05 10:00",
    version:"B1"
  }));

  const payrollRuns = [
    { month:"2026-01", version:"P1", status:"已计算", calculatedAt:"2026-02-06 10:26", people:employees.length, operator:"财务管理员" }
  ];

  const getShanghaiEmployeeContributions = (employee) => {
    const socialBase = Math.min(shanghaiSocialPolicy.baseMax, Math.max(shanghaiSocialPolicy.baseMin, employee.socialBase));
    const housingBase = Math.min(shanghaiHousingFundPolicy.baseMax, Math.max(shanghaiHousingFundPolicy.baseMin, employee.socialBase));
    return {
      pension:socialBase * shanghaiSocialPolicy.employeeRates.pension,
      medical:socialBase * shanghaiSocialPolicy.employeeRates.medical,
      unemployment:socialBase * shanghaiSocialPolicy.employeeRates.unemployment,
      housingFund:housingBase * shanghaiHousingFundPolicy.employeeRate
    };
  };

  const annualTaxRows = employees.map((employee, employeeIndex) => ({
    employeeId: employee.id,
    year: 2026,
    months: Array.from({ length: 12 }, (_, index) => {
      const active = index < 6;
      const performanceRecord = monthlyPerformanceRecords.find((record)=>record.employeeId===employee.id&&record.month==="2026-01");
      const income = active ? employee.baseSalary + employee.performanceBase * performanceRecord.score + employee.bonus / 3 : 0;
      const contributions = getShanghaiEmployeeContributions(employee);
      const deductions = active ? 5000 + contributions.pension + contributions.medical + contributions.unemployment + contributions.housingFund + employee.specialDeduction : 0;
      const taxable = Math.max(0, income - deductions);
      return { month: index + 1, income: Math.round(income * 100) / 100, deductions: Math.round(deductions * 100) / 100, taxable, tax: active ? Math.round(taxable * (.03 + employeeIndex * .002) * 100) / 100 : 0 };
    })
  }));

  const taxEntities = companies.map((company, index) => ({
    ...company,
    period: "2026-01",
    people: employees.filter((employee) => employee.companyId === company.id).length,
    filingStatus: index === 1 ? "待申报" : "已申报",
    filedAt: index === 1 ? "—" : "2026-02-10 14:20"
  }));

  const reportingRows = employees.map((employee, index) => ({
    employeeId: employee.id,
    entityId: employee.companyId,
    status: index === 4 ? "报送失败" : index === 5 ? "待报送" : "已报送",
    reason: index === 4 ? "证件有效期信息缺失" : "",
    reportedAt: index < 4 ? "2026-01-28 10:30" : "—"
  }));

  const payslipBatches = companies.map((company, index) => ({
    companyId: company.id,
    month: "2026-01",
    version: index === 0 ? "V2" : "V1",
    status: "已发布",
    publishedAt: "2026-02-08 18:00",
    total: employees.filter((employee) => employee.companyId === company.id).length
  }));

  const confirmationRows = employees.map((employee, index) => ({
    employeeId: employee.id,
    month: "2026-01",
    version: employee.companyId === "company-tech" ? "V2" : "V1",
    viewedAt: index < 5 ? `2026-02-0${9 + (index % 1)} 09:${10 + index}` : "—",
    status: index < 4 ? "已确认" : index === 4 ? "已查看待确认" : "待查看",
    confirmedAt: index < 4 ? `2026-02-09 10:${20 + index}` : "—"
  }));

  const socialBills = companies.map((company, index) => {
    const members = employees.filter((employee) => employee.companyId === company.id);
    const contributions = members.map(getShanghaiEmployeeContributions);
    const payrollAmount = contributions.reduce((sum, item) => sum + item.pension + item.medical + item.unemployment + item.housingFund, 0);
    const difference = index === 1 ? 186.4 : 0;
    return {
      companyId: company.id, month: "2026-01", people: members.length,
      pension: contributions.reduce((sum, item) => sum + item.pension, 0),
      medical: contributions.reduce((sum, item) => sum + item.medical, 0),
      unemployment: contributions.reduce((sum, item) => sum + item.unemployment, 0),
      housingFund: contributions.reduce((sum, item) => sum + item.housingFund, 0),
      payrollAmount, billAmount: payrollAmount + difference, difference,
      status: difference ? "存在差异" : "核对一致"
    };
  });

  window.PayrollGroupData = {
    companies, productLines, employees, annualTaxRows, taxEntities,
    reportingRows, payslipBatches, confirmationRows, socialBills,
    specialDeductionPolicies, shanghaiSocialPolicy,
    shanghaiHousingFundPolicy, policyVersions,
    monthlyContributionSnapshots, payrollRuns, monthlyPerformanceRecords
  };
}());
