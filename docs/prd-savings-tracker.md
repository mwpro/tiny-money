# PRD: Savings Tracker Module

## Problem Statement

As a user managing savings across many accounts of different risk profiles and purposes, I need a structured way to record monthly balances, understand how my total savings is composed and growing, track progress toward financial goals, and ensure I always have an adequate financial cushion — all without the manual overhead and limited insight of a spreadsheet.

## Solution

A new **Savings Tracker** module within tiny-money, independent of the transactions/budgets system (except where explicitly integrated). The user records a monthly snapshot of each account's balance. The app aggregates these into dashboards, category breakdowns, ROI summaries, and goal progress views. A one-time setup defines account categories, goals, and a cushion target.

## User Stories

1. As a user, I want to create savings accounts (e.g. "PKO Savings Account", "IKE mBank") so that I can track each one individually.
2. As a user, I want to create user-defined account categories (e.g. "Main savings", "Retirement", "Kids", "Risky investments") so that I can group accounts by purpose.
3. As a user, I want to assign each account to a category so that reports can aggregate by purpose.
4. As a user, I want to mark an account as inactive/archived so that it disappears from monthly entry without losing historical data.
5. As a user, I want to record a monthly balance snapshot for each active account so that I have a point-in-time record.
6. As a user, I want to see the previous month's balances pre-filled on the monthly entry screen so that I only need to update what changed.
7. As a user, I want a one-click "copy from last month" button per account so that I can quickly carry forward unchanged balances.
8. As a user, I want to record the total amount I've invested into each account (cumulative deposits minus withdrawals) alongside the balance so that ROI can be calculated.
9. As a user, I want to define financial goals (e.g. "New car", "Home renovation") with a target amount and optional target date.
10. As a user, I want to link account categories to a goal so that the goal's progress is automatically calculated from account balances.
11. As a user, I want multiple active goals simultaneously so that I can pursue several targets at once.
12. As a user, I want to see how much savings are available toward each goal (with the cushion amount already deducted from the eligible balance) so that I see only truly spendable progress.
13. As a user, I want to see a projected date for reaching each goal based on my recent savings rate so that I can set realistic expectations.
14. As a user, I want to set a fixed financial cushion target (e.g. 60,000 PLN) so that I always know if my safety net is adequate.
15. As a user, I want to select which account categories count toward the cushion (e.g. "Main savings" yes, "Crypto" no) so that only truly liquid/safe money is counted.
16. As a user, I want to see a recommendation for the cushion amount based on my average monthly expenses from the transactions module so that I can calibrate my cushion to real spending.
17. As a user, I want the dashboard to show my total savings and whether my cushion target is met (green/red indicator) so that I can assess my financial safety at a glance.
18. As a user, I want a chart of total savings over time so that I can see my long-term growth trend.
19. As a user, I want a stacked area/line chart of savings by category over time so that I can see how each bucket of savings has evolved.
20. As a user, I want a chart of monthly delta per account (how much was added/withdrawn each month) so that I understand my saving/spending patterns per account.
21. As a user, I want to see simple ROI per account ((current balance - total invested) / total invested) so that I can compare which accounts are earning the most.
22. As a user, I want to navigate to any past month's snapshot and see or edit it so that I can correct mistakes.
23. As a user, I want archived accounts to be excluded from the monthly entry form but still visible in historical charts.

## Implementation Decisions

### Backend Schema (new tables)

- **savings_categories** — id, name, contributes_to_goals (bool)
- **savings_accounts** — id, name, category_id, is_active
- **savings_snapshots** — id, account_id, period (YYYY-MM), balance, invested_amount
- **savings_goals** — id, name, target_amount, target_date (nullable)
- **savings_goal_categories** — goal_id, category_id (many-to-many join)
- **savings_settings** — single-row table: cushion_amount
- **savings_cushion_categories** — category_id (join table: which categories count toward the cushion)

### Backend Modules

- **SavingsController** — one controller for the whole module, with routes for:
  - Accounts CRUD + archive
  - Categories CRUD
  - Snapshots: get by period, upsert snapshot entry for an account, copy-from-previous-month per account
  - Goals CRUD + link/unlink categories
  - Settings (get/put cushion amount + which categories count toward cushion)
  - Dashboard summary endpoint (total savings, cushion actual vs. target, cushion recommendation)
  - Reports endpoint: time-series totals, by-category totals, monthly deltas, ROI per account, goal progress + projections
