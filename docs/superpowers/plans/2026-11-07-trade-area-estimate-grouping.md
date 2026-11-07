# Trade-First Area Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every estimate output group enabled items by trade first and by construction area second, with both area and trade subtotals.

**Architecture:** Replace the current area-primary helper with one pure trade-first grouping function that returns nested trade groups containing ordered area groups and both subtotal levels. `app.jsx` will consume this single model for the APP detail, PDF, ODS, Excel, and text output so their order cannot drift.

**Tech Stack:** JavaScript, React 18 JSX, Node.js built-in test runner, browser-generated PDF/ODS/Excel.

**Spec:** `docs/superpowers/specs/2026-11-07-trade-area-estimate-grouping-design.md`

## Global Constraints

- Group order is trade → area → item.
- 客廳 is the first area inside each trade; remaining areas follow the estimate-area order, and custom areas follow known areas.
- Every area has an area subtotal and every trade has a trade subtotal.
- APP detail, PDF, ODS, Excel, and text output consume the same grouping result.
- Existing item data, enable/disable behavior, item totals, and final totals are unchanged.

## Review Focus

- Two trades sharing 客廳 must remain in separate trade groups; Task 1 tests this.
- One trade with repeated, non-adjacent area rows must consolidate them; Task 1 tests this.
- Custom trade names and custom areas must remain stable and ordered; Task 1 tests this.
- Area and trade subtotals must equal only their own rows; Task 1 tests exact literal totals.
- Empty input must produce no display groups; Task 1 tests this.

---

### Task 1: Shared trade-first grouping model

**Files:**
- Modify: `estimate-display-utils.js`
- Modify: `estimate-display-utils.test.cjs`

**Interfaces:**
- Consumes: estimate rows shaped as `{ trade, area, subtotal, ... }`, ordered trade names, and ordered area names.
- Produces: `groupEstimateRowsByTradeAndArea(rows, tradeOrder, areaOrder) -> [{ trade, areas: [{ area, rows, subtotal }], subtotal }]`.

- [ ] **Step 1: Write failing behavior tests**

Add tests with literal expected output for trade-first separation, 客廳-first area order, consolidation of repeated areas, custom trade/custom area stability, exact area/trade subtotals, and empty rows.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test estimate-display-utils.test.cjs`

Expected: FAIL because `groupEstimateRowsByTradeAndArea` is not exported or current grouping remains area-primary.

- [ ] **Step 3: Implement the pure grouping function**

Use `groupEstimateRowsByTradeAndArea(rows, tradeOrder = [], areaOrder = [])`; preserve original row order within each trade-area bucket and calculate subtotals from the supplied row subtotals.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test estimate-display-utils.test.cjs`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

Commit message: `Group estimate rows by trade then area`

### Task 2: Apply nested grouping to every estimate output

**Files:**
- Modify: `app.jsx`
- Modify: `pdf-export-utils.js` only if rendered pagination needs header bundling
- Modify: `pdf-export-utils.test.cjs` only if pagination behavior changes
- Modify: `estimate-display-utils.test.cjs`

**Interfaces:**
- Consumes: `groupEstimateRowsByTradeAndArea` from Task 1.
- Produces: one `estimateTradeGroups` value used by APP detail, PDF, ODS, Excel, and text export.

- [ ] **Step 1: Write failing integration expectations**

Add a pure rendering-section assertion if extraction is needed; otherwise extend the grouping fixture to match the exact hierarchy consumed by every output. The production change that must fail it is returning area-primary groups or omitting either subtotal level.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test estimate-display-utils.test.cjs pdf-export-utils.test.cjs`

Expected: FAIL on the new hierarchy expectation before `app.jsx` is rewired.

- [ ] **Step 3: Rewire every output**

Create the standard trade order from the estimate row construction order, build `estimateTradeGroups`, and render each trade header, its ordered area groups, each area subtotal, then the trade subtotal. Remove the trade prefix from individual item names because the parent trade header now supplies it.

- [ ] **Step 4: Verify focused and full suites**

Run focused: `node --test estimate-display-utils.test.cjs pdf-export-utils.test.cjs`

Run full: tracked `*.test.cjs` files via `node --test`.

Expected: all tests pass with no failures.

- [ ] **Step 5: Browser verification**

Enter two trades containing the same area and one trade containing two areas; verify the visible hierarchy and matching totals before publishing.

- [ ] **Step 6: Commit**

Commit message: `Render estimates by trade and area`

### Task 3: Review and publish

**Files:**
- No product files unless review finds a regression.

**Interfaces:**
- Consumes: Tasks 1–2 committed implementation.
- Produces: reviewed and deployed `main` with verified live behavior.

- [ ] **Step 1: Run final review for Critical/Important issues**
- [ ] **Step 2: Run the fresh full suite and `git diff --check`**
- [ ] **Step 3: Integrate to `main`, push the existing free Netlify project, and wait for `ready`**
- [ ] **Step 4: Verify live assets and the visible trade → area → item hierarchy**
