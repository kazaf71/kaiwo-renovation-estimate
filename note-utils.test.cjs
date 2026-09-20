const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanNote, appendNote, noteLine } = require("./note-utils.js");
const fs = require("node:fs");

test("blank notes do not add output", () => {
  assert.equal(cleanNote("   "), "");
  assert.equal(noteLine("   "), "");
  assert.equal(appendNote("平釘天花板", "   "), "平釘天花板");
});

test("filled notes are trimmed and appended", () => {
  assert.equal(cleanNote("  現場確認高度  "), "現場確認高度");
  assert.equal(noteLine("  現場確認高度  "), "備註：現場確認高度");
  assert.equal(appendNote("平釘天花板", "  現場確認高度  "), "平釘天花板\n備註：現場確認高度");
});

test("offline app shell includes estimate helper scripts", () => {
  const serviceWorker = fs.readFileSync("./sw.js", "utf8");
  const index = fs.readFileSync("./index.html", "utf8");
  assert.match(serviceWorker, /kaiwo-estimate-v16/);
  assert.match(serviceWorker, /\/app\.jsx\?v=16/);
  assert.match(serviceWorker, /\/note-utils\.js\?v=15/);
  assert.match(serviceWorker, /\/estimate-display-utils\.js\?v=8/);
  assert.match(index, /estimate-display-utils\.js\?v=8/);
  assert.match(index, /note-utils\.js\?v=15/);
  assert.match(index, /app\.jsx\?v=16/);
});

test("estimate details provide shared desktop and mobile layouts", () => {
  const app = fs.readFileSync("./app.jsx", "utf8");
  assert.match(app, /estimate-detail-desktop hidden md:table/);
  assert.match(app, /estimate-detail-mobile md:hidden/);
});
