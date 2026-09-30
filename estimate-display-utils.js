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

  const estimateDetailHeaders = ["項目", "數量", "單位", "單價", "單項總價", "備註"];
  const estimateDetailColumnWidths = ["30%", "7%", "6%", "12%", "15%", "30%"];
  const estimateOdsColumnWidths = ["5.5cm", "1.3cm", "1.1cm", "2.2cm", "2.8cm", "5.5cm"];

  const buildEstimateTitles = (projectName, brandName) => {
    const name = String(projectName || "").trim();
    return {
      summaryTitle: name ? `${name}裝修預算初估表` : "裝修預算初估表",
      formalTitle: name ? `${brandName} ${name}案估價表` : `${brandName} 估價表`
    };
  };

  const formatProjectLocation = (projectLocation) =>
    String(projectLocation || "").trim() || "未填寫";

  const toEstimateDetailCells = (row, subtotalText) => {
    const itemName = row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name;
    return [itemName, row.qty, row.unit, row.unitPrice, subtotalText, String(row.note || "").trim()];
  };

  return {
    buildPaymentLines: (stages) => stages.filter((stage) => stage.name.trim()).map((stage, index) => {
      const number = index + 1;
      const digits = "零一二三四五六七八九";
      const ordinal = number < 10 ? digits[number] : number < 100
        ? `${number < 20 ? "" : digits[Math.floor(number / 10)]}十${number % 10 ? digits[number % 10] : ""}`
        : String(number);
      return `第${ordinal}期款項：${stage.name.trim()}${stage.percent !== "" ? `，收取總金額的 ${Number(stage.percent)}%` : ""}。`;
    }),
    buildEstimateTitles,
    estimateDetailColumnWidths,
    estimateDetailHeaders,
    estimateOdsColumnWidths,
    formatCabinetQuantity,
    formatProjectLocation,
    isPricedItem,
    toEstimateDetailCells,
    toComparisonSafeRow
  };
});
