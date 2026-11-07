const test = require("node:test");
const assert = require("node:assert/strict");

test("legacy items without enabled stay active", () => {
  const { isItemEnabled } = require("./item-enabled-utils.js");
  assert.equal(isItemEnabled({ id: "legacy" }), true);
});

test("only an explicit false disables an item", () => {
  const { isItemEnabled } = require("./item-enabled-utils.js");
  assert.equal(isItemEnabled({ enabled: true }), true);
  assert.equal(isItemEnabled({ enabled: false }), false);
});

test("a disabled item contributes an empty subtotal without losing its data", () => {
  const { enabledSubtotal } = require("./item-enabled-utils.js");
  const row = { enabled: false, area: "客廳", qty: 4, actualUnitPrice: 1800 };
  const subtotal = { low: 7200, high: 7200 };
  const emptySubtotal = { low: 0, high: 0 };

  assert.equal(enabledSubtotal(row, subtotal, emptySubtotal), emptySubtotal);
  assert.deepEqual(row, { enabled: false, area: "客廳", qty: 4, actualUnitPrice: 1800 });
});

test("re-enabling an item restores the same calculated subtotal", () => {
  const { enabledSubtotal } = require("./item-enabled-utils.js");
  const subtotal = { low: 7200, high: 7200 };
  assert.equal(enabledSubtotal({ enabled: true }, subtotal, { low: 0, high: 0 }), subtotal);
});

test("importing a legacy backup defaults cleanup back to enabled", () => {
  const { mergeImportedDraft } = require("./item-enabled-utils.js");
  const current = { cleanupEnabled: false, cleanupQty: 1, cleanupActualUnitPrice: 5000 };
  const legacyBackup = { cleanupQty: 2, cleanupActualUnitPrice: 2000 };

  assert.deepEqual(mergeImportedDraft(current, legacyBackup), {
    cleanupEnabled: true,
    cleanupQty: 2,
    cleanupActualUnitPrice: 2000
  });
});

test("importing an explicit disabled cleanup state preserves it", () => {
  const { mergeImportedDraft } = require("./item-enabled-utils.js");
  assert.equal(mergeImportedDraft({ cleanupEnabled: true }, { cleanupEnabled: false }).cleanupEnabled, false);
});
