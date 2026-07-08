# Feature Specification: Quote Creation & Subscription Period Configuration Flow
 
**Feature Branch**: `001-quote-subscription-flow`
 
**Created**: 2026-07-06
 
**Status**: Ready for Implementation
 
---
 
## 1. Executive Summary & Architecture
 
This feature delivers an integrated sales wizard that allows sales representatives to create quotes from active CRM opportunities, choose product bundles (specifically Google Cloud Platform and Looker Core), define subscription contract dates and billing schedules, and partition the contract term into annual or custom periods.
 
### System Flow & Navigation
The overall configuration flow spans three distinct stages, diagrammed below:
 
```mermaid
graph TD
    A[Opportunity Landing Page] -->|Hover & Click 'Create Quote'| B[Product Selection Catalog]
    B -->|Select GCP/Looker & Open Cart| C[Cart Drawer Pane]
    C -->|Click 'Continue'| D[Configure Quote: Details Tab]
    D -->|Define Dates & Billing Freq| E[Configure Quote: Plans & Discounts Tab]
    E -->|Click '+ Create subscription periods'| F[Choose Period Frequency Modal]
    F -->|Generate & Populate Ramps| G[Final Quote Submission]
```
 
---
 
## 2. Detailed Functional Specifications
 
### Phase 1: Opportunity List & Navigation
The Opportunity List is the entry page of the **Deal Studio** workspace. It provides a tabular overview of sales opportunities in the organization.
 
**UI Structure (Landing Page):**
- **Header**: Contains the "Deal Studio" title on the left, a "Search" input field in the middle, and status/profile icons on the right.
- **Main Content**: A structured table titled "Opportunities" displaying active opportunity records. Columns include: `Checkbox`, `Opportunity Name` (sortable), `Account Name`, `Owner`, `Amount`, `Close Date`, and an `Action Menu` (`⋮`).
- **Footer (Pagination)**: `Rows per page` selector (defaults to `5`), Range and Total indicator, and Pagination navigation buttons.
 
**Interaction & Behavior:**
- **Paginated Loading**: Fetches all opportunity records and paginates them (5 per page by default).
- **Action Menu & Quote Ingress**: The action menu on hover provides a **Create Quote** button. Clicking this takes the user to the Product Selection page, caching the Opportunity ID and associated Account Name in session state.
 
**Data Dictionary & Validation:**
- **Search bar**: Real-time keyword filter on Opportunity list.
- **Rows per page**: Options are `5`, `10`, `15`, `20`.
 
**Edge Cases:**
- *No Opportunities Found*: Display "No opportunities found. Please create an opportunity to start."
- *Network/API Timeout*: Display a red warning toast "Failed to load opportunities. Please refresh the page."
 
### Phase 2: Product Selection & Discovery
Allows sales representatives to discover product bundles, filter them by family, and add them to a cart before creating a formal quote.
 
**UI Structure (Catalog & Cart):**
- **Header**: `← Select products` and full-width search input field.
- **Left Sidebar**: "Product family" filter panel (`GCP`, `Workspace`, `Chrome`, `Maps`, `PSO`).
- **Right Main Panel**: Grouped list of available product bundles showing a title header and individual product cards.
- **Product Card**: Group Header, Product Icon & Label, and `+ Add` button.
- **Cart View (Right Slide-out Drawer)**: Shows `Added products`, list of selected products, and a solid blue `Continue` button.
 
**Interaction & Behavior:**
- **Filtering & Search**: Keyword search filters product cards dynamically. Sidebar filtering limits the view (e.g., selecting `GCP` shows only GCP and Looker Core bundles).
- **Cart Lifecycle**: Clicking `+ Add` slides out the cart drawer, updates the card to `✓ Added`, and adds the item to the cart. Clicking `Continue` validates the cart, creates a Quote record pre-associated with the Opportunity, copies products to Quote Line Items, and navigates to Quote Details.
 
**MVP Scope Constraints:**
Under this MVP, the system strictly supports configuration for the following core product bundles: **Google Cloud Platform (Commit)** and **Looker Core (Subscription)**.
 
**Edge Cases:**
- *Empty Search Results*: Display "No products match your search. Try a different keyword."
 
### Phase 3: Quote Details & Subscription Periods Flow
A split, double-tab interface where the quote properties and temporal ramp schedules are defined and configured.
 
**UI Structure:**
- **Top Bar**: Account info, tabbed interface (`Quote 1`), and actions (`Preview approval`, `Create contract`). Sub-header shows Quote Number, Configured Product, Contract Details, Total Value.
- **Tab 1 - Details**:
  - **Quote Details Section**:
    - `Primary contact`: Will be prefilled from the opportunity.
    - `Sales Channel`: Will be prefilled from the opportunity.
    - `Operation Type`: Defaults to `New`.
    - `Quote Expiration Date`: Defaults to 45 days from creation.
  - **Subscription Details Section**:
    - `Billing Frequency`: Picklist values will be fetched from the API call, and a default value will be prefilled.
    - `Term Starts on`: Picklist values will be fetched from the API call, and a default value will be prefilled.
    - `Term Start Date`: User must manually select.
    - `Term End Date`: User must manually select.
  - **Payment Account Card**: Displays primary account details.
