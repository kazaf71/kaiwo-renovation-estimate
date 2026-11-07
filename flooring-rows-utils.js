(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoFlooringRows = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const migrateFloorRows = (draft, createId) => {
    if (Array.isArray(draft.floorRows)) return draft.floorRows;
    return [{
      id: createId(),
      area: draft.floorArea || "全室",
      customText: draft.floorText || "地板工程",
      qty: draft.floorPing ?? 18,
      unit: draft.floorUnit || "坪",
      actualUnitPrice: draft.floorActualUnitPrice ?? "",
      note: draft.floorNote || ""
    }];
  };
  const updateFloorRow = (rows, id, patch) => rows.map((row) => row.id === id ? { ...row, ...patch } : row);
  const removeFloorRow = (rows, id) => rows.filter((row) => row.id !== id);
  return { migrateFloorRows, updateFloorRow, removeFloorRow };
});
