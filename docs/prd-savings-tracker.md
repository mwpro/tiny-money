# PRD: Savings Tracker Module

## Problem Statement

As a user managing savings across many accounts of different risk profiles and purposes, I need a structured way to record monthly balances, understand how my total savings is composed and growing, and ensure I always have an adequate financial cushion — all without the manual overhead and limited insight of a spreadsheet.

## Solution

A new **Savings Tracker** module within tiny-money, independent of the transactions/budgets system (except where explicitly integrated). The user records a monthly snapshot of each account's balance. The app aggregates these into dashboards, category breakdowns, and ROI summaries. A one-time setup defines account categories and a cushion target.

## User Stories

1. As a user, I want to create savings accounts (e.g. "PKO Savings Account", "IKE mBank") so that I can track each one individually.
2. As a user, I want to create user-defined account categories (e.g. "Main savings", "Retirement", "Kids", "Risky investments") so that I can group accounts by purpose.
3. As a user, I want to assign each account to a category so that reports can aggregate by purpose.
4. As a user, I want to mark an account as inactive/archived so that it disappears from monthly entry without losing historical data.
5. As a user, I want to record a monthly balance snapshot for each active account so that I have a point-in-time record.
6. As a user, I want to see the previous month's balances pre-filled on the monthly entry screen so that I only need to update what changed.
7. As a user, I want a one-click "copy from last month" button per account so that I can quickly carry forward the balance (deposited/withdrawn reset to 0).
8. As a user, I want to record how much I deposited into and withdrew from each account in a given month so that ROI and investment return can be calculated.
9. As a user, I want to set a fixed financial cushion target (e.g. 60,000 PLN) so that I always know if my safety net is adequate.
10. As a user, I want to select which account categories count toward the cushion (e.g. "Main savings" yes, "Crypto" no) so that only truly liquid/safe money is counted.
11. As a user, I want to see a recommendation for the cushion amount based on my average monthly expenses from the transactions module so that I can calibrate my cushion to real spending.
12. As a user, I want the dashboard to show my total savings and whether my cushion target is met (green/red indicator) so that I can assess my financial safety at a glance.
13. As a user, I want a chart of total savings over time so that I can see my long-term growth trend.
14. As a user, I want a stacked area/line chart of savings by category over time so that I can see how each bucket of savings has evolved.
15. As a user, I want a chart of monthly cash flows per account (deposited and withdrawn each month) so that I can see my saving/spending patterns per account.
16. As a user, I want to see simple ROI per account ((current balance - total invested) / total invested) so that I can compare which accounts are earning the most.
17. As a user, I want to navigate to any past month's snapshot and see or edit it so that I can correct mistakes or enter historical data.
18. As a user, I want archived accounts to be excluded from the monthly entry form but still visible in historical charts.

## Implementation Decisions

### Backend Schema (new tables)

- **savings_categories** — id, name
- **savings_accounts** — id, name, category_id, is_active
- **savings_snapshots** — id, account_id, period (YYYY-MM), balance, deposited, withdrawn
  - `deposited` and `withdrawn` default to 0; represent that month's cash flows
  - The first snapshot's `deposited` field serves as the "seed" for cumulative invested amount
- **savings_settings** — single-row table: cushion_amount
- **savings_cushion_categories** — category_id (which categories count toward the cushion)

### Backend Modules

- **SavingsController** — one controller for the whole module, with routes for:
  - Accounts CRUD + archive
  - Categories CRUD
  - Snapshots: get by period, upsert snapshot entry for an account
  - Settings (get/put cushion amount + cushion-eligible categories)
  - Dashboard summary endpoint (total savings, cushion actual vs. target, cushion recommendation)
  - Reports endpoint: time-series totals, by-category totals, monthly cash flows, ROI per account
- **ISavingsStore** — store interface following the existing repository pattern
- **MySqlSavingsStore** — Dapper SQL implementation

### Dashboard Integration

A separate lightweight savings dashboard endpoint provides: total savings (sum of most recent snapshots for all active accounts), cushion target, cushion actual (sum of most recent snapshots for cushion-eligible accounts). The cushion recommendation reads average monthly expenses from the transaction store (read-only cross-module query).

### Frontend Modules

- **`features/savings/`** — new top-level feature; added to the main nav between Reports and Tags:
  - **Monthly Entry page** — default period is current calendar month. Table of all active accounts, pre-filled from each account's most recent snapshot. Editable balance, deposited, withdrawn columns. Per-account "copy from last month" button (copies balance only; deposited/withdrawn reset to 0). One "Save all" button for the period.
  - **Accounts page** — CRUD for accounts and categories. Archive toggle.
  - **Settings page** — cushion target input, cushion-eligible categories selector, recommendation display.
  - **Charts page** — four chart panels: total over time, by-category stacked, monthly cash flows, ROI per account.
- **Dashboard widget** — total savings (all active accounts, all categories) + cushion status (green/red). Links to Savings module.
- **SavingsApiClient** — new client in the API layer following the `ApiClient.ts` / `ApiClientImpl.ts` pattern.

### Key Behavior

- **Snapshot model**: one entry per account per month (YYYY-MM). Upsert semantics (create or update).
- **Pre-fill logic**: when landing on a period with no saved snapshots, each account shows its most recent snapshot's balance (regardless of how many months ago). If no prior snapshot exists, balance shows 0.
- **Cumulative invested amount**: sum of all `deposited` minus sum of all `withdrawn` across all of an account's snapshots. The first snapshot's `deposited` value acts as the historical seed.
- **ROI**: (current balance − cumulative invested) / cumulative invested × 100%. Only shown when cumulative invested > 0.
- **Category re-attribution**: if an account changes category, all historical snapshots are attributed to the new category in charts. History always reflects the current config.
- **Cushion actual**: sum of most recent snapshots for accounts in cushion-eligible categories.
- **Cushion recommendation**: average monthly expenses (from transactions) × 3, shown as an informational hint.
- **Cushion settings are point-in-time**: only current target and categories stored; no history tracked.

## Testing Decisions

**Good tests** test external behavior (inputs → outputs), not internal implementation. Pure calculation logic is unit-tested without a DB.

**Modules to test:**

1. **ROI calculation** — (balance − cumulative invested) / cumulative invested. Covers: positive gain, negative gain, zero invested (ROI not shown), partial history with seed.
2. **Cushion recommendation** — average monthly expenses × multiplier. Tested with mock expense data.

**Prior art**: `backend/MW.TinyMoney.UnitTests/` — xUnit + FluentAssertions patterns.

## Out of Scope

- Time-weighted return (TWR) — potential future improvement; simple ROI only for now.
- Tracking history of cushion target changes over time.
- Tracking liabilities (credits, mortgages), real estate, or non-financial assets.
- Automated account balance import (bank API integration).
- Bulk historical import from Excel (user enters history manually via the period navigator).
- Notifications or alerts beyond the dashboard cushion indicator.
- Multi-currency support.
- Actionable saving advice / smart insights.

## Further Notes

- The module is intentionally independent of the transactions module — it is a parallel data entry system, not derived from transaction data. The only cross-module read is the cushion recommendation.
- Simple ROI is used: (balance − cumulative invested) / cumulative invested. No mention of TWR in the UI.
- Historical data entry is supported from day one — the period selector allows navigating to any past month. Users can reconstruct years of history manually.
