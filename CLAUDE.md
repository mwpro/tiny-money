# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tiny-money** is a personal budget management application with:
- **Backend**: ASP.NET Core 10.0 REST API (C#) with Dapper + MySQL
- **Frontend**: React 19 + TypeScript SPA with Vite, Auth0, React Query, React Hook Form

The backend serves the frontend as static files from `wwwroot` in production (built via multi-stage Docker).

> **Legacy frontend**: The `frontend/` directory contains an older Vue.js frontend. It has some features not yet ported to `tinymoney-frontend/`. Do not read or reference this code unless explicitly porting a legacy feature.

## Commands

### Frontend (`tinymoney-frontend/`)
```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite bundle
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`backend/MW.TinyMoney.Api/`)
```bash
dotnet restore
dotnet run        # Start API on port 52386
dotnet publish    # Build for production
```

### Full-Stack Docker Build
```bash
docker build -t tiny-money .   # Multi-stage: builds frontend then backend
```

## Architecture

### Local Development Setup

Both processes must run simultaneously:
- **Backend**: port 52386
- **Frontend**: Vite dev server on port 5173 (no proxying — frontend calls backend directly at `http://localhost:52386`)

The only config not in the repository is the **database connection string**. The backend loads `/run/secrets/appsettings.secret.json` as an optional file (see `Program.cs`) — place your connection string override there to configure the local database. Do not connect to any external database servers.


### Frontend → Backend Communication
1. On startup, frontend fetches `GET /api/config` to get runtime config (API URL, Auth0 settings)
2. User authenticates with Auth0, gets JWT access token
3. All API calls include `Authorization: Bearer <token>`
4. Backend validates token via Auth0 authority

### Frontend Structure (`tinymoney-frontend/src/`)
- **Feature-based**: `features/{budgets,transactions,reports,tags,vendors,dashboard}/`
- **API layer**: `api/ApiClient.ts` (interface) + `api/ApiClientImpl.ts` (fetch-based impl) + `api/ApiTypes.ts` (all TypeScript types) + `api/ApiClientProvider.tsx` (React context)
- **UI components**: `components/ui/` — Radix UI primitives styled with Tailwind CSS 4
- **Path alias**: `@/*` → `./src/*`
- React Query manages all server state; React Hook Form handles form validation

### Backend Structure (`backend/MW.TinyMoney.Api/`)
- **Feature modules**: `Budget/`, `Transaction/`, `Categories/`, `Tags/`, `Vendors/`, `Reports/`, `Buffer/`
- Each module has: Controller → Store interface → MySql implementation (repository pattern)
- **Data access**: Dapper with direct parameterized SQL (no EF Core)
- **Key stores**: `ITransactionStore`, `IBudgetStore`, `IVendorStore`, `ITagStore`, `ICategoriesStore`, `IReportsProvider`, `IBufferedTransactionStore`
- `FrontendConfigurationEndpoint` serves runtime config to the frontend
- `MySqlConnectionFactory` handles connection pooling

### Reports Domain
Three report types: Summary (line/bar charts), Top List (ranked transactions), Sankey (flow visualization). Reports are generated server-side via `IReportsProvider`.

### Transaction Buffer
Import staging area for bank statement parsing — transactions land in a buffer before being confirmed into the main transaction table.

## Development Workflow

Changes are made via PRs to `master`.

After making code changes, always verify compilation and tests before finishing:
- **Backend - build**: `cd backend && dotnet build`
- **Backend - tests**: `cd backend && dotnet test`
- **Frontend**: `cd tinymoney-frontend && npm run build`
- **Frontend - tests**: no tests so far

Fix any errors before considering the task done.

## Commit Style

Do NOT add `Co-Authored-By: Claude` or any AI attribution lines to commits. The presence of `CLAUDE.md` in the repository is sufficient to indicate AI usage in the project.

## Key Conventions

- **Frontend forms**: Use React Hook Form for form management
- **Frontend data fetching**: Always use React Query hooks; never fetch in components directly
- **Backend stores**: All database operations go through store interfaces injected via DI
- **Authentication**: Auth0 on both sides — frontend uses `@auth0/auth0-react`, backend uses JWT Bearer middleware
