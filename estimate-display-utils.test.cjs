const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  buildPaymentLines,
  buildEstimateTitles,
  estimateDetailColumnWidths,
  estimateDetailHeaders,
  formatCabinetQuantity,
  formatProjectLocation,
  isPricedItem,
  toEstimateDetailCells,
  toComparisonSafeRow
} = require("./estimate-display-utils.js");

const sourceRow = {
  trade: "木作工程",
  area: "客廳",
  name: "造型牆",
  qty: 4,
  unit: "尺",
  unitPrice: "500元",
  subtotal: { low: 2000, high: 2000 }
};

test("payment stages are consecutively numbered after blanks and deletions", () => {
  const stages = [{name:"簽約",percent:5},{name:" ",percent:10},{name:"木工進場",percent:30},{name:"尾款",percent:""}];
  assert.deepEqual(buildPaymentLines(stages), ["第一期款項：簽約，收取總金額的 5%。", "第二期款項：木工進場，收取總金額的 30%。", "第三期款項：尾款。"]);
  assert.equal(buildPaymentLines(stages.slice(2))[0], "第一期款項：木工進場，收取總金額的 30%。");
  assert.deepEqual(buildPaymentLines([]), []);
  const many = buildPaymentLines(Array.from({length:21}, () => ({name:"施工",percent:1})));
  assert.match(many[9], /^第十期款項/);
  assert.match(many[10], /^第十一期款項/);
  assert.match(many[20], /^第二十一期款項/);
});

test("normal mode preserves quantity, unit and unit price", () => {
  const result = toComparisonSafeRow(sourceRow, false, "NT$ 2,000元");
  assert.deepEqual(result, sourceRow);
  assert.notEqual(result, sourceRow);
});

test("comparison-safe mode displays each line as one lot at its total", () => {
  const result = toComparisonSafeRow(sourceRow, true, "NT$ 2,000元");
  assert.equal(result.qty, 1);
  assert.equal(result.unit, "式");
  assert.equal(result.unitPrice, "NT$ 2,000元");
  assert.deepEqual(result.subtotal, sourceRow.subtotal);
  assert.equal(sourceRow.qty, 4);
  assert.equal(sourceRow.unit, "尺");
});

test("an item is included only when quantity and entered price are positive", () => {
  assert.equal(isPricedItem(4, 500), true);
  assert.equal(isPricedItem(4, "500"), true);
  assert.equal(isPricedItem(4, ""), false);
  assert.equal(isPricedItem(0, 500), false);
  assert.equal(isPricedItem(4, 0), false);
  assert.equal(isPricedItem(4, "not-a-price"), false);
});

test("cabinet quantity displays only the total billable feet", () => {
  assert.equal(formatCabinetQuantity(3.96, 1), "3.96");
  assert.equal(formatCabinetQuantity(3.96, 2), "7.92");
});

test("cabinet furniture choices are independent and include upper and lower cabinets", () => {
  const html = fs.readFileSync("./index.html", "utf8");
  const pricingJson = html.match(/<script type="application\/json" id="pricing-data">\s*([\s\S]*?)\s*<\/script>/)[1];
  const pricing = JSON.parse(pricingJson);
  const cabinetNames = pricing.cabinetTypes.map((item) => item.name);

  assert.equal(cabinetNames.includes("電視櫃／書桌／臥榻／妝台／床頭櫃"), false);
  for (const name of ["電視櫃", "書桌", "臥榻", "妝台", "床頭櫃", "上下櫃"]) {
    assert.equal(cabinetNames.includes(name), true, `missing cabinet choice: ${name}`);
  }
  assert.equal(pricing.legacyCabinetTypes.some((item) => item.id === "furniture"), true);
});

test("low cabinet choices are merged while old drafts remain supported", () => {
  const html = fs.readFileSync("./index.html", "utf8");
  const pricingJson = html.match(/<script type="application\/json" id="pricing-data">\s*([\s\S]*?)\s*<\/script>/)[1];
  const pricing = JSON.parse(pricingJson);
  const lowCabinet = pricing.cabinetTypes.find((item) => item.id === "low");

  assert.deepEqual({ name: lowCabinet.name, low: lowCabinet.low, high: lowCabinet.high }, {
    name: "矮櫃",
    low: 4500,
    high: 6100
  });
  assert.equal(pricing.cabinetTypes.some((item) => ["lowA", "lowB"].includes(item.id)), false);
  assert.deepEqual(pricing.legacyCabinetTypes.filter((item) => ["lowA", "lowB"].includes(item.id)).map((item) => item.id), ["lowA", "lowB"]);
});

test("all estimate outputs share the requested six-column order", () => {
  assert.deepEqual(estimateDetailHeaders, ["工種", "項目", "單位", "數量", "單項總價", "備註"]);
  assert.deepEqual(toEstimateDetailCells({
    trade: "櫃體工程",
    area: "玄關",
    name: "鞋櫃",
    unit: "尺",
    qty: "3.96",
    note: "現場確認",
    subtotal: { low: 29703, high: 29703 }
  }, "NT$ 29,703元"), ["櫃體工程", "玄關｜鞋櫃", "尺", "3.96", "NT$ 29,703元", "現場確認"]);
});

