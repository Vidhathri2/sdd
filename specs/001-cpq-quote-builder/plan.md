# Implementation Plan: Deal Studio CPQ Quote Builder

**Branch**: `001-cpq-quote-builder` | **Date**: 2026-06-22 | **Spec**: `specs/001-cpq-quote-builder/spec.md`

**Input**: Feature specification from `specs/001-cpq-quote-builder/spec.md`

## Summary

Build a standalone, demo-focused Next.js application that authenticates server-side using Salesforce username-password credentials, reads Opportunity data through server-side Salesforce API routes, and supports a CPQ quote-building flow with product selection, quote configuration, and Salesforce-backed contract summary data.

## Technical Context

**Language/Version**: TypeScript, Next.js 14.x

**Primary Dependencies**: `next`, `react`, `react-dom`, `tailwindcss`, `postcss`, `autoprefixer`

**Storage**: N/A for feature data persistence; session state held in-memory for the demo

**Testing**: Manual validation for the POC; optional future tests using Jest / React Testing Library

**Target Platform**: Web browsers via Next.js app router, running locally or deployed to any Node-capable host

**Project Type**: Standalone web application with server-rendered pages and server-side API routes

**Performance Goals**: Demo-worthy responsiveness; first page loads under 5 seconds against a connected Salesforce org

**Constraints**: All Salesforce calls must happen server-side; secrets must be stored in environment variables; UI and Salesforce integration must remain separate; focus on working flow over complete error handling

**Scale/Scope**: Single-feature POC for quote creation in a Salesforce CPQ-connected org

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Salesforce username-password auth and REST API calls are implemented in server-side Next.js API routes. PASS
- No Salesforce Consumer Secret is exposed to client-side code. PASS
- Required Salesforce configuration comes from environment variables. PASS
- UI components are separate from integration logic. PASS
- POC prioritizes a working demo flow over exhaustive production hardening. PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-cpq-quote-builder/
├── plan.md
├── spec.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── auth/
│   │   └── callback/route.ts
│   ├── opportunities/route.ts
│   ├── products/route.ts
│   └── quotes/route.ts
├── login/page.tsx
├── opportunities/page.tsx
├── products/page.tsx
├── quote/page.tsx
├── layout.tsx
└── globals.css

components/
├── OpportunityTable.tsx
├── ProductFamilySidebar.tsx
├── AddedProductsPanel.tsx
├── QuoteDetailsTab.tsx
├── CommitPeriodSection.tsx
└── BillingSummaryPanel.tsx

lib/
├── salesforce/
│   ├── auth.ts
│   ├── opportunities.ts
│   ├── products.ts
│   └── quotes.ts
└── types.ts
```

**Structure Decision**: Single Next.js App Router project. No separate frontend/backend split — Next.js API routes under `app/api/` serve as the server-side backend layer, calling Salesforce on behalf of the browser. UI components live under `components/`, and all Salesforce integration logic is isolated under `lib/salesforce/`.

## Complexity Tracking

No constitution violations detected. The design choices are aligned with the POC focus and current governance.

## Phase Output Expectations

- `research.md`: Cover any remaining technology and integration decisions, such as Salesforce CPQ product mapping, session behavior, and quote flow design.
- `data-model.md`: Document the domain entities used in the quote workflow, including Opportunity, Product, QuoteDraft, Account, and related Salesforce objects.
- `contracts/api.md`: Describe the server-side API contracts for Salesforce-backed data retrieval and quote creation.
- `quickstart.md`: Provide local validation steps for login, opportunity browsing, product selection, and quote configuration.
- `tasks.md`: Phase 2 output created by `/speckit.tasks` after design artifacts are available.

## Next Steps

1. Generate `research.md`, `data-model.md`, `contracts/api.md`, and `quickstart.md` from this plan.
2. Create `tasks.md` with implementation tasks after the design artifacts are finalized.
3. Use this plan, the feature spec, and the generated contracts as the basis for `/speckit.tasks`.