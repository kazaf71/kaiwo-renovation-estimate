const test = require("node:test");
const assert = require("node:assert/strict");
const { areaChoices, moveItemToArea, migrateProtectionRows, updateProtectionRow, removeProtectionRow } = require("./area-utils.js");
const fs = require("node:fs");

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

test("legacy protection fields migrate into the first editable protection row", () => {
  const rows = migrateProtectionRows({
    protectionArea: "公共走道",
    protectionText: "公共區域保護",
    protectionNote: "電梯至門口",
    protectionQty: 2,
    protectionUnit: "式",
    protectionActualUnitPrice: "3500"
  }, () => "protection-1");

  assert.deepEqual(rows, [{
    id: "protection-1",
    area: "公共走道",
    customText: "公共區域保護",
    note: "電梯至門口",
    qty: 2,
    unit: "式",
    actualUnitPrice: "3500"
  }]);
});

test("protection rows can be edited and removed independently", () => {
  const rows = [
    { id: "public", area: "公共區域", customText: "公區保護", qty: 1 },
    { id: "private", area: "私人區域", customText: "室內保護", qty: 1 }
  ];

  assert.deepEqual(updateProtectionRow(rows, "private", { qty: 2 }), [
    rows[0],
    { ...rows[1], qty: 2 }
  ]);
  assert.deepEqual(removeProtectionRow(rows, "public"), [rows[1]]);
});

test("every trade area control supports quick choices and custom typing", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  const areaControls = app.split("\n").filter((line) => line.includes("<AreaSelect "));
  assert.ok(areaControls.length >= 10);
  for (const control of areaControls) assert.match(control, /\ballowCustom\b/);
  assert.doesNotMatch(app, /<select aria-label="施工區域" value=\{row\.area\}/);
});
