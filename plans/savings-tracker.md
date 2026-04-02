# Plan: Savings Tracker Module

> Source PRD: `docs/prd-savings-tracker.md`

## Architectural decisions

- **Backend API base route**: `/api/savings`
  - `GET/POST /api/savings/categories` — list, create
  - `PUT/DELETE /api/savings/categories/{id}` — update, delete (blocked if accounts exist)
  - `GET/POST /api/savings/accounts` — list, create
  - `PUT /api/savings/accounts/{id}` — update (name, category, is_active)
  - `GET /api/savings/snapshots/{year}/{month}` — returns pre-filled period data (last known values for all active accounts, or 0 if no prior snapshot); `deposited`/`withdrawn` always 0 in pre-fill
  - `POST /api/savings/snapshots/{year}/{month}` — batch upsert: body is `[{ accountId, balance, deposited, withdrawn }]`
  - `GET/PUT /api/savings/settings` — cushion settings; GET always returns an object (defaults if unconfigured, never 404)
  - `GET/POST /api/savings/goals` — list, create
  - `PUT/DELETE /api/savings/goals/{id}` — update, hard delete
  - `PUT /api/savings/goals/{id}/archive` — toggle archive
  - `GET /api/savings/dashboard` — total savings (latest per account), cushion actual vs. target
  - `GET /api/savings/reports` — charts data (time-series, by-category, cash flows, ROI)

- **Frontend routes**:
  - `/savings` — monthly entry page (main nav target from Phase 2)
  - `/savings/accounts` — accounts & categories management (secondary; linked from within Savings, not main nav)
  - `/savings/goals` — goals list and progress
  - `/savings/charts` — all four chart panels
  - `/savings/settings` — cushion settings
  - Phase 1 only: `/savings` routes to accounts page temporarily

- **Nav**: "Savings" added as a top-level item between Reports and Tags (desktop + mobile)

- **Schema** (all new tables; created in a single DbUp migration in Phase 1):
  - `savings_categories` — id, name
  - `savings_accounts` — id, name, category_id, is_active
  - `savings_snapshots` — id, account_id, period (YYYY-MM), balance, deposited, withdrawn
    - `deposited` on the first snapshot for an account = historical invested seed
  - `savings_goals` — id, name, target_amount, target_date (nullable), is_archived
  - `savings_goal_categories` — goal_id, category_id
  - `savings_settings` — cushion_amount (single row; created on first PUT, defaults returned if missing)
  - `savings_cushion_categories` — category_id

- **Key behavioral rules** (apply everywhere):
  - "Last known balance": for any account without a snapshot in a given period, always use its most recent prior snapshot — never assume 0
  - Dashboard widget: always shows latest known totals, independent of the dashboard's period selector
  - Monthly entry form: shows ALL active accounts (regardless of account creation date), supporting historical backfill
  - Category re-attribution: changing an account's category retroactively applies everywhere in charts
  - Goal progress = sum of last-known balances in linked categories − cushion_amount, floored at 0; deducted independently per goal
  - Goal projection = (target − progress) / avg monthly net balance growth over last 6 months (or all available months if fewer than 6); no projection shown when rate ≤ 0
  - Charts X-axis: only months where at least one snapshot exists (no calendar gaps filled)
  - By-category chart: each plotted month uses the last-known balance per account up to that month

- **Frontend API client**: `savingsClient` added to `ApiClient` type and implemented in `ApiClientImpl`

---

## Phase 1: Accounts & Categories

**User stories**: 1, 2, 3, 4

### What to build

The configuration foundation for the entire module. The user can create account categories and savings accounts assigned to them. Accounts can be archived (hidden from future data entry without losing history) and unarchived. The Savings nav item is added to the main navigation and temporarily routes to the accounts management page.

This phase creates all 7 schema tables (via a single DbUp migration), establishes the `SavingsController` / `ISavingsStore` / `MySqlSavingsStore` pattern for the module, and wires up the frontend management UI.

Category deletion is blocked if accounts are assigned to it; the API returns a 400 with a clear message.

### Acceptance criteria

- [ ] User can create, rename, and delete a savings category
- [ ] Deleting a category that has accounts returns an error; UI shows why
- [ ] User can create a savings account with a name and assigned category
- [ ] User can edit an account's name or category assignment
- [ ] User can archive an account; it no longer appears in active account lists
- [ ] User can unarchive an account
- [ ] "Savings" appears in the main navigation (desktop and mobile) and routes to the accounts page
- [ ] All 7 schema tables are created by a single DbUp migration

---

## Phase 2: Monthly Snapshot Entry

**User stories**: 5, 6, 7 (no button — pre-fill is the copy), 8, 22

### What to build

The core data-entry workflow. The entry page defaults to the current calendar month and shows all active accounts grouped by category, with balance pre-filled from each account's most recent prior snapshot and `deposited`/`withdrawn` pre-filled as 0. The user edits what changed and hits one Save button for the whole period. Past months are editable via the period selector.

No per-account "copy" button — the pre-fill itself is the mechanism. All active accounts appear regardless of when they were created, enabling historical data entry.

From this phase, `/savings` routes to the monthly entry page. The accounts page moves to `/savings/accounts`.

### Acceptance criteria

- [ ] Monthly entry page defaults to the current calendar month
- [ ] All active accounts are shown, grouped by category, regardless of account creation date
- [ ] Balance is pre-filled from the most recent prior snapshot for each account; 0 if none exists
- [ ] `deposited` and `withdrawn` always pre-fill as 0
- [ ] Period selector allows navigating to any past month; data loads correctly
- [ ] Editing a past month with existing snapshots shows saved values (not pre-fill)
- [ ] One "Save" button sends a batch POST with all account values; upsert semantics
- [ ] Saving twice is idempotent
- [ ] Archived accounts are excluded from the entry form
- [ ] `/savings` now routes to the monthly entry page; accounts management is at `/savings/accounts`

