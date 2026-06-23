# Feature Specification: Deal Studio CPQ Quote Builder

**Feature Branch**: `001-cpq-quote-builder`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Build Deal Studio, a web app that authenticates server-side using Salesforce username-password credentials, shows Opportunity data, and lets users build CPQ Quotes through a custom UI.

## Clarifications

### Session 2026-06-22
- Q: Should the Select Products page use live Salesforce CPQ product records or a seeded mock catalog? → A: Use live Salesforce CPQ product records directly.
- Q: Should the Configure Quote page Details tab include a full CPQ details sheet or a minimal form? → A: Full CPQ details sheet, but no incentive/discount fields yet.
- Clarification status: complete.

## User Scenarios & Testing

### User Story 1 - Salesforce login and opportunity access (Priority: P1)
A sales rep must authenticate to the connected Salesforce org before seeing any Deal Studio content.

**Why this priority**: Without authentication, the app cannot read Opportunity data or build quotes, so this is the foundational entry point for the demo.

**Independent Test**: Launch the app, open the app, verify server-side Salesforce authentication succeeds, and confirm redirection to the Opportunities landing page.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor, **when** they load the app, **then** they are prompted to sign in through the server-side Salesforce authentication flow.
2. **Given** the app successfully authenticates with Salesforce server-side, **when** the session is established, **then** the user is redirected to the Opportunities list.
3. **Given** the user has valid access, **when** they revisit the app, **then** they land on the Opportunities list without re-authenticating.

---

### User Story 2 - Opportunities list landing page (Priority: P1)
A logged-in user must see a live Opportunities table with actionable quote creation.

**Why this priority**: This page is the primary entry point for the quote workflow and demonstrates live Salesforce data integration.

**Independent Test**: Log in, load the landing page, confirm the opportunity table is populated, and verify the Create Quote action is available on each row.

**Acceptance Scenarios**:
1. **Given** a logged-in user, **when** they arrive at the landing page, **then** they see an Opportunities table with columns: Opportunity Name, Account Name, Owner, Amount, Close Date.
2. **Given** the table is displayed, **when** an opportunity row is rendered, **then** it includes an action menu with a "Create Quote" option.
3. **Given** the user selects "Create Quote", **when** the action is clicked, **then** the app navigates to the Select Products page with the Opportunity ID in context.

---

### User Story 3 - Select Products page (Priority: P1)
After selecting an opportunity, the user chooses products to add to a new quote.

**Why this priority**: Product selection is the core of quote creation and enables the demonstration of CPQ product configuration.

**Independent Test**: From the Opportunities page, click Create Quote, filter products by family, search products, add at least one product, and continue.

**Acceptance Scenarios**:
1. **Given** the user clicked Create Quote, **when** the Select Products page loads, **then** the Opportunity ID appears in the URL context.
2. **Given** the Select Products page is visible, **when** a product family filter is selected, **then** the product list updates to only show products from that family.
3. **Given** the user types keywords into the search bar, **when** they search, **then** the product list is filtered by matching product names.
4. **Given** the user clicks Add on a product, **then** the product appears in the Added Products panel.
5. **Given** at least one product has been added, **when** the user clicks Continue, **then** the app navigates to the Configure Quote page.

---

### User Story 4 - Configure Quote page (Priority: P1)
The user refines quote details, sees quote metadata, and can move forward with quote preparation.

**Why this priority**: This page demonstrates the quote assembly flow and provides the most visible CPQ preview experience in the POC.

**Independent Test**: Add one or more products, continue to Configure Quote, verify quote metadata, and see the tabs and actions described.

**Acceptance Scenarios**:
1. **Given** products were selected, **when** the Configure Quote page loads, **then** the header shows Account name and a website link.
2. **Given** the page is visible, **when** it renders the quote area, **then** it shows a tab strip of quotes with an option to add another quote.
3. **Given** the page includes quote metadata, **when** the quote is generated, **then** it displays an auto-generated Quote Number and a default Quote Name.
4. **Given** a quote is present, **when** the user views the page, **then** a "View in Salesforce" link is present and deep-links to the Salesforce record.
5. **Given** the Configure Quote page is rendered, **when** the user selects the Details tab, **then** the Primary Contact lookup/dropdown field is visible and additional quote-level metadata fields are available.
6. **Given** the Configure Quote page is rendered, **when** the user selects the Discounts and Incentives tab, **then** that tab content area is available and may start as a placeholder without discount capture fields.
7. **Given** the Configure Quote page is rendered, **when** the page loads, **then** a "Preview Approval" button is visible in the top right and may show a placeholder state when clicked.
8. **Given** the Configure Quote page is rendered, **when** the Total Commitment Period section is present, **then** it includes a stepper to set the number of commit periods, and for each period it shows Period (months) and Amount fields plus an Add Commit Period action.
9. **Given** the Configure Quote page is rendered, **when** the summary panel is visible, **then** it shows read-only Contract Start Date, Term, Payment Account, Billing Account, Billing Account ID, Billing Address, and Billing Currency sourced from Salesforce.
10. **Given** the Details tab is visible, **when** the user inspects fields, **then** Sales Channel (dropdown), Quote Start Date, Quote Expiration Date, and Primary Contact are all shown.

