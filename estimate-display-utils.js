(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoEstimateDisplay = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const toComparisonSafeRow = (row, enabled, subtotalText) => enabled
    ? { ...row, qty: 1, unit: "式", unitPrice: subtotalText }
    : { ...row };

  const isPricedItem = (quantity, price) => {
    if (price === "" || price === null || price === undefined) return false;
    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);
    return Number.isFinite(numericQuantity) && numericQuantity > 0
      && Number.isFinite(numericPrice) && numericPrice > 0;
  };

  const formatCabinetQuantity = (widthFeet, count) =>
    (Number(widthFeet) * Number(count || 0)).toFixed(2);

  const estimateDetailHeaders = ["工種", "項目", "單位", "數量", "單項總價", "備註"];
  const estimateDetailColumnWidths = ["12%", "20%", "7%", "9%", "17%", "35%"];

  const buildEstimateTitles = (projectName, brandName) => {
    const name = String(projectName || "").trim();
    return {
      summaryTitle: name ? `${name}裝修預算初估表` : "裝修預算初估表",
      formalTitle: name ? `${brandName} ${name}案估價表` : `${brandName} 估價表`
    };
  };

  const formatProjectLocation = (projectLocation) =>
    String(projectLocation || "").trim() || "未填寫";

  const toEstimateDetailCells = (row, subtotalText, showTrade = true) => {
    const itemName = row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name;
    return [showTrade ? row.trade : "", itemName, row.unit, row.qty, subtotalText, String(row.note || "").trim()];
  };

  return {
    buildEstimateTitles,
    estimateDetailColumnWidths,
    estimateDetailHeaders,
    formatCabinetQuantity,
    formatProjectLocation,
    isPricedItem,
    toEstimateDetailCells,
    toComparisonSafeRow
  };
});
