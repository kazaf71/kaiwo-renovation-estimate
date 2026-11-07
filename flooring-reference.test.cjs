const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("./app.jsx", "utf8");

test("flooring keeps one combined price suggestion without grade selection", () => {
  assert.doesNotMatch(app, /floorGrade/);
  assert.doesNotMatch(app, /地板工程等級/);
  assert.doesNotMatch(app, /updateFloorGrade/);
  assert.match(app, /價位建議：\{moneyRange\(floorReference\)\}／坪/);
});

test("flooring still uses only the manually entered actual price", () => {
  assert.match(app, /const flooringTotal = floorNeeded \? actualPricedPair\(floorPing, floorActualUnitPrice\) : pair\(\);/);
  assert.match(app, /value=\{floorActualUnitPrice\}/);
});
