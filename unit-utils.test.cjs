const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("unit choices keep the requested order without duplicate entries", () => {
  const { unitChoices } = require("./unit-utils.js");
  assert.deepEqual(unitChoices("坪"), ["尺", "坪", "式", "處", "樘", "片", "面"]);
});

test("unit choices preserve an existing catalog unit after the common choices", () => {
  const { unitChoices } = require("./unit-utils.js");
  assert.deepEqual(unitChoices("臺尺"), ["尺", "坪", "式", "處", "樘", "片", "面", "臺尺"]);
});

test("all trade unit controls use the shared dropdown", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  assert.ok((app.match(/<UnitSelect /g) || []).length >= 10);
  assert.doesNotMatch(app, /<Field label="單位">[\s\S]{0,160}<input/);
  assert.doesNotMatch(app, /aria-label="單位"[^>]*type=\{type\}/);
});
