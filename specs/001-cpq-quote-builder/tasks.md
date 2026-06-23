# Tasks: Deal Studio CPQ Quote Builder

**Input**: Design documents from `/specs/001-cpq-quote-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish folders, config, and core environment support for Salesforce integration.

- [X] T001 Create the server-side API folder structure in `app/api/auth/` and `app/api/salesforce/`
- [X] T002 Create the UI page file structure in `app/` for login, opportunities, products, and quote flows
- [X] T003 Create the Salesforce helper library files in `lib/salesforce/auth.ts`, `lib/salesforce/opportunities.ts`, `lib/salesforce/products.ts`, and `lib/salesforce/quotes.ts`
- [X] T004 Create shared type definitions in `lib/types.ts` for Opportunity, Account, Product, QuoteDraft, CommitmentPeriod, and QuoteSummary
- [X] T005 [P] Update `.env.example` with all required Salesforce configuration variables: `SF_USERNAME`, `SF_PASSWORD`, `SF_SECURITY_TOKEN`, `SF_CONSUMER_KEY`, `SF_CONSUMER_SECRET`, and `SF_INSTANCE_URL`
- [X] T006 [P] Confirm `specs/001-cpq-quote-builder/quickstart.md` documents local setup and validation steps

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement authentication, session management, and server-side Salesforce API routes required by all stories.

- [X] T007 Implement session management helpers in `lib/session.ts` to read, validate, and clear auth cookies
- [X] T008 Implement Salesforce username-password authentication in `lib/salesforce/auth.ts`
- [X] T009 Remove browser OAuth login route and use server-side Salesforce auth instead
- [X] T010 Remove OAuth callback route and session-cookie-based auth flow
- [X] T011 [P] Implement `app/api/salesforce/opportunities/route.ts` to proxy Opportunity queries to Salesforce for authenticated users
- [X] T012 [P] Implement `app/api/salesforce/products/route.ts` to proxy CPQ product queries, supporting optional `family` and `search` filters
- [X] T013 [P] Implement `app/api/salesforce/quotes/route.ts` to accept quote draft payloads and create a quote draft or Salesforce quote record
- [X] T014 [P] Add authorization validation to all `app/api/salesforce/*` routes so requests fail with `401 Unauthorized` when the session is missing or invalid

---

## Phase 3: User Story 1 - Salesforce login and opportunity access (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to sign in with Salesforce and reach the Opportunities list.

**Independent Test**: Launch the app, click login, complete Salesforce OAuth, and verify redirection to the Opportunities page.

- [X] T015 [US1] Implement `app/login/page.tsx` with a Salesforce login button and redirect to `/api/auth/login`
- [X] T016 [US1] Implement `app/opportunities/page.tsx` to fetch `/api/salesforce/opportunities` and navigate authenticated users into the app flow
- [X] T017 [US1] Add session-aware browser redirect handling in `app/opportunities/page.tsx` so unauthenticated requests navigate back to `app/login/page.tsx`
- [X] T018 [US1] Implement an opportunity empty-state display in `app/opportunities/page.tsx` when Salesforce returns no opportunities
- [X] T019 [US1] Ensure `app/api/auth/callback/route.ts` redirects to `/opportunities` after successful OAuth

---

## Phase 4: User Story 2 - Opportunities list landing page (Priority: P1)

**Goal**: Display a live Opportunities table with a Create Quote action for each row.

**Independent Test**: Log in, load the landing page, confirm table data appears, and verify Create Quote is present.

- [X] T020 [US2] Implement `components/OpportunityTable.tsx` to render Opportunity Name, Account Name, Owner, Amount, Close Date, and a Create Quote action
- [X] T021 [US2] Wire `components/OpportunityTable.tsx` into `app/opportunities/page.tsx`
- [X] T022 [US2] Ensure the Create Quote action navigates to `app/products/page.tsx?opportunityId=<id>`
- [X] T023 [US2] Add error handling in `app/opportunities/page.tsx` for Salesforce API failures
- [X] T024 [US2] Confirm the Opportunities page uses live Salesforce data and does not fall back to a local mock catalog

---

## Phase 5: User Story 3 - Select Products page (Priority: P1)

**Goal**: Let users select products from Salesforce CPQ catalog and continue only after products are added.

**Independent Test**: From Opportunities, click Create Quote, filter and search products, add at least one product, and continue.

- [X] T025 [US3] Implement `app/products/page.tsx` to read `opportunityId` from the URL and display it in context
- [X] T026 [US3] Implement product family filtering in `app/products/page.tsx` using `components/ProductFamilySidebar.tsx`
- [X] T027 [US3] Implement keyword search for CPQ products in `app/products/page.tsx`
- [X] T028 [US3] Implement `components/AddedProductsPanel.tsx` and show selected products as they are added
- [X] T029 [US3] Ensure the Continue button in `app/products/page.tsx` is disabled until at least one product is selected
- [X] T030 [US3] Implement navigation from `app/products/page.tsx` to `app/quote/page.tsx` with selected products preserved in the demo flow

---

## Phase 6: User Story 4 - Configure Quote page (Priority: P1)

**Goal**: Present quote metadata, tabs, commitment periods, and Salesforce-backed summary data.

**Independent Test**: Add products, open Configure Quote, verify metadata, tabs, and summary fields.

- [X] T031 [US4] Implement `app/quote/page.tsx` to display Account name, Quote Number, Quote Name, and `View in Salesforce` deep link
- [X] T032 [US4] Implement `components/QuoteDetailsTab.tsx` for the Details tab with Sales Channel, Quote Start Date, Quote Expiration Date, and Primary Contact
- [X] T033 [US4] Implement a Discounts and Incentives tab placeholder in `app/quote/page.tsx`
- [X] T034 [US4] Implement `components/CommitPeriodSection.tsx` with a stepper, Period (months) and Amount fields, and Add Commit Period action
- [X] T035 [US4] Implement `components/BillingSummaryPanel.tsx` showing Contract Start Date, Term, Payment Account, Billing Account, Billing Account ID, Billing Address, and Billing Currency
- [X] T036 [US4] Implement a `Preview Approval` button placeholder in `app/quote/page.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, and cross-story consistency.

- [X] T037 [P] Update `specs/001-cpq-quote-builder/quickstart.md` to reflect the final app discovery and validation flow
- [X] T038 [P] Update `specs/001-cpq-quote-builder/contracts/api.md` with any final route or payload contract details discovered during implementation
- [X] T039 [P] Document final environment and session requirements in `.env.example` and `specs/001-cpq-quote-builder/quickstart.md`
- [X] T040 [P] Verify all feature routes and pages use server-side Salesforce integration only and do not expose credentials client-side
- [X] T041 [P] Clean up any placeholder UI text and confirm the app meets the POC success criteria from the feature spec

---

## Dependencies & Execution Order

- Phase 1: Setup tasks can start immediately.
- Phase 2: Foundational tasks block user story implementation until complete.
- Phase 3+: User story phases can proceed after foundational completion.
- Phase 7: Polish depends on all user stories and foundational infrastructure being complete.

## Parallel Opportunities

- `T005`, `T006`, `T013`, `T014`, `T037`, `T038`, `T039`, `T040`, and `T041` can run in parallel because they are documentation, config, or independent route validation tasks.
- `T011`, `T012`, and `T013` can be implemented in parallel after authentication route support exists.
- Story-specific component work such as `T020`/`T021` and `T026`/`T027` can proceed in parallel by separate developers once the core pages exist.
