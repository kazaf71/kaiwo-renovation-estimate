const pricing = JSON.parse(document.querySelector("#pricing-data").textContent);

const { cleanNote, noteLine } = window.KaiwoNotes;
const {
  buildEstimateTitles,
  estimateDetailColumnWidths,
  estimateDetailHeaders,
  formatCabinetQuantity,
  formatProjectLocation,
  isPricedItem,
  toEstimateDetailCells,
  toComparisonSafeRow
} = window.KaiwoEstimateDisplay;
const { buildPdfFileName, paginateEstimateGroups } = window.KaiwoPdfExport;
pricing.brand.line = "@371leiqg";
const draftKey = "kaiwo-estimate-trial-v1";
let savedDraft = {};
try { savedDraft = JSON.parse(localStorage.getItem(draftKey) || "{}"); } catch (_) {}
if (!savedDraft || typeof savedDraft !== "object" || Array.isArray(savedDraft)) savedDraft = {};
if (Array.isArray(savedDraft.cabinetRows)) {
  savedDraft.cabinetRows = savedDraft.cabinetRows.map((row) => {
    if (!["lowA", "lowB"].includes(row.type)) return row;
    return {
      ...row,
      type: "low",
      customText: ["矮櫃A", "矮櫃B"].includes(row.customText) ? "矮櫃" : row.customText,
      low: 4500,
      high: 6100
    };
  });
}
function useDraftState(key, fallback) {
  const [value, setValue] = React.useState(() => savedDraft[key] ?? fallback);
  React.useEffect(() => {
    savedDraft[key] = value;
    try {
      localStorage.setItem(draftKey, JSON.stringify(savedDraft));
      document.querySelector("#draft-status")?.replaceChildren("草稿已儲存於本機");
    } catch (_) { document.querySelector("#draft-status")?.replaceChildren("無法自動儲存，請下載備份"); }
  }, [key, value]);
  return [value, setValue];
}
function backupDraft() {
  const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, data: savedDraft}, null, 2)], {type: "application/json"}));
  const a = document.createElement("a"); a.href = url; a.download = "楷沃估價草稿.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importDraft(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const draft = JSON.parse(await file.text());
    if (draft.version !== 1 || !draft.data || typeof draft.data !== "object" || Array.isArray(draft.data)) throw new Error();
    const clean = {};
    for (const [key, value] of Object.entries(draft.data)) {
      if (!Object.hasOwn(savedDraft, key)) continue;
      const expected = savedDraft[key];
      if (Array.isArray(expected) ? !Array.isArray(value) : typeof value !== typeof expected && !(typeof expected === "number" && typeof value === "string")) throw new Error();
      clean[key] = value;
    }
    if (!Object.keys(clean).length) throw new Error();
    if (!window.confirm("載入草稿會取代目前內容，確定載入？")) return;
    localStorage.setItem(draftKey, JSON.stringify({...savedDraft, ...clean})); location.reload();
  } catch (_) { window.alert("無法載入，請選擇本試用版下載的草稿 JSON 檔案。"); }
  event.target.value = "";
}

const money = (value) =>
  Math.round(value || 0).toLocaleString("zh-TW", {
    maximumFractionDigits: 0
  });

const moneyRange = (range) => {
  const low = Math.round(range.low || 0);
  const high = Math.round(range.high || 0);
  return low === high ? `${money(low)}元` : `${money(low)}-${money(high)}元`;
};

const numberInputClass = "w-24 rounded-md border border-coffee/20 px-2.5 py-2 text-sm";
const numberInputWideClass = "w-28 rounded-md border border-coffee/20 px-2.5 py-2 text-sm";
const numberInputPanelClass = "w-24 rounded-md border border-coffee/20 bg-white px-2.5 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-400";
const textInputClass = "rounded-md border border-coffee/20 px-2.5 py-2 text-sm";
const fullTextInputClass = "w-full rounded-lg border border-coffee/20 bg-white px-3 py-2 text-sm";

const toFeet = (cm) => Number(cm || 0) / 30.3;

const fixedNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const pricedPair = (qty, low, high, fixed = "") => {
  const fixedPrice = fixedNumber(fixed);
  const amount = Number(qty || 0);
  if (fixedPrice !== null) return pair(amount * fixedPrice, amount * fixedPrice);
  return pair(amount * Number(low || 0), amount * Number(high || 0));
};

const unitPriceText = (low, high, fixed = "") => moneyRange(pricedPair(1, low, high, fixed));

const referenceText = (item, fallbackUnit = "") => {
  if (!item) return "";
  const unit = item.unit || fallbackUnit;
  const price = moneyRange(pair(item.low, item.high));
  return `${item.name}｜${price}${unit ? `／${unit}` : ""}`;
};

const itemDisplayName = (item, fallback = "") => item?.name || fallback;

const rowText = (row, item, fallback = "") => row.customText || itemDisplayName(item, row.name || fallback);

const actualUnitPriceText = (value) => {
  const number = fixedNumber(value);
  return number === null ? "未填" : `${money(number)}元`;
};

const actualPricedPair = (qty, actualUnitPrice) => {
  const price = fixedNumber(actualUnitPrice);
  const amount = Number(qty || 0);
  if (price === null) return pair();
  return pair(amount * price, amount * price);
};

function pair(low = 0, high = 0) {
  return { low, high };
}

function addPair(a, b) {
  return pair((a.low || 0) + (b.low || 0), (a.high || 0) + (b.high || 0));
}

