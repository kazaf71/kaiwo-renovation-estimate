(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoPdfExport = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fileDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");

  const safeFilePart = (value) => String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|%]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  const buildPdfFileName = (projectName, date = new Date()) => {
    const project = safeFilePart(projectName) || "未命名案件";
    return `楷沃裝修工程-${project}-估價單-${fileDate(date)}.pdf`;
  };

  const paginateEstimateGroups = (groups, maxRowsPerPage = 10) => {
    const capacity = Math.max(1, Number(maxRowsPerPage) || 10);
    const pages = [];
    let page = [];
    let usedRows = 0;

    const finishPage = () => {
      if (page.length) pages.push(page);
      page = [];
      usedRows = 0;
    };

    groups.forEach((group) => {
      let offset = 0;
      while (offset < group.rows.length) {
        if (usedRows >= capacity) finishPage();
        const take = Math.min(capacity - usedRows, group.rows.length - offset);
        const rows = group.rows.slice(offset, offset + take);
        const isLastFragment = offset + take >= group.rows.length;
        page.push({
          ...group,
          rows,
          continued: offset > 0,
          showSubtotal: isLastFragment
        });
        usedRows += take;
        offset += take;
        if (!isLastFragment) finishPage();
      }
    });

    finishPage();
    return pages.length ? pages : [[]];
  };

  const renderedPdfRows = (groups) => groups.reduce((total, group) => (
    total + 1 + group.rows.length + (group.showSubtotal ? 1 : 0)
  ), 0);

  const paginateEstimateGroupsForPdf = (groups, maxRenderedRows = 24) => {
    const capacity = Math.max(3, Number(maxRenderedRows) || 24);
    const pages = [];
    let page = [];
    let usedRows = 0;

    const finishPage = () => {
      if (page.length) pages.push(page);
      page = [];
      usedRows = 0;
    };

    groups.forEach((group) => {
      let offset = 0;
      while (offset < group.rows.length) {
        if (capacity - usedRows < 3) finishPage();
        const availableAfterHeader = capacity - usedRows - 1;
        const remaining = group.rows.length - offset;
        const canFinish = remaining + 1 <= availableAfterHeader;
        let take = canFinish ? remaining : Math.min(remaining, availableAfterHeader);
        if (!canFinish && take === remaining && take > 1) take -= 1;

        const rows = group.rows.slice(offset, offset + take);
        const isLastFragment = offset + take >= group.rows.length;
        page.push({
          ...group,
          rows,
          continued: offset > 0,
          showSubtotal: isLastFragment
        });
        usedRows += 1 + take + (isLastFragment ? 1 : 0);
        offset += take;
        if (!isLastFragment) finishPage();
      }
    });

    finishPage();
    return pages.length ? pages : [[]];
  };

  const shouldAppendPdfSummaryPage = (lastPageGroups, maxRenderedRows = 24, summaryRows = 10) => (
    renderedPdfRows(lastPageGroups) + summaryRows > maxRenderedRows
  );

  const paginateRenderedPdf = (source) => {
    const host = source.parentNode;
    const pages = [];
    const style = source.querySelector("style");
    const footer = source.querySelector(".pdf-footer");
    const units = [];
    for (const child of source.children) {
      if (child === style || child === footer) continue;
      if (child.matches(".detail")) {
        const rows = Array.from(child.tBodies[0].rows);
        for (let i = 0; i < rows.length; i++) {
          const group = [rows[i]];
          if (rows[i].matches(".trade") && rows[i + 1]) group.push(rows[++i]);
          units.push({ table: child, rows: group });
        }
      } else if (child.matches(".terms")) {
        const parts = Array.from(child.children);
        for (let i = 0; i < parts.length; i++) {
          const wrapper = child.cloneNode(false);
          wrapper.style.cssText = "margin:0;border:0;padding:0;";
          wrapper.append(parts[i].cloneNode(true));
          if (parts[i].tagName === "H2" && parts[i + 1]) wrapper.append(parts[++i].cloneNode(true));
          units.push({ node: wrapper });
        }
      } else units.push({ node: child });
    }
    // Keep the final payment summary and signatures together when they fit a page.
    const paymentIndex = units.findIndex((unit) => unit.node?.querySelector(".payment-title"));
    if (paymentIndex >= 0) {
      const closing = document.createElement("div");
      units.slice(paymentIndex).forEach((unit) => closing.append(unit.node.cloneNode(true)));
      source.append(closing);
      if (closing.getBoundingClientRect().height < 850) units.splice(paymentIndex, units.length - paymentIndex, { node: closing.cloneNode(true) });
      closing.remove();
    }
    let content, currentTable;
    const newPage = () => {
      const page = source.cloneNode(false);
      page.style.cssText = source.style.cssText + ";height:1123px;min-height:1123px;position:relative;display:block;";
      page.append(style.cloneNode(true));
      content = document.createElement("div");
      content.style.cssText = "display:flow-root;";
      page.append(content);
      if (pages.length) {
        const header = document.createElement("header");
        header.className = "continuation-head";
        const title = document.createElement("h1");
        title.textContent = source.querySelector(".pdf-title").textContent + "（續）";
        const label = document.createElement("span");
        label.className = "pdf-page-label";
        header.append(title, label);
        content.append(header);
      }
      const pageFooter = footer.cloneNode(true);
      pageFooter.style.cssText = "position:absolute;bottom:34px;left:34px;right:34px;";
      page.append(pageFooter);
      host.append(page);
      pages.push(page);
      currentTable = null;
    };
    newPage();
    for (const unit of units) {
      const append = () => {
        if (!unit.table) {
          currentTable = null;
          const node = unit.node.cloneNode(true);
          content.append(node);
          return [node];
        }
        if (!currentTable) {
          currentTable = unit.table.cloneNode(true);
          currentTable.tBodies[0].replaceChildren();
          content.append(currentTable);
        }
        const rows = unit.rows.map((row) => row.cloneNode(true));
        currentTable.tBodies[0].append(...rows);
        return rows;
      };
      let inserted = append();
      if (content.getBoundingClientRect().height > 1020) {
        inserted.forEach((node) => node.remove());
        if (currentTable && !currentTable.tBodies[0].rows.length) currentTable.remove();
        newPage();
        inserted = append();
        if (content.getBoundingClientRect().height > 1020) throw new Error("單一項目內容超過一頁，請將過長的備註分成多個項目。");
      }
    }
    source.remove();
    pages.forEach((page, index) => {
      const signatures = page.querySelector(".pdf-signatures");
      if (signatures) signatures.style.cssText = "position:absolute;bottom:70px;left:34px;right:34px;margin-top:0;";
      page.querySelector(".pdf-page-label").textContent = `第 ${index + 1} / ${pages.length} 頁`;
      page.querySelector(".pdf-footer span:last-child").textContent = `${index + 1} / ${pages.length}`;
    });
    return pages;
  };

  return {
    paginateRenderedPdf,
    buildPdfFileName,
    paginateEstimateGroups,
    paginateEstimateGroupsForPdf,
    renderedPdfRows,
    safeFilePart,
    shouldAppendPdfSummaryPage
  };
});
