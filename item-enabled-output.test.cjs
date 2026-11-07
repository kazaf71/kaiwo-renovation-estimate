const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("disabled rows are omitted while their entered data remains available", () => {
  const { enabledRows } = require("./item-enabled-utils.js");
  const rows = [
    { id: "paint", enabled: true, name: "乳膠漆", qty: 4, price: 1800 },
    { id: "floor", enabled: false, name: "超耐磨地板", qty: 10, price: 5200 },
    { id: "legacy", name: "舊草稿木作", qty: 3, price: 550 }
  ];

  assert.deepEqual(enabledRows(rows).map((row) => row.id), ["paint", "legacy"]);
  assert.deepEqual(rows[1], { id: "floor", enabled: false, name: "超耐磨地板", qty: 10, price: 5200 });
});

test("all estimate output is filtered by the shared enabled rule", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  assert.match(app, /const rawEstimateRows = \[[\s\S]*?\]\.filter\(isItemEnabled\);/);
  assert.match(app, /enabledRows\(customTrades[\s\S]*?enabledRows\(cabinetTotals[\s\S]*?enabledRows\(woodTotals[\s\S]*?enabledRows\(flooringTotals[\s\S]*?enabledRows\(masonryTotals[\s\S]*?enabledRows\(protectionTotals[\s\S]*?enabledRows\(plumbingExtraTotals[\s\S]*?enabledRows\(paintingExtraTotals[\s\S]*?enabledRows\(airConditioningTotals/);
});

test("every standard trade and cleanup excludes disabled amounts", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  const guardedSubtotalCount = (app.match(/enabledSubtotal\(/g) || []).length;
  assert.ok(guardedSubtotalCount >= 9, `expected at least 9 row subtotal guards, got ${guardedSubtotalCount}`);
  assert.match(app, /const cleanupTotal = cleanupEnabled \? actualPricedPair\(cleanupQty, cleanupActualUnitPrice\) : pair\(\);/);
});
