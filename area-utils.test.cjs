const test = require("node:test");
const assert = require("node:assert/strict");
const { areaChoices, moveItemToArea } = require("./area-utils.js");

test("area choices keep the item's current area and offer selected destinations", () => {
  assert.deepEqual(
    areaChoices("主臥室", ["次臥室1", "次臥室2"], ["客廳", "主臥室", "次臥室1", "次臥室2"]),
    ["主臥室", "次臥室1", "次臥室2"]
  );
});

test("area choices can include whole-house work without duplicates", () => {
  assert.deepEqual(
    areaChoices("全室", ["主臥室", "次臥室1"], ["客廳"], true),
    ["全室", "主臥室", "次臥室1"]
  );
});

test("moving an item changes only its area and preserves entered work", () => {
  const rows = [{ id: "wood-1", area: "主臥室", customText: "平釘天花板", qty: 6, unit: "坪", actualUnitPrice: "3200", note: "保留" }];
  assert.deepEqual(moveItemToArea(rows, "wood-1", "次臥室1"), [
    { id: "wood-1", area: "次臥室1", customText: "平釘天花板", qty: 6, unit: "坪", actualUnitPrice: "3200", note: "保留" }
  ]);
});
