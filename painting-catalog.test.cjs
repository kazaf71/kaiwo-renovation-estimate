const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("./index.html", "utf8");
const app = fs.readFileSync("./app.jsx", "utf8");
const pricingMatch = html.match(/<script type="application\/json" id="pricing-data">([\s\S]*?)<\/script>/);
const pricing = JSON.parse(pricingMatch[1]);

test("painting page contains all 12 reference items from the 2026 price list", () => {
  assert.deepEqual(pricing.paintingExtraItems, [
    { id: "new-wall-cement", name: "新作面刷水泥漆-矽酸鈣板或水泥粉刷牆面（全批土）", unit: "坪", low: 1400, high: 1800 },
    { id: "old-wall-cement", name: "舊作面刷水泥漆（全批土修補）", unit: "坪", low: 1000, high: 1350 },
    { id: "new-wall-latex", name: "新作面刷乳膠漆-矽酸鈣板或水泥粉刷牆面（全批土）", unit: "坪", low: 2000, high: 2550 },
    { id: "old-wall-latex", name: "舊作面刷乳膠漆（全批土修補）", unit: "坪", low: 1550, high: 1900 },
    { id: "new-wall-rainbow", name: "新作面刷立邦漆-矽酸鈣板或水泥粉刷牆面（全批土）", unit: "坪", low: 2400, high: 3000 },
    { id: "old-wall-rainbow", name: "舊作面刷立邦漆（全批土修補）", unit: "坪", low: 1950, high: 2300 },
    { id: "wood-clear-door", name: "門框木皮噴透明漆", unit: "樘", low: 1500, high: 2000 },
    { id: "wood-clear-single", name: "門片木皮噴透明漆", unit: "片", low: 2200, high: 2750 },
    { id: "wood-clear-small", name: "木作櫃木皮噴透明漆-120公分以下矮櫃", unit: "臺尺", low: 550, high: 750 },
    { id: "wood-clear-tall", name: "木作櫃木皮噴透明漆-超過120公分木櫃", unit: "臺尺", low: 850, high: 1250 },
    { id: "paint-protection", name: "噴漆（俗稱冷烤，但不是鋼琴烤漆）", unit: "才", low: 200, high: 300 },
    { id: "paint-touchup", name: "舊牆面太糟，需要個別貼網", unit: "坪", low: 300, high: 300 }
  ]);
});

test("painting rows keep area, custom text, quantity, unit and actual price controls", () => {
  assert.match(app, /<h3[^>]*>油漆項目<\/h3>/);
  assert.match(app, />新增油漆項目<\/button>/);
  assert.match(app, /<AreaSelect value=\{row\.area\}[\s\S]*updatePaintingExtra/);
  assert.match(app, /value=\{row\.customText\}/);
  assert.match(app, /value=\{row\.qty\}/);
  assert.match(app, /value=\{row\.actualUnitPrice\}/);
  assert.match(app, /<Field label="實際單價">[\s\S]*參考價：\{referenceText\(row\.item\)\}[\s\S]*<\/Field>/);
});

test("painting page removes the legacy base estimate from totals and exports", () => {
  assert.doesNotMatch(app, /paintingBase/);
  assert.match(app, /const paintingTotal = paintingExtraTotal;/);
});

test("painting item areas support both quick choices and custom typing", () => {
  assert.match(app, /<AreaSelect value=\{row\.area\} selectedAreas=\{selectedAreas\} allAreas=\{allAreas\} allowCustom onChange=\{\(area\) => updatePaintingExtra/);
});
