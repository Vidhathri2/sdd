# Implementation Plan: Quote Creation & Subscription Period Configuration Flow

**Branch**: `001-quote-subscription-flow` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-quote-subscription-flow/spec.md`

## Summary

This feature delivers an integrated sales wizard ("Deal Studio") that enables sales reps to create quotes from active opportunities, select product bundles (GCP and Looker Core), configure subscription details, and partition the contract term into annual or custom periods. We will implement this as a high-fidelity, responsive Single Page Application (SPA) using vanilla HTML, CSS, and modern JavaScript, structured and bundled using Vite.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES6+)

**Primary Dependencies**: 
- `vite` (v5.x) - Dev server and build tool
- `lucide` (icons) - For high-quality UI icons
- `vitest` (v1.x) - For unit testing validation rules and period splitting logic

**Storage**:
- Browser `sessionStorage` - For opportunity context caching
- Browser `localStorage` - For persistent mock Quote database

**Testing**: 
- `vitest` for business logic (date splitting calculations, validations)
- Manual high-fidelity UX validation

**Target Platform**: Modern Desktop Web Browsers (Chrome, Edge, Safari, Firefox)

**Project Type**: Vanilla Frontend Single Page Application

**Performance Goals**: 
- Initial paint under 1.0 second
- Tab swapping and search filtering: Instant (<50ms)
- Subscription period generation: Immediate (<50ms)
- Submitted period date verification and validation: Instant

**Constraints**:
- Fully functional CRM Deal Studio wizard with three screen states in a single page flow
- Defaults to CAD currency
- Strict date validations (no gaps, overlaps, or invalid ranges)

**Scale/Scope**:
- 1 Landing Opportunity view
- 1 Catalog product selection view with Cart slide-out
- 1 Double-tab Quote configuration view with period ramp grids

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Status | Notes |
|:---|:---|:---|
| I. Library-First | Pass | Date calculations and validation logic will be housed in isolated, pure-JS utility modules. |
| II. CLI / Protocol | Pass | Not applicable to this frontend web application; internal state protocols are clean JSON structures. |
| III. Test-First | Pass | Test cases for period date calculations and validation logic will be defined in `vitest`. |
| IV. Simplicity | Pass | Pure vanilla JS and CSS to avoid framework bloat and keep page transitions instant. |

## Project Structure

We are utilizing a Single Project Vite-based structure at the workspace root to ensure simple build, hot-reload, and high-fidelity rendering.

```text
/
├── index.html                  # Main application entry point
├── package.json                # Project configuration & scripts
├── vite.config.js              # Vite bundler config
├── src/
│   ├── main.js                 # App router, global event routing, and state manager
│   ├── style.css               # Premium design system, tokens, and global layout classes
│   ├── components/
│   │   ├── opportunity-list.js # Deal Studio opportunity table & pagination component
│   │   ├── product-catalog.js  # Discovery sidebar filters, product list, and cart drawer
│   │   └── quote-wizard.js     # Details tab, Plans & Discounts tab, and period generator
│   ├── services/
│   │   ├── db-service.js       # LocalStorage CRM database wrapper
│   │   └── period-service.js   # Pure logic for yearly/custom period date calculations
│   └── utils/
│       ├── date-utils.js       # Date formatting, comparison, and addition helpers
│       └── dom-utils.js        # DOM creation and selector utilities
└── tests/
    ├── period-service.test.js  # Unit tests for yearly date dividing logic
    └── date-utils.test.js      # Unit tests for date comparison & overlap rules
```

**Structure Decision**: A single Vite-based project in the workspace root allows us to compile Vanilla CSS and JS files, run a dev server with hot module replacement, and output a highly optimized production bundle.

## Complexity Tracking

*No violations detected. Structure follows the simplest possible path for a high-fidelity interactive wizard.*
