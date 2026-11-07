const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("./app.jsx", "utf8");
const styles = fs.readFileSync("./styles.css", "utf8");

test("every work item editor has a shared display and pricing toggle", () => {
  assert.match(app, /function ItemEnabledToggle\(/);
  assert.equal((app.match(/<ItemEnabledToggle /g) || []).length, 10);
  assert.match(app, /顯示／計價/);
});

test("newly added work items start enabled", () => {
  assert.ok((app.match(/enabled: true/g) || []).length >= 10);
  assert.match(app, /useDraftState\("cleanupEnabled", true\)/);
});

test("paused item styling keeps entered fields editable", () => {
  assert.match(styles, /\.item-paused\s*\{/);
  assert.match(app, /isItemEnabled\(row\) \? "" : "item-paused"/);
  assert.doesNotMatch(app, /disabled=\{!isItemEnabled\(row\)\}/);
});

test("disabled custom rows display a zero line amount", () => {
  assert.match(app, /custom-amount[\s\S]*?enabledSubtotal\(row, actualPricedPair\(row\.qty, row\.price\), pair\(\)\)/);
});
