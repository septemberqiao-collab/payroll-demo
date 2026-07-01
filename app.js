(function () {
  const data = window.PayrollGroupData;
  const payroll = window.PayrollDemo;
  const monthOptions = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
  let currentMonth = "2026-01";
  let results = payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);
  let selectedCompany = "all";
  let costDimension = "company";
  let settingsTab = "companies";
  let payrollExpandedCompanies = new Set();
  let payrollRunVersion = data.payrollRuns[0]?.version || "P0";

  const pageMeta = {
    "executive-dashboard":["经营驾驶舱","EXECUTIVE REPORTING"],
    "executive-summary":["经营分析摘要","EXECUTIVE REPORTING"],
    "product-line-alerts":["产品线预警","EXECUTIVE REPORTING"],
    "budget-attainment":["预算达成","EXECUTIVE REPORTING"],
    "collection-dashboard":["采集工作台","DATA COLLECTION"],
    "revenue-collection":["营收账单采集","DATA COLLECTION"],
    "cost-collection":["成本账单采集","DATA COLLECTION"],
    "dingtalk-expense-collection":["钉钉费用采集","DATA COLLECTION"],
    "matching-rules":["数据匹配规则","DATA COLLECTION"],
    "collection-exceptions":["异常数据处理","DATA COLLECTION"],
    "collection-logs":["采集日志","DATA COLLECTION"],
    "cost-dashboard-v2":["成本工作台","COST MANAGEMENT"],
    "direct-costs":["直接成本","COST MANAGEMENT"],
    "labor-costs":["人工成本","COST MANAGEMENT"],
    "expense-costs":["费用成本","COST MANAGEMENT"],
    "shared-cost-pool":["公共成本池","COST MANAGEMENT"],
    "business-dashboard":["经营核算工作台","GROUP BUSINESS ACCOUNTING"],
    "product-accounting":["产品线核算","PRODUCT LINE P&L"],
    "expense-collection":["费用归集","EXPENSE COLLECTION"],
    "allocation-rules":["分摊规则","ALLOCATION RULES"],
    dashboard:["集团薪酬工作台","GROUP PAYROLL"],
    "payroll-workbench":["薪资计算工作台","PAYROLL WORKBENCH"],
    "salary-profiles":["薪资档案","SALARY PROFILES"],
    "special-deductions":["专项附加扣除","SPECIAL DEDUCTIONS"],
    "annual-tax":["个税计算明细（全年）","ANNUAL TAX"],
    "tax-entities":["报税主体管理","TAX ENTITIES"],
    "person-reporting":["人员信息报送","PERSON REPORTING"],
    payslips:["工资条管理","PAYSLIP MANAGEMENT"],
    confirmations:["员工确认记录","PAYSLIP EVIDENCE"],
    "insured-employees":["参保人员","SOCIAL INSURANCE"],
    "social-bills":["社保公积金月结账单","MONTHLY SOCIAL BILLS"],
    "cost-dashboard":["薪酬成本看板","COST ANALYTICS"],
    "payroll-reports":["工资报表","PAYROLL REPORTS"],
    "group-settings":["系统设置","SYSTEM SETTINGS"]
  };
  const companyMap = Object.fromEntries(data.companies.map((item) => [item.id,item]));
  const lineMap = Object.fromEntries(data.productLines.map((item) => [item.id,item]));
  const resultMap = () => Object.fromEntries(results.map((item) => [item.id,item]));
  const visibleEmployees = () => results.filter((employee) => selectedCompany === "all" || employee.companyId === selectedCompany);
  const badgeClass = (status) => /正常|一致|已确认|已申报|已报送|启用|已发布/.test(status) ? "success" : /失败|差异|异常/.test(status) ? "danger" : /待|调整|查看/.test(status) ? "warning" : "neutral";
  const employeeCell = (employee) => `<div class="employee-cell"><div class="avatar">${employee.name[0]}</div><div><strong>${employee.name}</strong><span>${employee.id} · ${employee.department}</span></div></div>`;
  function monthLabel(month) {
    const [year, monthNumber] = month.split("-");
    return `${year} 年 ${Number(monthNumber)} 月`;
  }

  function recalculatePayrollResults() {
    results = payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);
  }

  function setCurrentMonth(month) {
    currentMonth = monthOptions.includes(month) ? month : "2026-01";
    const selector = document.getElementById("global-month-filter");
    if (selector) selector.value = currentMonth;
    recalculatePayrollResults();
    renderAll();
    showToast(`已切换到 ${monthLabel(currentMonth)}`);
  }

  function switchView(viewName) {
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === viewName));
    document.getElementById("view-" + viewName).classList.add("active");
    document.getElementById("page-title").textContent = pageMeta[viewName][0];
    document.getElementById("page-kicker").textContent = pageMeta[viewName][1];
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function toggleNavGroup(groupId) {
    document.getElementById(groupId)?.classList.toggle("open");
  }

  function sectionHeader(kicker,title,description,actions="") {
    return `<div class="section-head"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p></div><div class="head-actions">${actions}</div></div>`;
  }

  function metric(label,value,note,good=false) {
    return `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small class="${good?"good":""}">${note}</small></article>`;
  }

  function warningBadge(level) {
    const label = level === "red" ? "红色预警" : level === "yellow" ? "黄色关注" : "绿色健康";
    const cls = level === "red" ? "danger" : level === "yellow" ? "warning" : "success";
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function renderExecutiveDashboard(){
    const report = payroll.calculateExecutiveReport(data, currentMonth);
    const topRows = [...report.alertRows].sort((a,b)=>b.netProfit-a.netProfit);
    const riskRows = report.alertRows.filter(row=>row.warningLevel!=="green");
    document.getElementById("executive-dashboard-root").innerHTML =
      sectionHeader("EXECUTIVE REPORTING","高层经营驾驶舱","结论先行：3 分钟看懂本月经营结果、风险和建议动作。",`<button class="button ghost" data-view-jump="executive-summary">查看分析摘要</button><button class="button primary" data-view-jump="budget-attainment">查看预算达成</button>`) +
      `<div class="metric-grid">
        ${metric("本月收入",payroll.formatCurrency(report.totals.revenue),"来自营收账单采集",true)}
        ${metric("本月毛利",payroll.formatCurrency(report.totals.grossProfit),`毛利率 ${(report.totals.grossProfitRate*100).toFixed(1)}%`,true)}
        ${metric("本月费用",payroll.formatCurrency(report.totals.expense),"费用 + 公共分摊")}
        ${metric("本月净利",payroll.formatCurrency(report.totals.netProfit),`净利率 ${(report.totals.netProfitRate*100).toFixed(1)}%`,true)}
        ${metric("预算完成率",`${(report.totals.budgetCompletionRate*100).toFixed(1)}%`,"按产品线收入预算均值")}
        ${metric("风险提示",`${report.totals.alertCount} 项`,`异常数据 ${report.totals.exceptionCount} 条`)}
      </div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">MONTHLY CONCLUSION</p><h3>本月经营结论</h3></div><span class="badge info">高层摘要</span></div><div class="summary-list">${report.executiveSummary.map(item=>`<div><span>${item}</span></div>`).join("")}</div></article>
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">RISK</p><h3>关键风险提示</h3></div><button class="text-button" data-view-jump="product-line-alerts">查看预警</button></div><div class="todo-list">${(riskRows.length?riskRows:report.alertRows.slice(0,2)).map(row=>`<div class="todo"><span class="todo-icon ${row.warningLevel==="red"?"orange":row.warningLevel==="yellow"?"orange":"green"}">${row.lineName[0]}</span><div><strong>${row.lineName} · ${row.warningReason}</strong><span>${row.actionSuggestion}</span></div></div>`).join("")}</div></article>
      </div>
      <article class="panel wide" style="margin-top:14px"><div class="panel-head"><div><p class="eyebrow">CONTRIBUTION</p><h3>产品线净利贡献排行</h3></div><button class="text-button" data-view-jump="product-accounting">追溯产品线明细</button></div><div class="bar-chart">${topRows.map(row=>`<div class="bar-row"><label>${row.lineName}</label><div class="bar-track"><div class="bar-fill" style="width:${Math.max(8,row.netProfit/Math.max(topRows[0].netProfit,1)*100)}%;background:${row.color}"></div></div><strong>${payroll.formatCurrency(row.netProfit)}</strong></div>`).join("")}</div></article>`;
  }

  function renderExecutiveSummary(){
    const report = payroll.calculateExecutiveReport(data, currentMonth);
    const sections = [
      ["总体经营表现", report.executiveSummary[0]],
      ["收入变化说明", "收入来自营收账单采集，已按平台账号和产品线完成匹配。"],
      ["成本变化说明", "直接成本由业务账单提供，人工成本由薪酬核算带入，公共成本已进入分摊池。"],
      ["毛利率变化说明", report.executiveSummary[1]],
      ["净利率变化说明", report.executiveSummary[2]],
      ["重点产品线说明", report.executiveSummary[3]],
      ["下月关注事项", report.executiveSummary[4]]
    ];
    document.getElementById("executive-summary-root").innerHTML =
      sectionHeader("EXECUTIVE REPORTING","经营分析摘要","自动形成月度汇报文字框架，财务可在此基础上补充业务原因。",`<button class="button ghost">复制摘要</button><button class="button primary">模拟生成汇报稿</button>`) +
      `<div class="cards-grid">${sections.map((item,index)=>`<article class="settings-card"><span class="badge info">${index+1}</span><h3>${item[0]}</h3><p>${item[1]}</p></article>`).join("")}</div>`;
  }

  function renderProductLineAlerts(){
    const report = payroll.calculateExecutiveReport(data, currentMonth);
    document.getElementById("product-line-alerts-root").innerHTML =
      sectionHeader("EXECUTIVE REPORTING","产品线预警","用红黄绿状态展示每条产品线的经营健康度，并给出建议动作。",`<button class="button ghost" data-view-jump="collection-exceptions">查看异常数据</button>`) +
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>产品线</th><th>收入</th><th>毛利率</th><th>净利率</th><th>成本率</th><th>状态</th><th>预警原因</th><th>建议动作</th></tr></thead><tbody>${report.alertRows.map(row=>`<tr><td><span class="dot" style="background:${row.color}"></span>${row.lineName}</td><td>${payroll.formatCurrency(row.revenue)}</td><td>${(row.grossProfitRate*100).toFixed(1)}%</td><td>${(row.netProfitRate*100).toFixed(1)}%</td><td>${(row.totalCostRate*100).toFixed(1)}%</td><td>${warningBadge(row.warningLevel)}</td><td>${row.warningReason}</td><td>${row.actionSuggestion}</td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderBudgetAttainment(){
    const report = payroll.calculateExecutiveReport(data, currentMonth);
    document.getElementById("budget-attainment-root").innerHTML =
      sectionHeader("EXECUTIVE REPORTING","预算达成","展示预算 vs 实际、完成率、偏差金额和偏差原因。",`<button class="button ghost">导入预算</button><button class="button primary">模拟导出预算分析</button>`) +
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>产品线</th><th>实际收入</th><th>收入预算</th><th>完成率</th><th>收入偏差</th><th>实际净利</th><th>净利目标</th><th>净利偏差</th><th>状态</th><th>偏差原因</th></tr></thead><tbody>${report.budgetAttainmentRows.map(row=>`<tr><td>${row.lineName}</td><td>${payroll.formatCurrency(row.revenue)}</td><td>${payroll.formatCurrency(row.revenueBudget)}</td><td>${(row.budgetCompletionRate*100).toFixed(1)}%</td><td>${payroll.formatCurrency(row.varianceAmount)}</td><td>${payroll.formatCurrency(row.netProfit)}</td><td>${payroll.formatCurrency(row.netProfitTarget)}</td><td>${payroll.formatCurrency(row.netProfitVariance)}</td><td><span class="badge ${row.attainmentStatus==="达成"?"success":row.attainmentStatus==="基本达成"?"warning":"danger"}">${row.attainmentStatus}</span></td><td>${row.varianceReason||"—"}</td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderCollectionDashboard(){
    const revenueDone=data.revenueCollectionRows.filter(r=>r.matchStatus==="已匹配").length;
    const costDone=data.costCollectionRows.filter(r=>r.auditStatus==="已审核").length;
    const dingtalkDone=data.dingtalkExpenseRows.filter(r=>r.approvalStatus==="审批完成").length;
    const totalItems=data.revenueCollectionRows.length+data.costCollectionRows.length+data.dingtalkExpenseRows.length;
    const matched=revenueDone+costDone+dingtalkDone;
    document.getElementById("collection-dashboard-root").innerHTML=
      sectionHeader("DATA COLLECTION","数据采集中心","把平台对账单、业务成本账单、钉钉费用和薪资结果先采集、校验、匹配，再进入经营核算。",`<button class="button ghost">导入账单</button><button class="button primary">同步钉钉费用</button>`)+
      `<div class="metric-grid">
        ${metric("营收账单",`${revenueDone}/${data.revenueCollectionRows.length}`,"平台对账单已匹配",true)}
        ${metric("成本账单",`${costDone}/${data.costCollectionRows.length}`,"业务账单审核进度")}
        ${metric("钉钉费用",`${dingtalkDone}/${data.dingtalkExpenseRows.length}`,"审批完成后入费用池")}
        ${metric("产品线匹配率",`${Math.round(matched/totalItems*100)}%`,"未匹配进入异常处理",true)}
        ${metric("异常数据",`${data.collectionExceptionRows.length} 条`,"待财务/业务补充")}
        ${metric("薪资数据","已计算","内部自动带入人工成本",true)}
      </div>
      <div class="dashboard-grid"><article class="panel"><div class="panel-head"><div><p class="eyebrow">FLOW</p><h3>采集流程</h3></div><span class="badge info">半自动 Demo</span></div><div class="workflow">
        ${[["营收账单","平台下载后导入","revenue-collection","done"],["成本账单","业务上传并审核","cost-collection","current"],["钉钉费用","审批完成后同步","dingtalk-expense-collection","done"],["匹配规则","自动识别产品线","matching-rules","done"],["异常处理","未匹配数据补充","collection-exceptions","current"],["进入核算","输出到成本管理","cost-dashboard-v2",""]].map((item,i)=>`<button class="workflow-card ${item[3]}" data-view-jump="${item[2]}"><b>${i+1}</b><strong>${item[0]}</strong><span>${item[1]}</span></button>`).join("")}
      </div></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">LATEST LOGS</p><h3>最近采集日志</h3></div><button class="text-button" data-view-jump="collection-logs">查看全部</button></div><div class="todo-list">${data.collectionLogs.slice(0,4).map(log=>`<div class="todo"><span class="todo-icon ${log.exceptions?"orange":"green"}">${log.source[0]}</span><div><strong>${log.source} · ${log.action}</strong><span>${log.success} 条成功 / ${log.exceptions} 条异常 · ${log.operatedAt}</span></div></div>`).join("")}</div></article></div>`;
  }

  function renderRevenueCollection(){
    document.getElementById("revenue-collection-root").innerHTML=
      sectionHeader("DATA COLLECTION","营收账单采集","各平台下载对账单后导入，系统按账号/项目自动匹配公司和产品线。",`<button class="button primary">导入营收账单</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>月份</th><th>平台</th><th>账号/项目</th><th>公司</th><th>产品线</th><th>收入金额</th><th>手续/通道费</th><th>税费</th><th>结算金额</th><th>匹配状态</th></tr></thead><tbody>${data.revenueCollectionRows.map(row=>`<tr><td>${row.month}</td><td>${row.platform}</td><td>${row.account}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${lineMap[row.lineId]?.name}</td><td>${payroll.formatCurrency(row.income)}</td><td>${payroll.formatCurrency(row.channelFee)}</td><td>${payroll.formatCurrency(row.taxFee)}</td><td>${payroll.formatCurrency(row.settlementAmount)}</td><td><span class="badge success">${row.matchStatus}</span></td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderCostCollection(){
    document.getElementById("cost-collection-root").innerHTML=
      sectionHeader("DATA COLLECTION","成本账单采集","业务人员提交供应商账单，财务审核后进入直接成本或公共成本池。",`<button class="button primary">上传成本账单</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>月份</th><th>部门</th><th>供应商</th><th>成本类型</th><th>公司</th><th>产品线</th><th>金额</th><th>公共成本</th><th>审核状态</th></tr></thead><tbody>${data.costCollectionRows.map(row=>`<tr><td>${row.month}</td><td>${row.department}</td><td>${row.supplier}</td><td>${row.costType}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${lineMap[row.lineId]?.name||"公共成本池"}</td><td>${payroll.formatCurrency(row.amount)}</td><td>${row.isShared?"是":"否"}</td><td><span class="badge ${row.auditStatus==="已审核"?"success":"warning"}">${row.auditStatus}</span></td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderDingTalkExpenseCollection(){
    document.getElementById("dingtalk-expense-collection-root").innerHTML=
      sectionHeader("DATA COLLECTION","钉钉费用采集","同步钉钉审批/报销数据，按费用类型、部门和产品线进入费用成本。",`<button class="button primary">同步钉钉费用</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>审批单号</th><th>申请人</th><th>部门</th><th>费用类型</th><th>公司</th><th>产品线</th><th>金额</th><th>公共费用</th><th>审批状态</th></tr></thead><tbody>${data.dingtalkExpenseRows.map(row=>`<tr><td>${row.id}</td><td>${row.applicant}</td><td>${row.department}</td><td>${row.expenseType}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${lineMap[row.lineId]?.name||"公共费用池"}</td><td>${payroll.formatCurrency(row.amount)}</td><td>${row.isShared?"是":"否"}</td><td><span class="badge ${row.approvalStatus==="审批完成"?"success":"warning"}">${row.approvalStatus}</span></td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderMatchingRules(){
    document.getElementById("matching-rules-root").innerHTML=
      sectionHeader("DATA COLLECTION","数据匹配规则","通过账号、供应商、部门、员工和费用类型规则，自动匹配产品线与成本归属。",`<button class="button primary">+ 新增规则</button>`)+
      `<div class="cards-grid">${data.dataMatchingRules.map(rule=>`<article class="settings-card"><span class="badge success">${rule.status}</span><h3>${rule.type}</h3><p>${rule.source} → ${rule.targetName}</p><p>目标：${rule.target}</p></article>`).join("")}</div>`;
  }

  function renderCollectionExceptions(){
    document.getElementById("collection-exceptions-root").innerHTML=
      sectionHeader("DATA COLLECTION","异常数据处理","无法自动匹配或审批未完成的数据先进入异常池，处理后再进入核算。",`<button class="button primary">批量处理</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>来源</th><th>异常类型</th><th>说明</th><th>金额</th><th>状态</th><th>处理动作</th></tr></thead><tbody>${data.collectionExceptionRows.map(row=>`<tr><td>${row.source}</td><td>${row.issue}</td><td>${row.description}</td><td>${payroll.formatCurrency(row.amount)}</td><td><span class="badge warning">${row.status}</span></td><td><button class="row-action">补充规则</button></td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderCollectionLogs(){
    document.getElementById("collection-logs-root").innerHTML=
      sectionHeader("DATA COLLECTION","采集日志","记录每次导入、同步、覆盖和异常情况，便于月结追溯。",`<button class="button ghost">导出日志</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>来源</th><th>动作</th><th>操作人</th><th>时间</th><th>成功</th><th>异常</th><th>模式</th><th>状态</th></tr></thead><tbody>${data.collectionLogs.map(row=>`<tr><td>${row.source}</td><td>${row.action}</td><td>${row.operator}</td><td>${row.operatedAt}</td><td>${row.success}</td><td>${row.exceptions}</td><td>${row.mode}</td><td><span class="badge ${row.exceptions?"warning":"success"}">${row.status}</span></td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderCostManagementDashboard(){
    const cost=payroll.calculateCostManagement(data,currentMonth);
    const sorted=[...cost.rows].sort((a,b)=>b.totalCost-a.totalCost);
    const max=Math.max(...sorted.map(row=>row.totalCost),1);
    document.getElementById("cost-dashboard-v2-root").innerHTML=
      sectionHeader("COST MANAGEMENT","成本工作台","汇总直接成本、人工成本、费用成本和公共分摊成本，并输出到产品线经营分析。",`<button class="button ghost">导入成本</button><button class="button primary">生成成本月结</button>`)+
      `<div class="metric-grid">${metric("总成本",payroll.formatCurrency(cost.totals.totalCost),`成本率 ${(cost.totals.totalCostRate*100).toFixed(1)}%`,true)}${metric("直接成本",payroll.formatCurrency(cost.totals.directCost),"业务账单提供")}${metric("人工成本",payroll.formatCurrency(cost.totals.laborCost),"薪酬核算带入")}${metric("费用成本",payroll.formatCurrency(cost.totals.departmentExpense),"钉钉费用归集")}${metric("公共分摊成本",payroll.formatCurrency(cost.totals.allocatedExpense),"按营收占比分摊")}${metric("净利",payroll.formatCurrency(cost.totals.netProfit),`净利率 ${(cost.totals.netProfitRate*100).toFixed(1)}%`,true)}</div>
      <div class="chart-layout"><article class="panel"><div class="panel-head"><div><p class="eyebrow">COST RANKING</p><h3>产品线成本排行</h3></div></div><div class="bar-chart">${sorted.map(row=>`<div class="bar-row"><label>${row.lineName}</label><div class="bar-track"><div class="bar-fill" style="width:${Math.max(8,row.totalCost/max*100)}%;background:${row.color}"></div></div><strong>${payroll.formatCurrency(row.totalCost)}</strong></div>`).join("")}</div></article><article class="panel"><div class="panel-head"><div><p class="eyebrow">COST MIX</p><h3>成本结构</h3></div></div><div class="summary-list"><div><span>直接成本</span><strong>${payroll.formatCurrency(cost.totals.directCost)}</strong></div><div><span>人工成本</span><strong>${payroll.formatCurrency(cost.totals.laborCost)}</strong></div><div><span>费用成本</span><strong>${payroll.formatCurrency(cost.totals.departmentExpense)}</strong></div><div><span>公共分摊</span><strong>${payroll.formatCurrency(cost.totals.allocatedExpense)}</strong></div></div></article></div>`;
  }

  function renderDirectCosts(){
    document.getElementById("direct-costs-root").innerHTML=
      sectionHeader("COST MANAGEMENT","直接成本","直接归属于产品线的云资源、渠道分成、广告流量和交付外包成本。",`<button class="button primary">+ 新增直接成本</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>月份</th><th>公司</th><th>产品线</th><th>成本类型</th><th>金额</th><th>来源</th></tr></thead><tbody>${data.monthlyDirectCostRecords.map(row=>`<tr><td>${row.month}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${lineMap[row.lineId]?.name}</td><td>${row.category}</td><td>${payroll.formatCurrency(row.amount)}</td><td>${row.source}</td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderLaborCosts(){
    const rows=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);
    document.getElementById("labor-costs-root").innerHTML=
      sectionHeader("COST MANAGEMENT","人工成本","薪酬核算负责怎么算，成本管理负责看人工成本进入产品线还是公共人工成本池。",`<button class="button ghost">同步薪酬结果</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>员工</th><th>公司</th><th>部门</th><th>产品线/成本池</th><th>工资总额</th><th>企业承担成本</th><th>归集方式</th></tr></thead><tbody>${rows.map(row=>{const e=data.employees.find(x=>x.id===row.id);return `<tr><td>${employeeCell(row)}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${row.department}</td><td>${e.costAttribution==="sharedLaborPool"?"公共人工成本池":e.allocations.map(a=>lineMap[a.lineId]?.name+" "+a.percent+"%").join(" / ")}</td><td>${payroll.formatCurrency(row.salaryTotal)}</td><td>${payroll.formatCurrency(row.employerCost)}</td><td><span class="badge ${e.costAttribution==="sharedLaborPool"?"warning":"success"}">${e.costAttribution==="sharedLaborPool"?"公共人工成本池":"直接计入产品线"}</span></td></tr>`}).join("")}</tbody></table></div></article>`;
  }

  function renderExpenseCosts(){
    document.getElementById("expense-costs-root").innerHTML=
      sectionHeader("COST MANAGEMENT","费用成本","市场、差旅、办公、研发、行政等费用从费用归集和钉钉审批带入。",`<button class="button ghost">同步费用归集</button>`)+
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>月份</th><th>公司</th><th>部门</th><th>费用类型</th><th>金额</th><th>归集方式</th><th>产品线</th></tr></thead><tbody>${data.monthlyExpenseRecords.map(row=>`<tr><td>${row.month}</td><td>${companyMap[row.companyId]?.shortName}</td><td>${row.department}</td><td>${row.expenseType}</td><td>${payroll.formatCurrency(row.amount)}</td><td>${row.allocationMode==="shared"?"公共费用池":"直接计入"}</td><td>${lineMap[row.lineId]?.name||"公共费用池"}</td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderSharedCostPool(){
    const cost=payroll.calculateCostManagement(data,currentMonth);
    const pools=[{type:"共享人工成本池",source:"薪酬核算",amount:cost.sharedLaborPool,method:"按营收占比",status:"已分摊"},{type:"公共部门费用池",source:"钉钉费用/费用归集",amount:cost.sharedExpenses,method:"按营收占比",status:"已分摊"},{type:"公共办公费用池",source:"行政费用",amount:data.monthlyExpenseRecords.filter(r=>r.allocationMode==="shared"&&r.expenseType==="办公费用").reduce((s,r)=>s+r.amount,0),method:"按营收占比",status:"已分摊"}];
    document.getElementById("shared-cost-pool-root").innerHTML=
      sectionHeader("COST MANAGEMENT","公共成本池","公共人员和共享费用先进入成本池，再按规则分摊到各产品线。",`<button class="button primary">查看分摊明细</button>`)+
      `<div class="cards-grid">${pools.map(pool=>`<article class="settings-card"><span class="badge success">${pool.status}</span><h3>${pool.type}</h3><p>${pool.source}</p><p>金额：<strong>${payroll.formatCurrency(pool.amount)}</strong></p><p>规则：${pool.method}</p></article>`).join("")}</div>`;
  }

  function renderAccountingTable(rows){
    return `<article class="panel wide">
      <div class="panel-head"><div><p class="eyebrow">PRODUCT LINE DETAIL</p><h3>产品线经营明细</h3></div><span class="muted">营收 - 直接成本 - 人工成本 - 部门费用 - 公共分摊费用 = 利润</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>产品线</th><th>营收</th><th>直接成本</th><th>人工成本</th><th>部门费用</th><th>公共分摊费用</th><th>利润</th><th>利润率</th><th>人工成本率</th></tr></thead>
        <tbody>${rows.map(row=>`<tr>
          <td><span class="dot" style="background:${row.color}"></span>${row.lineName}</td>
          <td>${payroll.formatCurrency(row.revenue)}</td>
          <td>${payroll.formatCurrency(row.directCost)}</td>
          <td>${payroll.formatCurrency(row.laborCost)}</td>
          <td>${payroll.formatCurrency(row.departmentExpense)}</td>
          <td>${payroll.formatCurrency(row.allocatedExpense)}</td>
          <td><strong>${payroll.formatCurrency(row.profit)}</strong></td>
          <td><span class="badge ${row.profitRate>0.25?"success":"info"}">${(row.profitRate*100).toFixed(1)}%</span></td>
          <td>${(row.laborCostRate*100).toFixed(1)}%</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </article>`;
  }

  function renderBusinessDashboard(){
    const accounting = payroll.calculateBusinessAccounting(data, currentMonth);
    const sorted = [...accounting.rows].sort((a,b)=>b.profit-a.profit);
    const maxProfit = Math.max(...sorted.map(row=>row.profit), 1);
    document.getElementById("business-dashboard-root").innerHTML =
      sectionHeader("GROUP BUSINESS ACCOUNTING","集团经营核算平台","按月汇总营收、直接成本、人工成本、费用分摊和利润，薪酬核算自动进入产品线人工成本。",`<button class="button ghost">导入营收成本</button><button class="button primary">生成本月核算</button>`) +
      `<div class="metric-grid">
        ${metric("集团总营收",payroll.formatCurrency(accounting.totals.revenue),monthLabel(currentMonth),true)}
        ${metric("集团总利润",payroll.formatCurrency(accounting.totals.profit),`利润率 ${(accounting.totals.profitRate*100).toFixed(1)}%`,true)}
        ${metric("人工成本",payroll.formatCurrency(accounting.totals.laborCost),`人工成本率 ${(accounting.totals.laborCostRate*100).toFixed(1)}%`)}
        ${metric("公共分摊费用",payroll.formatCurrency(accounting.totals.allocatedExpense),"默认按营收占比分摊")}
      </div>
      <div class="chart-layout">
        <article class="panel">
          <div class="panel-head"><div><p class="eyebrow">PROFIT RANKING</p><h3>产品线利润排行</h3></div><span class="muted">点击产品线查看明细</span></div>
          <div class="bar-chart">${sorted.map(row=>`<div class="bar-row" data-view-jump="product-accounting"><label>${row.lineName}</label><div class="bar-track"><div class="bar-fill" style="width:${Math.max(8,row.profit/maxProfit*100)}%;background:${row.color}"></div></div><strong>${payroll.formatCurrency(row.profit)}</strong></div>`).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel-head"><div><p class="eyebrow">ALLOCATION</p><h3>公共费用池</h3></div><span class="badge info">按营收占比</span></div>
          <div class="summary-list">
            <div><span>共享人工成本池</span><strong>${payroll.formatCurrency(accounting.sharedLaborPool)}</strong></div>
            <div><span>共享部门费用池</span><strong>${payroll.formatCurrency(accounting.sharedExpenses)}</strong></div>
            <div><span>本月分摊合计</span><strong>${payroll.formatCurrency(accounting.totals.allocatedExpense)}</strong></div>
          </div>
        </article>
      </div>
      ${renderAccountingTable(accounting.rows)}`;
  }

  function renderProductAccounting(){
    const accounting = payroll.calculateBusinessAccounting(data, currentMonth);
    document.getElementById("product-accounting-root").innerHTML =
      sectionHeader("PRODUCT LINE P&L","产品线核算","查看每条产品业务线的营收、成本、人工成本、费用和利润。",`<button class="button ghost">导入营收</button><button class="button ghost">导入直接成本</button>`) +
      renderAccountingTable(accounting.rows);
  }

  function renderExpenseCollection(){
    document.getElementById("expense-collection-root").innerHTML =
      sectionHeader("EXPENSE COLLECTION","费用归集","按公司、部门和费用类型录入费用，可直接计入产品线或进入公共费用池。",`<button class="button primary">+ 新增费用</button>`) +
      `<article class="panel wide"><div class="table-wrap"><table><thead><tr><th>月份</th><th>公司</th><th>部门</th><th>费用类型</th><th>金额</th><th>归集方式</th><th>产品线</th><th>备注</th></tr></thead><tbody>${data.monthlyExpenseRecords.map(row=>`<tr><td>${row.month}</td><td>${companyMap[row.companyId]?.shortName||"集团"}</td><td>${row.department}</td><td>${row.expenseType}</td><td>${payroll.formatCurrency(row.amount)}</td><td>${row.allocationMode==="shared"?"公共费用池":"直接计入"}</td><td>${lineMap[row.lineId]?.name||"—"}</td><td>${row.note}</td></tr>`).join("")}</tbody></table></div></article>`;
  }

  function renderAllocationRules(){
    document.getElementById("allocation-rules-root").innerHTML =
      sectionHeader("ALLOCATION RULES","分摊规则","公共费用和共享人工成本默认按营收占比分摊，同时保留按人数和手工比例。",`<button class="button primary">+ 新增规则</button>`) +
      `<div class="cards-grid">${data.allocationRules.map(rule=>`<article class="settings-card"><span class="badge ${rule.status==="启用"?"success":"info"}">${rule.status}</span><h3>${rule.name}</h3><p>${rule.poolType} · ${rule.month}</p><p>方法：${rule.method==="revenue"?"按营收占比":rule.method==="headcount"?"按人数占比":"手工比例"}</p></article>`).join("")}</div>`;
  }

  function renderDashboard() {
    const rows = visibleEmployees();
    const totals = rows.reduce((sum,row)=>({gross:sum.gross+row.salaryTotal,net:sum.net+row.netPay,tax:sum.tax+row.withholdingTax,social:sum.social+row.socialSecurityTotal}),{gross:0,net:0,tax:0,social:0});
    const confirmations = data.confirmationRows.filter((record)=>rows.some((row)=>row.id===record.employeeId));
    const confirmed = confirmations.filter((record)=>record.status==="已确认").length;
    document.getElementById("dashboard-root").innerHTML = `
      <div class="hero"><div><p class="eyebrow" style="color:#aac8ff">${monthLabel(currentMonth)}集团薪酬</p><h2>从资料准备到成本分析，一条链路完成月度薪酬</h2><p>覆盖 3 家公司、4 条产品线；所有数据均为虚构 Demo 数据。</p></div><div class="hero-side"><span>本月流程完成度</span><strong>72%</strong></div></div>
      <div class="metric-grid">
        ${metric("算薪人数",rows.length+" 人","全部完成计算",true)}
        ${metric("集团应发",payroll.formatCurrency(totals.gross),"较上月 +6.8%",true)}
        ${metric("集团实发",payroll.formatCurrency(totals.net),"报表核对一致",true)}
        ${metric("代扣个税",payroll.formatCurrency(totals.tax),"累计预扣法")}
        ${metric("工资条确认率",confirmations.length?Math.round(confirmed/confirmations.length*100)+"%":"0%",`${confirmed}/${confirmations.length} 人已确认`)}
        ${metric("社保月结差异",payroll.formatCurrency(data.socialBills.filter(b=>b.month===currentMonth).reduce((s,b)=>s+b.difference,0)),"1 家主体待核对")}
      </div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">MONTHLY FLOW</p><h3>月度薪酬流程</h3></div><span class="muted">点击阶段进入对应模块</span></div>
          <div class="workflow">
            ${[["资料准备","6 人档案完整","salary-profiles","done"],["算薪","已计算","payroll-workbench","done"],["个税","1 人待报送","person-reporting","current"],["工资条确认","4/6 已确认","confirmations","current"],["社保月结","1 项差异","social-bills","current"],["成本分析","待管理复核","cost-dashboard",""]].map((item,i)=>`<button class="workflow-card ${item[3]}" data-view-jump="${item[2]}"><b>${i+1}</b><strong>${item[0]}</strong><span>${item[1]}</span></button>`).join("")}
          </div>
        </article>
        <article class="panel"><div class="panel-head"><div><p class="eyebrow">TO DO</p><h3>本月待办</h3></div><span class="badge warning">4 项</span></div>
          <div class="todo-list">
            <div class="todo"><span class="todo-icon green">企</span><div><strong>三项主体归属校验通过</strong><span>所属公司、报税主体、参保主体完全一致</span></div><button class="row-action" data-view-jump="salary-profiles">查看</button></div>
            <div class="todo"><span class="todo-icon blue">税</span><div><strong>唐可人员信息报送失败</strong><span>证件有效期信息缺失</span></div><button class="row-action" data-view-jump="person-reporting">处理</button></div>
            <div class="todo"><span class="todo-icon orange">保</span><div><strong>星云互动社保账单存在差异</strong><span>差异 ${payroll.formatCurrency(186.4)}</span></div><button class="row-action" data-view-jump="social-bills">核对</button></div>
          </div>
        </article>
      </div>`;
  }

  function renderPayrollWorkbench() {
    const summaries=payroll.summarizePayrollByCompany(results,data.companies);
    const total=summaries.reduce((sum,row)=>({people:sum.people+row.people,gross:sum.gross+row.gross,social:sum.social+row.social,special:sum.special+row.special,taxable:sum.taxable+row.taxable,tax:sum.tax+row.tax,net:sum.net+row.net,exceptions:sum.exceptions+row.exceptions}),{people:0,gross:0,social:0,special:0,taxable:0,tax:0,net:0,exceptions:0});
    const detailRows=(companyId)=>results.filter(row=>row.companyId===companyId).map(row=>`<tr class="payroll-detail-row"><td>${row.id}</td><td>${row.name}</td><td>${companyMap[row.companyId].shortName}</td><td data-col="payroll-base-salary">${payroll.formatCurrency(row.baseSalary)}</td><td data-col="payroll-performance-base">${payroll.formatCurrency(row.performanceBase)}</td><td data-col="payroll-performance-score">${row.performanceScore.toFixed(2)}</td><td data-col="payroll-final-performance">${payroll.formatCurrency(row.performancePay)}</td><td data-col="payroll-bonus">${payroll.formatCurrency(row.bonus)}</td><td data-col="payroll-allowance">${payroll.formatCurrency(row.allowance+row.mealAllowance)}</td><td data-col="payroll-gross">${payroll.formatCurrency(row.salaryTotal)}</td><td data-col="payroll-social">${payroll.formatCurrency(row.socialSecurityTotal)}</td><td data-col="payroll-special">${payroll.formatCurrency(row.specialDeduction)}</td><td data-col="payroll-taxable">${payroll.formatCurrency(row.taxableIncome)}</td><td data-col="payroll-tax">${payroll.formatCurrency(row.withholdingTax)}</td><td data-col="payroll-net"><strong>${payroll.formatCurrency(row.netPay)}</strong></td><td><span class="badge ${row.socialBaseRisk||row.housingFundBaseRisk||row.performanceScoreRisk?"warning":"success"}">${row.performanceScoreRisk?"绩效分异常":row.socialBaseRisk||row.housingFundBaseRisk?"基数风险":"已计算"}</span></td><td><button class="row-action" data-performance-edit="${row.id}">编辑绩效分</button></td></tr>`).join("");
    document.getElementById("payroll-workbench-root").innerHTML=sectionHeader("PAYROLL WORKBENCH","薪资计算工作台","一键计算集团全部公司，按集团汇总、公司小计和员工明细三级查看当月结果。",`<button class="button ghost" id="import-performance">导入绩效分</button><button class="button ghost" data-toggle-all="expand">展开全部</button><button class="button ghost" data-toggle-all="collapse">折叠全部</button><button class="button primary" id="run-group-payroll">一键计算全部公司</button>`)+
      `<div class="stat-strip"><div class="stat-item"><span>集团总人数</span><strong>${total.people} 人</strong></div><div class="stat-item"><span>所属公司</span><strong>${data.companies.length} 家</strong></div><div class="stat-item"><span>当前版本</span><strong>${payrollRunVersion}</strong></div><div class="stat-item"><span>异常人数</span><strong>${total.exceptions} 人</strong></div></div>
      <div class="metric-grid">${metric("工资总额",payroll.formatCurrency(total.gross),"集团全部公司")}${metric("社保公积金",payroll.formatCurrency(total.social),"个人扣除合计")}${metric("专项附加扣除",payroll.formatCurrency(total.special),"计税扣除")}${metric("应纳税所得额",payroll.formatCurrency(total.taxable),"累计预扣口径")}${metric("个人所得税",payroll.formatCurrency(total.tax),"全员个税")}${metric("实发工资",payroll.formatCurrency(total.net),"集团实发合计",true)}</div>
      <div class="payroll-accordion">${summaries.map(summary=>`<article class="company-payroll ${payrollExpandedCompanies.has(summary.companyId)?"open":""}"><button class="company-summary" data-company-toggle="${summary.companyId}"><span class="company-chevron">›</span><strong>${companyMap[summary.companyId].name}</strong><span>${summary.people} 人</span><span>工资 ${payroll.formatCurrency(summary.gross)}</span><span>社保公积金 ${payroll.formatCurrency(summary.social)}</span><span>个税 ${payroll.formatCurrency(summary.tax)}</span><span>实发 ${payroll.formatCurrency(summary.net)}</span><span class="badge ${summary.exceptions?"warning":"success"}">${summary.exceptions?summary.exceptions+" 项风险":"正常"}</span></button><div class="company-details"><div class="table-wrap"><table><thead><tr><th>编号</th><th>姓名</th><th>所属公司</th><th>基本工资</th><th>绩效工资基数</th><th>绩效分</th><th>最终绩效工资</th><th>奖金</th><th>津贴</th><th>工资总额</th><th>社保公积金</th><th>专项扣除</th><th>应纳税所得</th><th>个税</th><th>实发工资</th><th>状态</th><th></th></tr></thead><tbody>${detailRows(summary.companyId)}</tbody></table></div></div></article>`).join("")}</div>`;
  }

  function renderSalaryProfiles() {
    const rows = visibleEmployees();
    document.getElementById("salary-profiles-root").innerHTML = sectionHeader("SALARY PROFILES","薪资档案","所属公司、报税主体和参保主体强制一致且不可单独修改，成本可跨产品线分摊。",`<button class="button primary">+ 新增薪资档案</button>`) +
      `<div class="stat-strip">${[["档案人数",rows.length+" 人"],["在职/试用",`${rows.filter(r=>r.employeeStatus==="在职").length}/${rows.filter(r=>r.employeeStatus==="试用期").length}`],["跨线分摊",rows.filter(r=>r.allocations.length>1).length+" 人"],["档案完整率","100%"]].map(x=>`<div class="stat-item"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("")}</div>
      <div class="panel table-panel"><div class="table-toolbar"><strong>员工薪资档案</strong><span class="muted">固定薪资与入职信息</span></div><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>基本工资</th><th>绩效工资基数</th><th>入职/转正日期</th><th>岗位/用工类型</th><th>员工状态</th><th></th></tr></thead><tbody>
      ${rows.map(row=>`<tr><td>${employeeCell(row)}</td><td>${companyMap[row.companyId].shortName}</td><td>${payroll.formatCurrency(row.baseSalary)}</td><td>${payroll.formatCurrency(row.performanceBase)}</td><td>${row.hireDate}<br><span class="muted">转正 ${row.regularDate}</span></td><td>${row.jobTitle}<br><span class="muted">${row.employmentType}</span></td><td><span class="badge ${row.employeeStatus==="试用期"?"warning":"success"}">${row.employeeStatus}</span></td><td><button class="row-action" data-profile-detail="${row.id}">档案详情</button> <button class="row-action" data-allocation="${row.id}">编辑分摊</button></td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  function renderSpecialDeductions() {
    const rows=visibleEmployees();
    document.getElementById("special-deductions-root").innerHTML=sectionHeader("SPECIAL DEDUCTIONS","专项附加扣除","执行中国个人所得税统一政策；员工按实际依法申报金额参与计算。",`<button class="button primary">+ 新增扣除</button>`)+
      `<article class="panel policy-panel" data-policy="policy-cn-tax" data-policy-location="policy-shanghai-rent"><div class="panel-head"><div><p class="eyebrow">CHINA IIT POLICY</p><h3>中国个人所得税政策标准</h3></div><span class="badge info">国家统一规则</span></div><div class="policy-grid">${data.specialDeductionPolicies.map(p=>`<div class="policy-item" data-policy-marker="${p.marker||""}"><strong>${p.name}</strong><b>${p.standard===null?"按实际支出":payroll.formatCurrency(p.standard)}</b><span>${p.unit} · ${p.note}</span>${p.id==="medical"?'<small class="badge warning" data-policy="policy-annual-settlement">年度汇算项目</small>':""}</div>`).join("")}</div></article>`+
      `<div class="metric-grid">${metric("本月申报人数",rows.filter(r=>r.specialDeduction>0).length+" 人","覆盖当前筛选公司")}${metric("本月扣除合计",payroll.formatCurrency(rows.reduce((s,r)=>s+r.specialDeduction,0)),"六类专项附加扣除")}${metric("资料待更新","1 人","子女教育资料将到期")}${metric("年度累计",payroll.formatCurrency(rows.reduce((s,r)=>s+r.specialDeduction*6,0)),"截至 2026 年 6 月")}</div>
      <div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>报税主体</th><th>扣除类型</th><th>月度金额</th><th>生效月份</th><th>年度累计</th><th>资料状态</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${employeeCell(r)}</td><td>${companyMap[r.companyId].shortName}</td><td>${companyMap[r.companyId].shortName}</td><td>${r.specialDeduction?["住房租金","子女教育","赡养老人"][i%3]:"—"}</td><td>${payroll.formatCurrency(r.specialDeduction)}</td><td>${r.specialDeduction?"2026-01 至 2026-12":"—"}</td><td>${payroll.formatCurrency(r.specialDeduction*6)}</td><td><span class="badge ${i===2?"warning":"success"}">${i===2?"待更新":"有效"}</span></td></tr>`).join("")}</tbody></table></div></div>`;
  }

  function renderAnnualTax() {
    const rows=visibleEmployees();
    document.getElementById("annual-tax-root").innerHTML=sectionHeader("ANNUAL TAX","个税计算明细（全年）","累计维度为员工 + 报税主体 + 自然年度，点击员工查看 1–12 月明细。",`<select class="field-select"><option>2026 年</option></select>`)+
      `<div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>报税主体</th><th>累计收入</th><th>累计扣除</th><th>累计应税所得</th><th>累计个税</th><th>归属校验</th><th></th></tr></thead><tbody>${rows.map(r=>{const tax=data.annualTaxRows.find(x=>x.employeeId===r.id);const active=tax.months.filter(m=>m.income);const income=active.reduce((s,m)=>s+m.income,0),ded=active.reduce((s,m)=>s+m.deductions,0),taxTotal=active.reduce((s,m)=>s+m.tax,0);return `<tr><td>${employeeCell(r)}</td><td>${companyMap[r.companyId].shortName}</td><td>${companyMap[r.companyId].shortName}</td><td>${payroll.formatCurrency(income)}</td><td>${payroll.formatCurrency(ded)}</td><td>${payroll.formatCurrency(Math.max(0,income-ded))}</td><td>${payroll.formatCurrency(taxTotal)}</td><td><span class="badge success">一致</span></td><td><button class="row-action" data-tax-detail="${r.id}">全年明细</button></td></tr>`}).join("")}</tbody></table></div></div>`;
  }

  function renderTaxEntities() {
    document.getElementById("tax-entities-root").innerHTML=sectionHeader("TAX ENTITIES","报税主体管理","统一管理集团下不同公司的税号、主管税务机关和申报状态。",`<button class="button primary">+ 新增报税主体</button>`)+
      `<div class="cards-grid">${data.taxEntities.map(e=>`<article class="entity-card"><div class="card-actions"><span class="badge ${badgeClass(e.filingStatus)}">${e.filingStatus}</span><span class="muted">${e.period}</span></div><h3>${e.name}</h3><p>税号：${e.taxNo}</p><div class="entity-meta"><span>主管税务机关<b>${e.taxOffice}</b></span><span>纳税人数<b>${e.people} 人</b></span><span>最近申报<b>${e.filedAt}</b></span><span>主体状态<b>${e.status}</b></span></div><div class="card-actions"><button class="button ghost small">查看详情</button><button class="row-action">申报记录</button></div></article>`).join("")}</div>`;
  }

  function renderPersonReporting() {
    const rows=data.reportingRows.filter(record=>{const e=resultMap()[record.employeeId];return selectedCompany==="all"||e.companyId===selectedCompany});
    document.getElementById("person-reporting-root").innerHTML=sectionHeader("PERSON REPORTING","人员信息报送","按报税主体查看待报送、已报送和失败人员；所有操作均为 Demo 模拟。",`<button class="button primary">批量模拟报送</button>`)+
      `<div class="metric-grid">${metric("待报送",rows.filter(r=>r.status==="待报送").length+" 人","等待提交")}${metric("已报送",rows.filter(r=>r.status==="已报送").length+" 人","本月完成",true)}${metric("报送失败",rows.filter(r=>r.status==="报送失败").length+" 人","需要修正资料")}${metric("主体一致性","100%","自动跟随所属公司",true)}</div>
      <div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>报税主体</th><th>报送状态</th><th>报送时间</th><th>失败原因</th><th></th></tr></thead><tbody>${rows.map(r=>{const e=resultMap()[r.employeeId];return `<tr><td>${employeeCell(e)}</td><td>${companyMap[e.companyId].shortName}</td><td>${companyMap[e.companyId].shortName}</td><td><span class="badge ${badgeClass(r.status)}">${r.status}</span></td><td>${r.reportedAt}</td><td>${r.reason||"—"}</td><td>${r.status==="报送失败"?`<button class="button primary small" data-retry-report="${e.id}">重新报送</button>`:"—"}</td></tr>`}).join("")}</tbody></table></div></div>`;
  }

  function renderPayslipBatches() {
    const batches=data.payslipBatches.filter(b=>b.month===currentMonth&&(selectedCompany==="all"||b.companyId===selectedCompany));
    document.getElementById("payslips-root").innerHTML=sectionHeader("PAYSLIP MANAGEMENT","工资条","工资条发布后形成固定版本；重新发布生成新版本并保留历史记录。",`<button class="button primary">+ 生成 2026 年 1 月工资条</button>`)+
      `<div class="cards-grid">${batches.length?batches.map(b=>{const records=data.confirmationRows.filter(r=>r.month===currentMonth&&resultMap()[r.employeeId].companyId===b.companyId),confirmed=records.filter(r=>r.status==="已确认").length;return `<article class="entity-card"><div class="card-actions"><span class="badge success">${b.status}</span><strong>${b.version}</strong></div><h3>${companyMap[b.companyId].name}</h3><p>${b.month} 工资条批次</p><div class="entity-meta"><span>员工人数<b>${b.total} 人</b></span><span>确认进度<b>${confirmed}/${records.length}</b></span><span>发布时间<b>${b.publishedAt}</b></span><span>版本状态<b>当前有效</b></span></div><div class="card-actions"><button class="button ghost small" data-view-jump="confirmations">确认明细</button><button class="row-action" data-tax-detail="${data.employees.find(e=>e.companyId===b.companyId).id}">预览</button></div></article>`}).join(""):`<article class="empty-state"><h3>${monthLabel(currentMonth)}暂无工资条批次</h3><p>生成当月工资条后会在这里显示。</p></article>`}</div>`;
  }

  function renderConfirmations() {
    const records=data.confirmationRows.filter(r=>{const e=resultMap()[r.employeeId];return r.month===currentMonth&&(selectedCompany==="all"||e.companyId===selectedCompany)});
    const confirmed=records.filter(r=>r.status==="已确认").length,rate=records.length?Math.round(confirmed/records.length*100):0;
    document.getElementById("confirmations-root").innerHTML=sectionHeader("PAYSLIP EVIDENCE","员工确认记录","员工登录员工端查看并确认工资条，系统保存版本、确认人和确认时间。",`<button class="button ghost">导出确认存证</button>`)+
      `<div class="confirmation-summary"><div class="rate-card"><span>当前确认率</span><strong>${rate}%</strong><div class="rate-bar"><i style="width:${rate}%"></i></div></div><div class="panel"><div class="metric-grid" style="grid-template-columns:repeat(3,1fr);margin:0">${metric("已确认",confirmed+" 人","形成确认存证",true)}${metric("已查看待确认",records.filter(r=>r.status==="已查看待确认").length+" 人","已打开工资条")}${metric("待查看",records.filter(r=>r.status==="待查看").length+" 人","尚未登录查看")}</div></div></div>
      <div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>工资月份</th><th>版本</th><th>查看时间</th><th>确认状态</th><th>确认时间</th><th></th></tr></thead><tbody>${records.map(r=>{const e=resultMap()[r.employeeId];return `<tr><td>${employeeCell(e)}</td><td>${companyMap[e.companyId].shortName}</td><td>${r.month}</td><td>${r.version}</td><td>${r.viewedAt}</td><td><span class="badge ${badgeClass(r.status)}">${r.status}</span></td><td>${r.confirmedAt}</td><td>${r.status!=="已确认"?`<button class="button primary small" data-confirm-payslip="${e.id}">模拟员工确认</button>`:'<button class="row-action">查看存证</button>'}</td></tr>`}).join("")}</tbody></table></div></div>`;
  }

  function renderInsuredEmployees() {
    const rows=visibleEmployees();
    const policy=data.shanghaiSocialPolicy;
    document.getElementById("insured-employees-root").innerHTML=sectionHeader("SOCIAL INSURANCE","参保人员","参保地：上海。参保主体与所属公司强制一致，计费基数按上海政策上下限处理。",`<span class="badge warning" data-policy="policy-shanghai-social">${policy.status}</span><button class="button primary">+ 新增参保人员</button>`)+
      `<div class="stat-strip"><div class="stat-item"><span>政策适用地</span><strong>上海</strong></div><div class="stat-item"><span>社保基数范围</span><strong>${payroll.formatCurrency(policy.baseMin)}–${payroll.formatCurrency(policy.baseMax)}</strong></div><div class="stat-item"><span>政策期间</span><strong>${policy.effectiveFrom} 至 ${policy.effectiveTo}</strong></div><div class="stat-item"><span>复核状态</span><strong data-policy="policy-review-pending">${policy.status}</strong></div></div>
      <div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>员工</th><th>所属公司</th><th>参保地</th><th data-policy="raw-contribution-base">社保基数</th><th data-policy="effective-contribution-base">公积金基数</th><th>养老</th><th>医疗</th><th>失业</th><th>公积金</th><th>状态</th><th></th></tr></thead><tbody>${rows.map(e=>{const snapshot=data.monthlyContributionSnapshots.find(s=>s.employeeId===e.id&&s.month===currentMonth)||{socialBase:e.effectiveSocialBase,housingFundBase:e.effectiveHousingFundBase};return `<tr><td>${employeeCell(e)}</td><td>${companyMap[e.companyId].shortName}</td><td>上海</td><td>${payroll.formatCurrency(snapshot.socialBase)}</td><td>${payroll.formatCurrency(snapshot.housingFundBase)}</td><td>${payroll.formatCurrency(e.pension)}</td><td>${payroll.formatCurrency(e.medical)}</td><td>${payroll.formatCurrency(e.unemployment)}</td><td>${payroll.formatCurrency(e.housingFund)}</td><td><span class="badge ${e.socialBaseRisk||e.housingFundBaseRisk?"warning":"success"}">${e.socialBaseRisk||e.housingFundBaseRisk?"超限风险":"基数正常"}</span></td><td><button class="row-action" data-contribution-edit="${e.id}">编辑月度基数</button></td></tr>`}).join("")}</tbody></table></div></div>`;
  }

  function renderSocialBills() {
    const bills=data.socialBills.filter(b=>b.month===currentMonth&&(selectedCompany==="all"||b.companyId===selectedCompany));
    document.getElementById("social-bills-root").innerHTML=sectionHeader("MONTHLY SOCIAL BILLS","社保公积金月结账单","按所属公司汇总上海社保公积金，并与算薪个人扣款自动核对。",`<span class="badge warning">${data.shanghaiSocialPolicy.status}</span><button class="button ghost">导出月结账单</button>`)+
      `<div class="cards-grid">${bills.map(b=>`<article class="entity-card"><div class="card-actions"><span class="badge ${badgeClass(b.status)}">${b.status}</span><span class="muted">${b.month}</span></div><h3>${companyMap[b.companyId].name}</h3><p>参保人数 ${b.people} 人</p><div class="entity-meta"><span>养老<b>${payroll.formatCurrency(b.pension)}</b></span><span>医疗<b>${payroll.formatCurrency(b.medical)}</b></span><span>失业<b>${payroll.formatCurrency(b.unemployment)}</b></span><span>公积金<b>${payroll.formatCurrency(b.housingFund)}</b></span><span>账单总额<b>${payroll.formatCurrency(b.billAmount)}</b></span><span>差异金额<b style="color:${b.difference?'var(--red)':'var(--green)'}">${payroll.formatCurrency(b.difference)}</b></span></div><div class="card-actions">${b.difference?`<button class="button primary small" data-reconcile-bill="${b.companyId}">标记已核对</button><button class="row-action">员工差异</button>`:'<button class="button ghost small">查看账单</button>'}</div></article>`).join("")}</div>`;
  }

  function costGroups() {
    const rows=visibleEmployees();
    if(costDimension==="company") return data.companies.filter(c=>selectedCompany==="all"||c.id===selectedCompany).map(c=>({id:c.id,name:c.shortName,color:"#2d6cdf",amount:rows.filter(r=>r.companyId===c.id).reduce((s,r)=>s+r.employerCost,0)}));
    return data.productLines.map(line=>({id:line.id,name:line.name,color:line.color,amount:rows.reduce((sum,r)=>sum+r.allocatedCosts.filter(a=>a.lineId===line.id).reduce((s,a)=>s+a.amount,0),0)}));
  }

  function renderCostDashboard() {
    const groups=costGroups(),total=groups.reduce((s,g)=>s+g.amount,0),max=Math.max(...groups.map(g=>g.amount),1),rows=visibleEmployees();
    document.getElementById("cost-dashboard-root").innerHTML=sectionHeader("COST ANALYTICS","薪酬成本看板","按所属公司或产品线查看薪酬成本；跨产品线成本按员工分摊比例计算。",`<div class="dimension-toggle"><button class="${costDimension==="company"?"active":""}" data-cost-dimension="company">按所属公司</button><button class="${costDimension==="product"?"active":""}" data-cost-dimension="product">按产品线</button></div>`)+
      `<div class="metric-grid">${metric("薪酬成本总额",payroll.formatCurrency(total),"工资 + 企业承担成本")}${metric("人均薪酬成本",payroll.formatCurrency(rows.length?total/rows.length:0),`${rows.length} 名员工`)}${metric("最高成本维度",groups.sort((a,b)=>b.amount-a.amount)[0]?.name||"—","当前筛选范围")}${metric("跨线分摊人员",rows.filter(r=>r.allocations.length>1).length+" 人","分摊比例均为 100%",true)}</div>
      <div class="chart-layout"><article class="panel"><div class="panel-head"><div><p class="eyebrow">COST MIX</p><h3>${costDimension==="company"?"公司成本构成":"产品线成本构成"}</h3></div><span class="muted">2026 年 1 月</span></div><div class="bar-chart">${groups.map(g=>`<div class="bar-row"><label>${g.name}</label><div class="bar-track"><div class="bar-fill" style="width:${g.amount/max*100}%;background:${g.color}"></div></div><strong>${payroll.formatCurrency(g.amount)}</strong></div>`).join("")}</div></article>
      <article class="panel"><div class="panel-head"><div><p class="eyebrow">TREND</p><h3>近 6 月集团成本趋势</h3></div><span class="badge success">环比 +4.2%</span></div><div class="bar-chart">${["8月","9月","10月","11月","12月","1月"].map((m,i)=>`<div class="bar-row"><label>${m}</label><div class="bar-track"><div class="bar-fill" style="width:${62+i*7}%;background:#8eb1ef"></div></div><strong>${payroll.formatCurrency(total*(.75+i*.05))}</strong></div>`).join("")}</div></article></div>`;
  }

  function renderPayrollReports() {
    document.getElementById("payroll-reports-root").innerHTML=sectionHeader("PAYROLL REPORTS","工资报表","按所属公司生成工资表、个税表、银行发放表和成本汇总表。",`<button class="button primary">批量导出</button>`)+
      `<div class="report-list">${[["工","月度工资表","49 项字段 · 参考现有模板"],["税","个税计算表","全年累计收入、扣除及预扣税额"],["银","银行发放表","按所属公司生成代发数据"],["成","薪酬成本汇总表","公司、部门和产品线多维汇总"]].map(r=>`<article class="report-card"><span class="report-icon">${r[0]}</span><div><h3>${r[1]}</h3><p>${r[2]}</p></div><button data-download-report="${r[1]}">导出</button></article>`).join("")}</div>`;
  }

  function renderGroupSettings() {
    let content="";
    if(settingsTab==="companies") content=`<div class="cards-grid">${data.companies.map(c=>`<article class="settings-card"><span class="badge success">${c.status}</span><h3>${c.name}</h3><p>${c.taxOffice}</p><div class="entity-meta"><span>报税主体<b>已启用</b></span><span>参保主体<b>已启用</b></span><span>员工人数<b>${data.employees.filter(e=>e.companyId===c.id).length} 人</b></span><span>公司编码<b>${c.id}</b></span></div></article>`).join("")}</div>`;
    if(settingsTab==="lines") content=`<div class="cards-grid">${data.productLines.map(line=>`<article class="settings-card"><span class="badge success">启用</span><h3>${line.name}</h3><p>负责人：${line.owner}</p><div class="entity-meta"><span>参与员工<b>${data.employees.filter(e=>e.allocations.some(a=>a.lineId===line.id)).length} 人</b></span><span>默认规则<b>按员工比例</b></span></div></article>`).join("")}</div>`;
    if(settingsTab==="permissions") content=`<div class="cards-grid">${[["系统管理员","集团全部数据","公司、规则、用户及解锁"],["薪酬财务","授权公司","算薪、调整及报表"],["人事专员","授权公司","员工档案及人员报送"],["审计只读","集团全部数据","历史版本和操作记录"]].map(r=>`<article class="settings-card"><span class="badge info">${r[1]}</span><h3>${r[0]}</h3><p>${r[2]}</p><button class="button ghost small">权限详情</button></article>`).join("")}</div>`;
    if(settingsTab==="policies") content=`<div class="cards-grid" data-settings="settings-policy-tab">${data.policyVersions.map(p=>`<article class="settings-card"><span class="badge ${p.status.includes("待复核")?"warning":"success"}">${p.status}</span><h3>${p.name}</h3><p>${p.region||p.location} · ${p.effectiveFrom} 至 ${p.effectiveTo||"长期有效"}</p><div class="entity-meta"><span>政策版本<b>${p.id}</b></span><span>复核要求<b>${p.status.includes("待复核")?"正式启用前复核":"已生效"}</b></span></div><button class="button ghost small">查看参数</button></article>`).join("")}</div>`;
    document.getElementById("group-settings-root").innerHTML=sectionHeader("SYSTEM SETTINGS","系统设置","管理集团公司、产品线分摊规则和角色权限。",`<button class="button primary">+ 新增配置</button>`)+
      `<div class="settings-tabs"><button class="${settingsTab==="companies"?"active":""}" data-settings-tab="companies">集团与公司</button><button class="${settingsTab==="lines"?"active":""}" data-settings-tab="lines">产品线及分摊规则</button><button class="${settingsTab==="policies"?"active":""}" data-settings-tab="policies">政策参数</button><button class="${settingsTab==="permissions"?"active":""}" data-settings-tab="permissions">用户与权限</button></div>${content}`;
  }

  function renderAll() {
    renderExecutiveDashboard();renderExecutiveSummary();renderProductLineAlerts();renderBudgetAttainment();renderCollectionDashboard();renderRevenueCollection();renderCostCollection();renderDingTalkExpenseCollection();renderMatchingRules();renderCollectionExceptions();renderCollectionLogs();renderCostManagementDashboard();renderDirectCosts();renderLaborCosts();renderExpenseCosts();renderSharedCostPool();renderBusinessDashboard();renderProductAccounting();renderExpenseCollection();renderAllocationRules();renderDashboard();renderPayrollWorkbench();renderSalaryProfiles();renderSpecialDeductions();renderAnnualTax();renderTaxEntities();renderPersonReporting();renderPayslipBatches();renderConfirmations();renderInsuredEmployees();renderSocialBills();renderCostDashboard();renderPayrollReports();renderGroupSettings();
  }

  function openModal(html){document.getElementById("modal-content").innerHTML=html;document.getElementById("detail-modal").classList.add("open")}
  function closeModal(){document.getElementById("detail-modal").classList.remove("open")}

  function openAllocationEditor(employeeId) {
    const e=results.find(r=>r.id===employeeId);
    openModal(`<p class="eyebrow">COST ALLOCATION</p><h2>${e.name} · 产品线成本分摊</h2><p class="muted">比例合计必须等于 100%，否则不能保存。</p><div class="allocation-editor">${e.allocations.map((a,i)=>`<div class="allocation-row"><label>${lineMap[a.lineId].name}</label><input type="number" min="0" max="100" value="${a.percent}" data-allocation-input="${i}"><span>%</span></div>`).join("")}</div><div class="allocation-total" id="allocation-total">当前合计：100%</div><button class="button primary" data-save-allocations="${e.id}">保存分摊</button>`);
    document.querySelectorAll("[data-allocation-input]").forEach(input=>input.addEventListener("input",updateAllocationTotal));
  }
  function updateAllocationTotal(){const total=[...document.querySelectorAll("[data-allocation-input]")].reduce((s,i)=>s+Number(i.value||0),0),box=document.getElementById("allocation-total");box.textContent=`当前合计：${total}%`;box.classList.toggle("invalid",total!==100)}
  function saveAllocations(employeeId) {
    const e=results.find(r=>r.id===employeeId),values=[...document.querySelectorAll("[data-allocation-input]")].map((input,i)=>({lineId:e.allocations[i].lineId,percent:Number(input.value)}));
    if(!payroll.validateAllocations(values)) return showToast("分摊比例合计必须为 100%");
    data.employees.find(row=>row.id===employeeId).allocations=values;results=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);closeModal();renderAll();showToast("产品线分摊已保存");
  }
  function openPerformanceEditor(employeeId){
    const e=results.find(r=>r.id===employeeId),record=data.monthlyPerformanceRecords.find(r=>r.employeeId===employeeId&&r.month===currentMonth)||{score:e.performanceScore||0};
    openModal(`<p class="eyebrow">MONTHLY PERFORMANCE</p><h2>${e.name} · 编辑 ${monthLabel(currentMonth)}绩效分</h2><p class="muted">绩效分允许范围 0–1.5，修改后将重新计算集团结果。</p><div class="allocation-editor"><label>绩效工资基数<input value="${e.performanceBase}" readonly></label><label>绩效分<input id="performance-score-input" type="number" min="0" max="1.5" step="0.01" value="${record.score}"></label><label>修改原因<input id="performance-reason-input" placeholder="必填，例如：绩效复核调整"></label></div><button class="button primary" data-save-performance="${e.id}">保存并重新计算</button>`);
  }
  function savePerformanceScore(employeeId){
    const score=Number(document.getElementById("performance-score-input").value),reason=document.getElementById("performance-reason-input").value.trim();
    if(score<0||score>1.5)return showToast("绩效分必须在 0–1.5 之间");
    if(!reason)return showToast("请填写修改原因");
    payroll.updateMonthlyPerformanceScore(data.monthlyPerformanceRecords,employeeId,currentMonth,score,reason);
    results=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);payrollRunVersion=`P${Number(payrollRunVersion.slice(1)||0)+1}`;closeModal();renderAll();showToast(`绩效分已更新，计算版本 ${payrollRunVersion}`);
  }
  function simulatePerformanceImport(){
    data.employees.forEach((employee,index)=>payroll.updateMonthlyPerformanceScore(data.monthlyPerformanceRecords,employee.id,currentMonth,[.96,.91,.84,.98,.79,.88][index],"模拟导入绩效表"));
    results=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth,data.monthlyPerformanceRecords);payrollRunVersion=`P${Number(payrollRunVersion.slice(1)||0)+1}`;renderAll();showToast(`已模拟导入 6 条绩效分，版本 ${payrollRunVersion}`);
  }
  function openSalaryProfileDetail(employeeId){
    const e=results.find(r=>r.id===employeeId);
    openModal(`<p class="eyebrow">SALARY PROFILE</p><h2>${e.name} · 薪资档案</h2><div class="entity-meta"><span>基本工资<b>${payroll.formatCurrency(e.baseSalary)}</b></span><span>绩效工资基数<b>${payroll.formatCurrency(e.performanceBase)}</b></span><span>入职日期<b>${e.hireDate}</b></span><span>转正日期<b>${e.regularDate}</b></span><span>所属公司<b>${companyMap[e.companyId].name}</b></span><span>部门 / 岗位<b>${e.department} / ${e.jobTitle}</b></span><span>用工类型<b>${e.employmentType}</b></span><span>员工状态<b>${e.employeeStatus}</b></span></div>`);
  }
  function toggleCompanyDetails(companyId){payrollExpandedCompanies.has(companyId)?payrollExpandedCompanies.delete(companyId):payrollExpandedCompanies.add(companyId);renderPayrollWorkbench()}
  function toggleAllCompanyDetails(mode){payrollExpandedCompanies=mode==="expand"?new Set(data.companies.map(c=>c.id)):new Set();renderPayrollWorkbench()}
  function runGroupPayroll(){results=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth);payrollRunVersion=`P${Number(payrollRunVersion.slice(1)||0)+1}`;data.payrollRuns.push({month:currentMonth,version:payrollRunVersion,status:"已计算",calculatedAt:"刚刚",people:results.length,operator:"财务管理员"});renderAll();showToast(`集团 ${results.length} 人计算完成，版本 ${payrollRunVersion}`)}
  function openContributionEditor(employeeId){
    const e=results.find(r=>r.id===employeeId),s=data.monthlyContributionSnapshots.find(x=>x.employeeId===employeeId&&x.month===currentMonth)||{socialBase:e.effectiveSocialBase,housingFundBase:e.effectiveHousingFundBase};
    openModal(`<p class="eyebrow">MONTHLY BASE SNAPSHOT</p><h2>${e.name} · 编辑月度基数</h2><p class="muted">超出上海政策上下限仅提示风险，仍按录入值计算。</p><div class="allocation-editor"><label>生效月份<select id="base-month" class="field-select">${monthOptions.filter(month=>month>=currentMonth).map(month=>`<option value="${month}">${month}</option>`).join("")}</select></label><label>社保基数<input id="social-base-input" type="number" min="0" value="${s.socialBase}"></label><label>公积金基数<input id="housing-base-input" type="number" min="0" value="${s.housingFundBase}"></label><label>修改原因<input id="base-reason-input" placeholder="必填，例如：员工确认新基数"></label></div><div class="allocation-total" id="base-risk-box">录入值将直接参与计算，并从生效月份传播至后续月份</div><button class="button primary" data-save-contribution="${e.id}">保存并自动重算</button>`);
  }
  function saveContributionSnapshot(employeeId){
    const month=document.getElementById("base-month").value,social=Number(document.getElementById("social-base-input").value),housing=Number(document.getElementById("housing-base-input").value),reason=document.getElementById("base-reason-input").value.trim();
    if(!reason)return showToast("请填写修改原因");
    const affected=payroll.updateContributionSnapshots(data.monthlyContributionSnapshots,employeeId,month,social,housing,reason);
    results=payroll.calculateGroupPayroll(data.employees,data.monthlyContributionSnapshots,currentMonth);payrollRunVersion=`P${Number(payrollRunVersion.slice(1)||0)+1}`;closeModal();renderAll();showToast(`已重算 ${affected.length} 个月，版本 ${payrollRunVersion}，状态待重新审批`);
  }
  function openAnnualTaxDetail(employeeId) {
    const e=results.find(r=>r.id===employeeId),row=data.annualTaxRows.find(r=>r.employeeId===employeeId);
    openModal(`<p class="eyebrow">2026 ANNUAL TAX</p><h2>${e.name} · 全年个税计算明细</h2><p class="muted">所属公司 / 报税主体：${companyMap[e.companyId].name}</p><div class="tax-grid">${row.months.map(m=>`<div class="tax-month"><b>${m.month} 月</b><span>收入</span><strong>${payroll.formatCurrency(m.income)}</strong><span>扣除</span><strong>${payroll.formatCurrency(m.deductions)}</strong><span>个税</span><strong>${payroll.formatCurrency(m.tax)}</strong><div class="mini-progress"><i style="width:${Math.min(100,m.income/250)}%"></i></div></div>`).join("")}</div>`);
  }
  function retryPersonReport(employeeId){const row=data.reportingRows.find(r=>r.employeeId===employeeId);row.status="已报送";row.reason="";row.reportedAt="刚刚（Demo 模拟）";renderPersonReporting();showToast("人员信息已模拟重新报送")}
  function confirmPayslip(employeeId){const row=data.confirmationRows.find(r=>r.employeeId===employeeId);row.status="已确认";row.viewedAt=row.viewedAt==="—"?"刚刚":row.viewedAt;row.confirmedAt="刚刚（Demo 模拟）";renderConfirmations();renderDashboard();showToast("已模拟员工登录并确认工资条")}
  function reconcileSocialBill(companyId){const bill=data.socialBills.find(b=>b.companyId===companyId);bill.difference=0;bill.billAmount=bill.payrollAmount;bill.status="核对一致";renderSocialBills();renderDashboard();showToast("社保月结差异已模拟核对")}
  function setCostDimension(dimension){costDimension=dimension;renderCostDashboard()}
  function filterByCompany(companyId){selectedCompany=companyId;renderAll();showToast(companyId==="all"?"已切换集团视图":`已筛选：${companyMap[companyId].shortName}`)}
  function setSettingsTab(tab){settingsTab=tab;renderGroupSettings()}
  function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2200)}

  function init() {
    const select=document.getElementById("global-company-filter");
    select.innerHTML=`<option value="all">集团全部公司</option>${data.companies.map(c=>`<option value="${c.id}">${c.shortName}</option>`).join("")}`;
    select.addEventListener("change",e=>filterByCompany(e.target.value));
    const monthSelect=document.getElementById("global-month-filter");
    if(monthSelect){monthSelect.value=currentMonth;monthSelect.addEventListener("change",e=>setCurrentMonth(e.target.value));}
    document.addEventListener("click",event=>{
      const nav=event.target.closest("[data-view]"),jump=event.target.closest("[data-view-jump]"),group=event.target.closest("[data-nav-group]"),allocation=event.target.closest("[data-allocation]"),save=event.target.closest("[data-save-allocations]"),tax=event.target.closest("[data-tax-detail]"),retry=event.target.closest("[data-retry-report]"),confirm=event.target.closest("[data-confirm-payslip]"),bill=event.target.closest("[data-reconcile-bill]"),dimension=event.target.closest("[data-cost-dimension]"),tab=event.target.closest("[data-settings-tab]"),download=event.target.closest("[data-download-report]"),companyToggle=event.target.closest("[data-company-toggle]"),toggleAll=event.target.closest("[data-toggle-all]"),contributionEdit=event.target.closest("[data-contribution-edit]"),contributionSave=event.target.closest("[data-save-contribution]"),performanceEdit=event.target.closest("[data-performance-edit]"),performanceSave=event.target.closest("[data-save-performance]"),profileDetail=event.target.closest("[data-profile-detail]");
      if(nav){if(nav.dataset.settingTab)setSettingsTab(nav.dataset.settingTab);switchView(nav.dataset.view)}
      if(jump)switchView(jump.dataset.viewJump);if(group)toggleNavGroup(group.dataset.navGroup);if(allocation)openAllocationEditor(allocation.dataset.allocation);if(save)saveAllocations(save.dataset.saveAllocations);if(tax)openAnnualTaxDetail(tax.dataset.taxDetail);if(retry)retryPersonReport(retry.dataset.retryReport);if(confirm)confirmPayslip(confirm.dataset.confirmPayslip);if(bill)reconcileSocialBill(bill.dataset.reconcileBill);if(dimension)setCostDimension(dimension.dataset.costDimension);if(tab)setSettingsTab(tab.dataset.settingsTab);if(download)showToast(`${download.dataset.downloadReport}已生成（Demo 模拟）`);if(companyToggle)toggleCompanyDetails(companyToggle.dataset.companyToggle);if(toggleAll)toggleAllCompanyDetails(toggleAll.dataset.toggleAll);if(contributionEdit)openContributionEditor(contributionEdit.dataset.contributionEdit);if(contributionSave)saveContributionSnapshot(contributionSave.dataset.saveContribution);if(performanceEdit)openPerformanceEditor(performanceEdit.dataset.performanceEdit);if(performanceSave)savePerformanceScore(performanceSave.dataset.savePerformance);if(profileDetail)openSalaryProfileDetail(profileDetail.dataset.profileDetail);if(event.target.id==="run-group-payroll")runGroupPayroll();if(event.target.id==="import-performance")simulatePerformanceImport();if(event.target.closest("[data-close-modal]"))closeModal();
    });
    renderAll();
  }
  init();
  Object.assign(window,{switchView,toggleNavGroup,openAllocationEditor,saveAllocations,openAnnualTaxDetail,retryPersonReport,confirmPayslip,reconcileSocialBill,setCostDimension,filterByCompany,setCurrentMonth,renderPayrollWorkbench,toggleCompanyDetails,toggleAllCompanyDetails,openContributionEditor,saveContributionSnapshot,runGroupPayroll,openPerformanceEditor,savePerformanceScore,simulatePerformanceImport});
}());

