(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoUnits = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const commonUnits = ["尺", "坪", "式", "處", "樘", "片", "面"];
  const unitChoices = (current) => {
    const value = String(current || "").trim();
    return value && !commonUnits.includes(value) ? [...commonUnits, value] : [...commonUnits];
  };
  return { commonUnits, unitChoices };
});
