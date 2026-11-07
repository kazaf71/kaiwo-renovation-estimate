(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoItemEnabled = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const isItemEnabled = (row) => row?.enabled !== false;
  const enabledRows = (rows) => rows.filter(isItemEnabled);
  const enabledSubtotal = (row, subtotal, emptySubtotal) => isItemEnabled(row) ? subtotal : emptySubtotal;
  const mergeImportedDraft = (currentDraft, importedDraft) => {
    const merged = { ...currentDraft, ...importedDraft };
    if (!Object.hasOwn(importedDraft, "cleanupEnabled")) merged.cleanupEnabled = true;
    return merged;
  };
  return { isItemEnabled, enabledRows, enabledSubtotal, mergeImportedDraft };
});