- **Tab 2 - Plans & Discounts**:
  - `Subscription Start Date` and `Subscription End Date`: Filled from Tab 1. If changed here, the corresponding values in Tab 1 will automatically update to match.
  - **Empty State**: Displays a `+ Create subscription periods` button.
  - **Ramp Panel Grid**: Shows collapsible generated periods. Configured rows include:
    - **Platform Child Products**: This category contains 3 child products. Only one platform product can be selected per period. Selecting a platform product from the dropdown is mandatory to proceed with configurations.
    - **Users Child Products**: Includes Standard User, Developer User, and Viewer User.
    - **Non-prod**: Contains 3 child products, but they are displayed as a single row dynamically populated based on the selected platform product.
    - **Attributes per row**: Quantity, Region, GCP Project ID, Looker Instance ID, and Discount.
    - **Inclusion Rule**: Only rows with a quantity greater than 0 will be added to the final quote.
- **Footer Buttons**: `Cancel`, `Save`, `Submit` (disabled until periods are configured).
 
**Interaction & Behavior:**
- **Quote Details Autofill**: `Primary contact` and `Sales Channel` are autofilled via the Opportunity API hook.
- **Period Configuration Generation**:
  - **Yearly**: Calculates the term duration in months and generates N periods (maximum 1 year duration each), bounded by overall term dates sequentially.
  - **Custom**: Allows selecting a specific month duration (e.g., 18 months, 24 months, etc.) and the number of periods accordingly. For example, if a 13-month duration is initially selected, the first period will be created with exactly 12 months, and the second period will cover the remaining 1 month.
  - **Add Period**:
    - For Yearly configurations: Automatically creates a new period appending to the existing periods with a 12-month duration gap, updating the overall `Subscription End Date` automatically.
    - For Custom configurations: Allows adding a period manually by selecting custom start and end dates.
- **Ramp Table Validation Rules**: If a child product quantity > 0, `Region`, `GCP Project ID`, and `Looker Instance ID` are mandatory. The final date of the last period must exactly match the overall `Subscription End Date`. No gaps or overlaps between periods are permitted.
- **Submission**: Clicking the "Submit" button triggers a POST API call that updates the current quote with all configured period details.
 
**Edge Cases:**
- *Mismatch in Term Dates*: Display "Period dates must be contiguous. Please correct the gaps."
- *Submit with Unfilled Mandatory Row Info*: Display "GCP Project ID is required when quantity is greater than 0."
- *Term Date Shift Reset*: If Term Start Date in Tab 1 changes after periods are configured, prompt "Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?"
 
---
 
## 3. Integration & State Management
 
### Context Passing Lifecycle
- Navigating Opportunity List -> Product Selection: `Opportunity ID` and `Account Name` must be retained in session state.
- Clicking `Continue` in the cart creates a draft Quote record on the server:
  ```json
  {
    "opportunityId": "opp-98124",
    "status": "Draft",
    "configuredProducts": ["Looker Core"]
  }
  ```
- The UI navigates to `/configure-quote/{quoteId}`.
- Switching between `Details` and `Plans & Discounts` tabs must retain unsaved client-side states in memory without server calls.
 
### Date Sync Rules
- `Subscription Start Date` and `Subscription End Date` under `Plans & Discounts` tab dynamically update to reflect inputs from `Details` tab (`Term Start Date`, `Term End Date`), and vice versa.
 
---
 
## 4. Data Flow & Success Criteria
 
### Key Entity Mapping
```mermaid
erDiagram
    OPPORTUNITY ||--o{ QUOTE : creates
    QUOTE ||--|{ SUBSCRIPTION_PERIOD : contains
    SUBSCRIPTION_PERIOD ||--|{ QUOTE_LINE_ITEM : configures
```
 
### Business Success Metrics
- **SC-001**: End-to-end configuration (Opportunity -> Product -> Period Ramp -> Submit) must take under 3 minutes.
- **SC-002**: Page loading speeds for the catalog and details tabs must remain below 1.5 seconds.
- **SC-003**: Subscription period date splits must calculate immediately (under 500ms) upon clicking Create.
- **SC-004**: No gaps or overlaps can exist in the final submitted period dates.
 
---
 
## 5. Technical Requirements & Integrations
 
- **Salesforce REST APIs Integration**: Salesforce REST APIs **must be used as the definitive source of truth** for Opportunities, Bundle Products, and Looker Child Products. This is a strict technical requirement, not an assumption. All CRM data fetching, including opportunity state, contacts, and account details, will rely directly on these APIs.
- **API Authentication & Access Token**: Before fetching opportunities, an access token must be used and stored in session storage. This token will be utilized for all API calls made within the application. Currently, the access token will be hardcoded for every 2 hours.
- **Term Duration Rule**: The total term must represent a clean monthly term (e.g. 12, 24, 36 months) to ensure clean division into yearly periods.
 
 