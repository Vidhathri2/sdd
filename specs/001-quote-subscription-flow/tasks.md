# Tasks: Quote Creation & Subscription Period Configuration Flow (Angular & Tailwind CSS)

**Input**: Design documents from `/specs/001-quote-subscription-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested for the TDD approach (T008, T009, T011, T013, T015, T017).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: Angular 18 project folders starting from `src/` at the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tailwind CSS installation and configuration in the Angular 18 workspace.

- [ ] T001 Install Tailwind CSS and its peer dependencies in package.json
- [ ] T002 Configure Tailwind content paths in tailwind.config.js
- [ ] T003 Add Tailwind CSS directives into src/styles.css
- [ ] T004 Verify tailwind installation by adding test classes in src/app/app.component.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core routing, date utilities, and mocked CRM service.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Setup Angular routing structure in src/app/app.routes.ts
- [ ] T006 Implement pure date validation helper functions in src/app/utils/date-utils.ts
- [x] T007 [P] Implement CrmService mock logic in src/app/services/crm.service.ts
- [ ] T008 Write Jasmine unit tests for date validation helper functions in src/app/utils/date-utils.spec.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Opportunity List & Product Selection (Priority: P1) 🎯 MVP

**Goal**: Opportunity list, search filter, action menu hover trigger, product catalog discovery, and right cart slide-out drawer.

**Independent Test**: Navigate to `/opportunities`, search for opportunities, hover/click three dots, click "Create Quote", verify navigation to `/select-products`, search and filter products, click "Add Product" and verify cart drawer updates and opens.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Write Jasmine unit tests for OpportunityListComponent in src/app/components/opportunity-list/opportunity-list.component.spec.ts
- [ ] T011 [P] [US1] Write Jasmine unit tests for ProductCatalogComponent in src/app/components/product-catalog/product-catalog.component.spec.ts

### Implementation for User Story 1

- [x] T010 [US1] Implement OpportunityListComponent HTML/TypeScript template using Tailwind in src/app/components/opportunity-list/opportunity-list.component.ts
- [ ] T012 [US1] Implement ProductCatalogComponent HTML/TypeScript template using Tailwind in src/app/components/product-catalog/product-catalog.component.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Quote Details Configuration (Priority: P2)

**Goal**: Tab 1 Details screen displaying Quote details (Prefilled contact, channel) and Subscription details (picklists and manual date selection).

**Independent Test**: From cart, click Continue, see quote dashboard Tab 1, select date ranges, check date validation rules, switch tabs and see dates synced.

### Tests for User Story 2
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US2] Write Jasmine unit tests for QuoteDetailsTabComponent in src/app/components/quote-wizard/quote-details-tab/quote-details-tab.component.spec.ts

### Implementation for User Story 2

- [ ] T014 [US2] Implement QuoteDetailsTabComponent HTML/TypeScript template with reactive forms in src/app/components/quote-wizard/quote-details-tab/quote-details-tab.component.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Subscription Period & Discount Configuration (Priority: P3)

**Goal**: Tab 2 Plans & Discounts screen, generating yearly or custom periods in accordion grid, child product quantity/discount configuration, child license validations, and quote submission.

**Independent Test**: Switch to Tab 2, click create periods modal, input looker child info, hit submit, check database state update and success toast.

### Tests for User Story 3
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US3] Write Jasmine unit tests for PeriodService date division in src/app/services/period.service.spec.ts
- [ ] T017 [P] [US3] Write Jasmine unit tests for QuotePlansTabComponent in src/app/components/quote-wizard/quote-plans-tab/quote-plans-tab.component.spec.ts

### Implementation for User Story 3

- [ ] T016 [US3] Implement PeriodService yearly/custom splitting logic in src/app/services/period.service.ts
- [ ] T018 [US3] Implement QuotePlansTabComponent HTML/TypeScript template with accordion grid in src/app/components/quote-wizard/quote-plans-tab/quote-plans-tab.component.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T019 Run all Jasmine/Karma unit tests to verify 100% success rate
- [ ] T020 Perform manual E2E validation scenarios defined in specs/001-quote-subscription-flow/quickstart.md
- [ ] T021 Add Tailwind UI transitions and micro-animations to improve aesthetic quality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1:
Task: "Write Jasmine unit tests for OpportunityListComponent in src/app/components/opportunity-list/opportunity-list.component.spec.ts"
Task: "Write Jasmine unit tests for ProductCatalogComponent in src/app/components/product-catalog/product-catalog.component.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
