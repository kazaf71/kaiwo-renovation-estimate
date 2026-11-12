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

  const cabinetBillableQuantity = (row = {}) => row.pricingMode === "direct"
    ? Number(row.qty || 0)
    : (Number(row.widthCm || 0) / 30.3) * Number(row.qty || 0);

  const formatCabinetRowQuantity = (row = {}) => row.pricingMode === "direct"
    ? String(Number(row.qty || 0))
    : cabinetBillableQuantity(row).toFixed(2);

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

  const buildEstimateFileName = (projectLocation, projectName, date = new Date(), extension = "json") => {
    const pad = (value) => String(value).padStart(2, "0");
    const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
    const cleanPart = (value) => String(value || "")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "");
    const location = cleanPart(projectLocation);
    const rawProject = cleanPart(projectName);
    const project = rawProject ? (rawProject.endsWith("案") ? rawProject : `${rawProject}案`) : "";
    const label = [location, project].filter(Boolean).join(" ") || "估價草稿";
    const safeExtension = String(extension || "json").replace(/^\.+/, "").replace(/[^a-z0-9]/gi, "") || "json";
    return `${timestamp} ${label}.${safeExtension.toLowerCase()}`;
  };

  const formatProjectLocation = (projectLocation) =>
    String(projectLocation || "").trim() || "未填寫";

  const sortEstimateRowsByArea = (rows, areaOrder = []) => {
    const rank = new Map(areaOrder.map((area, index) => [area, index]));
    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const leftRank = rank.has(left.row.area) ? rank.get(left.row.area) : Number.MAX_SAFE_INTEGER;
        const rightRank = rank.has(right.row.area) ? rank.get(right.row.area) : Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        if (leftRank === Number.MAX_SAFE_INTEGER) {
          const areaOrderResult = String(left.row.area || "").localeCompare(String(right.row.area || ""), "zh-Hant");
          if (areaOrderResult) return areaOrderResult;
        }
        return left.index - right.index;
      })
      .map(({ row }) => row);
  };

  const groupEstimateRowsByArea = (rows, areaOrder = []) => {
    const sortedRows = sortEstimateRowsByArea(rows, areaOrder);
    const groups = [];
    sortedRows.forEach((row) => {
      const area = String(row.area || "未填區域").trim() || "未填區域";
      let group = groups[groups.length - 1];
      if (!group || group.area !== area) {
        group = { area, rows: [], subtotal: { low: 0, high: 0 } };
        groups.push(group);
      }
      group.rows.push(row);
      group.subtotal.low += Number(row.subtotal?.low || 0);
      group.subtotal.high += Number(row.subtotal?.high || 0);
    });
    return groups;
  };

  const groupEstimateRowsByTradeAndArea = (rows, tradeOrder = [], areaOrder = []) => {
    const tradeRank = new Map(tradeOrder.map((trade, index) => [trade, index]));
    const tradeGroups = [];
    const tradeMap = new Map();

    rows.forEach((row) => {
      const trade = String(row.trade || "未填工種").trim() || "未填工種";
      if (!tradeMap.has(trade)) {
        const group = { trade, rows: [], firstIndex: tradeGroups.length };
        tradeMap.set(trade, group);
        tradeGroups.push(group);
      }
      tradeMap.get(trade).rows.push(row);
    });

    return tradeGroups
      .sort((left, right) => {
        const leftRank = tradeRank.has(left.trade) ? tradeRank.get(left.trade) : Number.MAX_SAFE_INTEGER;
        const rightRank = tradeRank.has(right.trade) ? tradeRank.get(right.trade) : Number.MAX_SAFE_INTEGER;
        return leftRank - rightRank || left.firstIndex - right.firstIndex;
      })
      .map(({ trade, rows: tradeRows }) => {
        const areas = groupEstimateRowsByArea(tradeRows, areaOrder);
        const subtotal = areas.reduce((sum, area) => ({
          low: sum.low + Number(area.subtotal.low || 0),
          high: sum.high + Number(area.subtotal.high || 0)
        }), { low: 0, high: 0 });
        return { trade, areas, subtotal };
      });
  };

  const formatEstimateItemName = (area, name) => `${area}｜${name}`;

  const toEstimateDetailCells = (row, subtotalText) => {
    return [row.name, row.qty, row.unit, row.unitPrice, subtotalText, String(row.note || "").trim()];
  };

  return {
    cabinetBillableQuantity,
    buildEstimateFileName,
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
    formatCabinetRowQuantity,
    formatEstimateItemName,
    formatProjectLocation,
    groupEstimateRowsByTradeAndArea,
    groupEstimateRowsByArea,
    isPricedItem,
    sortEstimateRowsByArea,
    toEstimateDetailCells,
    toComparisonSafeRow
  };
});
