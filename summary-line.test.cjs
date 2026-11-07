const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("./app.jsx", "utf8");

test("right-side estimate details hide every zero-dollar line", () => {
  assert.match(
    source,
    /function SummaryLine\(\{ label, range \}\) \{[\s\S]*if \(!Number\(range\?\.low \|\| 0\) && !Number\(range\?\.high \|\| 0\)\) return null;/
  );
});