test("grouped detail rows leave trade blank after the group heading", () => {
  const row = {
    trade: "櫃體工程",
    area: "玄關",
    name: "鞋櫃",
    unit: "尺",
    qty: "3.96",
    note: "現場確認"
  };

  assert.deepEqual(toEstimateDetailCells(row, "NT$ 29,703元", false), ["", "玄關｜鞋櫃", "尺", "3.96", "NT$ 29,703元", "現場確認"]);
});

test("detail column widths reserve the largest area for notes", () => {
  assert.deepEqual(estimateDetailColumnWidths, ["12%", "20%", "7%", "9%", "17%", "35%"]);
});

test("estimate titles use the editable project name", () => {
  assert.deepEqual(buildEstimateTitles("  王先生新居  ", "楷沃裝修工程"), {
    summaryTitle: "王先生新居裝修預算初估表",
    formalTitle: "楷沃裝修工程 王先生新居案估價表"
  });
  assert.deepEqual(buildEstimateTitles("", "楷沃裝修工程"), {
    summaryTitle: "裝修預算初估表",
    formalTitle: "楷沃裝修工程 估價表"
  });
});

test("project location is trimmed and has a clear empty fallback", () => {
  assert.equal(formatProjectLocation("  台北市中山區中山路 100 號  "), "台北市中山區中山路 100 號");
  assert.equal(formatProjectLocation("   "), "未填寫");
});

test("published app is labeled as the formal version", () => {
  const appSource = fs.readFileSync("./app.jsx", "utf8");

  assert.equal(appSource.includes("工程報價 / 正式版"), true);
  assert.equal(appSource.includes("本機試用版"), false);
});

test("PDF export provides a safe project-based filename and grouped pagination", () => {
  assert.equal(fs.existsSync("./pdf-export-utils.js"), true, "missing PDF export helper");
  const {
    buildPdfFileName,
    paginateEstimateGroups,
    paginateEstimateGroupsForPdf,
    shouldAppendPdfSummaryPage
  } = require("./pdf-export-utils.js");

  assert.equal(buildPdfFileName(" 王先生/新居 ", new Date("2026-09-20T00:00:00")), "楷沃裝修工程-王先生-新居-估價單-20260920.pdf");
  const pages = paginateEstimateGroups([{ trade: "木作工程", rows: Array.from({ length: 5 }, (_, index) => ({ name: `項目${index + 1}`, note: "" })) }], 3);
  assert.equal(pages.length, 2);
  assert.equal(pages[0][0].trade, "木作工程");
  assert.equal(pages[1][0].continued, true);
  assert.equal(pages[1][0].showSubtotal, true);

  const previewGroups = Array.from({ length: 6 }, (_, groupIndex) => ({
    trade: `工種${groupIndex + 1}`,
    subtotal: { low: 2000, high: 2000 },
    rows: Array.from({ length: 2 }, (_, rowIndex) => ({ name: `項目${rowIndex + 1}` }))
  }));
  const previewPages = paginateEstimateGroupsForPdf(previewGroups, 24);
  assert.equal(previewPages.length, 1, "six two-item trades should fill one PDF page");
  assert.equal(shouldAppendPdfSummaryPage(previewPages.at(-1), 24, 10), true);

  const singleTradePages = paginateEstimateGroupsForPdf([
    { trade: "測試工程", subtotal: { low: 12000, high: 12000 }, rows: Array.from({ length: 12 }, (_, index) => ({ name: `項目${index + 1}` })) }
  ], 24);
  assert.equal(singleTradePages.length, 1);
  assert.equal(shouldAppendPdfSummaryPage(singleTradePages.at(-1), 24, 10), false, "summary should use the remaining first-page space");
});

test("published app includes one-click PDF assets and control", () => {
  const index = fs.readFileSync("./index.html", "utf8");
  const worker = fs.readFileSync("./sw.js", "utf8");
  const appSource = fs.readFileSync("./app.jsx", "utf8");

  assert.match(index, /pdf-export-utils\.js\?v=4/);
  assert.match(index, /html2canvas\.min\.js/);
  assert.match(index, /jspdf\.umd\.min\.js/);
  assert.match(worker, /pdf-export-utils\.js\?v=4/);
  assert.match(worker, /html2canvas\.min\.js/);
  assert.match(worker, /jspdf\.umd\.min\.js/);
  assert.match(appSource, /下載 PDF/);
  assert.match(appSource, /downloadPdf/);
});

test("formal PDF fills the first page and uses a compact continuation header", () => {
  const appSource = fs.readFileSync("./app.jsx", "utf8");

  assert.match(appSource, /paginateRenderedPdf\(sheet\)/);
  assert.match(appSource, /pageIndex === 0/);
  assert.match(appSource, /continuation-head/);
  assert.match(appSource, /formalTitle.*（續）/);
  assert.match(appSource, /第 \$\{pageIndex \+ 1\} \/ \$\{pages\.length\} 頁/);
});
