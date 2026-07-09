# Implementation Plan: Quote Creation & Subscription Period Configuration Flow (Angular & Tailwind CSS)

**Branch**: `001-quote-subscription-flow` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-quote-subscription-flow/spec.md`

## Summary

This feature delivers an integrated sales wizard ("Deal Studio") that enables sales reps to create quotes from active opportunities, select product bundles (GCP and Looker Core), configure subscription details, and partition the contract term into annual or custom periods. We will implement this as a high-fidelity, responsive single-page web application using **Angular (v18.x)** with **TypeScript**, styled using the **Tailwind CSS** framework.

## Technical Context

**Language/Version**: TypeScript (v5.5+), HTML5, CSS3

**Primary Dependencies**: 
- `@angular/core`, `@angular/common`, `@angular/router`, `@angular/forms` (v18.x) - Application framework
- `tailwindcss` (v3.x), `postcss`, `autoprefixer` - Utility-first styling framework
- `rxjs` (v7.8+) - Reactive streams for state management and API calls
- `jasmine` and `karma` - Angular-native unit testing framework

**Storage**:
- Browser `sessionStorage` - For opportunity context caching
- Browser `localStorage` - For persistent mock Quote database

**Testing**: 
- Jasmine/Karma for unit tests of Angular components, services, and utility functions
- Manual high-fidelity UX validation

**Target Platform**: Modern Desktop Web Browsers (Chrome, Edge, Safari, Firefox)

**Project Type**: Angular 18 Web Application (Single-Page)

**Performance Goals**: 
- Initial paint under 1.0 second
- Tab swapping and search filtering: Instant (<50ms)
- Subscription period generation: Immediate (<50ms)
- Submitted period date verification and validation: Instant

**Constraints**:
- Fully functional CRM Deal Studio wizard with three screen states in a single page flow
- Strict date validations (no gaps, overlaps, or invalid ranges)
- Use of Tailwind CSS utility classes for layout, styling, and interactions (hover, active, disabled)

**Scale/Scope**:
- 1 Landing Opportunity view component
- 1 Catalog product selection view component with Cart slide-out drawer
- 1 Double-tab Quote configuration view component with period ramp grids

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Status | Notes |
|:---|:---|:---|
| I. Library-First | Pass | Date calculations and validation logic will be housed in isolated, pure-TypeScript utility modules. |
| II. CLI / Protocol | Pass | Not applicable to this frontend web application; internal state protocols are clean JSON structures. |
| III. Test-First | Pass | Test cases for components, services, and period calculations will be defined using Jasmine/Karma. |
| IV. Simplicity | Pass | Single-responsibility Angular components and standard Tailwind styling utilities. |

## Project Structure

We are utilizing a standard Angular workspace layout configured with Tailwind CSS:

```text
/
├── angular.json                # Angular workspace configuration
├── package.json                # Project dependencies, scripts, and configuration
├── tailwind.config.js          # Tailwind CSS style definitions and content paths
├── tsconfig.json               # TypeScript base configuration
├── src/
│   ├── index.html              # Main HTML container
│   ├── main.ts                 # Bootstrap file for the Angular application
│   ├── styles.css              # Global styles importing Tailwind directives
│   ├── app/
│   │   ├── app.config.ts       # Global providers (routing, animations, HTTP)
│   │   ├── app.routes.ts       # Application routing configuration
│   │   ├── app.component.ts    # Main application root component
│   │   ├── components/
│   │   │   ├── opportunity-list/   # Angular component for opportunity landing page
│   │   │   ├── product-catalog/    # Angular component for product discovery and cart drawer
│   │   │   └── quote-wizard/       # Angular component for quote configuration and period generation
│   │   ├── services/
│   │   │   ├── crm.service.ts      # Shared service for Opportunity / Product / Quote mock APIs
│   │   │   └── period.service.ts   # Shared service for Yearly/Custom period date calculations
│   │   └── utils/
│   │       └── date-utils.ts       # Pure TS functions for date validation, gaps, and overlaps
└── specs/
    └── 001-quote-subscription-flow/
        ├── spec.md             # Functional requirements document
        ├── plan.md             # This implementation plan
        ├── research.md         # Research on split periods and date mathematics
        ├── data-model.md       # Data definitions and mock CRM schemas
        └── contracts/
            └── api.md          # Mock HTTP request/response payloads
```

**Structure Decision**: A standard Angular structure keeps our components isolated, type-safe, and highly maintainable, while Tailwind CSS handles styling without writing custom CSS classes.

## Complexity Tracking

*No violations detected. Structure follows the simplest possible path for a high-fidelity interactive wizard.*
