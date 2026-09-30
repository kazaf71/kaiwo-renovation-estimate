const test = require("node:test");
const assert = require("node:assert/strict");
const { editableText, editableUnit } = require("./editable-text-utils.js");

test("keeps an intentionally empty item label", () => {
  assert.equal(editableText({ customText: "" }, "平釘天花板"), "");
});

test("uses a fallback item label only for legacy data", () => {
  assert.equal(editableText({}, "平釘天花板"), "平釘天花板");
  assert.equal(editableText({ customText: null }, "平釘天花板"), "平釘天花板");
});

test("keeps an intentionally empty unit", () => {
  assert.equal(editableUnit({ unit: "" }, "坪"), "");
});

test("uses a fallback unit only for legacy data", () => {
  assert.equal(editableUnit({}, "坪"), "坪");
  assert.equal(editableUnit({ unit: null }, "尺"), "尺");
});
