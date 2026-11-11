const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const appSource = fs.readFileSync("./app.jsx", "utf8");
const odsExportSource = appSource.slice(
  appSource.indexOf("const downloadOds = async"),
  appSource.indexOf("const downloadExcel =")
);
const excelExportSource = appSource.slice(
  appSource.indexOf("const downloadExcel ="),
  appSource.indexOf("const downloadPdf = async")
);

test("ODS export prefixes each item with its area and has only one subtotal per trade", () => {
  assert.match(odsExportSource, /formatEstimateItemName\(areaGroup\.area, row\.name\)/);
  assert.doesNotMatch(odsExportSource, /施工區域：/);
  assert.doesNotMatch(odsExportSource, /areaGroup\.area\} 小計/);
  assert.equal((odsExportSource.match(/tradeSubtotalLabel/g) || []).length, 2);
});

test("Excel export prefixes each item with its area and has only one subtotal per trade", () => {
  assert.match(excelExportSource, /formatEstimateItemName\(areaGroup\.area, row\.name\)/);
  assert.doesNotMatch(excelExportSource, /施工區域：/);
  assert.doesNotMatch(excelExportSource, /areaGroup\.area\} 小計/);
  assert.equal((excelExportSource.match(/trade-subtotal/g) || []).length, 4);
});

test("ODS and Excel exports use grayscale styling without the old brown palette", () => {
  const legacyBrownColors = /#(?:F2E7D8|8B6F58|D8C8B5|4B3428|FBF6EF|5B4637|EADBCB|A88C72|F4EDE4|B69E83|2F2721|F8F1E8|3F2C22|5D4A3D)/i;
  assert.doesNotMatch(odsExportSource, legacyBrownColors);
  assert.doesNotMatch(excelExportSource, legacyBrownColors);
});
