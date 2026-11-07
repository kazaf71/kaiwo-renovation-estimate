const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "app.jsx"), "utf8");

test("protection work area accepts custom text while keeping area suggestions", () => {
  assert.match(source, /function AreaSelect\([\s\S]*allowCustom = false/);
  assert.match(source, /allowCustom \? \([\s\S]*<input[\s\S]*<datalist/);
  assert.match(source, /<AreaSelect value=\{row\.area\}[\s\S]*allowCustom/);
});

test("protection work supports adding, editing and deleting multiple area rows", () => {
  assert.match(source, /新增保護區域/);
  assert.match(source, /protectionTotals\.map/);
  assert.match(source, /updateProtection\(row\.id/);
  assert.match(source, /removeProtectionRow/);
});
