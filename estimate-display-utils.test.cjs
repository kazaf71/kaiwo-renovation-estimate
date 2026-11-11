const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  buildEstimateFileName,
  buildPaymentLines,
  buildEstimateTitles,
  estimateDetailColumnWidths,
  estimateDetailHeaders,
  estimateOdsColumnWidths,
  formatCabinetQuantity,
  formatEstimateItemName,
  formatProjectLocation,
  groupEstimateRowsByTradeAndArea,
  groupEstimateRowsByArea,
  isPricedItem,
  sortEstimateRowsByArea,
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

test("estimate rows keep each area together with the living room first", () => {
  const rows = [
    { id: "living-1", area: "客廳" },
    { id: "main-1", area: "主臥室" },
    { id: "living-2", area: "客廳" },
    { id: "secondary-1", area: "次臥室1" },
    { id: "main-2", area: "主臥室" },
    { id: "custom", area: "公共走道" }
  ];

  assert.deepEqual(
    sortEstimateRowsByArea(rows, ["客廳", "全室", "玄關", "主臥室", "次臥室1"])
      .map((row) => row.id),
    ["living-1", "living-2", "main-1", "main-2", "secondary-1", "custom"]
  );
});

test("estimate groups separate trades before grouping their areas", () => {
  const rows = [
    { id: "wood-main-1", trade: "木作工程", area: "主臥室", subtotal: { low: 100, high: 110 } },
    { id: "plumbing-living", trade: "水電工程", area: "客廳", subtotal: { low: 200, high: 220 } },
    { id: "paint-main", trade: "油漆工程", area: "主臥室", subtotal: { low: 300, high: 330 } },
    { id: "wood-living", trade: "木作工程", area: "客廳", subtotal: { low: 400, high: 440 } },
    { id: "wood-main-2", trade: "木作工程", area: "主臥室", subtotal: { low: 50, high: 55 } },
    { id: "glass-custom", trade: "玻璃工程", area: "露台", subtotal: { low: 700, high: 770 } },
    { id: "glass-living", trade: "玻璃工程", area: "客廳", subtotal: { low: 80, high: 88 } }
  ];
  const groups = groupEstimateRowsByTradeAndArea(
    rows,
    ["木作工程", "水電工程", "油漆工程"],
    ["客廳", "全室", "主臥室"]
  );

  assert.deepEqual(groups.map((group) => group.trade), ["木作工程", "水電工程", "油漆工程", "玻璃工程"]);
  assert.deepEqual(groups[0].areas.map((group) => group.area), ["客廳", "主臥室"]);
  assert.deepEqual(groups[0].areas[1].rows.map((row) => row.id), ["wood-main-1", "wood-main-2"]);
  assert.deepEqual(groups[0].areas[0].subtotal, { low: 400, high: 440 });
  assert.deepEqual(groups[0].areas[1].subtotal, { low: 150, high: 165 });
  assert.deepEqual(groups[0].subtotal, { low: 550, high: 605 });
  assert.deepEqual(groups[3].areas.map((group) => group.area), ["客廳", "露台"]);
  assert.deepEqual(groups[3].subtotal, { low: 780, high: 858 });
  assert.deepEqual(groupEstimateRowsByTradeAndArea([], [], []), []);
});

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

test("customer estimate rows use item text only because trade is a parent heading", () => {
  assert.deepEqual(estimateDetailHeaders, ["項目", "數量", "單位", "單價", "單項總價", "備註"]);
  assert.deepEqual(toEstimateDetailCells({
    trade: "櫃體工程",
    area: "玄關",
    name: "鞋櫃",
    qty: "3.96",
    unit: "尺",
    unitPrice: "NT$ 7,500元",
    note: "現場確認",
    subtotal: { low: 29703, high: 29703 }
  }, "NT$ 29,703元"), ["鞋櫃", "3.96", "尺", "NT$ 7,500元", "NT$ 29,703元", "現場確認"]);
});

test("grouped detail rows do not repeat the parent trade name", () => {
  const row = {
    trade: "櫃體工程",
    area: "玄關",
    name: "鞋櫃",
    unit: "尺",
    qty: "3.96",
    note: "現場確認"
  };

  assert.deepEqual(toEstimateDetailCells({ ...row, unitPrice: "NT$ 7,500元" }, "NT$ 29,703元"), ["鞋櫃", "3.96", "尺", "NT$ 7,500元", "NT$ 29,703元", "現場確認"]);
});

test("item and note columns are equally widest in the compact six-column layout", () => {
  assert.deepEqual(estimateDetailColumnWidths, ["30%", "7%", "6%", "12%", "15%", "30%"]);
  assert.deepEqual(estimateOdsColumnWidths, ["5.5cm", "1.3cm", "1.1cm", "2.2cm", "2.8cm", "5.5cm"]);
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

test("all estimate downloads can share timestamp, location and project name", () => {
  const now = new Date(2026, 10, 11, 20, 54);
  assert.equal(buildEstimateFileName("三重", "許宅", now, "json"), "202611112054 三重 許宅案.json");
  assert.equal(buildEstimateFileName("三重", "許宅案", now, "pdf"), "202611112054 三重 許宅案.pdf");
  assert.equal(buildEstimateFileName("三重", "許宅", now, "ods"), "202611112054 三重 許宅案.ods");
  assert.equal(buildEstimateFileName("三重", "許宅", now, "xls"), "202611112054 三重 許宅案.xls");
});

test("draft backup filename removes invalid filename characters and omits empty labels", () => {
  const now = new Date(2026, 10, 11, 20, 54);
  assert.equal(buildEstimateFileName("台北/中山", "王宅:裝修", now, "json"), "202611112054 台北-中山 王宅-裝修案.json");
  assert.equal(buildEstimateFileName("", "", now, "json"), "202611112054 估價草稿.json");
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
    pdfContinuationContextRows,
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

  const fakeRow = (className, text) => ({ className, text, matches: (selector) => selector === `.${className}` });
  const activeTrade = fakeRow("trade", "工種：木作工程");
  const activeArea = fakeRow("area", "施工區域：客廳");
  const item = fakeRow("item", "項目 9");
  const nextArea = fakeRow("area", "施工區域：主臥室");
  const nextTrade = fakeRow("trade", "工種：油漆工程");
  assert.deepEqual(pdfContinuationContextRows([item], activeTrade, activeArea), [activeTrade, activeArea], "continued items must repeat their trade and area");
  assert.deepEqual(pdfContinuationContextRows([nextArea, item], activeTrade, activeArea), [activeTrade], "a new area must repeat only its trade");
  assert.deepEqual(pdfContinuationContextRows([nextTrade], activeTrade, activeArea), [], "a new trade must not repeat the previous hierarchy");
});

test("published app includes one-click PDF assets and control", () => {
  const index = fs.readFileSync("./index.html", "utf8");
  const worker = fs.readFileSync("./sw.js", "utf8");
  const appSource = fs.readFileSync("./app.jsx", "utf8");

  assert.match(index, /pdf-export-utils\.js\?v=7/);
  assert.match(index, /html2canvas\.min\.js/);
  assert.match(index, /jspdf\.umd\.min\.js/);
  assert.match(worker, /pdf-export-utils\.js\?v=7/);
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
test("estimate item labels show the area before the item name", () => {
  assert.equal(formatEstimateItemName("客廳", "平釘天花板"), "客廳｜平釘天花板");
  assert.equal(formatEstimateItemName("主臥室", "窗簾盒"), "主臥室｜窗簾盒");
});