### Edge Cases
- What happens if OAuth succeeds but the Salesforce org has no accessible Opportunity records? The app should show a friendly empty state on the Opportunities page.
- What happens if a product family filter has no matching products? The product list should show an empty message rather than a blank container.
- What happens if the user returns to the Select Products page with no products selected? The Continue button should be disabled until products are added.

## Requirements

### Functional Requirements
- **FR-001**: The app MUST require successful Salesforce authentication before any Opportunity or quote UI is visible.
- **FR-002**: The app MUST display a live Opportunities table using Salesforce data.
- **FR-003**: Each Opportunity row MUST provide a "Create Quote" action that initiates quote creation.
- **FR-004**: The app MUST support a Select Products flow with product family filtering.
- **FR-005**: The app MUST support keyword search within the product list.
- **FR-006**: The app MUST allow selected products to be reviewed in an Added Products panel.
- **FR-007**: The app MUST allow the user to continue from Select Products only after products are selected.
- **FR-008**: The Configure Quote page MUST display quote metadata including Account name, website, Quote Number, Quote Name, and Salesforce deep link.
- **FR-009**: The Configure Quote page MUST present Details and Discounts and Incentives tabs.
- **FR-010**: The Details tab MUST include Primary Contact plus other quote-level metadata fields; the Discounts and Incentives tab may start as a placeholder without discount capture fields.
- **FR-011**: The app MUST source product information live from Salesforce CPQ product records, not from a local mock catalog.
- **FR-012**: The app MUST separate Salesforce integration logic from UI components.
- **FR-013**: The Configure Quote page MUST include a "Total Commitment Period" section with a stepper to set the number of commit periods, and for each period, a Period (months) field and an Amount field, plus an "Add Commit Period" action.
- **FR-014**: The Configure Quote page MUST include a read-only summary panel showing Contract Start Date, Term, Payment Account, Billing Account, Billing Account ID, Billing Address, and Billing Currency, sourced from the related Salesforce Account/Opportunity record.
- **FR-015**: The Configure Quote page MUST include a "Preview Approval" button (top right). For this POC it can show a placeholder/non-functional state on click.
- **FR-016**: The Details tab MUST include Sales Channel (dropdown), Quote Start Date, and Quote Expiration Date as individual fields, alongside Primary Contact.
- **FR-017**: The app MUST use environment variables for all Salesforce credentials and configuration.
- **FR-018**: The app MUST use server-side Next.js API routes for all Salesforce calls.

### Key Entities
- **Opportunity**: Represents a Salesforce Opportunity, including `Id`, `Name`, `Account Name`, `Owner`, `Amount`, and `Close Date`.
- **Product**: Represents a CPQ product offering, including `Name`, `Product Family`, and selection state.
- **Quote**: Represents a quote draft with metadata such as Quote Number, Quote Name, selected products, and Salesfoce record deep link.
- **Account**: Represents the Salesforce account associated with an opportunity, including `Name` and `Website`.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Authenticated users can reach the Opportunities landing page in one click after server-side Salesforce authentication completes.
- **SC-002**: The Opportunities page loads live Salesforce Opportunity data in under 5 seconds for a demo org.
- **SC-003**: Users can select at least one product and successfully navigate to Configure Quote from the Select Products page.
- **SC-004**: The Configure Quote page displays quote metadata and a working Salesforce deep link for the selected opportunity/quote.
- **SC-005**: The app keeps Salesforce credentials out of browser code and uses server-side routes for all Salesforce API requests.

## Assumptions
- Salesforce OAuth will be available through a Connected App and the demo org has valid Opportunity and Account data.
- The POC does not need full CPQ pricing calculations, product rules, or quote approval workflows.
- Product catalog data will be sourced live from Salesforce CPQ product records.
- The Discounts and Incentives tab may be present as a placeholder in the POC, with discount capture deferred.
- The demo should focus on a working browser flow and not on extensive error recovery.
- The app is a standalone Next.js web application and not embedded inside Salesforce.
