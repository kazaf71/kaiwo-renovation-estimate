const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("./app.jsx", "utf8");

test("indoor area and building condition are removed from the form", () => {
  assert.doesNotMatch(app, /useDraftState\("ping"/);
  assert.doesNotMatch(app, /useDraftState\("condition"/);
  assert.doesNotMatch(app, /label="室內坪數"/);
  assert.doesNotMatch(app, /label="屋況"/);
});

test("indoor area and building condition are omitted from every estimate output", () => {
  assert.doesNotMatch(app, /基本條件：室內/);
  assert.doesNotMatch(app, /value: "屋況"/);
  assert.doesNotMatch(app, />屋況</);
  assert.doesNotMatch(app, /"屋況", condition/);
});