function PriceRange({ range, large = false }) {
  return (
    <div className={large ? "text-2xl font-black text-coffee" : "font-bold text-coffee"}>
      NT$ {moneyRange(range)}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function NoteField({ value, onChange, disabled = false }) {
  return (
    <label className="item-note">
      <span>備註（選填）</span>
      <textarea rows="2" value={value || ""} disabled={disabled} placeholder="填寫此項目的施工備註" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

const WorkspaceContext = React.createContext("基本資料");
const workSections = ["基本資料", "需要估價的區域", "櫃體工程估價", "木作工程估價", "地板工程", "土水工程估價", "保護工程", "清運廢棄物工程", "水電工程估價", "油漆工程估價", "空調工程估價", "自訂工程"];

function Card({ title, children, defaultOpen = true }) {
  const active = React.useContext(WorkspaceContext);
  return (
    <details open={true} hidden={active !== title} className="work-panel print-card rounded-lg border border-coffee/15 bg-creamSoft shadow-md shadow-coffee/5">
      <summary onClick={(event) => event.preventDefault()} className="no-print flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-lg font-black text-coffee">{title}</h2>
        <span className="rounded-md bg-wood/35 px-2.5 py-1 text-xs font-bold text-coffee">展開／收合</span>
      </summary>
      <div className="border-t border-coffee/10 p-4">{children}</div>
    </details>
  );
}

function App() {
  const [activeSection, setActiveSection] = React.useState("基本資料");
  const [customTrades, setCustomTrades] = useDraftState("customTrades", []);
  const updateCustomTrade = (id, patch) => {
    setCustomTrades((trades) => trades.map((trade) => trade.id === id ? {...trade, ...patch} : trade));
    setShowResult(false);
  };
  const customTotals = customTrades.map((trade) => ({...trade, subtotal: trade.rows.reduce((sum, row) => addPair(sum, actualPricedPair(row.qty, row.price)), pair())}));
  const customTotal = customTotals.reduce((sum, trade) => addPair(sum, trade.subtotal), pair());
  const [projectName, setProjectName] = useDraftState("projectName", "");
  const [projectLocation, setProjectLocation] = useDraftState("projectLocation", "");
  const [ping, setPing] = useDraftState("ping", 28);
  const [condition, setCondition] = useDraftState("condition", "新成屋");
  const { summaryTitle, formalTitle } = buildEstimateTitles(projectName, pricing.brand.name);
  const projectLocationText = formatProjectLocation(projectLocation);
  const [selectedAreas, setSelectedAreas] = useDraftState("selectedAreas", []);
  const [customAreas, setCustomAreas] = useDraftState("customAreas", []);
  const [newArea, setNewArea] = React.useState("");
  const [areaMessage, setAreaMessage] = React.useState("");
  const allAreas = [...new Set([...pricing.areas, ...customAreas])];
  const addCustomArea = (event) => {
    event.preventDefault();
    const name = newArea.trim();
    if (!name) { setAreaMessage("請填入區域名稱"); return; }
    if (!allAreas.includes(name)) setCustomAreas((areas) => [...areas, name]);
    setSelectedAreas((areas) => areas.includes(name) ? areas : [...areas, name]);
    setNewArea("");
    setAreaMessage(allAreas.includes(name) ? `已選取「${name}」` : `已新增並選取「${name}」`);
    setShowResult(false);
  };
  const [floorArea, setFloorArea] = useDraftState("floorArea", "全室");
  const [floorGrade, setFloorGrade] = useDraftState("floorGrade", "middle");
  const [floorPing, setFloorPing] = useDraftState("floorPing", 18);
  const [floorLow, setFloorLow] = useDraftState("floorLow", 5000);
  const [floorHigh, setFloorHigh] = useDraftState("floorHigh", 5000);
  const [floorFixed, setFloorFixed] = useDraftState("floorFixed", "");
  const [floorText, setFloorText] = useDraftState("floorText", "中階地板");
  const [floorNote, setFloorNote] = useDraftState("floorNote", "");
  const [floorUnit, setFloorUnit] = useDraftState("floorUnit", "坪");
  const [floorActualUnitPrice, setFloorActualUnitPrice] = useDraftState("floorActualUnitPrice", "");
  const floorNeeded = fixedNumber(floorActualUnitPrice) !== null && Number(floorPing) > 0;
  const [protectionArea, setProtectionArea] = useDraftState("protectionArea", "全室");
  const [protectionText, setProtectionText] = useDraftState("protectionText", "保護工程");
  const [protectionNote, setProtectionNote] = useDraftState("protectionNote", "");
  const [protectionQty, setProtectionQty] = useDraftState("protectionQty", 1);
  const [protectionUnit, setProtectionUnit] = useDraftState("protectionUnit", "式");
  const [protectionLow, setProtectionLow] = useDraftState("protectionLow", 8000);
  const [protectionHigh, setProtectionHigh] = useDraftState("protectionHigh", 15000);
  const [protectionFixed, setProtectionFixed] = useDraftState("protectionFixed", "");
  const [protectionActualUnitPrice, setProtectionActualUnitPrice] = useDraftState("protectionActualUnitPrice", "");
  const [cleanupArea, setCleanupArea] = useDraftState("cleanupArea", "全室");
  const [cleanupText, setCleanupText] = useDraftState("cleanupText", "清運廢棄物工程");
  const [cleanupNote, setCleanupNote] = useDraftState("cleanupNote", "");
  const [cleanupQty, setCleanupQty] = useDraftState("cleanupQty", 1);
  const [cleanupUnit, setCleanupUnit] = useDraftState("cleanupUnit", "式");
  const [cleanupLow, setCleanupLow] = useDraftState("cleanupLow", 12000);
  const [cleanupHigh, setCleanupHigh] = useDraftState("cleanupHigh", 25000);
  const [cleanupFixed, setCleanupFixed] = useDraftState("cleanupFixed", "");
  const [cleanupActualUnitPrice, setCleanupActualUnitPrice] = useDraftState("cleanupActualUnitPrice", "");
  const [invoiceNeeded, setInvoiceNeeded] = useDraftState("invoiceNeeded", false);
  const [comparisonSafeMode, setComparisonSafeMode] = useDraftState("comparisonSafeMode", false);
  const [managementPercent, setManagementPercent] = useDraftState("managementPercent", "");
  const [showResult, setShowResult] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [pdfDownloading, setPdfDownloading] = React.useState(false);
  const [cabinetRows, setCabinetRows] = useDraftState("cabinetRows", []);
  const [woodRows, setWoodRows] = useDraftState("woodRows", []);
  const [plumbingExtras, setPlumbingExtras] = useDraftState("plumbingExtras", []);
  const [paintingExtras, setPaintingExtras] = useDraftState("paintingExtras", []);
  const [airConditioningRows, setAirConditioningRows] = useDraftState("airConditioningRows", []);
  const [masonryRows, setMasonryRows] = useDraftState("masonryRows", []);

  const cabinetTypeMap = React.useMemo(() => Object.fromEntries(
    [...pricing.cabinetTypes, ...(pricing.legacyCabinetTypes || [])].map((item) => [item.id, item])
  ), []);
  const woodItemMap = React.useMemo(() => Object.fromEntries(pricing.woodworkItems.map((item) => [item.id, item])), []);
  const plumbingItemMap = React.useMemo(() => Object.fromEntries(pricing.plumbingExtraItems.map((item) => [item.id, item])), []);
  const paintingItemMap = React.useMemo(() => Object.fromEntries(pricing.paintingExtraItems.map((item) => [item.id, item])), []);
  const airConditioningItemMap = React.useMemo(() => Object.fromEntries(pricing.airConditioningItems.map((item) => [item.id, item])), []);
  const masonryItemMap = React.useMemo(() => Object.fromEntries(pricing.masonryItems.map((item) => [item.id, item])), []);
  const floorItem = pricing.flooring.find((item) => item.id === floorGrade) || pricing.flooring[0];
  const [plumbingBaseLow, setPlumbingBaseLow] = useDraftState("plumbingBaseLow", pricing.plumbingElectric["新成屋"].low);
  const [plumbingBaseHigh, setPlumbingBaseHigh] = useDraftState("plumbingBaseHigh", pricing.plumbingElectric["新成屋"].high);
  const [plumbingBaseFixed, setPlumbingBaseFixed] = useDraftState("plumbingBaseFixed", "");
  const [plumbingBaseArea, setPlumbingBaseArea] = useDraftState("plumbingBaseArea", "全室");
  const [plumbingBaseText, setPlumbingBaseText] = useDraftState("plumbingBaseText", "新成屋基礎水電");
  const [plumbingBaseNote, setPlumbingBaseNote] = useDraftState("plumbingBaseNote", "");
  const [plumbingBaseActualUnitPrice, setPlumbingBaseActualUnitPrice] = useDraftState("plumbingBaseActualUnitPrice", "");
  const [paintingBaseLow, setPaintingBaseLow] = useDraftState("paintingBaseLow", pricing.painting["新成屋"].low);
  const [paintingBaseHigh, setPaintingBaseHigh] = useDraftState("paintingBaseHigh", pricing.painting["新成屋"].high);
  const [paintingBaseFixed, setPaintingBaseFixed] = useDraftState("paintingBaseFixed", "");
  const [paintingBaseArea, setPaintingBaseArea] = useDraftState("paintingBaseArea", "全室");
  const [paintingBaseText, setPaintingBaseText] = useDraftState("paintingBaseText", "新成屋基礎油漆");
  const [paintingBaseNote, setPaintingBaseNote] = useDraftState("paintingBaseNote", "");
  const [paintingBaseActualUnitPrice, setPaintingBaseActualUnitPrice] = useDraftState("paintingBaseActualUnitPrice", "");

  const visibleCabinetRows = cabinetRows.filter((row) => selectedAreas.includes(row.area));

  const cabinetTotals = visibleCabinetRows.map((row) => {
    const type = cabinetTypeMap[row.type] || pricing.cabinetTypes[0];
    const widthFeet = toFeet(row.widthCm);
    return {
      ...row,
      typeName: type.name,
      customText: row.customText || row.name || itemDisplayName(type, "新增櫃體"),
      unit: row.unit || "尺",
      unitLow: Number(row.low || 0),
      unitHigh: Number(row.high || 0),
      widthFeet,
      subtotal: actualPricedPair(widthFeet * Number(row.qty || 0), row.actualUnitPrice)
    };
  });

  const visibleWoodRows = woodRows.filter((row) => selectedAreas.includes(row.area));

  const woodTotals = visibleWoodRows.map((row) => {
    const item = woodItemMap[row.itemId] || pricing.woodworkItems[0];
    return {
      ...row,
      item,
      customText: rowText(row, item),
      unit: row.unit || item.unit,
      subtotal: actualPricedPair(row.qty, row.actualUnitPrice)
    };
  });

  const cabinetTotal = cabinetTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const woodTotal = woodTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const flooringTotal = floorNeeded ? actualPricedPair(floorPing, floorActualUnitPrice) : pair();
  const peRate = pricing.plumbingElectric[condition];
  const paintRate = pricing.painting[condition];
  const plumbingBaseTotal = actualPricedPair(ping, plumbingBaseActualUnitPrice);
  const paintingBaseTotal = actualPricedPair(ping, paintingBaseActualUnitPrice);
  const plumbingExtraTotals = plumbingExtras.map((row) => ({
    ...row,
    item: plumbingItemMap[row.itemId] || pricing.plumbingExtraItems[0],
    customText: rowText(row, plumbingItemMap[row.itemId] || pricing.plumbingExtraItems[0]),
    unit: row.unit || (plumbingItemMap[row.itemId] || pricing.plumbingExtraItems[0]).unit,
    subtotal: actualPricedPair(row.qty, row.actualUnitPrice)
  }));
  const paintingExtraTotals = paintingExtras.map((row) => ({
    ...row,
    item: paintingItemMap[row.itemId] || pricing.paintingExtraItems[0],
    customText: rowText(row, paintingItemMap[row.itemId] || pricing.paintingExtraItems[0]),
    unit: row.unit || (paintingItemMap[row.itemId] || pricing.paintingExtraItems[0]).unit,
    subtotal: actualPricedPair(row.qty, row.actualUnitPrice)
  }));
  const airConditioningTotals = airConditioningRows.map((row) => ({
    ...row,
    item: airConditioningItemMap[row.itemId] || pricing.airConditioningItems[0],
    customText: rowText(row, airConditioningItemMap[row.itemId] || pricing.airConditioningItems[0]),
    unit: row.unit || (airConditioningItemMap[row.itemId] || pricing.airConditioningItems[0]).unit,
    subtotal: actualPricedPair(row.qty, row.actualUnitPrice)
  }));
  const masonryTotals = masonryRows.map((row) => ({
    ...row,
    item: masonryItemMap[row.itemId] || pricing.masonryItems[0],
    customText: rowText(row, masonryItemMap[row.itemId] || pricing.masonryItems[0]),
    unit: row.unit || (masonryItemMap[row.itemId] || pricing.masonryItems[0]).unit,
    subtotal: actualPricedPair(row.qty, row.actualUnitPrice)
  }));
  const plumbingExtraTotal = plumbingExtraTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const paintingExtraTotal = paintingExtraTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const airConditioningTotal = airConditioningTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const masonryTotal = masonryTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const protectionTotal = actualPricedPair(protectionQty, protectionActualUnitPrice);
  const cleanupTotal = actualPricedPair(cleanupQty, cleanupActualUnitPrice);
  const plumbingTotal = addPair(plumbingBaseTotal, plumbingExtraTotal);
  const paintingTotal = addPair(paintingBaseTotal, paintingExtraTotal);
  const grandTotal = [cabinetTotal, woodTotal, flooringTotal, masonryTotal, protectionTotal, cleanupTotal, plumbingTotal, paintingTotal, airConditioningTotal, customTotal].reduce(addPair, pair());
  const invoiceTotal = invoiceNeeded ? pair(grandTotal.low * 0.05, grandTotal.high * 0.05) : pair();
  const managementRate = Number(managementPercent || 0) / 100;
  const managementTotal = managementRate > 0 ? pair(grandTotal.low * managementRate, grandTotal.high * managementRate) : pair();
  const finalTotal = [grandTotal, invoiceTotal, managementTotal].reduce(addPair, pair());
  const hasAmount = (range) => Number(range.low || 0) !== 0 || Number(range.high || 0) !== 0;

  const updateCabinet = (id, patch) => {
    setCabinetRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updateWood = (id, patch) => {
    setWoodRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updateCabinetType = (id, typeId) => {
    const item = cabinetTypeMap[typeId] || pricing.cabinetTypes[0];
    updateCabinet(id, { type: typeId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: "尺", actualUnitPrice: "" });
  };

  const updateWoodItem = (id, itemId) => {
    const item = woodItemMap[itemId] || pricing.woodworkItems[0];
    updateWood(id, { itemId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: item.unit, actualUnitPrice: "" });
  };

  const updateFloorGrade = (gradeId) => {
    const item = pricing.flooring.find((floor) => floor.id === gradeId) || pricing.flooring[0];
    setFloorGrade(gradeId);
    setFloorLow(item.low);
    setFloorHigh(item.high);
    setFloorText(itemDisplayName(item));
    setFloorUnit("坪");
    setFloorActualUnitPrice("");
    setFloorFixed("");
    setShowResult(false);
  };

  const updateCondition = (value) => {
    const nextPeRate = pricing.plumbingElectric[value];
    const nextPaintRate = pricing.painting[value];
    setCondition(value);
    setPlumbingBaseLow(nextPeRate.low);
    setPlumbingBaseHigh(nextPeRate.high);
    setPlumbingBaseText(`${value}基礎水電`);
    setPlumbingBaseActualUnitPrice("");
    setPlumbingBaseFixed("");
    setPaintingBaseLow(nextPaintRate.low);
    setPaintingBaseHigh(nextPaintRate.high);
    setPaintingBaseText(`${value}基礎油漆`);
    setPaintingBaseActualUnitPrice("");
    setPaintingBaseFixed("");
    setShowResult(false);
  };

  const updatePlumbingExtra = (id, patch) => {
    setPlumbingExtras((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updatePaintingExtra = (id, patch) => {
    setPaintingExtras((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updateAirConditioning = (id, patch) => {
    setAirConditioningRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updateMasonry = (id, patch) => {
    setMasonryRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updatePlumbingItem = (id, itemId) => {
    const item = plumbingItemMap[itemId] || pricing.plumbingExtraItems[0];
    updatePlumbingExtra(id, { itemId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: item.unit, actualUnitPrice: "" });
  };

  const updatePaintingItem = (id, itemId) => {
    const item = paintingItemMap[itemId] || pricing.paintingExtraItems[0];
    updatePaintingExtra(id, { itemId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: item.unit, actualUnitPrice: "" });
  };

  const updateAirConditioningItem = (id, itemId) => {
    const item = airConditioningItemMap[itemId] || pricing.airConditioningItems[0];
    updateAirConditioning(id, { itemId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: item.unit, actualUnitPrice: "" });
  };

  const updateMasonryItem = (id, itemId) => {
    const item = masonryItemMap[itemId] || pricing.masonryItems[0];
    updateMasonry(id, { itemId, low: item.low, high: item.high, fixed: "", customText: itemDisplayName(item), unit: item.unit, actualUnitPrice: "" });
  };

  const addCabinet = (area = selectedAreas[0] || "客廳") => {
    const item = cabinetTypeMap.tall || pricing.cabinetTypes[0];
    setCabinetRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), area, name: "新增櫃體", customText: itemDisplayName(item), note: "", type: "tall", widthCm: 120, qty: 1, unit: "尺", low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }
    ]);
    setShowResult(false);
  };

  const addWood = (area = selectedAreas[0] || "全室") => {
    const item = woodItemMap.flatCeiling || pricing.woodworkItems[0];
    setWoodRows((rows) => [...rows, { id: crypto.randomUUID(), area, itemId: item.id, customText: itemDisplayName(item), note: "", qty: 1, unit: item.unit, low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }]);
    setShowResult(false);
  };

  const addPlumbingExtra = () => {
    const item = pricing.plumbingExtraItems[0];
    setPlumbingExtras((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "客廳", itemId: item.id, customText: itemDisplayName(item), note: "", qty: 1, unit: item.unit, low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }]);
    setShowResult(false);
  };

  const addPaintingExtra = () => {
    const item = pricing.paintingExtraItems[0];
    setPaintingExtras((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "客廳", itemId: item.id, customText: itemDisplayName(item), note: "", qty: 1, unit: item.unit, low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }]);
    setShowResult(false);
  };

  const addAirConditioning = () => {
    const item = pricing.airConditioningItems[0];
    setAirConditioningRows((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "客廳", itemId: item.id, customText: itemDisplayName(item), note: "", qty: 1, unit: item.unit, low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }]);
    setShowResult(false);
  };

  const addMasonry = () => {
    const item = pricing.masonryItems[0];
    setMasonryRows((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "廁所／浴室", itemId: item.id, customText: itemDisplayName(item), note: "", qty: 1, unit: item.unit, low: item.low, high: item.high, fixed: "", actualUnitPrice: "" }]);
    setShowResult(false);
  };

  const toggleArea = (area) => {
    setSelectedAreas((areas) => (areas.includes(area) ? areas.filter((item) => item !== area) : [...areas, area]));
    setShowResult(false);
  };

  const estimateNoteLines = [
    ...customTrades.flatMap((trade) => trade.rows.map((row) => cleanNote(row.note) ? `- ${trade.name.trim() || "自訂工程"}｜${row.area || "全室"}｜${row.name.trim() || "未命名項目"}：${cleanNote(row.note)}` : "")),
    ...cabinetTotals.map((row) => cleanNote(row.note) ? `- 櫃體工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : ""),
    ...woodTotals.map((row) => cleanNote(row.note) ? `- 木作工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : ""),
    floorNeeded && cleanNote(floorNote) ? `- 地板工程｜${floorArea}｜${floorText}：${cleanNote(floorNote)}` : "",
    ...masonryTotals.map((row) => hasAmount(row.subtotal) && cleanNote(row.note) ? `- 土水工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : ""),
    hasAmount(protectionTotal) && cleanNote(protectionNote) ? `- 保護工程｜${protectionArea}｜${protectionText}：${cleanNote(protectionNote)}` : "",
    hasAmount(cleanupTotal) && cleanNote(cleanupNote) ? `- 清運廢棄物工程｜${cleanupArea}｜${cleanupText}：${cleanNote(cleanupNote)}` : "",
    hasAmount(plumbingBaseTotal) && cleanNote(plumbingBaseNote) ? `- 水電工程｜${plumbingBaseArea}｜${plumbingBaseText}：${cleanNote(plumbingBaseNote)}` : "",
    ...plumbingExtraTotals.map((row) => hasAmount(row.subtotal) && cleanNote(row.note) ? `- 水電工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : ""),
    hasAmount(paintingBaseTotal) && cleanNote(paintingBaseNote) ? `- 油漆工程｜${paintingBaseArea}｜${paintingBaseText}：${cleanNote(paintingBaseNote)}` : "",
    ...paintingExtraTotals.map((row) => hasAmount(row.subtotal) && cleanNote(row.note) ? `- 油漆工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : ""),
    ...airConditioningTotals.map((row) => hasAmount(row.subtotal) && cleanNote(row.note) ? `- 空調工程｜${row.area}｜${row.customText}：${cleanNote(row.note)}` : "")
  ].filter(Boolean);
  const estimateNoteText = estimateNoteLines.join("\n");
  const summaryItemLine = (row) => comparisonSafeMode
    ? `  - ${row.area}｜${row.customText} × 1式：NT$ ${moneyRange(row.subtotal)}`
    : `  - ${row.area}｜${row.customText} × ${row.qty}${row.unit} × ${actualUnitPriceText(row.actualUnitPrice)}：NT$ ${moneyRange(row.subtotal)}`;

  const summaryText = React.useMemo(() => {
    const lines = [
      summaryTitle,
      `${pricing.brand.name}｜${pricing.brand.positioning}`,
      `工程地點：${projectLocationText}`,
      `LINE：${pricing.brand.line}｜電話：${pricing.brand.phone}`,
      ``,
      `基本條件：室內 ${ping} 坪，屋況：${condition}`,
      `估價區域：${selectedAreas.join("、") || "未選擇"}`,
      ``,
      ...(hasAmount(cabinetTotal) ? [`櫃體工程：NT$ ${moneyRange(cabinetTotal)}`] : []),
      ...(hasAmount(woodTotal) ? [`木作工程：NT$ ${moneyRange(woodTotal)}`] : []),
      ...(floorNeeded && hasAmount(flooringTotal) ? [`地板工程：NT$ ${moneyRange(flooringTotal)}`] : []),
      ...(hasAmount(masonryTotal) ? [`土水工程：NT$ ${moneyRange(masonryTotal)}`] : []),
      ...masonryTotals.filter((row) => hasAmount(row.subtotal)).map(summaryItemLine),
      ...(hasAmount(protectionTotal) ? [`保護工程：NT$ ${moneyRange(protectionTotal)}（${protectionText} × ${comparisonSafeMode ? "1式" : `${protectionQty}${protectionUnit} × ${actualUnitPriceText(protectionActualUnitPrice)}`}）`] : []),
      ...(hasAmount(cleanupTotal) ? [`清運廢棄物工程：NT$ ${moneyRange(cleanupTotal)}（${cleanupText} × ${comparisonSafeMode ? "1式" : `${cleanupQty}${cleanupUnit} × ${actualUnitPriceText(cleanupActualUnitPrice)}`}）`] : []),
      ...(hasAmount(plumbingTotal) ? [`水電工程：NT$ ${moneyRange(plumbingTotal)}（基礎 ${moneyRange(plumbingBaseTotal)}，加價 ${moneyRange(plumbingExtraTotal)}）`] : []),
      ...plumbingExtraTotals.filter((row) => hasAmount(row.subtotal)).map(summaryItemLine),
      ...(hasAmount(paintingTotal) ? [`油漆工程：NT$ ${moneyRange(paintingTotal)}（基礎 ${moneyRange(paintingBaseTotal)}，加價 ${moneyRange(paintingExtraTotal)}）`] : []),
      ...paintingExtraTotals.filter((row) => hasAmount(row.subtotal)).map(summaryItemLine),
      ...(hasAmount(airConditioningTotal) ? [`空調工程：NT$ ${moneyRange(airConditioningTotal)}`] : []),
      ...airConditioningTotals.filter((row) => hasAmount(row.subtotal)).map(summaryItemLine),
      ``,
      ...customTotals.map((trade) => `${trade.name || "自訂工程"}：NT$ ${moneyRange(trade.subtotal)}`),
      ...(estimateNoteText ? [`項目備註：`, estimateNoteText, ``] : []),
      `稅前工程總額：NT$ ${moneyRange(grandTotal)}`,
      ...(managementRate > 0 ? [`監管費（${managementPercent}%）：NT$ ${moneyRange(managementTotal)}`] : []),
      ...(invoiceNeeded ? [`發票稅金（5%）：NT$ ${moneyRange(invoiceTotal)}`] : []),
      `全部總額：NT$ ${moneyRange(finalTotal)}`,
      ``,
      `免責說明：此為線上初估金額，實際報價仍需依現場丈量、材質選擇、施工條件與圖面內容為準。`
    ];
    return lines.join("\n");
  }, [summaryTitle, projectLocationText, customTrades, ping, condition, selectedAreas, cabinetTotal, woodTotal, floorNeeded, flooringTotal, masonryTotal, masonryTotals, protectionTotal, protectionText, protectionQty, protectionUnit, protectionActualUnitPrice, cleanupTotal, cleanupText, cleanupQty, cleanupUnit, cleanupActualUnitPrice, plumbingBaseTotal, plumbingExtraTotal, plumbingTotal, plumbingExtraTotals, paintingBaseTotal, paintingExtraTotal, paintingTotal, paintingExtraTotals, airConditioningTotal, airConditioningTotals, estimateNoteText, comparisonSafeMode, grandTotal, managementRate, managementPercent, managementTotal, invoiceNeeded, invoiceTotal, finalTotal]);

  const rawEstimateRows = [
    ...customTrades.flatMap((trade) => trade.rows.map((row) => ({trade: trade.name.trim() || "自訂工程", area: row.area || "全室", name: row.name.trim() || "未命名項目", note: row.note || "", qty: row.qty, unit: row.unit, unitPrice: actualUnitPriceText(row.price), subtotal: actualPricedPair(row.qty, row.price)}))),
    ...cabinetTotals.map((row) => ({
      trade: "櫃體工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: formatCabinetQuantity(row.widthFeet, row.qty),
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    })),
    ...woodTotals.map((row) => ({
      trade: "木作工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: row.qty,
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    })),
    ...(floorNeeded ? [{
      trade: "地板工程",
      area: floorArea,
      name: floorText,
      note: floorNote,
      qty: floorPing,
      unit: floorUnit,
      unitPrice: actualUnitPriceText(floorActualUnitPrice),
      subtotal: flooringTotal
    }] : []),
    ...masonryTotals.filter((row) => isPricedItem(row.qty, row.actualUnitPrice)).map((row) => ({
      trade: "土水工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: row.qty,
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    })),
    ...(isPricedItem(protectionQty, protectionActualUnitPrice) ? [{
      trade: "保護工程",
      area: protectionArea,
      name: protectionText,
      note: protectionNote,
      qty: protectionQty,
      unit: protectionUnit,
      unitPrice: actualUnitPriceText(protectionActualUnitPrice),
      subtotal: protectionTotal
    }] : []),
    ...(isPricedItem(cleanupQty, cleanupActualUnitPrice) ? [{
      trade: "清運廢棄物工程",
      area: cleanupArea,
      name: cleanupText,
      note: cleanupNote,
      qty: cleanupQty,
      unit: cleanupUnit,
      unitPrice: actualUnitPriceText(cleanupActualUnitPrice),
      subtotal: cleanupTotal
    }] : []),
    ...(isPricedItem(ping, plumbingBaseActualUnitPrice) ? [{
      trade: "水電工程",
      area: plumbingBaseArea,
      name: plumbingBaseText,
      note: plumbingBaseNote,
      qty: ping,
      unit: "坪",
      unitPrice: actualUnitPriceText(plumbingBaseActualUnitPrice),
      subtotal: plumbingBaseTotal
    }] : []),
    ...plumbingExtraTotals.filter((row) => isPricedItem(row.qty, row.actualUnitPrice)).map((row) => ({
      trade: "水電工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: row.qty,
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    })),
    ...(isPricedItem(ping, paintingBaseActualUnitPrice) ? [{
      trade: "油漆工程",
      area: paintingBaseArea,
      name: paintingBaseText,
      note: paintingBaseNote,
      qty: ping,
      unit: "坪",
      unitPrice: actualUnitPriceText(paintingBaseActualUnitPrice),
      subtotal: paintingBaseTotal
    }] : []),
    ...paintingExtraTotals.filter((row) => isPricedItem(row.qty, row.actualUnitPrice)).map((row) => ({
      trade: "油漆工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: row.qty,
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    })),
    ...airConditioningTotals.filter((row) => isPricedItem(row.qty, row.actualUnitPrice)).map((row) => ({
      trade: "空調工程",
      area: row.area,
      name: row.customText,
      note: row.note || "",
      qty: row.qty,
      unit: row.unit,
      unitPrice: actualUnitPriceText(row.actualUnitPrice),
      subtotal: row.subtotal
    }))
  ];
  const estimateRows = rawEstimateRows.map((row) => toComparisonSafeRow(row, comparisonSafeMode, `NT$ ${moneyRange(row.subtotal)}`));

  const tradeOrder = [...new Set(["櫃體工程", "木作工程", "地板工程", "土水工程", "保護工程", "清運廢棄物工程", "水電工程", "油漆工程", "空調工程", ...customTrades.map((trade) => trade.name.trim() || "自訂工程")])];
  const estimateGroups = tradeOrder
    .map((trade) => {
      const rows = estimateRows.filter((row) => row.trade === trade);
      return {
        trade,
        rows,
        subtotal: rows.reduce((sum, row) => addPair(sum, row.subtotal), pair())
      };
    })
    .filter((group) => group.rows.length > 0);
  const totalRows = [
    ["稅前工程總額", grandTotal],
    ...(managementRate > 0 ? [[`監管費（${managementPercent}%）`, managementTotal]] : []),
    ...(invoiceNeeded ? [["發票稅金（5%）", invoiceTotal]] : [])
  ];

  const copySummary = async () => {
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const xmlEscape = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const odsCell = (cell) => {
    const normalized = cell && typeof cell === "object" && !Array.isArray(cell)
      ? cell
      : { value: cell };
    const styleAttr = normalized.style ? ` table:style-name="${normalized.style}"` : "";
    const span = Number(normalized.span || 1);
    const spanAttr = span > 1 ? ` table:number-columns-spanned="${span}"` : "";
    const coveredCells = span > 1
      ? Array.from({ length: span - 1 }, () => "<table:covered-table-cell/>").join("")
      : "";
    return `<table:table-cell office:value-type="string"${styleAttr}${spanAttr}><text:p>${xmlEscape(normalized.value)}</text:p></table:table-cell>${coveredCells}`;
  };

  const odsRow = (values, style = "") => (
    `<table:table-row>${values.map((value) => odsCell(
      value && typeof value === "object" && !Array.isArray(value)
        ? { style, ...value }
        : { value, style }
    )).join("")}</table:table-row>`
  );

  const odsCellsRow = (cells) => `<table:table-row>${cells.map(odsCell).join("")}</table:table-row>`;

  const downloadOds = async () => {
    if (!window.JSZip) {
      alert("ODS 產生器尚未載入，請確認網路連線後重新整理頁面。");
      return;
    }

    const now = new Date();
    const today = now.toLocaleDateString("zh-TW");
    const fileDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("");
    const tableRows = [
      odsCellsRow([{ value: formalTitle, span: 6, style: "title" }]),
      odsCellsRow([
        { value: "工程地點", style: "metaLabel" },
        { value: projectLocationText, span: 2, style: "meta" },
        { value: "日期", style: "metaLabel" },
        { value: today, span: 2, style: "meta" }
      ]),
      odsCellsRow([
        { value: "工程項目", style: "metaLabel" },
        { value: "室內裝修工程", span: 2, style: "meta" },
        { value: "屋況", style: "metaLabel" },
        { value: condition, span: 2, style: "meta" }
      ]),
      odsCellsRow([
        { value: "案件名稱", style: "metaLabel" },
        { value: projectName.trim() || "未填寫", span: 2, style: "meta" },
        { value: "聯絡方式", style: "metaLabel" },
        { value: `LINE ${pricing.brand.line}｜${pricing.brand.phone}`, span: 2, style: "meta" }
      ]),
      odsRow(["", "", "", "", "", ""], "spacer"),
      odsCellsRow([
        { value: estimateDetailHeaders[0], style: "head" },
        { value: estimateDetailHeaders[1], style: "head" },
        { value: estimateDetailHeaders[2], style: "headCenter" },
        { value: estimateDetailHeaders[3], style: "headCenter" },
        { value: estimateDetailHeaders[4], style: "headAmount" },
        { value: estimateDetailHeaders[5], style: "head" }
      ])
    ];

    estimateGroups.forEach((group) => {
      tableRows.push(odsCellsRow([{ value: group.trade, span: 6, style: "section" }]));
      group.rows.forEach((row) => {
        const cells = toEstimateDetailCells(row, `NT$ ${moneyRange(row.subtotal)}`, false);
        tableRows.push(odsCellsRow([
          { value: cells[0], style: "body" },
          { value: cells[1], style: "bodyItem" },
          { value: cells[2], style: "bodyCenter" },
          { value: cells[3], style: "bodyCenter" },
          { value: cells[4], style: "bodyAmountStrong" },
          { value: cells[5], style: "note" }
        ]));
      });
      tableRows.push(odsCellsRow([
        { value: `${group.trade} 小計`, span: 4, style: "subtotalLabel" },
        { value: `NT$ ${moneyRange(group.subtotal)}`, style: "subtotalAmount" },
        { value: "", style: "subtotal" }
      ]));
      tableRows.push(odsRow(["", "", "", "", "", ""], "spacer"));
    });

    totalRows.forEach(([label, total]) => {
      tableRows.push(odsCellsRow([
        { value: label, span: 4, style: "totalLabel" },
        { value: `NT$ ${moneyRange(total)}`, style: "totalAmount" },
        { value: "", style: "total" }
      ]));
    });
    tableRows.push(odsCellsRow([
      { value: "全部總額", span: 4, style: "grandLabel" },
      { value: `NT$ ${moneyRange(finalTotal)}`, style: "grandAmount" },
      { value: "", style: "grand" }
    ]));
    tableRows.push(odsRow(["", "", "", "", "", ""], "spacer"));
    [
      "估價單項目外之工程，已追加工程單另立項目報價。",
      "如需開立發票，以工程總金額5%為發票稅金。",
      "監管費依稅前工程總額計算，不以含稅後金額計算。",
      "簽約訂金為工程款總額35%進場給付。",
      "工程進度6成，給付工程款總額65%。",
      "工程完成，給付工程款總額95%。",
      "驗收完成結清尾款5%。",
      "報價單依日期保留1個月。",
      "責任保修非人為損壞保固一年。"
    ].forEach((note) => tableRows.push(odsRow([{ value: note, span: 6, style: "note" }])));

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="colTrade" style:family="table-column"><style:table-column-properties style:column-width="2.5cm"/></style:style>
    <style:style style:name="colItem" style:family="table-column"><style:table-column-properties style:column-width="4.2cm"/></style:style>
    <style:style style:name="colUnit" style:family="table-column"><style:table-column-properties style:column-width="1.35cm"/></style:style>
    <style:style style:name="colQty" style:family="table-column"><style:table-column-properties style:column-width="1.8cm"/></style:style>
    <style:style style:name="colTotal" style:family="table-column"><style:table-column-properties style:column-width="3.5cm"/></style:style>
    <style:style style:name="colNote" style:family="table-column"><style:table-column-properties style:column-width="7.3cm"/></style:style>
    <style:style style:name="title" style:family="table-cell"><style:table-cell-properties fo:background-color="#F2E7D8" fo:border="0.74pt solid #8B6F58" fo:padding="0.2cm"/><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="20pt" fo:font-weight="bold" fo:color="#3F2C22"/></style:style>
    <style:style style:name="meta" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.08cm"/><style:text-properties fo:font-size="9.5pt" fo:color="#4B3428"/></style:style>
    <style:style style:name="metaLabel" style:family="table-cell"><style:table-cell-properties fo:background-color="#FBF6EF" fo:border="0.5pt solid #D8C8B5" fo:padding="0.08cm"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#4B3428"/></style:style>
    <style:style style:name="head" style:family="table-cell"><style:table-cell-properties fo:background-color="#5B4637" fo:border="0.5pt solid #5B4637" fo:padding="0.09cm"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#FFFFFF"/></style:style>
    <style:style style:name="headCenter" style:family="table-cell"><style:table-cell-properties fo:background-color="#5B4637" fo:border="0.5pt solid #5B4637" fo:padding="0.09cm"/><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#FFFFFF"/></style:style>
    <style:style style:name="headAmount" style:family="table-cell"><style:table-cell-properties fo:background-color="#5B4637" fo:border="0.5pt solid #5B4637" fo:padding="0.09cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#FFFFFF"/></style:style>
    <style:style style:name="section" style:family="table-cell"><style:table-cell-properties fo:background-color="#EADBCB" fo:border="0.5pt solid #A88C72" fo:padding="0.09cm"/><style:text-properties fo:font-size="10.5pt" fo:font-weight="bold" fo:color="#3F2C22"/></style:style>
    <style:style style:name="body" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.07cm"/><style:text-properties fo:font-size="9.3pt" fo:color="#2F2721"/></style:style>
    <style:style style:name="bodyItem" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.07cm"/><style:text-properties fo:font-size="9.3pt" fo:color="#2F2721"/></style:style>
    <style:style style:name="bodyCenter" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.07cm"/><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="9.3pt" fo:color="#2F2721"/></style:style>
    <style:style style:name="bodyAmount" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.07cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.3pt" fo:color="#2F2721"/></style:style>
    <style:style style:name="bodyAmountStrong" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.07cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.3pt" fo:font-weight="bold" fo:color="#2F2721"/></style:style>
    <style:style style:name="subtotal" style:family="table-cell"><style:table-cell-properties fo:background-color="#F8F1E8" fo:border="0.5pt solid #B69E83" fo:padding="0.08cm"/></style:style>
    <style:style style:name="subtotalLabel" style:family="table-cell"><style:table-cell-properties fo:background-color="#F8F1E8" fo:border="0.5pt solid #B69E83" fo:padding="0.08cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#4B3428"/></style:style>
    <style:style style:name="subtotalAmount" style:family="table-cell"><style:table-cell-properties fo:background-color="#F8F1E8" fo:border="0.5pt solid #B69E83" fo:padding="0.08cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.5pt" fo:font-weight="bold" fo:color="#4B3428"/></style:style>
    <style:style style:name="total" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #8B6F58" fo:padding="0.08cm"/></style:style>
    <style:style style:name="totalLabel" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #8B6F58" fo:padding="0.08cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.8pt" fo:font-weight="bold" fo:color="#4B3428"/></style:style>
    <style:style style:name="totalAmount" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #8B6F58" fo:padding="0.08cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="9.8pt" fo:font-weight="bold" fo:color="#4B3428"/></style:style>
    <style:style style:name="grand" style:family="table-cell"><style:table-cell-properties fo:background-color="#3F2C22" fo:border="0.5pt solid #3F2C22" fo:padding="0.11cm"/></style:style>
    <style:style style:name="grandLabel" style:family="table-cell"><style:table-cell-properties fo:background-color="#3F2C22" fo:border="0.5pt solid #3F2C22" fo:padding="0.11cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="11.5pt" fo:font-weight="bold" fo:color="#FFFFFF"/></style:style>
    <style:style style:name="grandAmount" style:family="table-cell"><style:table-cell-properties fo:background-color="#3F2C22" fo:border="0.5pt solid #3F2C22" fo:padding="0.11cm"/><style:paragraph-properties fo:text-align="end"/><style:text-properties fo:font-size="11.5pt" fo:font-weight="bold" fo:color="#FFFFFF"/></style:style>
    <style:style style:name="note" style:family="table-cell"><style:table-cell-properties fo:border="0.5pt solid #D8C8B5" fo:padding="0.06cm"/><style:text-properties fo:font-size="8.5pt" fo:color="#5D4A3D"/></style:style>
    <style:style style:name="spacer" style:family="table-cell"><style:table-cell-properties fo:padding="0.02cm"/></style:style>
  </office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:table table:name="工程估價單">
        <table:table-column table:style-name="colTrade"/>
        <table:table-column table:style-name="colItem"/>
        <table:table-column table:style-name="colUnit"/>
        <table:table-column table:style-name="colQty"/>
        <table:table-column table:style-name="colTotal"/>
        <table:table-column table:style-name="colNote"/>
        ${tableRows.join("\n")}
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`;

    const templateResponse = await fetch("assets/estimate-template.ods");
    if (!templateResponse.ok) {
      alert("找不到 ODS 模板檔，請確認 assets/estimate-template.ods 是否存在。");
      return;
    }

    const zip = await window.JSZip.loadAsync(await templateResponse.arrayBuffer());
    const templateStyles = await zip.file("styles.xml")?.async("string");
    if (templateStyles) {
      const compactStyles = templateStyles
        .replace(/fo:margin-top="[^"]*"/g, 'fo:margin-top="0.8cm"')
        .replace(/fo:margin-bottom="[^"]*"/g, 'fo:margin-bottom="0.8cm"')
        .replace(/fo:margin-left="[^"]*"/g, 'fo:margin-left="0.8cm"')
        .replace(/fo:margin-right="[^"]*"/g, 'fo:margin-right="0.8cm"');
      zip.file("styles.xml", compactStyles);
    }
    zip.file("content.xml", contentXml);
    zip.file("mimetype", "application/vnd.oasis.opendocument.spreadsheet", { compression: "STORE" });

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.oasis.opendocument.spreadsheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `楷沃裝修工程-估價單-${fileDate}.ods`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const now = new Date();
    const today = now.toLocaleDateString("zh-TW");
    const fileDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("");
    const htmlCell = (value, tag = "td", extra = "") => `<${tag} ${extra}>${xmlEscape(value)}</${tag}>`;
    const colgroup = `<colgroup>${estimateDetailColumnWidths.map((width) => `<col style="width:${width}">`).join("")}</colgroup>`;
    const rows = [
      `<tr>${htmlCell(formalTitle, "th", 'colspan="6" class="title"')}</tr>`,
      `<tr>${["工程地點", projectLocationText, "", "日期", today, ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${["工程項目", "室內裝修工程", "", "屋況", condition, ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${["案件名稱", projectName.trim() || "未填寫", "", "聯絡方式", `LINE ${pricing.brand.line}｜${pricing.brand.phone}`, ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${estimateDetailHeaders.map((value) => htmlCell(value, "th")).join("")}</tr>`
    ];

    estimateGroups.forEach((group) => {
      rows.push(`<tr>${htmlCell(group.trade, "th", 'colspan="6" class="section"')}</tr>`);
      group.rows.forEach((row) => {
        const cells = toEstimateDetailCells(row, `NT$ ${moneyRange(row.subtotal)}`, false);
        rows.push(`<tr>${cells.map((value, index) => htmlCell(value, "td", index === 5 ? 'class="note item-note-output"' : "")).join("")}</tr>`);
      });
      rows.push(`<tr>${htmlCell(`${group.trade} 小計`, "td", 'colspan="4" class="subtotal"')}${htmlCell(`NT$ ${moneyRange(group.subtotal)}`, "td", 'class="subtotal amount"')}${htmlCell("", "td", 'class="subtotal"')}</tr>`);
    });

    [...totalRows, ["全部總額", finalTotal]].forEach(([label, total]) => {
      rows.push(`<tr>${htmlCell(label, "td", 'colspan="4" class="total"')}${htmlCell(`NT$ ${moneyRange(total)}`, "td", 'class="total amount"')}${htmlCell("", "td", 'class="total"')}</tr>`);
    });

    [
      "估價單項目外之工程，已追加工程單另立項目報價。",
      "如需開立發票，以工程總金額5%為發票稅金。",
      "監管費依稅前工程總額計算，不以含稅後金額計算。",
      "簽約訂金為工程款總額35%進場給付。",
      "工程進度6成，給付工程款總額65%。",
      "工程完成，給付工程款總額95%。",
      "驗收完成結清尾款5%。",
      "報價單依日期保留1個月。",
      "責任保修非人為損壞保固一年。"
    ].forEach((note) => rows.push(`<tr>${htmlCell(note, "td", 'colspan="6" class="note"')}</tr>`));

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Microsoft JhengHei", Arial, sans-serif; margin: 18px; color: #2f2721; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #b69e83; padding: 7px 8px; font-size: 12px; vertical-align: middle; word-break: break-word; white-space: normal; }
    th { background: #6f5948; color: #fff; }
    .title { background: #f2e7d8; color: #4b3428; font-size: 24px; text-align: center; padding: 12px; }
    .section { background: #efe3d3; color: #4b3428; text-align: left; }
    .subtotal { background: #f8f1e8; font-weight: bold; }
    .total { font-weight: bold; }
    .amount { text-align: right; }
    .note { color: #5d4a3d; }
  </style>
</head>
<body><table>${colgroup}${rows.join("")}</table></body>
</html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `楷沃裝修工程-估價單-${fileDate}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      window.alert("PDF 產生器尚未載入，請重新整理頁面後再試一次。");
      return;
    }

    const now = new Date();
    const today = now.toLocaleDateString("zh-TW");
    const terms = [
      "估價單項目外之工程，已追加工程單另立項目報價。",
      "如需開立發票，以工程總金額 5% 為發票稅金。",
      "監管費依稅前工程總額計算，不以含稅後金額計算。",
      "簽約訂金為工程款總額 35% 進場給付。",
      "工程進度 6 成，給付工程款總額 65%。",
      "工程完成，給付工程款總額 95%。",
      "驗收完成結清尾款 5%。",
      "報價單依日期保留 1 個月。",
      "責任保修非人為損壞保固一年。"
    ];
    const pages = paginateEstimateGroups(estimateGroups, 8);
    const lastItemCount = pages.at(-1).reduce((count, group) => count + group.rows.length, 0);
    if (lastItemCount > 4) pages.push([]);

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;left:-12000px;top:0;width:794px;background:#fff;z-index:-1;";
    document.body.appendChild(host);
    setPdfDownloading(true);

    try {
      const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        const pageGroups = pages[pageIndex];
        const includeSummary = pageIndex === pages.length - 1;
        const sheet = document.createElement("section");
        sheet.style.cssText = "box-sizing:border-box;width:794px;min-height:1123px;padding:34px;background:#fff;color:#252525;font-family:'Microsoft JhengHei','Noto Sans TC',Arial,sans-serif;display:flex;flex-direction:column;";

        const tableRows = pageGroups.flatMap((group) => {
          const sectionTitle = `${group.trade}${group.continued ? "（續）" : ""}`;
          const rows = [
            `<tr class="trade"><td colspan="6">${xmlEscape(sectionTitle)}</td></tr>`,
            ...group.rows.map((row) => {
              const cells = toEstimateDetailCells(row, `NT$ ${moneyRange(row.subtotal)}`, false);
              return `<tr>${cells.map((value, index) => `<td class="${index === 4 ? "amount" : ""}">${xmlEscape(value)}</td>`).join("")}</tr>`;
            })
          ];
          if (group.showSubtotal) {
            rows.push(`<tr class="subtotal"><td colspan="4">${xmlEscape(group.trade)} 小計</td><td class="amount">NT$ ${xmlEscape(moneyRange(group.subtotal))}</td><td></td></tr>`);
          }
          return rows;
        }).join("");

        const totals = includeSummary ? `
          <table class="totals">
            <tbody>
              ${totalRows.map(([label, total]) => `<tr><td>${xmlEscape(label)}</td><td>NT$ ${xmlEscape(moneyRange(total))}</td></tr>`).join("")}
              <tr class="grand"><td>全部總額</td><td>NT$ ${xmlEscape(moneyRange(finalTotal))}</td></tr>
            </tbody>
          </table>
          <section class="terms"><h2>估價條款與說明</h2>${terms.map((term, index) => `<p>${index + 1}. ${xmlEscape(term)}</p>`).join("")}</section>
        ` : "";

        sheet.innerHTML = `
          <style>
            .pdf-head { border-bottom: 3px solid #3f3f3f; padding-bottom: 14px; }
            .pdf-brand { font-size: 13px; font-weight: 700; color: #555; }
            .pdf-title { margin: 5px 0 0; font-size: 25px; font-weight: 900; color: #171717; }
            .pdf-meta { width: 100%; margin: 14px 0; border-collapse: collapse; table-layout: fixed; }
            .pdf-meta th, .pdf-meta td { border: 1px solid #bdbdbd; padding: 7px 8px; font-size: 11px; text-align: left; word-break: break-word; }
            .pdf-meta th { width: 74px; background: #e4e4e4; color: #222; }
            .pdf-page-label { float: right; color: #666; font-size: 10px; }
            .detail { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .detail th, .detail td { border: 1px solid #b8b8b8; padding: 7px 6px; font-size: 10.5px; line-height: 1.45; vertical-align: top; word-break: break-word; }
            .detail thead th { background: #3f3f3f; color: #fff; text-align: left; }
            .detail .trade td { background: #d4d4d4; font-weight: 900; color: #111; }
            .detail .subtotal td { background: #ededed; font-weight: 800; text-align: right; }
            .detail .amount { text-align: right; font-weight: 700; }
            .empty { border: 1px solid #bbb; padding: 24px; text-align: center; color: #666; font-size: 12px; }
            .totals { width: 100%; margin-top: 15px; border-collapse: collapse; }
            .totals td { border: 1px solid #777; padding: 8px 10px; font-size: 11px; font-weight: 700; }
            .totals td:last-child { width: 190px; text-align: right; }
            .totals .grand td { background: #2f2f2f; color: #fff; font-size: 13px; font-weight: 900; }
            .terms { margin-top: 15px; border-top: 2px solid #777; padding-top: 10px; }
            .terms h2 { margin: 0 0 6px; font-size: 12px; }
            .terms p { margin: 2px 0; font-size: 9.5px; line-height: 1.45; }
            .pdf-footer { margin-top: auto; border-top: 1px solid #aaa; padding-top: 8px; color: #555; font-size: 9px; display: flex; justify-content: space-between; }
          </style>
          <header class="pdf-head">
            <span class="pdf-page-label">第 ${pageIndex + 1} / ${pages.length} 頁</span>
            <div class="pdf-brand">${xmlEscape(pricing.brand.name)}｜${xmlEscape(pricing.brand.positioning)}</div>
            <h1 class="pdf-title">${xmlEscape(formalTitle)}</h1>
          </header>
          <table class="pdf-meta"><tbody>
            <tr><th>工程地點</th><td>${xmlEscape(projectLocationText)}</td><th>日期</th><td>${xmlEscape(today)}</td></tr>
            <tr><th>工程項目</th><td>室內裝修工程</td><th>屋況</th><td>${xmlEscape(condition)}</td></tr>
            <tr><th>案件名稱</th><td>${xmlEscape(projectName.trim() || "未填寫")}</td><th>聯絡方式</th><td>LINE ${xmlEscape(pricing.brand.line)}｜${xmlEscape(pricing.brand.phone)}</td></tr>
          </tbody></table>
          ${pageGroups.length ? `
            <table class="detail">
              <colgroup>${estimateDetailColumnWidths.map((width) => `<col style="width:${width}">`).join("")}</colgroup>
              <thead><tr>${estimateDetailHeaders.map((header) => `<th>${xmlEscape(header)}</th>`).join("")}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          ` : "<div class=\"empty\">本頁為估價總計與條款</div>"}
          ${totals}
          <footer class="pdf-footer"><span>${xmlEscape(pricing.brand.name)}｜LINE ${xmlEscape(pricing.brand.line)}｜${xmlEscape(pricing.brand.phone)}</span><span>${pageIndex + 1} / ${pages.length}</span></footer>
        `;
        host.replaceChildren(sheet);
        if (document.fonts?.ready) await document.fonts.ready;
        const canvas = await window.html2canvas(sheet, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true,
          windowWidth: 794
        });
        if (pageIndex > 0) pdf.addPage("a4", "portrait");
        const pageWidth = 210;
        const pageHeight = 297;
        let imageWidth = pageWidth;
        let imageHeight = canvas.height * imageWidth / canvas.width;
        if (imageHeight > pageHeight) {
          imageHeight = pageHeight;
          imageWidth = canvas.width * imageHeight / canvas.height;
        }
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", (pageWidth - imageWidth) / 2, 0, imageWidth, imageHeight, undefined, "FAST");
      }
      pdf.save(buildPdfFileName(projectName, now));
    } catch (error) {
      console.error("PDF export failed", error);
      window.alert("PDF 產生失敗，請重新整理頁面後再試一次。");
    } finally {
      host.remove();
      setPdfDownloading(false);
    }
  };

  const detailText = [
    "各工種估價明細",
    estimateDetailHeaders.join("｜"),
    ...estimateGroups.flatMap((group) => [
      `【${group.trade}】`,
      ...group.rows.map((row) => toEstimateDetailCells(row, `NT$ ${moneyRange(row.subtotal)}`, false).join("｜")),
      [`${group.trade}小計`, "", "", "", `NT$ ${moneyRange(group.subtotal)}`, ""].join("｜")
    ]),
    ...totalRows.map(([label, total]) => [label, "", "", "", `NT$ ${moneyRange(total)}`, ""].join("｜")),
    ["全部總額", "", "", "", `NT$ ${moneyRange(finalTotal)}`, ""].join("｜")
  ].join("\n");

  const copyDetail = async () => {
    await navigator.clipboard.writeText(detailText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <WorkspaceContext.Provider value={activeSection}>
    <main className="trial-workspace mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 xl:px-8">
      <header className="mb-6 rounded-lg border border-coffee/15 bg-creamSoft/90 p-5 shadow-xl shadow-coffee/10 md:p-8">
        <div className="header-row grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-cocoa">工程報價 / 正式版</p>
            <h1 className="text-3xl font-black leading-tight text-coffee md:text-5xl">{pricing.brand.name}</h1>
            <p className="mt-3 text-lg font-bold text-stone-700">{pricing.brand.positioning}</p>
          </div>
          <div className="header-contact grid gap-2 rounded-lg bg-wood/20 p-4 text-sm text-stone-700">
            <div><span className="font-bold text-coffee">LINE</span> {pricing.brand.line}</div>
            <div><span className="font-bold text-coffee">電話</span> {pricing.brand.phone}</div>
          </div>
        </div>
      </header>
      <div className="draft-toolbar no-print">
        <span id="draft-status" role="status">草稿已儲存於本機</span>
        <button type="button" onClick={backupDraft}>備份草稿</button>
        <label className="draft-import">載入草稿<input type="file" accept="application/json,.json" onChange={importDraft} /></label>
      </div>

      <nav className="trade-nav no-print" aria-label="估價工種">
        {workSections.map((title, index) => <button type="button" key={title} aria-pressed={activeSection === title} onClick={() => setActiveSection(title)}><span>{String(index + 1).padStart(2, "0")}</span>{title.replace("工程估價", "工程").replace("需要估價的區域", "估價區域")}</button>)}
      </nav>
      <div className="estimate-layout grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start 2xl:gap-8">
        <section className="grid gap-4">
          <Card title="基本資料">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="案件名稱">
                  <input className={fullTextInputClass} value={projectName} maxLength="60" placeholder="例如：王先生新居" onChange={(e) => { setProjectName(e.target.value); setShowResult(false); }} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="工程地點">
                  <input className={fullTextInputClass} value={projectLocation} maxLength="120" placeholder="例如：台北市中山區中山路 100 號" onChange={(e) => { setProjectLocation(e.target.value); setShowResult(false); }} />
                </Field>
              </div>
              <Field label="室內坪數">
                <input className={numberInputPanelClass} type="number" min="1" value={ping} onChange={(e) => { setPing(Number(e.target.value)); setShowResult(false); }} />
              </Field>
              <Field label="屋況">
                <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3" value={condition} onChange={(e) => updateCondition(e.target.value)}>
                  <option>新成屋</option>
                  <option>中古屋</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card title="需要估價的區域">
            <form className="custom-area-form" onSubmit={addCustomArea}>
              <Field label="自訂區域名稱"><input className={fullTextInputClass} value={newArea} maxLength={60} placeholder="例如：佛堂、工作室、三樓露台" onChange={(e) => { setNewArea(e.target.value); setAreaMessage(""); }} /></Field>
              <button className="custom-add" type="submit">＋ 新增區域</button>
            </form>
            <p className="area-status" role="status">{areaMessage}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {allAreas.map((area) => (
                <label key={area} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${selectedAreas.includes(area) ? "border-coffee bg-wood/25 text-coffee" : "border-coffee/15 bg-white text-stone-600"}`}>
                  <input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => toggleArea(area)} />
                  <span className="font-bold">{area}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card title="櫃體工程估價">
            <div className="grid gap-4">
              {selectedAreas.length === 0 && (
                <div className="rounded-lg border border-dashed border-coffee/25 bg-white p-5 text-stone-600">
                  請先在上方「需要估價的區域」勾選區域，下方會自動出現對應的櫃體工程區。
                </div>
              )}

              {selectedAreas.map((area) => {
                const areaRows = cabinetTotals.filter((row) => row.area === area);
                const areaTotal = areaRows.reduce((sum, row) => addPair(sum, row.subtotal), pair());

                return (
                  <section key={area} className="rounded-lg border border-coffee/15 bg-white p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-coffee">{area}區櫃體工程</h3>
                        <p className="text-sm text-stone-500">此區小計：NT$ {moneyRange(areaTotal)}</p>
                      </div>
                      <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={() => addCabinet(area)}>
                        新增{area}櫃體
                      </button>
                    </div>

                    {areaRows.length === 0 ? (
                      <div className="rounded-lg bg-cream px-4 py-3 text-sm text-stone-600">此區尚未新增櫃體。</div>
                    ) : (
                      <div className="grid gap-3">
                        {areaRows.map((row) => (
                          <div key={row.id} className="rounded-lg border border-coffee/10 bg-creamSoft p-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_110px_90px_90px_120px]">
                              <Field label="高度分類">
                                <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.type} onChange={(e) => updateCabinetType(row.id, e.target.value)}>
                                  {row.type === "furniture" && <option value="furniture">舊版綜合櫃體</option>}
                                  {pricing.cabinetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
                              </Field>
                              <Field label="項目文字">
                                <input className={fullTextInputClass} value={row.customText} onChange={(e) => updateCabinet(row.id, { customText: e.target.value })} />
                              </Field>
                              <Field label="寬度公分">
                                <input className={numberInputClass} type="number" min="0" value={row.widthCm} onChange={(e) => updateCabinet(row.id, { widthCm: Number(e.target.value) })} />
                              </Field>
                              <Field label="數量">
                                <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateCabinet(row.id, { qty: Number(e.target.value) })} />
                              </Field>
                              <Field label="單位">
                                <input className={numberInputClass} value={row.unit} onChange={(e) => updateCabinet(row.id, { unit: e.target.value })} />
                              </Field>
                              <Field label="實際單價">
                                <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updateCabinet(row.id, { actualUnitPrice: e.target.value })} />
                              </Field>
                            </div>
                            <div className="mt-3 grid gap-2 rounded-lg bg-white px-3 py-3 text-sm text-stone-700 md:grid-cols-4">
                              <div>寬度台尺：<b>{row.widthFeet.toFixed(2)}</b></div>
                              <div className="md:col-span-2">參考依據：<b>{referenceText(cabinetTypeMap[row.type] || pricing.cabinetTypes[0], row.unit)}</b></div>
                              <div>小計：<b>NT$ {moneyRange(row.subtotal)}</b></div>
                            </div>
                            <NoteField value={row.note} onChange={(note) => updateCabinet(row.id, { note })} />
                            <button className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700" type="button" onClick={() => setCabinetRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除此櫃體</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </Card>

          <Card title="木作工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              {selectedAreas.length === 0 && (
                <div className="rounded-lg border border-dashed border-coffee/25 bg-white p-5 text-stone-600">
                  請先到「02 估價區域」勾選區域，這裡會自動出現各區的木作工程欄位。
                </div>
              )}

              {selectedAreas.map((area) => {
                const areaRows = woodTotals.filter((row) => row.area === area);
                const areaTotal = areaRows.reduce((sum, row) => addPair(sum, row.subtotal), pair());

                return (
                  <section key={area} className="rounded-lg border border-coffee/15 bg-white p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-black text-coffee">{area}區木作工程</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-stone-700">此區小計：NT$ {moneyRange(areaTotal)}</span>
                        <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={() => addWood(area)}>新增{area}木作項目</button>
                      </div>
                    </div>

                    {areaRows.length === 0 && <p className="py-5 text-center text-sm text-stone-600">此區尚未新增木作項目。</p>}

                    <div className="grid gap-3">
                      {areaRows.map((row) => (
                        <div key={row.id} className="rounded-lg border border-coffee/10 bg-cream p-4">
                          <div className="wood-entry-grid">
                            <Field label="木作項目">
                              <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updateWoodItem(row.id, e.target.value)}>
                                {pricing.woodworkItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </Field>
                            <Field label="項目文字（可自由輸入）">
                              <input className={`${fullTextInputClass} wood-text-input`} value={row.customText} placeholder={`填寫${area}要施作的木作內容`} onChange={(e) => updateWood(row.id, { customText: e.target.value })} />
                            </Field>
                            <Field label="數量／尺寸">
                              <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateWood(row.id, { qty: Number(e.target.value) })} />
                            </Field>
                            <Field label="單位">
                              <input className={numberInputClass} value={row.unit} onChange={(e) => updateWood(row.id, { unit: e.target.value })} />
                            </Field>
                            <Field label="實際單價">
                              <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updateWood(row.id, { actualUnitPrice: e.target.value })} />
                            </Field>
                            <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700" type="button" onClick={() => setWoodRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                          </div>
                          <div className="mt-3 rounded-lg bg-white px-3 py-3 text-sm text-stone-700">
                            <div>參考依據：<b>{referenceText(row.item)}</b></div>
                            小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                          </div>
                          <NoteField value={row.note} onChange={(note) => updateWood(row.id, { note })} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </Card>

          <Card title="地板工程" defaultOpen={false}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <Field label="地板工程等級">
                  <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3 disabled:bg-stone-100 disabled:text-stone-400" value={floorGrade} onChange={(e) => updateFloorGrade(e.target.value)}>
                    {pricing.flooring.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="區域">
                  <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3 disabled:bg-stone-100 disabled:text-stone-400" value={floorArea} onChange={(e) => { setFloorArea(e.target.value); setShowResult(false); }}>
                    {(["全室", ...(selectedAreas.length ? selectedAreas : allAreas)]).map((area) => <option key={area}>{area}</option>)}
                  </select>
                </Field>
                <Field label="項目文字">
                  <input className={fullTextInputClass} value={floorText} onChange={(e) => { setFloorText(e.target.value); setShowResult(false); }} />
                </Field>
                <Field label="地板施工坪數">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorPing} onChange={(e) => { setFloorPing(Number(e.target.value)); setShowResult(false); }} />
                </Field>
                <Field label="單位">
                  <input className={numberInputPanelClass} value={floorUnit} onChange={(e) => { setFloorUnit(e.target.value); setShowResult(false); }} />
                </Field>
                <Field label="實際單價">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorActualUnitPrice} placeholder="自行填入" onChange={(e) => { setFloorActualUnitPrice(e.target.value); setShowResult(false); }} />
                </Field>
                <NoteField value={floorNote} onChange={(note) => { setFloorNote(note); setShowResult(false); }} />
              </div>
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>參考依據：{referenceText(floorItem, "坪")}</div>
                <div>實際單價：{actualUnitPriceText(floorActualUnitPrice)}／{floorUnit}</div>
                <div>目前小計：NT$ {moneyRange(flooringTotal)}</div>
              </div>
            </div>
          </Card>

          <Card title="土水工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg border border-coffee/20 bg-white px-3 py-3 text-sm text-stone-700">新增項目並填入實際單價後，自動列入估價。</div>

              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>土水工程小計：<b>NT$ {moneyRange(masonryTotal)}</b></div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">土水項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={addMasonry}>新增土水項目</button>
                </div>

                {masonryTotals.map((row) => (
                  <div key={row.id} className="rounded-lg border border-coffee/10 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_1fr_90px_90px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} onChange={(e) => updateMasonry(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : allAreas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="土水項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updateMasonryItem(row.id, e.target.value)}>
                          {pricing.masonryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </Field>
                      <Field label="項目文字">
                        <input className={fullTextInputClass} value={row.customText} onChange={(e) => updateMasonry(row.id, { customText: e.target.value })} />
                      </Field>
                      <Field label="數量">
                        <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateMasonry(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="單位">
                        <input className={numberInputClass} value={row.unit} onChange={(e) => updateMasonry(row.id, { unit: e.target.value })} />
                      </Field>
                      <Field label="實際單價">
                        <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updateMasonry(row.id, { actualUnitPrice: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" onClick={() => setMasonryRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">
                      <div>參考依據：<b>{referenceText(row.item)}</b></div>
                      小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                    </div>
                    <NoteField value={row.note} onChange={(note) => updateMasonry(row.id, { note })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="保護工程" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg border border-coffee/10 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[130px_1fr_100px_100px_140px] md:items-end">
                  <Field label="區域">
                    <select className="rounded-lg border border-coffee/20 px-3 py-2" value={protectionArea} onChange={(e) => { setProtectionArea(e.target.value); setShowResult(false); }}>
                      {(["全室", ...(selectedAreas.length ? selectedAreas : allAreas)]).map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </Field>
                  <Field label="項目文字">
                    <input className={fullTextInputClass} value={protectionText} onChange={(e) => { setProtectionText(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="數量">
                    <input className={numberInputClass} type="number" min="0" value={protectionQty} onChange={(e) => { setProtectionQty(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="單位">
                    <input className="rounded-lg border border-coffee/20 px-3 py-2" value={protectionUnit} onChange={(e) => { setProtectionUnit(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="實際單價">
                    <input className={numberInputClass} type="number" min="0" value={protectionActualUnitPrice} placeholder="自行填入" onChange={(e) => { setProtectionActualUnitPrice(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(protectionTotal)}</b></div>
                <NoteField value={protectionNote} onChange={(note) => { setProtectionNote(note); setShowResult(false); }} />
              </div>
            </div>
          </Card>

          <Card title="清運廢棄物工程" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg border border-coffee/10 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[130px_1fr_100px_100px_140px] md:items-end">
                  <Field label="區域">
                    <select className="rounded-lg border border-coffee/20 px-3 py-2" value={cleanupArea} onChange={(e) => { setCleanupArea(e.target.value); setShowResult(false); }}>
                      {(["全室", ...(selectedAreas.length ? selectedAreas : allAreas)]).map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </Field>
                  <Field label="項目文字">
                    <input className={fullTextInputClass} value={cleanupText} onChange={(e) => { setCleanupText(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="數量">
                    <input className={numberInputClass} type="number" min="0" value={cleanupQty} onChange={(e) => { setCleanupQty(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="單位">
                    <input className="rounded-lg border border-coffee/20 px-3 py-2" value={cleanupUnit} onChange={(e) => { setCleanupUnit(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="實際單價">
                    <input className={numberInputClass} type="number" min="0" value={cleanupActualUnitPrice} placeholder="自行填入" onChange={(e) => { setCleanupActualUnitPrice(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(cleanupTotal)}</b></div>
                <NoteField value={cleanupNote} onChange={(note) => { setCleanupNote(note); setShowResult(false); }} />
              </div>
            </div>
          </Card>

          <Card title="水電工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>基礎估算：{condition}，參考 {money(plumbingBaseLow)}-{money(plumbingBaseHigh)}元／坪，填入實際單價後自動列入估價。</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[130px_1fr_130px]">
                  <Field label="區域">
                    <select className="rounded-lg border border-coffee/20 px-3 py-2" value={plumbingBaseArea} onChange={(e) => { setPlumbingBaseArea(e.target.value); setShowResult(false); }}>
                      {(["全室", ...(selectedAreas.length ? selectedAreas : allAreas)]).map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </Field>
                  <Field label="基礎項目文字">
                    <input className={fullTextInputClass} value={plumbingBaseText} onChange={(e) => { setPlumbingBaseText(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="實際單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={plumbingBaseActualUnitPrice} placeholder="自行填入" onChange={(e) => { setPlumbingBaseActualUnitPrice(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div>基礎小計：<b>NT$ {moneyRange(plumbingBaseTotal)}</b></div>
                <div>加價小計：<b>NT$ {moneyRange(plumbingExtraTotal)}</b></div>
                <div>水電工程總計：<b>NT$ {moneyRange(plumbingTotal)}</b></div>
                <NoteField value={plumbingBaseNote} onChange={(note) => { setPlumbingBaseNote(note); setShowResult(false); }} />
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">水電加價項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={addPlumbingExtra}>新增水電加價</button>
                </div>

                {plumbingExtraTotals.map((row) => (
                  <div key={row.id} className="rounded-lg border border-coffee/10 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_1fr_90px_90px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} onChange={(e) => updatePlumbingExtra(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : allAreas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="水電項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updatePlumbingItem(row.id, e.target.value)}>
                          {pricing.plumbingExtraItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </Field>
                      <Field label="項目文字">
                        <input className={fullTextInputClass} value={row.customText} onChange={(e) => updatePlumbingExtra(row.id, { customText: e.target.value })} />
                      </Field>
                      <Field label="數量">
                        <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updatePlumbingExtra(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="單位">
                        <input className={numberInputClass} value={row.unit} onChange={(e) => updatePlumbingExtra(row.id, { unit: e.target.value })} />
                      </Field>
                      <Field label="實際單價">
                        <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updatePlumbingExtra(row.id, { actualUnitPrice: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" onClick={() => setPlumbingExtras((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">
                      <div>參考依據：<b>{referenceText(row.item)}</b></div>
                      小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                    </div>
                    <NoteField value={row.note} onChange={(note) => updatePlumbingExtra(row.id, { note })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="油漆工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>基礎估算：{condition}，參考 {money(paintingBaseLow)}-{money(paintingBaseHigh)}元／坪，填入實際單價後自動列入估價。</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[130px_1fr_130px]">
                  <Field label="區域">
                    <select className="rounded-lg border border-coffee/20 px-3 py-2" value={paintingBaseArea} onChange={(e) => { setPaintingBaseArea(e.target.value); setShowResult(false); }}>
                      {(["全室", ...(selectedAreas.length ? selectedAreas : allAreas)]).map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </Field>
                  <Field label="基礎項目文字">
                    <input className={fullTextInputClass} value={paintingBaseText} onChange={(e) => { setPaintingBaseText(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="實際單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={paintingBaseActualUnitPrice} placeholder="自行填入" onChange={(e) => { setPaintingBaseActualUnitPrice(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div>基礎小計：<b>NT$ {moneyRange(paintingBaseTotal)}</b></div>
                <div>加價小計：<b>NT$ {moneyRange(paintingExtraTotal)}</b></div>
                <div>油漆工程總計：<b>NT$ {moneyRange(paintingTotal)}</b></div>
                <NoteField value={paintingBaseNote} onChange={(note) => { setPaintingBaseNote(note); setShowResult(false); }} />
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">油漆加價項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={addPaintingExtra}>新增油漆加價</button>
                </div>

                {paintingExtraTotals.map((row) => (
                  <div key={row.id} className="rounded-lg border border-coffee/10 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_1fr_90px_90px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} onChange={(e) => updatePaintingExtra(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : allAreas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="油漆項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updatePaintingItem(row.id, e.target.value)}>
                          {pricing.paintingExtraItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </Field>
                      <Field label="項目文字">
                        <input className={fullTextInputClass} value={row.customText} onChange={(e) => updatePaintingExtra(row.id, { customText: e.target.value })} />
                      </Field>
                      <Field label="數量">
                        <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updatePaintingExtra(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="單位">
                        <input className={numberInputClass} value={row.unit} onChange={(e) => updatePaintingExtra(row.id, { unit: e.target.value })} />
                      </Field>
                      <Field label="實際單價">
                        <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updatePaintingExtra(row.id, { actualUnitPrice: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" onClick={() => setPaintingExtras((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">
                      <div>參考依據：<b>{referenceText(row.item)}</b></div>
                      小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                    </div>
                    <NoteField value={row.note} onChange={(note) => updatePaintingExtra(row.id, { note })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="空調工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg border border-coffee/20 bg-white px-3 py-3 text-sm text-stone-700">新增項目並填入實際單價後，自動列入估價。</div>

              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>空調工程小計：<b>NT$ {moneyRange(airConditioningTotal)}</b></div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">空調項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee" type="button" onClick={addAirConditioning}>新增空調項目</button>
                </div>

                {airConditioningTotals.map((row) => (
                  <div key={row.id} className="rounded-lg border border-coffee/10 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_1fr_90px_90px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} onChange={(e) => updateAirConditioning(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : allAreas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="空調項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updateAirConditioningItem(row.id, e.target.value)}>
                          {pricing.airConditioningItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </Field>
                      <Field label="項目文字">
                        <input className={fullTextInputClass} value={row.customText} onChange={(e) => updateAirConditioning(row.id, { customText: e.target.value })} />
                      </Field>
                      <Field label="數量">
                        <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateAirConditioning(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="單位">
                        <input className={numberInputClass} value={row.unit} onChange={(e) => updateAirConditioning(row.id, { unit: e.target.value })} />
                      </Field>
                      <Field label="實際單價">
                        <input className={numberInputClass} type="number" min="0" value={row.actualUnitPrice} placeholder="自行填入" onChange={(e) => updateAirConditioning(row.id, { actualUnitPrice: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" onClick={() => setAirConditioningRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">
                      <div>參考依據：<b>{referenceText(row.item)}</b></div>
                      小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                    </div>
                    <NoteField value={row.note} onChange={(note) => updateAirConditioning(row.id, { note })} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="自訂工程">
            <button className="custom-add" type="button" onClick={() => { setCustomTrades((trades) => [...trades, {id: crypto.randomUUID(), name: "", rows: [{id: crypto.randomUUID(), name: "", area: "全室", qty: 1, unit: "式", price: "", note: ""}]}]); setShowResult(false); }}>＋ 新增工種</button>
            {!customTrades.length && <p className="custom-empty">尚無自訂工程</p>}
            {customTotals.map((trade) => <section className="custom-trade" key={trade.id}>
              <div className="custom-heading">
                <Field label="工種名稱"><input className={fullTextInputClass} placeholder="例如：玻璃工程" value={trade.name} onChange={(e) => updateCustomTrade(trade.id, {name: e.target.value})} /></Field>
                <strong>小計 NT$ {moneyRange(trade.subtotal)}</strong>
                <button type="button" title="刪除工種" aria-label="刪除工種" onClick={() => { if (window.confirm("確定刪除此工種及全部項目？")) { setCustomTrades((trades) => trades.filter((item) => item.id !== trade.id)); setShowResult(false); } }}>×</button>
              </div>
              <div className="custom-table-wrap"><table className="custom-table"><thead><tr><th>項目</th><th>區域</th><th>數量</th><th>單位</th><th>單價</th><th>單項總價</th><th></th></tr></thead><tbody>
                {trade.rows.map((row) => <React.Fragment key={row.id}>
                  <tr>
                    {[['name', '項目', 'text'], ['area', '區域', 'text'], ['qty', '數量', 'number'], ['unit', '單位', 'text'], ['price', '單價', 'number']].map(([key, label, type]) => <td key={key}><input aria-label={label} placeholder={key === 'price' ? '選填' : label} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} value={row[key]} onChange={(e) => updateCustomTrade(trade.id, {rows: trade.rows.map((item) => item.id === row.id ? {...item, [key]: type === 'number' && e.target.value !== '' ? Math.max(0, Number(e.target.value)) : e.target.value} : item)})} /></td>)}
                    <td className="custom-amount">{row.price === '' ? '未填單價' : moneyRange(actualPricedPair(row.qty, row.price))}</td>
                    <td><button title="刪除項目" aria-label="刪除項目" type="button" onClick={() => { if (window.confirm("確定刪除此項目？")) updateCustomTrade(trade.id, {rows: trade.rows.filter((item) => item.id !== row.id)}); }}>×</button></td>
                  </tr>
                  <tr className="custom-note-row">
                    <td colSpan="7"><NoteField value={row.note} onChange={(note) => updateCustomTrade(trade.id, {rows: trade.rows.map((item) => item.id === row.id ? {...item, note} : item)})} /></td>
                  </tr>
                </React.Fragment>)}
              </tbody></table></div>
              <button className="custom-add" type="button" onClick={() => updateCustomTrade(trade.id, {rows: [...trade.rows, {id: crypto.randomUUID(), name: '', area: '全室', qty: 1, unit: '式', price: '', note: ''}]})}>＋ 新增項目</button>
            </section>)}
          </Card>
        </section>

        <aside className="2xl:sticky 2xl:top-4">
          <div className="print-card rounded-lg border border-coffee/15 bg-creamSoft p-4 shadow-lg shadow-coffee/10">
            <p className="text-xs font-black uppercase tracking-normal text-cocoa">Live Estimate</p>
            <h2 className="mt-1 text-2xl font-black text-coffee">全部總額</h2>
            <div className="mt-4 rounded-lg bg-wood/20 p-4">
              <PriceRange range={finalTotal} large />
            </div>
            <div className="mt-4 grid gap-3 rounded-lg bg-white p-3 text-sm text-stone-700">
              <label className="flex items-center gap-2 font-bold text-coffee">
                <input type="checkbox" checked={invoiceNeeded} onChange={(e) => { setInvoiceNeeded(e.target.checked); setShowResult(false); }} />
                加計 5% 發票
              </label>
              <label className="comparison-safe-toggle">
                <input type="checkbox" checked={comparisonSafeMode} onChange={(e) => { setComparisonSafeMode(e.target.checked); setShowResult(false); }} />
                <span>
                  <b>防比價模式</b>
                  <small>對外明細統一顯示為 1 式，單價改列該項總價</small>
                </span>
              </label>
              <Field label="監管費 %（以稅前工程總額計算）">
                <input className={numberInputClass} type="number" min="0" value={managementPercent} placeholder="選填" onChange={(e) => { setManagementPercent(e.target.value); setShowResult(false); }} />
              </Field>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-700">
              {hasAmount(cabinetTotal) && <SummaryLine label="櫃體工程" range={cabinetTotal} />}
              {hasAmount(woodTotal) && <SummaryLine label="木作工程" range={woodTotal} />}
              {hasAmount(flooringTotal) && <SummaryLine label="地板工程" range={flooringTotal} />}
              {hasAmount(masonryTotal) && <SummaryLine label="土水工程" range={masonryTotal} />}
              {hasAmount(protectionTotal) && <SummaryLine label="保護工程" range={protectionTotal} />}
              {hasAmount(cleanupTotal) && <SummaryLine label="清運廢棄物" range={cleanupTotal} />}
              {hasAmount(plumbingTotal) && <SummaryLine label="水電工程" range={plumbingTotal} />}
              {hasAmount(paintingTotal) && <SummaryLine label="油漆工程" range={paintingTotal} />}
              {hasAmount(airConditioningTotal) && <SummaryLine label="空調工程" range={airConditioningTotal} />}
              {customTotals.map((trade) => <SummaryLine key={trade.id} label={trade.name || "自訂工程"} range={trade.subtotal} />)}
              <SummaryLine label="稅前工程總額" range={grandTotal} />
              {managementRate > 0 && <SummaryLine label="監管費" range={managementTotal} />}
              {invoiceNeeded && <SummaryLine label="發票稅金" range={invoiceTotal} />}
            </div>
            <button className="no-print mt-5 w-full rounded-lg bg-coffee px-4 py-4 text-base font-black text-white shadow-lg shadow-coffee/20" type="button" onClick={() => { setShowResult(true); setTimeout(() => document.getElementById("quote-result")?.scrollIntoView({behavior: "smooth", block: "start"}), 0); }}>
              查看報價明細
            </button>
          </div>
        </aside>
      </div>

      {showResult && (
        <section id="quote-result" className="print-card mt-5 rounded-lg border border-coffee/15 bg-creamSoft p-4 shadow-lg shadow-coffee/10 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-cocoa">Estimate Result</p>
              <h2 className="mt-1 break-words text-3xl font-black text-coffee">{summaryTitle}</h2>
              <p className="mt-2 text-stone-600">以下摘要可列印或複製，方便傳給客戶或貼到 LINE。</p>
            </div>
            <div className="no-print grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={copySummary}>{copied ? "已複製" : "複製文字"}</button>
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={downloadOds}>下載 ODS</button>
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={downloadExcel}>下載 Excel</button>
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee disabled:cursor-wait disabled:opacity-60" type="button" disabled={pdfDownloading} onClick={downloadPdf}>{pdfDownloading ? "產生 PDF…" : "下載 PDF"}</button>
              <button className="rounded-md bg-coffee px-3 py-2.5 text-sm font-bold text-white" type="button" onClick={() => window.print()}>列印摘要</button>
            </div>
          </div>
          <textarea className="mt-4 min-h-56 w-full rounded-lg border border-coffee/15 bg-white p-4 text-sm leading-7 text-stone-800 shadow-inner shadow-coffee/5" readOnly value={summaryText} />

          <div className="mt-5 overflow-x-auto rounded-lg border border-coffee/15 bg-white">
            <div className="border-b border-coffee/10 bg-wood/20 px-4 py-3">
              <h3 className="text-lg font-black text-coffee">各工種估價明細</h3>
              <p className="mt-1 text-sm text-stone-600">{comparisonSafeMode ? "防比價模式已啟用：所有項目統一以 1 式及該項總價列示。" : "依目前填寫內容產生，備註會顯示於各項目右側。"}</p>
            </div>
            <table className="estimate-detail-desktop hidden md:table print:table w-full min-w-[980px] table-fixed border-collapse text-sm">
              <colgroup>
                {estimateDetailColumnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width }} />)}
              </colgroup>
              <thead className="bg-cream text-left text-coffee">
                <tr>
                  <th className="border-b border-coffee/10 px-3 py-2.5">工種</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5">項目</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5">單位</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5 text-right">數量</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5 text-right">單項總價</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5">備註</th>
                </tr>
              </thead>
              <tbody>
                {estimateGroups.map((group) => (
                  <React.Fragment key={group.trade}>
                    <tr className="bg-wood/25">
                      <td className="border-b border-coffee/10 px-3 py-2.5 font-black text-coffee" colSpan="6">{group.trade}</td>
                    </tr>
                    {group.rows.map((row, index) => (
                      <tr key={`${row.trade}-${row.name}-${index}`} className="odd:bg-white even:bg-creamSoft">
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-stone-700"></td>
                        <td className="break-words border-b border-coffee/10 px-3 py-2.5 text-stone-800">{row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-stone-700">{row.unit}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-right text-stone-700">{row.qty}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-bold text-stone-800">NT$ {moneyRange(row.subtotal)}</td>
                        <td className="whitespace-normal break-words border-b border-coffee/10 px-3 py-2.5 text-stone-700">{cleanNote(row.note)}</td>
                      </tr>
                    ))}
                    <tr className="bg-cream">
                      <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-black text-coffee" colSpan="4">{group.trade} 小計</td>
                      <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-black text-coffee">NT$ {moneyRange(group.subtotal)}</td>
                      <td className="border-b border-coffee/10 px-3 py-2.5"></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-coffee text-white">
                <tr>
                  <td className="px-3 py-3 font-bold" colSpan="4">稅前工程總額</td>
                  <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(grandTotal)}</td>
                  <td className="px-3 py-3"></td>
                </tr>
                {managementRate > 0 && (
                  <tr>
                    <td className="px-3 py-3 font-bold" colSpan="4">監管費（{managementPercent}%）</td>
                    <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(managementTotal)}</td>
                    <td className="px-3 py-3"></td>
                  </tr>
                )}
                {invoiceNeeded && (
                  <tr>
                    <td className="px-3 py-3 font-bold" colSpan="4">發票稅金（5%）</td>
                    <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(invoiceTotal)}</td>
                    <td className="px-3 py-3"></td>
                  </tr>
                )}
                <tr className="bg-stone-950">
                  <td className="px-3 py-4 text-base font-black" colSpan="4">全部總額</td>
                  <td className="px-3 py-4 text-right text-base font-black">NT$ {moneyRange(finalTotal)}</td>
                  <td className="px-3 py-4"></td>
                </tr>
              </tfoot>
            </table>
            <div className="estimate-detail-mobile md:hidden print:hidden">
              {estimateGroups.map((group) => (
                <section key={`mobile-${group.trade}`} className="border-b border-coffee/15 last:border-b-0">
                  <h4 className="bg-wood/25 px-4 py-3 font-black text-coffee">{group.trade}</h4>
                  {group.rows.map((row, index) => (
                    <article key={`mobile-${row.trade}-${row.name}-${index}`} className="border-b border-coffee/10 px-4 py-3 last:border-b-0">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <div>
                          <div className="text-xs font-bold text-stone-500">項目</div>
                          <div className="mt-1 break-words font-bold text-stone-800">{row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-stone-500">單項總價</div>
                          <div className="mt-1 whitespace-nowrap font-black text-coffee">NT$ {moneyRange(row.subtotal)}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-coffee/10 pt-3 text-sm">
                        <div><span className="font-bold text-stone-500">單位：</span><span className="text-stone-800">{row.unit}</span></div>
                        <div><span className="font-bold text-stone-500">數量：</span><span className="text-stone-800">{row.qty}</span></div>
                      </div>
                      {cleanNote(row.note) && (
                        <div className="mt-3 break-words border-t border-coffee/10 pt-3 text-sm leading-6 text-stone-700">
                          <span className="font-bold text-stone-500">備註：</span>{cleanNote(row.note)}
                        </div>
                      )}
                    </article>
                  ))}
                  <div className="flex items-center justify-between gap-3 bg-cream px-4 py-3 font-black text-coffee">
                    <span>{group.trade} 小計</span>
                    <span>NT$ {moneyRange(group.subtotal)}</span>
                  </div>
                </section>
              ))}
              <div className="bg-coffee px-4 py-3 text-white">
                <div className="flex items-center justify-between gap-3 py-1.5 font-bold">
                  <span>稅前工程總額</span><span>NT$ {moneyRange(grandTotal)}</span>
                </div>
                {managementRate > 0 && (
                  <div className="flex items-center justify-between gap-3 py-1.5 font-bold">
                    <span>監管費（{managementPercent}%）</span><span>NT$ {moneyRange(managementTotal)}</span>
                  </div>
                )}
                {invoiceNeeded && (
                  <div className="flex items-center justify-between gap-3 py-1.5 font-bold">
                    <span>發票稅金（5%）</span><span>NT$ {moneyRange(invoiceTotal)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/25 pt-3 text-base font-black">
                  <span>全部總額</span><span>NT$ {moneyRange(finalTotal)}</span>
                </div>
              </div>
            </div>
            <div className="no-print flex justify-end border-t border-coffee/10 bg-creamSoft px-4 py-3">
              <button className="rounded-lg bg-coffee px-4 py-3 font-bold text-white" type="button" onClick={copyDetail}>
                {copied ? "已複製" : "複製明細內容"}
              </button>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-6 rounded-lg border border-coffee/15 bg-creamSoft/85 p-5 text-sm leading-7 text-stone-600">
        <b className="text-coffee">免責說明：</b>
        此為線上初估金額，實際報價仍需依現場丈量、材質選擇、施工條件與圖面內容為準。
      </footer>
    </main>
    </WorkspaceContext.Provider>
  );
}

function SummaryLine({ label, range }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-coffee/10 py-2">
      <span>{label}</span>
      <span className="font-bold text-coffee">NT$ {moneyRange(range)}</span>
    </div>
  );
}

ReactDOM.createRoot(document.querySelector("#root")).render(<App />);

