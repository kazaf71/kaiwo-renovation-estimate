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

  return { buildPdfFileName, paginateEstimateGroups, safeFilePart };
});
