(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoAreas = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function areaChoices(currentArea, selectedAreas = [], allAreas = [], includeWhole = false) {
    const available = selectedAreas.length ? selectedAreas : allAreas;
    return [...new Set([includeWhole ? "全室" : "", currentArea, ...available].filter(Boolean))];
  }

  function moveItemToArea(rows, id, area) {
    return rows.map((row) => row.id === id ? { ...row, area } : row);
  }

  function migrateProtectionRows(draft = {}, makeId = () => "protection-row") {
    if (Array.isArray(draft.protectionRows)) return draft.protectionRows;
    return [{
      id: makeId(),
      area: draft.protectionArea ?? "全室",
      customText: draft.protectionText ?? "保護工程",
      note: draft.protectionNote ?? "",
      qty: draft.protectionQty ?? 1,
      unit: draft.protectionUnit ?? "式",
      actualUnitPrice: draft.protectionActualUnitPrice ?? ""
    }];
  }

  function updateProtectionRow(rows, id, patch) {
    return rows.map((row) => row.id === id ? { ...row, ...patch } : row);
  }

  function removeProtectionRow(rows, id) {
    return rows.filter((row) => row.id !== id);
  }

  return { areaChoices, moveItemToArea, migrateProtectionRows, updateProtectionRow, removeProtectionRow };
});