- **ISavingsStore** — store interface following the existing repository pattern
- **MySqlSavingsStore** — Dapper SQL implementation

### Dashboard Integration

A separate lightweight savings dashboard endpoint provides the widget data: total savings, cushion target, cushion actual (sum of cushion-eligible account balances). The cushion recommendation reads average monthly expenses from the transaction store (read-only cross-module query).

### Frontend Modules

- **`features/savings/`** — new top-level feature with:
  - **Monthly Entry page** — table of all active accounts, previous month values pre-filled, editable. Per-account "copy from last month" button. Period selector (month/year).
  - **Accounts page** — CRUD for accounts and categories. Archive toggle.
  - **Goals page** — CRUD for goals, link categories to goals, view goal progress cards.
  - **Settings page** — cushion target input, cushion-eligible categories selector, recommendation display.
  - **Charts page** — four chart panels: total over time, by-category stacked, monthly delta, ROI per account.
- **Dashboard widget** — total savings number + cushion status (green/red). Linked to savings module main page.
- **SavingsApiClient** — new client in the API layer following the `ApiClient.ts` / `ApiClientImpl.ts` pattern.

### Key Behavior

- **Snapshot model**: one balance entry per account per month (YYYY-MM). Upsert semantics (create or update).
- **Copy from last month**: pre-fills each account's balance from its most recent snapshot (not necessarily the immediately preceding calendar month — handles months the user skipped).
- **Inactive accounts**: preserved in history; excluded from the monthly entry form for new periods.
- **Goal progress**: sum of current month's balances for accounts in the goal's linked categories, minus the cushion amount. The cushion is "locked" and unavailable toward any goal. If cushion-eligible categories overlap with goal-linked categories, the cushion target is subtracted before showing goal progress. Progress is floored at zero.
- **Goal projection**: (target_amount − current_progress) / average monthly savings delta over last 3–6 months.
- **ROI**: (balance − invested_amount) / invested_amount × 100%. Only shown when invested_amount > 0.
- **Cushion actual**: sum of current month balances for accounts in cushion-eligible categories only.
- **Cushion recommendation**: average monthly expenses × 3 (default multiplier), shown as an informational hint alongside the user-defined target.
- **No link to transactions except**: cushion recommendation reads average expenses read-only.
- **Cushion settings are point-in-time**: only the current cushion target and categories are stored; history of changes is not tracked.

## Testing Decisions

**Good tests** test external behavior (inputs → outputs), not internal implementation. For pure calculation logic, unit tests are sufficient without a DB.

**Modules to test:**

1. **Goal progress + projection calculation** — inputs: list of snapshots + goal config + cushion settings → outputs: available-toward-goal amount + projected date. Key edge cases: cushion covers entire goal-eligible balance (progress floors at 0), multiple goals sharing a category.
2. **ROI calculation** — (balance − invested) / invested. Simple unit tests covering: positive gain, negative gain, zero invested (no ROI shown).
3. **Cushion recommendation** — average monthly expenses × multiplier. Tested with mock transaction data.

**Prior art**: `backend/MW.TinyMoney.UnitTests/` — xUnit + FluentAssertions patterns.

## Out of Scope

- Time-weighted return (TWR) — potential future improvement; simple ROI only for now.
- Tracking history of cushion target changes over time.
- Priority-ordered goals / savings allocation between goals.
- Tracking liabilities (credits, mortgages), real estate, or non-financial assets.
- Automated account balance import (bank API integration).
- Notifications or alerts beyond the dashboard cushion indicator.
- Multi-currency support.
- Historical data import from Excel.
- Actionable saving advice / smart insights beyond goal projections.

## Further Notes

- The module is intentionally independent of the transactions module — it is a parallel data entry system, not derived from transaction data. The only cross-module read is the cushion recommendation.
- Simple ROI is used: (balance − invested_amount) / invested_amount. No mention of TWR in the UI.
- Goal categories can overlap: the same category can contribute to multiple goals. There is no splitting — if "Main savings" = 100k and it's linked to both "Car" (target 50k) and "Home" (target 500k), both goals show 100k as available (minus the cushion). This is intentional and transparent.
