(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoEditableText = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function editableText(row, fallback = "") {
    return typeof row?.customText === "string" ? row.customText : fallback;
  }

  function editableUnit(row, fallback = "") {
    return typeof row?.unit === "string" ? row.unit : fallback;
  }

  function editableNumber(value) {
    return value === "" ? "" : Number(value);
  }

  return { editableNumber, editableText, editableUnit };
});
