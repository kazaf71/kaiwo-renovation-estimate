(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoItemEnabled = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const isItemEnabled = (row) => row?.enabled !== false;
  const enabledSubtotal = (row, subtotal, emptySubtotal) => isItemEnabled(row) ? subtotal : emptySubtotal;
  return { isItemEnabled, enabledSubtotal };
});
