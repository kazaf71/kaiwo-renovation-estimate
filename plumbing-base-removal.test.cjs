const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("./app.jsx", "utf8");

test("plumbing page removes the legacy base estimate from totals and exports", () => {
  assert.doesNotMatch(app, /plumbingBase/);
  assert.match(app, /const plumbingTotal = plumbingExtraTotal;/);
  assert.doesNotMatch(app, /水電工程：NT\$ \$\{moneyRange\(plumbingTotal\)\}（基礎/);
});

test("plumbing page keeps the editable item list", () => {
  assert.match(app, /<h3[^>]*>水電加價項目<\/h3>/);
  assert.match(app, />新增水電加價<\/button>/);
  assert.match(app, /<AreaSelect value=\{row\.area\}[^\n]*allowCustom[^\n]*updatePlumbingExtra/);
});
