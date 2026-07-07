const pricing = JSON.parse(document.querySelector("#pricing-data").textContent);

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

function Card({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="print-card rounded-lg border border-coffee/15 bg-creamSoft shadow-md shadow-coffee/5">
      <summary className="no-print flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-lg font-black text-coffee">{title}</h2>
        <span className="rounded-md bg-wood/35 px-2.5 py-1 text-xs font-bold text-coffee">展開／收合</span>
      </summary>
      <div className="border-t border-coffee/10 p-4">{children}</div>
    </details>
  );
}

function App() {
  const [roomType, setRoomType] = React.useState("3房");
  const [ping, setPing] = React.useState(28);
  const [condition, setCondition] = React.useState("新成屋");
  const [selectedAreas, setSelectedAreas] = React.useState([]);
  const [floorNeeded, setFloorNeeded] = React.useState(false);
  const [floorGrade, setFloorGrade] = React.useState("middle");
  const [floorPing, setFloorPing] = React.useState(18);
  const [floorLow, setFloorLow] = React.useState(5000);
  const [floorHigh, setFloorHigh] = React.useState(5000);
  const [floorFixed, setFloorFixed] = React.useState("");
  const [masonryNeeded, setMasonryNeeded] = React.useState(false);
  const [protectionNeeded, setProtectionNeeded] = React.useState(false);
  const [protectionQty, setProtectionQty] = React.useState(1);
  const [protectionUnit, setProtectionUnit] = React.useState("式");
  const [protectionLow, setProtectionLow] = React.useState(8000);
  const [protectionHigh, setProtectionHigh] = React.useState(15000);
  const [protectionFixed, setProtectionFixed] = React.useState("");
  const [cleanupNeeded, setCleanupNeeded] = React.useState(false);
  const [cleanupQty, setCleanupQty] = React.useState(1);
  const [cleanupUnit, setCleanupUnit] = React.useState("式");
  const [cleanupLow, setCleanupLow] = React.useState(12000);
  const [cleanupHigh, setCleanupHigh] = React.useState(25000);
  const [cleanupFixed, setCleanupFixed] = React.useState("");
  const [invoiceNeeded, setInvoiceNeeded] = React.useState(false);
  const [managementPercent, setManagementPercent] = React.useState("");
  const [showResult, setShowResult] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [cabinetRows, setCabinetRows] = React.useState([]);
  const [woodRows, setWoodRows] = React.useState([]);
  const [plumbingNeeded, setPlumbingNeeded] = React.useState(false);
  const [paintingNeeded, setPaintingNeeded] = React.useState(false);
  const [plumbingExtras, setPlumbingExtras] = React.useState([]);
  const [paintingExtras, setPaintingExtras] = React.useState([]);
  const [masonryRows, setMasonryRows] = React.useState([]);

  const cabinetTypeMap = React.useMemo(() => Object.fromEntries(pricing.cabinetTypes.map((item) => [item.id, item])), []);
  const woodItemMap = React.useMemo(() => Object.fromEntries(pricing.woodworkItems.map((item) => [item.id, item])), []);
  const plumbingItemMap = React.useMemo(() => Object.fromEntries(pricing.plumbingExtraItems.map((item) => [item.id, item])), []);
  const paintingItemMap = React.useMemo(() => Object.fromEntries(pricing.paintingExtraItems.map((item) => [item.id, item])), []);
  const masonryItemMap = React.useMemo(() => Object.fromEntries(pricing.masonryItems.map((item) => [item.id, item])), []);
  const floorItem = pricing.flooring.find((item) => item.id === floorGrade) || pricing.flooring[0];
  const [plumbingBaseLow, setPlumbingBaseLow] = React.useState(pricing.plumbingElectric["新成屋"].low);
  const [plumbingBaseHigh, setPlumbingBaseHigh] = React.useState(pricing.plumbingElectric["新成屋"].high);
  const [plumbingBaseFixed, setPlumbingBaseFixed] = React.useState("");
  const [paintingBaseLow, setPaintingBaseLow] = React.useState(pricing.painting["新成屋"].low);
  const [paintingBaseHigh, setPaintingBaseHigh] = React.useState(pricing.painting["新成屋"].high);
  const [paintingBaseFixed, setPaintingBaseFixed] = React.useState("");

  const visibleCabinetRows = cabinetRows.filter((row) => selectedAreas.includes(row.area));

  const cabinetTotals = visibleCabinetRows.map((row) => {
    const type = cabinetTypeMap[row.type] || pricing.cabinetTypes[0];
    const widthFeet = toFeet(row.widthCm);
    return {
      ...row,
      typeName: type.name,
      unitLow: Number(row.low || 0),
      unitHigh: Number(row.high || 0),
      widthFeet,
      subtotal: pricedPair(widthFeet * Number(row.qty || 0), row.low, row.high, row.fixed)
    };
  });

  const woodTotals = woodRows.map((row) => {
    const item = woodItemMap[row.itemId] || pricing.woodworkItems[0];
    return {
      ...row,
      item,
      subtotal: pricedPair(row.qty, row.low, row.high, row.fixed)
    };
  });

  const cabinetTotal = cabinetTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const woodTotal = woodTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const flooringTotal = floorNeeded ? pricedPair(floorPing, floorLow, floorHigh, floorFixed) : pair();
  const peRate = pricing.plumbingElectric[condition];
  const paintRate = pricing.painting[condition];
  const plumbingBaseTotal = plumbingNeeded ? pricedPair(ping, plumbingBaseLow, plumbingBaseHigh, plumbingBaseFixed) : pair();
  const paintingBaseTotal = paintingNeeded ? pricedPair(ping, paintingBaseLow, paintingBaseHigh, paintingBaseFixed) : pair();
  const plumbingExtraTotals = plumbingExtras.map((row) => ({
    ...row,
    item: plumbingItemMap[row.itemId] || pricing.plumbingExtraItems[0],
    subtotal: plumbingNeeded ? pricedPair(row.qty, row.low, row.high, row.fixed) : pair()
  }));
  const paintingExtraTotals = paintingExtras.map((row) => ({
    ...row,
    item: paintingItemMap[row.itemId] || pricing.paintingExtraItems[0],
    subtotal: paintingNeeded ? pricedPair(row.qty, row.low, row.high, row.fixed) : pair()
  }));
  const masonryTotals = masonryRows.map((row) => ({
    ...row,
    item: masonryItemMap[row.itemId] || pricing.masonryItems[0],
    subtotal: masonryNeeded
      ? pricedPair(row.qty, row.low, row.high, row.fixed)
      : pair()
  }));
  const plumbingExtraTotal = plumbingExtraTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const paintingExtraTotal = paintingExtraTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const masonryTotal = masonryTotals.reduce((sum, row) => addPair(sum, row.subtotal), pair());
  const protectionTotal = protectionNeeded ? pricedPair(protectionQty, protectionLow, protectionHigh, protectionFixed) : pair();
  const cleanupTotal = cleanupNeeded ? pricedPair(cleanupQty, cleanupLow, cleanupHigh, cleanupFixed) : pair();
  const plumbingTotal = addPair(plumbingBaseTotal, plumbingExtraTotal);
  const paintingTotal = addPair(paintingBaseTotal, paintingExtraTotal);
  const grandTotal = [cabinetTotal, woodTotal, flooringTotal, masonryTotal, protectionTotal, cleanupTotal, plumbingTotal, paintingTotal].reduce(addPair, pair());
  const invoiceTotal = invoiceNeeded ? pair(grandTotal.low * 0.05, grandTotal.high * 0.05) : pair();
  const managementRate = Number(managementPercent || 0) / 100;
  const managementTotal = managementRate > 0 ? pair(grandTotal.low * managementRate, grandTotal.high * managementRate) : pair();
  const finalTotal = [grandTotal, invoiceTotal, managementTotal].reduce(addPair, pair());

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
    updateCabinet(id, { type: typeId, low: item.low, high: item.high, fixed: "" });
  };

  const updateWoodItem = (id, itemId) => {
    const item = woodItemMap[itemId] || pricing.woodworkItems[0];
    updateWood(id, { itemId, low: item.low, high: item.high, fixed: "" });
  };

  const updateFloorGrade = (gradeId) => {
    const item = pricing.flooring.find((floor) => floor.id === gradeId) || pricing.flooring[0];
    setFloorGrade(gradeId);
    setFloorLow(item.low);
    setFloorHigh(item.high);
    setFloorFixed("");
    setShowResult(false);
  };

  const updateCondition = (value) => {
    const nextPeRate = pricing.plumbingElectric[value];
    const nextPaintRate = pricing.painting[value];
    setCondition(value);
    setPlumbingBaseLow(nextPeRate.low);
    setPlumbingBaseHigh(nextPeRate.high);
    setPlumbingBaseFixed("");
    setPaintingBaseLow(nextPaintRate.low);
    setPaintingBaseHigh(nextPaintRate.high);
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

  const updateMasonry = (id, patch) => {
    setMasonryRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setShowResult(false);
  };

  const updatePlumbingItem = (id, itemId) => {
    const item = plumbingItemMap[itemId] || pricing.plumbingExtraItems[0];
    updatePlumbingExtra(id, { itemId, low: item.low, high: item.high, fixed: "" });
  };

  const updatePaintingItem = (id, itemId) => {
    const item = paintingItemMap[itemId] || pricing.paintingExtraItems[0];
    updatePaintingExtra(id, { itemId, low: item.low, high: item.high, fixed: "" });
  };

  const updateMasonryItem = (id, itemId) => {
    const item = masonryItemMap[itemId] || pricing.masonryItems[0];
    updateMasonry(id, { itemId, low: item.low, high: item.high, fixed: "" });
  };

  const addCabinet = (area = selectedAreas[0] || "客廳") => {
    const item = cabinetTypeMap.tall || pricing.cabinetTypes[0];
    setCabinetRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), area, name: "新增櫃體", type: "tall", widthCm: 120, qty: 1, low: item.low, high: item.high, fixed: "" }
    ]);
    setShowResult(false);
  };

  const addWood = () => {
    const item = woodItemMap.flatCeiling || pricing.woodworkItems[0];
    setWoodRows((rows) => [...rows, { id: crypto.randomUUID(), itemId: item.id, qty: 1, low: item.low, high: item.high, fixed: "" }]);
    setShowResult(false);
  };

  const addPlumbingExtra = () => {
    const item = pricing.plumbingExtraItems[0];
    setPlumbingExtras((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "客廳", itemId: item.id, qty: 1, low: item.low, high: item.high, fixed: "" }]);
    setShowResult(false);
  };

  const addPaintingExtra = () => {
    const item = pricing.paintingExtraItems[0];
    setPaintingExtras((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "客廳", itemId: item.id, qty: 1, low: item.low, high: item.high, fixed: "" }]);
    setShowResult(false);
  };

  const addMasonry = () => {
    const item = pricing.masonryItems[0];
    setMasonryRows((rows) => [...rows, { id: crypto.randomUUID(), area: selectedAreas[0] || "廁所／浴室", itemId: item.id, qty: 1, low: item.low, high: item.high, fixed: "" }]);
    setShowResult(false);
  };

  const toggleArea = (area) => {
    setSelectedAreas((areas) => (areas.includes(area) ? areas.filter((item) => item !== area) : [...areas, area]));
    setShowResult(false);
  };

  const summaryText = React.useMemo(() => {
    const lines = [
      `您的裝修預算初估`,
      `${pricing.brand.name}｜${pricing.brand.positioning}`,
      `服務地區：${pricing.brand.serviceArea}`,
      `LINE：${pricing.brand.line}｜電話：${pricing.brand.phone}`,
      ``,
      `基本條件：${roomType}，室內 ${ping} 坪，屋況：${condition}`,
      `估價區域：${selectedAreas.join("、") || "未選擇"}`,
      ``,
      `櫃體工程：NT$ ${moneyRange(cabinetTotal)}`,
      `木作工程：NT$ ${moneyRange(woodTotal)}`,
      `地板工程：${floorNeeded ? `NT$ ${moneyRange(flooringTotal)}` : "未勾選，不列入估價"}`,
      `土水工程：${masonryNeeded ? `NT$ ${moneyRange(masonryTotal)}` : "未勾選，不列入估價"}`,
      ...masonryTotals.filter((row) => masonryNeeded).map((row) => `  - ${row.area}｜${row.item.name} × ${row.qty}${row.item.unit}：NT$ ${moneyRange(row.subtotal)}`),
      `保護工程：${protectionNeeded ? `NT$ ${moneyRange(protectionTotal)}（${protectionQty}${protectionUnit} × ${unitPriceText(protectionLow, protectionHigh, protectionFixed)}）` : "未勾選，不列入估價"}`,
      `清運廢棄物工程：${cleanupNeeded ? `NT$ ${moneyRange(cleanupTotal)}（${cleanupQty}${cleanupUnit} × ${unitPriceText(cleanupLow, cleanupHigh, cleanupFixed)}）` : "未勾選，不列入估價"}`,
      `水電工程：${plumbingNeeded ? `NT$ ${moneyRange(plumbingTotal)}（基礎 ${moneyRange(plumbingBaseTotal)}，加價 ${moneyRange(plumbingExtraTotal)}）` : "未勾選，不列入估價"}`,
      ...plumbingExtraTotals.filter(() => plumbingNeeded).map((row) => `  - ${row.area}｜${row.item.name} × ${row.qty}${row.item.unit}：NT$ ${moneyRange(row.subtotal)}`),
      `油漆工程：${paintingNeeded ? `NT$ ${moneyRange(paintingTotal)}（基礎 ${moneyRange(paintingBaseTotal)}，加價 ${moneyRange(paintingExtraTotal)}）` : "未勾選，不列入估價"}`,
      ...paintingExtraTotals.filter(() => paintingNeeded).map((row) => `  - ${row.area}｜${row.item.name} × ${row.qty}${row.item.unit}：NT$ ${moneyRange(row.subtotal)}`),
      ``,
      `稅前工程總額：NT$ ${moneyRange(grandTotal)}`,
      `監管費${managementRate > 0 ? `（${managementPercent}%）` : ""}：NT$ ${moneyRange(managementTotal)}`,
      `發票稅金${invoiceNeeded ? "（5%）" : "（未勾選）"}：NT$ ${moneyRange(invoiceTotal)}`,
      `全部總額：NT$ ${moneyRange(finalTotal)}`,
      ``,
      `免責說明：此為線上初估金額，實際報價仍需依現場丈量、材質選擇、施工條件與圖面內容為準。`
    ];
    return lines.join("\n");
  }, [roomType, ping, condition, selectedAreas, cabinetTotal, woodTotal, floorNeeded, flooringTotal, masonryNeeded, masonryTotal, masonryTotals, protectionNeeded, protectionTotal, protectionQty, protectionUnit, protectionLow, protectionHigh, cleanupNeeded, cleanupTotal, cleanupQty, cleanupUnit, cleanupLow, cleanupHigh, plumbingNeeded, plumbingBaseTotal, plumbingExtraTotal, plumbingTotal, plumbingExtraTotals, paintingNeeded, paintingBaseTotal, paintingExtraTotal, paintingTotal, paintingExtraTotals, grandTotal, managementRate, managementPercent, managementTotal, invoiceNeeded, invoiceTotal, finalTotal]);

  const estimateRows = [
    ...cabinetTotals.map((row) => ({
      trade: "櫃體工程",
      area: row.area,
      name: row.name,
      qty: `${row.widthFeet.toFixed(2)}尺 × ${row.qty}`,
      unit: "尺",
      unitPrice: unitPriceText(row.low, row.high, row.fixed),
      subtotal: row.subtotal
    })),
    ...woodTotals.map((row) => ({
      trade: "木作工程",
      area: "-",
      name: row.item.name,
      qty: row.qty,
      unit: row.item.unit,
      unitPrice: unitPriceText(row.low, row.high, row.fixed),
      subtotal: row.subtotal
    })),
    ...(floorNeeded ? [{
      trade: "地板工程",
      area: "-",
      name: floorItem.name,
      qty: floorPing,
      unit: "坪",
      unitPrice: unitPriceText(floorLow, floorHigh, floorFixed),
      subtotal: flooringTotal
    }] : []),
    ...(masonryNeeded ? masonryTotals.map((row) => ({
      trade: "土水工程",
      area: row.area,
      name: row.item.name,
      qty: row.qty,
      unit: row.item.unit,
      unitPrice: unitPriceText(row.low, row.high, row.fixed),
      subtotal: row.subtotal
    })) : []),
    ...(protectionNeeded ? [{
      trade: "保護工程",
      area: "-",
      name: "保護工程",
      qty: protectionQty,
      unit: protectionUnit,
      unitPrice: unitPriceText(protectionLow, protectionHigh, protectionFixed),
      subtotal: protectionTotal
    }] : []),
    ...(cleanupNeeded ? [{
      trade: "清運廢棄物工程",
      area: "-",
      name: "清運廢棄物工程",
      qty: cleanupQty,
      unit: cleanupUnit,
      unitPrice: unitPriceText(cleanupLow, cleanupHigh, cleanupFixed),
      subtotal: cleanupTotal
    }] : []),
    ...(plumbingNeeded ? [{
      trade: "水電工程",
      area: "全室",
      name: `${condition}基礎水電`,
      qty: ping,
      unit: "坪",
      unitPrice: unitPriceText(plumbingBaseLow, plumbingBaseHigh, plumbingBaseFixed),
      subtotal: plumbingBaseTotal
    }] : []),
    ...(plumbingNeeded ? plumbingExtraTotals.map((row) => ({
      trade: "水電工程",
      area: row.area,
      name: row.item.name,
      qty: row.qty,
      unit: row.item.unit,
      unitPrice: unitPriceText(row.low, row.high, row.fixed),
      subtotal: row.subtotal
    })) : []),
    ...(paintingNeeded ? [{
      trade: "油漆工程",
      area: "全室",
      name: `${condition}基礎油漆`,
      qty: ping,
      unit: "坪",
      unitPrice: unitPriceText(paintingBaseLow, paintingBaseHigh, paintingBaseFixed),
      subtotal: paintingBaseTotal
    }] : []),
    ...(paintingNeeded ? paintingExtraTotals.map((row) => ({
      trade: "油漆工程",
      area: row.area,
      name: row.item.name,
      qty: row.qty,
      unit: row.item.unit,
      unitPrice: unitPriceText(row.low, row.high, row.fixed),
      subtotal: row.subtotal
    })) : [])
  ];

  const tradeOrder = ["櫃體工程", "木作工程", "地板工程", "土水工程", "保護工程", "清運廢棄物工程", "水電工程", "油漆工程"];
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
      odsCellsRow([{ value: "楷沃裝修工程 - 工程估價單", span: 6, style: "title" }]),
      odsCellsRow([
        { value: "工程地點", style: "metaLabel" },
        { value: "", span: 2, style: "meta" },
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
        { value: "服務地區", style: "metaLabel" },
        { value: "台北・新北・桃園", span: 2, style: "meta" },
        { value: "聯絡方式", style: "metaLabel" },
        { value: "LINE @416ukqvs｜0968-820-326", span: 2, style: "meta" }
      ]),
      odsRow(["", "", "", "", "", ""], "spacer"),
      odsCellsRow([
        { value: "工種", style: "head" },
        { value: "工程項目", style: "head" },
        { value: "數量", style: "headCenter" },
        { value: "單位", style: "headCenter" },
        { value: "單價", style: "headAmount" },
        { value: "單項總價", style: "headAmount" }
      ])
    ];

    estimateGroups.forEach((group) => {
      tableRows.push(odsCellsRow([{ value: group.trade, span: 6, style: "section" }]));
      group.rows.forEach((row) => {
        const itemName = row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name;
        tableRows.push(odsCellsRow([
          { value: "", style: "body" },
          { value: itemName, style: "bodyItem" },
          { value: row.qty, style: "bodyCenter" },
          { value: row.unit, style: "bodyCenter" },
          { value: row.unitPrice, style: "bodyAmount" },
          { value: `NT$ ${moneyRange(row.subtotal)}`, style: "bodyAmountStrong" }
        ]));
      });
      tableRows.push(odsCellsRow([
        { value: "", style: "subtotal" },
        { value: `${group.trade} 小計`, span: 4, style: "subtotalLabel" },
        { value: `NT$ ${moneyRange(group.subtotal)}`, style: "subtotalAmount" }
      ]));
      tableRows.push(odsRow(["", "", "", "", "", ""], "spacer"));
    });

    [
      ["稅前工程總額", grandTotal],
      [`監管費${managementRate > 0 ? `（${managementPercent}%）` : ""}`, managementTotal],
      [`發票稅金${invoiceNeeded ? "（5%）" : "（未勾選）"}`, invoiceTotal]
    ].forEach(([label, total]) => {
      tableRows.push(odsCellsRow([
        { value: "", style: "total" },
        { value: label, span: 4, style: "totalLabel" },
        { value: `NT$ ${moneyRange(total)}`, style: "totalAmount" }
      ]));
    });
    tableRows.push(odsCellsRow([
      { value: "", style: "grand" },
      { value: "全部總額", span: 4, style: "grandLabel" },
      { value: `NT$ ${moneyRange(finalTotal)}`, style: "grandAmount" }
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
    <style:style style:name="colTrade" style:family="table-column"><style:table-column-properties style:column-width="2.2cm"/></style:style>
    <style:style style:name="colItem" style:family="table-column"><style:table-column-properties style:column-width="8.0cm"/></style:style>
    <style:style style:name="colQty" style:family="table-column"><style:table-column-properties style:column-width="1.35cm"/></style:style>
    <style:style style:name="colUnit" style:family="table-column"><style:table-column-properties style:column-width="1.35cm"/></style:style>
    <style:style style:name="colPrice" style:family="table-column"><style:table-column-properties style:column-width="3.15cm"/></style:style>
    <style:style style:name="colTotal" style:family="table-column"><style:table-column-properties style:column-width="3.45cm"/></style:style>
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
        <table:table-column table:style-name="colQty"/>
        <table:table-column table:style-name="colUnit"/>
        <table:table-column table:style-name="colPrice"/>
        <table:table-column table:style-name="colTotal"/>
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
    const colgroup = `
      <col style="width:11%">
      <col style="width:41%">
      <col style="width:7%">
      <col style="width:7%">
      <col style="width:16%">
      <col style="width:18%">
    `;
    const rows = [
      `<tr>${htmlCell("楷沃裝修工程 - 工程估價單", "th", 'colspan="6" class="title"')}</tr>`,
      `<tr>${["工程地點", "", "", "日期", today, ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${["工程項目", "室內裝修工程", "", "屋況", condition, ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${["服務地區", "台北・新北・桃園", "", "聯絡方式", "LINE @416ukqvs｜0968-820-326", ""].map((value) => htmlCell(value)).join("")}</tr>`,
      `<tr>${["工種", "工程項目", "數量", "單位", "單價", "單項總價"].map((value) => htmlCell(value, "th")).join("")}</tr>`
    ];

    estimateGroups.forEach((group) => {
      rows.push(`<tr>${htmlCell(group.trade, "th", 'colspan="6" class="section"')}</tr>`);
      group.rows.forEach((row) => {
        const itemName = row.area && row.area !== "-" ? `${row.area}｜${row.name}` : row.name;
        rows.push(`<tr>${[
          "",
          itemName,
          row.qty,
          row.unit,
          row.unitPrice,
          `NT$ ${moneyRange(row.subtotal)}`
        ].map((value) => htmlCell(value)).join("")}</tr>`);
      });
      rows.push(`<tr>${htmlCell("", "td")}${htmlCell(`${group.trade} 小計`, "td", 'colspan="4" class="subtotal"')}${htmlCell(`NT$ ${moneyRange(group.subtotal)}`, "td", 'class="subtotal amount"')}</tr>`);
    });

    [
      ["稅前工程總額", grandTotal],
      [`監管費${managementRate > 0 ? `（${managementPercent}%）` : ""}`, managementTotal],
      [`發票稅金${invoiceNeeded ? "（5%）" : "（未勾選）"}`, invoiceTotal],
      ["全部總額", finalTotal]
    ].forEach(([label, total]) => {
      rows.push(`<tr>${htmlCell("", "td")}${htmlCell(label, "td", 'colspan="4" class="total"')}${htmlCell(`NT$ ${moneyRange(total)}`, "td", 'class="total amount"')}</tr>`);
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
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #b69e83; padding: 7px 8px; font-size: 12px; vertical-align: middle; }
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

  const detailText = [
    "各工種估價明細",
    "工種｜項目｜數量｜單位｜單價｜單項總價",
    ...estimateGroups.flatMap((group) => [
      `【${group.trade}】`,
      ...group.rows.map((row) => [
        row.area,
        row.name,
        row.qty,
        row.unit,
        row.unitPrice,
        `NT$ ${moneyRange(row.subtotal)}`
      ].join("｜")),
      `${group.trade}小計｜｜｜｜｜NT$ ${moneyRange(group.subtotal)}`
    ]),
    `稅前工程總額｜｜｜｜｜NT$ ${moneyRange(grandTotal)}`,
    `監管費${managementRate > 0 ? `（${managementPercent}%）` : ""}｜｜｜｜｜NT$ ${moneyRange(managementTotal)}`,
    `發票稅金${invoiceNeeded ? "（5%）" : "（未勾選）"}｜｜｜｜｜NT$ ${moneyRange(invoiceTotal)}`,
    `全部總額｜｜｜｜｜NT$ ${moneyRange(finalTotal)}`
  ].join("\n");

  const copyDetail = async () => {
    await navigator.clipboard.writeText(detailText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 xl:px-8">
      <header className="mb-6 rounded-lg border border-coffee/15 bg-creamSoft/90 p-5 shadow-xl shadow-coffee/10 md:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-cocoa">3D Design × Engineering Planning</p>
            <h1 className="text-3xl font-black leading-tight text-coffee md:text-5xl">{pricing.brand.name}</h1>
            <p className="mt-3 text-lg font-bold text-stone-700">{pricing.brand.positioning}</p>
            <p className="mt-2 text-stone-600">服務地區：{pricing.brand.serviceArea}</p>
          </div>
          <div className="grid gap-2 rounded-lg bg-wood/20 p-4 text-sm text-stone-700">
            <div><span className="font-bold text-coffee">LINE</span> {pricing.brand.line}</div>
            <div><span className="font-bold text-coffee">電話</span> {pricing.brand.phone}</div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start 2xl:gap-8">
        <section className="grid gap-4">
          <Card title="基本資料">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="房型">
                <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3" value={roomType} onChange={(e) => { setRoomType(e.target.value); setShowResult(false); }}>
                  <option>2房</option>
                  <option>3房</option>
                </select>
              </Field>
              <Field label="室內坪數">
                <input className={numberInputPanelClass} type="number" min="1" value={ping} onChange={(e) => { setPing(Number(e.target.value)); setShowResult(false); }} />
              </Field>
              <Field label="屋況">
                <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3" value={condition} onChange={(e) => updateCondition(e.target.value)}>
                  <option>新成屋</option>
                  <option>中古屋</option>
                </select>
              </Field>
              <label className="flex min-h-[76px] items-center gap-3 rounded-lg border border-coffee/20 bg-white px-3 py-3">
                <input type="checkbox" checked={floorNeeded} onChange={(e) => { setFloorNeeded(e.target.checked); setShowResult(false); }} />
                <span>
                  <b className="block text-sm text-stone-700">需要地板工程</b>
                  <span className="text-xs text-stone-500">未勾選則地板費用不列入總價</span>
                </span>
              </label>
            </div>
          </Card>

          <Card title="需要估價的區域">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pricing.areas.map((area) => (
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
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                              <Field label="櫃體名稱">
                                <input className="rounded-lg border border-coffee/20 px-3 py-2" value={row.name} onChange={(e) => updateCabinet(row.id, { name: e.target.value })} />
                              </Field>
                              <Field label="高度分類">
                                <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.type} onChange={(e) => updateCabinetType(row.id, e.target.value)}>
                                  {pricing.cabinetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
                              </Field>
                              <Field label="寬度公分">
                                <input className={numberInputClass} type="number" min="0" value={row.widthCm} onChange={(e) => updateCabinet(row.id, { widthCm: Number(e.target.value) })} />
                              </Field>
                              <Field label="數量">
                                <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateCabinet(row.id, { qty: Number(e.target.value) })} />
                              </Field>
                              <Field label="低標單價">
                                <input className={numberInputClass} type="number" min="0" value={row.low} onChange={(e) => updateCabinet(row.id, { low: Number(e.target.value) })} />
                              </Field>
                              <Field label="高標單價">
                                <input className={numberInputClass} type="number" min="0" value={row.high} onChange={(e) => updateCabinet(row.id, { high: Number(e.target.value) })} />
                              </Field>
                              <Field label="固定單價">
                                <input className={numberInputClass} type="number" min="0" value={row.fixed} placeholder="選填" onChange={(e) => updateCabinet(row.id, { fixed: e.target.value })} />
                              </Field>
                            </div>
                            <div className="mt-3 grid gap-2 rounded-lg bg-white px-3 py-3 text-sm text-stone-700 md:grid-cols-4">
                              <div>寬度台尺：<b>{row.widthFeet.toFixed(2)}</b></div>
                              <div>低標單價：<b>{money(row.unitLow)}</b>元／尺</div>
                              <div>高標單價：<b>{money(row.unitHigh)}</b>元／尺</div>
                              <div>小計：<b>NT$ {moneyRange(row.subtotal)}</b></div>
                            </div>
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
              {woodTotals.map((row) => (
                <div key={row.id} className="rounded-lg border border-coffee/10 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_110px_130px_130px_130px_auto] md:items-end">
                    <Field label="木作項目">
                      <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} onChange={(e) => updateWoodItem(row.id, e.target.value)}>
                        {pricing.woodworkItems.map((item) => <option key={item.id} value={item.id}>{item.name}｜{money(item.low)}-{money(item.high)}元／{item.unit}</option>)}
                      </select>
                    </Field>
                    <Field label={`數量／尺寸（${row.item.unit}）`}>
                      <input className={numberInputClass} type="number" min="0" value={row.qty} onChange={(e) => updateWood(row.id, { qty: Number(e.target.value) })} />
                    </Field>
                    <Field label="低標單價">
                      <input className={numberInputClass} type="number" min="0" value={row.low} onChange={(e) => updateWood(row.id, { low: Number(e.target.value) })} />
                    </Field>
                    <Field label="高標單價">
                      <input className={numberInputClass} type="number" min="0" value={row.high} onChange={(e) => updateWood(row.id, { high: Number(e.target.value) })} />
                    </Field>
                    <Field label="固定單價">
                      <input className={numberInputClass} type="number" min="0" value={row.fixed} placeholder="選填" onChange={(e) => updateWood(row.id, { fixed: e.target.value })} />
                    </Field>
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700" type="button" onClick={() => setWoodRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                  </div>
                  <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">
                    小計：<b>NT$ {moneyRange(row.subtotal)}</b>
                  </div>
                </div>
              ))}
              <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-3 font-black text-coffee" type="button" onClick={addWood}>新增木作項目</button>
            </div>
          </Card>

          <Card title="地板工程" defaultOpen={false}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <label className="flex items-center gap-3 rounded-lg border border-coffee/20 bg-white px-3 py-3">
                  <input type="checkbox" checked={floorNeeded} onChange={(e) => { setFloorNeeded(e.target.checked); setShowResult(false); }} />
                  <span className="font-bold text-stone-700">需要地板工程</span>
                </label>
                <Field label="地板工程等級">
                  <select className="rounded-lg border border-coffee/20 bg-white px-3 py-3 disabled:bg-stone-100 disabled:text-stone-400" value={floorGrade} disabled={!floorNeeded} onChange={(e) => updateFloorGrade(e.target.value)}>
                    {pricing.flooring.map((item) => <option key={item.id} value={item.id}>{item.name}｜{money(item.low)}元／坪</option>)}
                  </select>
                </Field>
                <Field label="地板施工坪數">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorPing} disabled={!floorNeeded} onChange={(e) => { setFloorPing(Number(e.target.value)); setShowResult(false); }} />
                </Field>
                <Field label="低標單價／坪">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorLow} disabled={!floorNeeded} onChange={(e) => { setFloorLow(Number(e.target.value)); setShowResult(false); }} />
                </Field>
                <Field label="高標單價／坪">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorHigh} disabled={!floorNeeded} onChange={(e) => { setFloorHigh(Number(e.target.value)); setShowResult(false); }} />
                </Field>
                <Field label="固定單價／坪">
                  <input className={numberInputPanelClass} type="number" min="0" value={floorFixed} placeholder="選填" disabled={!floorNeeded} onChange={(e) => { setFloorFixed(e.target.value); setShowResult(false); }} />
                </Field>
              </div>
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>地板工程：{floorNeeded ? `${money(floorLow)}-${money(floorHigh)}元／坪，依施工坪數自動計算。` : "未勾選，不列入估價。"}</div>
                <div>目前小計：NT$ {moneyRange(flooringTotal)}</div>
              </div>
            </div>
          </Card>

          <Card title="土水工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <label className="flex items-center gap-3 rounded-lg border border-coffee/20 bg-white px-3 py-3">
                <input type="checkbox" checked={masonryNeeded} onChange={(e) => { setMasonryNeeded(e.target.checked); setShowResult(false); }} />
                <span>
                  <b className="block text-stone-700">需要土水工程</b>
                  <span className="text-xs text-stone-500">未勾選則土水費用不列入總價</span>
                </span>
              </label>

              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <div>土水工程小計：<b>NT$ {moneyRange(masonryTotal)}</b></div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">土水項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee disabled:opacity-50" type="button" disabled={!masonryNeeded} onClick={addMasonry}>新增土水項目</button>
                </div>

                {masonryTotals.map((row) => (
                  <div key={row.id} className={`rounded-lg border border-coffee/10 bg-white p-4 ${masonryNeeded ? "" : "opacity-60"}`}>
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_90px_120px_120px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} disabled={!masonryNeeded} onChange={(e) => updateMasonry(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : pricing.areas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="土水項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} disabled={!masonryNeeded} onChange={(e) => updateMasonryItem(row.id, e.target.value)}>
                          {pricing.masonryItems.map((item) => <option key={item.id} value={item.id}>{item.name}｜{money(item.low)}-{money(item.high)}元／{item.unit}</option>)}
                        </select>
                      </Field>
                      <Field label={`數量（${row.item.unit}）`}>
                        <input className={numberInputClass} type="number" min="0" value={row.qty} disabled={!masonryNeeded} onChange={(e) => updateMasonry(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="低標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.low} disabled={!masonryNeeded} onChange={(e) => updateMasonry(row.id, { low: Number(e.target.value) })} />
                      </Field>
                      <Field label="高標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.high} disabled={!masonryNeeded} onChange={(e) => updateMasonry(row.id, { high: Number(e.target.value) })} />
                      </Field>
                      <Field label="固定單價">
                        <input className={numberInputClass} type="number" min="0" value={row.fixed} placeholder="選填" disabled={!masonryNeeded} onChange={(e) => updateMasonry(row.id, { fixed: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" disabled={!masonryNeeded} onClick={() => setMasonryRows((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(row.subtotal)}</b></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="保護工程" defaultOpen={false}>
            <div className="grid gap-4">
              <label className="flex items-center gap-3 rounded-lg border border-coffee/20 bg-white px-3 py-3">
                <input type="checkbox" checked={protectionNeeded} onChange={(e) => { setProtectionNeeded(e.target.checked); setShowResult(false); }} />
                <span>
                  <b className="block text-stone-700">需要保護工程</b>
                  <span className="text-xs text-stone-500">勾選後列入總價，可自由填入單價</span>
                </span>
              </label>
              <div className={`rounded-lg border border-coffee/10 bg-white p-4 ${protectionNeeded ? "" : "opacity-60"}`}>
                <div className="grid gap-3 md:grid-cols-[100px_100px_140px_140px_140px] md:items-end">
                  <Field label="數量">
                    <input className={numberInputClass} type="number" min="0" value={protectionQty} disabled={!protectionNeeded} onChange={(e) => { setProtectionQty(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="單位">
                    <input className="rounded-lg border border-coffee/20 px-3 py-2" value={protectionUnit} disabled={!protectionNeeded} onChange={(e) => { setProtectionUnit(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="低標單價">
                    <input className={numberInputClass} type="number" min="0" value={protectionLow} disabled={!protectionNeeded} onChange={(e) => { setProtectionLow(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="高標單價">
                    <input className={numberInputClass} type="number" min="0" value={protectionHigh} disabled={!protectionNeeded} onChange={(e) => { setProtectionHigh(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="固定單價">
                    <input className={numberInputClass} type="number" min="0" value={protectionFixed} placeholder="選填" disabled={!protectionNeeded} onChange={(e) => { setProtectionFixed(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(protectionTotal)}</b></div>
              </div>
            </div>
          </Card>

          <Card title="清運廢棄物工程" defaultOpen={false}>
            <div className="grid gap-4">
              <label className="flex items-center gap-3 rounded-lg border border-coffee/20 bg-white px-3 py-3">
                <input type="checkbox" checked={cleanupNeeded} onChange={(e) => { setCleanupNeeded(e.target.checked); setShowResult(false); }} />
                <span>
                  <b className="block text-stone-700">需要清運廢棄物工程</b>
                  <span className="text-xs text-stone-500">勾選後列入總價，可自由填入單價</span>
                </span>
              </label>
              <div className={`rounded-lg border border-coffee/10 bg-white p-4 ${cleanupNeeded ? "" : "opacity-60"}`}>
                <div className="grid gap-3 md:grid-cols-[100px_100px_140px_140px_140px] md:items-end">
                  <Field label="數量">
                    <input className={numberInputClass} type="number" min="0" value={cleanupQty} disabled={!cleanupNeeded} onChange={(e) => { setCleanupQty(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="單位">
                    <input className="rounded-lg border border-coffee/20 px-3 py-2" value={cleanupUnit} disabled={!cleanupNeeded} onChange={(e) => { setCleanupUnit(e.target.value); setShowResult(false); }} />
                  </Field>
                  <Field label="低標單價">
                    <input className={numberInputClass} type="number" min="0" value={cleanupLow} disabled={!cleanupNeeded} onChange={(e) => { setCleanupLow(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="高標單價">
                    <input className={numberInputClass} type="number" min="0" value={cleanupHigh} disabled={!cleanupNeeded} onChange={(e) => { setCleanupHigh(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="固定單價">
                    <input className={numberInputClass} type="number" min="0" value={cleanupFixed} placeholder="選填" disabled={!cleanupNeeded} onChange={(e) => { setCleanupFixed(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(cleanupTotal)}</b></div>
              </div>
            </div>
          </Card>

          <Card title="水電工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <label className="mb-3 flex items-center gap-2 font-black text-coffee">
                  <input type="checkbox" checked={plumbingNeeded} onChange={(e) => { setPlumbingNeeded(e.target.checked); setShowResult(false); }} />
                  需要水電工程
                </label>
                <div>基礎估算：{condition}，可自由調整每坪單價 × {ping} 坪</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <Field label="基礎低標單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={plumbingBaseLow} disabled={!plumbingNeeded} onChange={(e) => { setPlumbingBaseLow(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="基礎高標單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={plumbingBaseHigh} disabled={!plumbingNeeded} onChange={(e) => { setPlumbingBaseHigh(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="基礎固定單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={plumbingBaseFixed} placeholder="選填" disabled={!plumbingNeeded} onChange={(e) => { setPlumbingBaseFixed(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div>基礎小計：<b>NT$ {moneyRange(plumbingBaseTotal)}</b></div>
                <div>加價小計：<b>NT$ {moneyRange(plumbingExtraTotal)}</b></div>
                <div>水電工程總計：<b>NT$ {moneyRange(plumbingTotal)}</b></div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">水電加價項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee disabled:opacity-50" type="button" disabled={!plumbingNeeded} onClick={addPlumbingExtra}>新增水電加價</button>
                </div>

                {plumbingExtraTotals.map((row) => (
                  <div key={row.id} className={`rounded-lg border border-coffee/10 bg-white p-4 ${plumbingNeeded ? "" : "opacity-60"}`}>
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_90px_120px_120px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} disabled={!plumbingNeeded} onChange={(e) => updatePlumbingExtra(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : pricing.areas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="水電項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} disabled={!plumbingNeeded} onChange={(e) => updatePlumbingItem(row.id, e.target.value)}>
                          {pricing.plumbingExtraItems.map((item) => <option key={item.id} value={item.id}>{item.name}｜{money(item.low)}-{money(item.high)}元／{item.unit}</option>)}
                        </select>
                      </Field>
                      <Field label={`數量（${row.item.unit}）`}>
                        <input className={numberInputClass} type="number" min="0" value={row.qty} disabled={!plumbingNeeded} onChange={(e) => updatePlumbingExtra(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="低標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.low} disabled={!plumbingNeeded} onChange={(e) => updatePlumbingExtra(row.id, { low: Number(e.target.value) })} />
                      </Field>
                      <Field label="高標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.high} disabled={!plumbingNeeded} onChange={(e) => updatePlumbingExtra(row.id, { high: Number(e.target.value) })} />
                      </Field>
                      <Field label="固定單價">
                        <input className={numberInputClass} type="number" min="0" value={row.fixed} placeholder="選填" disabled={!plumbingNeeded} onChange={(e) => updatePlumbingExtra(row.id, { fixed: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" disabled={!plumbingNeeded} onClick={() => setPlumbingExtras((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(row.subtotal)}</b></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="油漆工程估價" defaultOpen={false}>
            <div className="grid gap-4">
              <div className="rounded-lg bg-white p-4 text-sm leading-7 text-stone-700">
                <label className="mb-3 flex items-center gap-2 font-black text-coffee">
                  <input type="checkbox" checked={paintingNeeded} onChange={(e) => { setPaintingNeeded(e.target.checked); setShowResult(false); }} />
                  需要油漆工程
                </label>
                <div>基礎估算：{condition}，可自由調整每坪單價 × {ping} 坪</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <Field label="基礎低標單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={paintingBaseLow} disabled={!paintingNeeded} onChange={(e) => { setPaintingBaseLow(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="基礎高標單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={paintingBaseHigh} disabled={!paintingNeeded} onChange={(e) => { setPaintingBaseHigh(Number(e.target.value)); setShowResult(false); }} />
                  </Field>
                  <Field label="基礎固定單價／坪">
                    <input className={numberInputClass} type="number" min="0" value={paintingBaseFixed} placeholder="選填" disabled={!paintingNeeded} onChange={(e) => { setPaintingBaseFixed(e.target.value); setShowResult(false); }} />
                  </Field>
                </div>
                <div>基礎小計：<b>NT$ {moneyRange(paintingBaseTotal)}</b></div>
                <div>加價小計：<b>NT$ {moneyRange(paintingExtraTotal)}</b></div>
                <div>油漆工程總計：<b>NT$ {moneyRange(paintingTotal)}</b></div>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-black text-coffee">油漆加價項目</h3>
                  <button className="rounded-lg border border-coffee/20 bg-wood/25 px-4 py-2 text-sm font-black text-coffee disabled:opacity-50" type="button" disabled={!paintingNeeded} onClick={addPaintingExtra}>新增油漆加價</button>
                </div>

                {paintingExtraTotals.map((row) => (
                  <div key={row.id} className={`rounded-lg border border-coffee/10 bg-white p-4 ${paintingNeeded ? "" : "opacity-60"}`}>
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_90px_120px_120px_120px_auto] md:items-end">
                      <Field label="區域">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.area} disabled={!paintingNeeded} onChange={(e) => updatePaintingExtra(row.id, { area: e.target.value })}>
                          {(selectedAreas.length ? selectedAreas : pricing.areas).map((area) => <option key={area}>{area}</option>)}
                        </select>
                      </Field>
                      <Field label="油漆項目">
                        <select className="rounded-lg border border-coffee/20 px-3 py-2" value={row.itemId} disabled={!paintingNeeded} onChange={(e) => updatePaintingItem(row.id, e.target.value)}>
                          {pricing.paintingExtraItems.map((item) => <option key={item.id} value={item.id}>{item.name}｜{money(item.low)}-{money(item.high)}元／{item.unit}</option>)}
                        </select>
                      </Field>
                      <Field label={`數量（${row.item.unit}）`}>
                        <input className={numberInputClass} type="number" min="0" value={row.qty} disabled={!paintingNeeded} onChange={(e) => updatePaintingExtra(row.id, { qty: Number(e.target.value) })} />
                      </Field>
                      <Field label="低標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.low} disabled={!paintingNeeded} onChange={(e) => updatePaintingExtra(row.id, { low: Number(e.target.value) })} />
                      </Field>
                      <Field label="高標單價">
                        <input className={numberInputClass} type="number" min="0" value={row.high} disabled={!paintingNeeded} onChange={(e) => updatePaintingExtra(row.id, { high: Number(e.target.value) })} />
                      </Field>
                      <Field label="固定單價">
                        <input className={numberInputClass} type="number" min="0" value={row.fixed} placeholder="選填" disabled={!paintingNeeded} onChange={(e) => updatePaintingExtra(row.id, { fixed: e.target.value })} />
                      </Field>
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" disabled={!paintingNeeded} onClick={() => setPaintingExtras((rows) => rows.filter((item) => item.id !== row.id))}>刪除</button>
                    </div>
                    <div className="mt-3 rounded-lg bg-cream px-3 py-3 text-sm text-stone-700">小計：<b>NT$ {moneyRange(row.subtotal)}</b></div>
                  </div>
                ))}
              </div>
            </div>
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
              <Field label="監管費 %（以稅前工程總額計算）">
                <input className={numberInputClass} type="number" min="0" value={managementPercent} placeholder="選填" onChange={(e) => { setManagementPercent(e.target.value); setShowResult(false); }} />
              </Field>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-700">
              <SummaryLine label="櫃體工程" range={cabinetTotal} />
              <SummaryLine label="木作工程" range={woodTotal} />
              <SummaryLine label="地板工程" range={flooringTotal} />
              <SummaryLine label="土水工程" range={masonryTotal} />
              <SummaryLine label="保護工程" range={protectionTotal} />
              <SummaryLine label="清運廢棄物" range={cleanupTotal} />
              <SummaryLine label="水電工程" range={plumbingTotal} />
              <SummaryLine label="油漆工程" range={paintingTotal} />
              <SummaryLine label="稅前工程總額" range={grandTotal} />
              <SummaryLine label="監管費" range={managementTotal} />
              <SummaryLine label="發票稅金" range={invoiceTotal} />
            </div>
            <button className="no-print mt-5 w-full rounded-lg bg-coffee px-4 py-4 text-base font-black text-white shadow-lg shadow-coffee/20" type="button" onClick={() => setShowResult(true)}>
              預計總金額
            </button>
          </div>
        </aside>
      </div>

      {showResult && (
        <section className="print-card mt-5 rounded-lg border border-coffee/15 bg-creamSoft p-4 shadow-lg shadow-coffee/10 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-cocoa">Estimate Result</p>
              <h2 className="mt-1 text-3xl font-black text-coffee">您的裝修預算初估</h2>
              <p className="mt-2 text-stone-600">以下摘要可列印或複製，方便傳給客戶或貼到 LINE。</p>
            </div>
            <div className="no-print grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={copySummary}>{copied ? "已複製" : "複製文字"}</button>
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={downloadOds}>下載 ODS</button>
              <button className="rounded-md border border-coffee/20 bg-white px-3 py-2.5 text-sm font-bold text-coffee" type="button" onClick={downloadExcel}>下載 Excel</button>
              <button className="rounded-md bg-coffee px-3 py-2.5 text-sm font-bold text-white" type="button" onClick={() => window.print()}>列印摘要</button>
            </div>
          </div>
          <textarea className="mt-4 min-h-56 w-full rounded-lg border border-coffee/15 bg-white p-4 text-sm leading-7 text-stone-800 shadow-inner shadow-coffee/5" readOnly value={summaryText} />

          <div className="mt-5 overflow-x-auto rounded-lg border border-coffee/15 bg-white">
            <div className="border-b border-coffee/10 bg-wood/20 px-4 py-3">
              <h3 className="text-lg font-black text-coffee">各工種估價明細</h3>
              <p className="mt-1 text-sm text-stone-600">依目前填寫內容產生，固定單價有填時會以單一金額列示。</p>
            </div>
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-cream text-left text-coffee">
                <tr>
                  <th className="border-b border-coffee/10 px-3 py-2.5">工種</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5">項目</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5 text-right">數量</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5">單位</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5 text-right">單價</th>
                  <th className="border-b border-coffee/10 px-3 py-2.5 text-right">單項總價</th>
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
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-stone-700">{row.area}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-stone-800">{row.name}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-right text-stone-700">{row.qty}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-stone-700">{row.unit}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-right text-stone-700">{row.unitPrice}</td>
                        <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-bold text-stone-800">NT$ {moneyRange(row.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-cream">
                      <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-black text-coffee" colSpan="5">{group.trade} 小計</td>
                      <td className="border-b border-coffee/10 px-3 py-2.5 text-right font-black text-coffee">NT$ {moneyRange(group.subtotal)}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-coffee text-white">
                <tr>
                  <td className="px-3 py-3 font-bold" colSpan="5">稅前工程總額</td>
                  <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(grandTotal)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-bold" colSpan="5">監管費{managementRate > 0 ? `（${managementPercent}%）` : ""}</td>
                  <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(managementTotal)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-bold" colSpan="5">發票稅金{invoiceNeeded ? "（5%）" : "（未勾選）"}</td>
                  <td className="px-3 py-3 text-right font-bold">NT$ {moneyRange(invoiceTotal)}</td>
                </tr>
                <tr className="bg-stone-950">
                  <td className="px-3 py-4 text-base font-black" colSpan="5">全部總額</td>
                  <td className="px-3 py-4 text-right text-base font-black">NT$ {moneyRange(finalTotal)}</td>
                </tr>
              </tfoot>
            </table>
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

