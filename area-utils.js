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

  return { areaChoices, moveItemToArea };
});