---

## Phase 3: Dashboard Widget — Total Savings

**User story**: 17 (partial — total only, no cushion status yet)

### What to build

A new widget on the existing dashboard showing total savings: the sum of each active account's most recent snapshot balance across all categories. Shows 0 if no snapshots exist. The widget is independent of the dashboard's month selector. Links to `/savings`.

### Acceptance criteria

- [ ] Dashboard shows a "Total Savings" widget with the correct sum
- [ ] Widget always reflects latest known balances, not the dashboard's selected period
- [ ] Widget shows 0 when no snapshots exist
- [ ] Widget links to `/savings`
- [ ] Widget renders without breaking existing dashboard layout

---

## Phase 4: Cushion Settings

**User stories**: 14, 15, 16, 17 (complete)

### What to build

A settings page at `/savings/settings` where the user enters a cushion target amount and selects which account categories count toward it. The page shows three cushion recommendations side by side — 3×, 6×, and 12× the average monthly expenses from the transactions module (over 3, 6, and 12 months respectively) — as informational reference points. The user sets their own target independently.

The dashboard Total Savings widget gains a green/red cushion status indicator.

Settings GET always returns an object with defaults (`cushion_amount: 0`) if unconfigured.

### Acceptance criteria

- [ ] Settings page allows entering a cushion target amount
- [ ] User can select which account categories count toward the cushion
- [ ] Page shows three recommendation figures: avg expenses × 3 over the last 3, 6, and 12 months
- [ ] Recommendations are labeled clearly as suggestions, not the user's target
- [ ] Dashboard widget shows green when cushion actual ≥ target
- [ ] Dashboard widget shows red when cushion actual < target
- [ ] No cushion indicator shown if target is 0 (unconfigured)
- [ ] `GET /api/savings/settings` returns defaults if no settings saved yet (never 404)

---

## Phase 5: Goal Setup

**User stories**: 9, 10, 11

### What to build

A goals page at `/savings/goals` for creating and managing financial goals. Each goal has a name, target amount, and optional target date. Goals are linked to one or more account categories. Multiple active goals can coexist. This phase delivers the data model and management UI only — no progress calculation yet.

### Acceptance criteria

- [ ] User can create a goal with a name, target amount, and optional target date
- [ ] User can link one or more account categories to a goal
- [ ] User can unlink a category from a goal
- [ ] User can edit a goal's name, target amount, and target date
- [ ] User can hard-delete a goal (with confirmation); this removes the goal record but not account snapshots
- [ ] Goals list page shows all active (non-archived) goals with their targets and linked categories

---

## Phase 6: Goal Progress, Projections & Archive

**User stories**: 12, 13, 24, 25

### What to build

Goals become actionable. Each goal card shows:
- **Available**: sum of last-known balances for accounts in linked categories − cushion amount (floored at 0). Cushion is deducted independently per goal (each goal subtracts the full cushion amount).
- **Progress bar**: available / target
- **Projection**: projected completion date based on average net balance growth over the last 6 months of data (or all available months if fewer). No projection shown when rate ≤ 0.

The user can archive a goal when it's achieved. Archived goals disappear from the active view and are excluded from all progress/projection/cushion calculations. Archiving is reversible.

### Acceptance criteria

- [ ] Each goal card shows available amount (last-known category balances − cushion, ≥ 0)
- [ ] Cushion is deducted from each goal independently
- [ ] Progress bar shows available / target
- [ ] Goal projection shown when average monthly growth over last 6 months is positive
- [ ] No projection shown when growth rate ≤ 0 or fewer than 2 months of data
- [ ] Projection falls back to all available months when fewer than 6 are recorded
- [ ] User can archive a goal; it disappears from active goals list
- [ ] User can unarchive a goal
- [ ] Archived goals are excluded from all progress and projection calculations
- [ ] Unit tests: progress = 0 when cushion ≥ eligible balance; two goals sharing a category each independently deduct full cushion; projection with positive growth; projection not shown with negative growth; goal exactly at target shows 100%

---

## Phase 7: Charts

**User stories**: 18, 19, 20, 21, 23

### What to build

A charts page at `/savings/charts` with four panels:

1. **Total savings over time** — line chart; X-axis = months with at least one snapshot; each point = sum of last-known balance per account up to that month
2. **By-category over time** — stacked area/line chart; same X-axis logic; each account contributes its last-known balance to its current category for that point
3. **Monthly cash flows** — bar chart of `deposited` and `withdrawn` per account per recorded month
4. **ROI per account** — bar chart; one bar per active account where cumulative invested > 0; ROI = (balance − cumulative invested) / cumulative invested × 100%

Archived accounts: included in charts 1 and 2 up to their last snapshot; excluded from chart 4.

### Acceptance criteria

- [ ] Total savings chart plots only months with at least one snapshot; no calendar gaps filled
- [ ] By-category chart uses last-known balance per account for each plotted month (not only accounts with an exact-month snapshot)
- [ ] Changing an account's category retroactively updates all historical by-category data
- [ ] Cash flows chart shows deposited and withdrawn bars per account per recorded month
- [ ] ROI chart shows only accounts where cumulative invested > 0
- [ ] ROI is correct: (current balance − sum(deposited) − initial_seed + sum(withdrawn)) / (sum(deposited) + initial_seed − sum(withdrawn))
- [ ] Archived accounts appear in charts 1 and 2 but not in chart 4
- [ ] Charts page is reachable from Savings nav
