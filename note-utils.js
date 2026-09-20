(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KaiwoNotes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const cleanNote = (value) => String(value ?? "").trim();
  const noteLine = (value) => {
    const note = cleanNote(value);
    return note ? `備註：${note}` : "";
  };
  const appendNote = (text, value) => {
    const note = noteLine(value);
    return note ? `${text}\n${note}` : text;
  };
  return { cleanNote, noteLine, appendNote };
});
