const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("legacy flooring fields migrate into the first editable area row", () => {
  const { migrateFloorRows } = require("./flooring-rows-utils.js");
  assert.deepEqual(migrateFloorRows({
    floorArea: "客廳",
    floorText: "超耐磨地板",
    floorPing: 12,
    floorUnit: "坪",
    floorActualUnitPrice: "5200",
    floorNote: "含收邊"
  }, () => "floor-1"), [{
    id: "floor-1", area: "客廳", customText: "超耐磨地板", qty: 12,
    unit: "坪", actualUnitPrice: "5200", note: "含收邊"
  }]);
});

test("flooring supports multiple independently editable area rows", () => {
  const { updateFloorRow, removeFloorRow } = require("./flooring-rows-utils.js");
  const rows = [
    { id: "living", area: "客廳", qty: 10 },
    { id: "room", area: "主臥室", qty: 5 }
  ];
  assert.deepEqual(updateFloorRow(rows, "room", { qty: 6 }), [rows[0], { ...rows[1], qty: 6 }]);
  assert.deepEqual(removeFloorRow(rows, "living"), [rows[1]]);
});

test("flooring page provides add and delete controls for area rows", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  assert.match(app, />新增地板區域<\/button>/);
  assert.match(app, /flooringTotals\.map\(\(row\) =>/);
  assert.match(app, /removeFloorRow/);
});
