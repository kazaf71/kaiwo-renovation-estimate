# 估價項目顯示／計價勾選 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為所有施工項目加入預設勾選、可暫停計價與輸出、可無損恢復的「顯示／計價」控制。

**Architecture:** 每筆列資料使用 `enabled` 欄位，未設定時一律視為啟用，以相容舊草稿。共用工具統一判斷啟用狀態與停用後的零小計；`app.jsx` 的工種小計、總額、備註與輸出資料全部由相同結果產生，避免 APP、PDF 與 ODS 不一致。清運單一項目使用 `cleanupEnabled` 草稿狀態套用相同行為。

**Tech Stack:** React 18（瀏覽器 Babel JSX）、原生 JavaScript、Node.js `node:test`、Service Worker、Netlify／GitHub 免費發布流程。

**Spec:** `docs/superpowers/specs/2026-11-07-item-enabled-toggle-design.md`

## Global Constraints

- 新增項目預設勾選；舊草稿缺少 `enabled` 時也視為勾選。
- 取消勾選不得清除區域、項目、數量、單位、單價或備註。
- 暫停項目不得進入任何小計、總額、管理費、稅額、APP 明細、摘要、PDF、ODS或備註。
- 重新勾選後必須立即以原資料恢復計價與輸出。
- 保留現有刪除功能，付款階段、發票與管理費不新增項目勾選框。
- 不加入付費服務，沿用既有 GitHub 與 Netlify 免費 HTTPS 發布。
- 不提交工作目錄內與本功能無關的既有變更。

## Review Focus

- 舊草稿沒有 `enabled`：仍顯示且計價；Task 1 測試。
- 明確 `enabled: false`：資料不變但小計為零；Task 1 測試。
- 停用項目的備註與輸出列：完全排除；Task 2 測試。
- 重新勾選：使用原數量與單價恢復同一金額；Task 1 與 Task 2 測試。
- 各工種新增列：都明確帶入 `enabled: true`；Task 3 測試。

---

### Task 1: 共用項目啟用規則

**Files:**
- Create: `item-enabled-utils.js`
- Create: `item-enabled-utils.test.cjs`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `note-utils.test.cjs`

**Interfaces:**
- Produces: `isItemEnabled(row): boolean`，僅 `row.enabled === false` 為停用。
- Produces: `enabledSubtotal(row, subtotal, emptySubtotal): subtotal`，停用時回傳零金額，啟用時保留原金額。

- [ ] **Step 1: Write the failing tests**

  在 `item-enabled-utils.test.cjs` 驗證缺少 `enabled`、`enabled: true`、`enabled: false`，以及停用後回傳零小計但原物件欄位不變。

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test item-enabled-utils.test.cjs`
  Expected: FAIL，因共用工具尚不存在。

- [ ] **Step 3: Implement the shared helper**

  建立 UMD 工具供瀏覽器與 Node 測試共用，並將 `item-enabled-utils.js?v=1` 加入 `index.html` 與 Service Worker app shell；將 APP 版本提升至 `v41`、快取提升至 `kaiwo-estimate-v43`。

- [ ] **Step 4: Run focused tests**

  Run: `node --test item-enabled-utils.test.cjs note-utils.test.cjs`
  Expected: PASS。

### Task 2: 計價、備註與所有輸出排除停用項目

**Files:**
- Modify: `app.jsx`
- Create: `item-enabled-output.test.cjs`

**Interfaces:**
- Consumes: `isItemEnabled(row)`、`enabledSubtotal(row, subtotal, pair())`。
- Produces: 所有工種 totals 中保留原列資料與 `enabled`，但停用列 `subtotal` 為零；所有輸出只接收啟用且已填價格的列。

- [ ] **Step 1: Write failing output tests**

  驗證櫃體、木作、地板、土水、保護、水電、油漆、空調、自訂工程及清運皆使用啟用判斷；備註來源與 `rawEstimateRows` 不可包含停用列。

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test item-enabled-output.test.cjs`
  Expected: FAIL，因目前總額與輸出尚未判斷 `enabled`。

- [ ] **Step 3: Apply enabled state to totals and outputs**

  在 `app.jsx` 引入共用工具；各 totals 先計算原金額，再以啟用狀態決定有效 subtotal。自訂工程 subtotal 只加總啟用列；清運以 `cleanupEnabled` 決定有效金額。備註與 `rawEstimateRows` 都明確過濾停用項目。

- [ ] **Step 4: Run focused tests**

  Run: `node --test item-enabled-utils.test.cjs item-enabled-output.test.cjs estimate-display-utils.test.cjs`
  Expected: PASS。

### Task 3: 全工種勾選介面與預設值

**Files:**
- Modify: `app.jsx`
- Modify: `styles.css`
- Create: `item-enabled-ui.test.cjs`

**Interfaces:**
- Consumes: 各既有 `update*` 方法與 `isItemEnabled(row)`。
- Produces: 共用 `ItemEnabledToggle` React 元件；所有新建列包含 `enabled: true`；停用列增加一致的淡化 class。

- [ ] **Step 1: Write failing UI coverage tests**

  驗證十類施工項目都有勾選控制、每個新增列預設 `enabled: true`、清運有獨立勾選狀態，且停用樣式不會停用欄位本身。

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test item-enabled-ui.test.cjs`
  Expected: FAIL，因畫面尚無共用勾選元件。

- [ ] **Step 3: Add toggle controls to every item editor**

  在每筆列最前方加入標示「顯示／計價」的 checkbox。取消勾選時保留欄位可編輯並淡化整列；重新勾選透過既有 updater 改回 `enabled: true`。櫃體、木作、地板、土水、保護、清運、水電、油漆、空調與自訂工程全部套用。

- [ ] **Step 4: Run focused tests**

  Run: `node --test item-enabled-ui.test.cjs item-enabled-output.test.cjs`
  Expected: PASS。

### Task 4: 全面驗證與免費網站發布

**Files:**
- Verify only: all tracked `*.test.cjs`

**Interfaces:**
- Consumes: Tasks 1–3 完整功能。
- Produces: GitHub `main` commit 與 Netlify ready deploy。

- [ ] **Step 1: Run the complete tracked test suite**

  Run: `$tests = & $git ls-files '*.test.cjs'; node --test $tests item-enabled-utils.test.cjs item-enabled-output.test.cjs item-enabled-ui.test.cjs`
  Expected: 0 failed。

- [ ] **Step 2: Check code and staged scope**

  Run: `git diff --check`，並確認 staged files 僅含本功能、設計與計畫檔案。
  Expected: 無空白錯誤，且不包含既有無關變更。

- [ ] **Step 3: Commit and push**

  Commit message: `Add reversible estimate item toggles`
  Push: `git push origin main`

- [ ] **Step 4: Verify Netlify and live assets**

  驗證最新 deploy state 為 `ready` 且 commit 對應本次提交；線上 `index.html` 載入 `app.jsx?v=41` 與 `item-enabled-utils.js?v=1`，`sw.js` 為 `kaiwo-estimate-v43`，線上 APP 含「顯示／計價」控制。
