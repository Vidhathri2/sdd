# Sub-Feature Specification: Quote Details & Subscription Periods Flow (Subscription Flow)

**Part of Feature**: `001-quote-subscription-flow`
**Component**: `SubscriptionFlowComponent` (formerly `QuoteWizardComponent`)

---

## 1. User Interface & Layout

The Subscription Flow page is a full-screen, viewport-height bounded page layout (`h-screen overflow-hidden`) matching the Opportunity List styling. The interface features a Salesforce-style light theme with a light grey background (`#f0f2f5`) and clean typography (Inter). It consists of a fixed card container that fits the entire screen width, with scrollable content columns using browser-native smooth scrolling (`scroll-smooth`).

### Page Header & Actions
- **Top Bar**: Shows the account logo/info (circular folder icon, account name) on the left, a tabbed document interface, and top-right actions:
  - `Preview approval` (outlined button with a user-card icon)
  - `Create contract` (solid blue button `bg-[#0f62fe]`)
- **Opportunity Reference**: Displays `Opportunity / Opportunity name` in small grey text in the top right corner.
- **Sub-header Details**:
  - Quote Number & Configured Product (e.g., `Q-1234 Looker Core` in large bold dark text on the left).
  - Details panel on the right (neatly aligned columns):
    - `Contract Start Date`: calculated date or `Upon provisioning`
    - `Term`: dynamic months duration or `0` initially
    - `Total Contract Value`: dynamic grand total value (bold text, summed across all periods)
- **Double Tabs**:
  - **Details**: Pre-filled CRM details, subscription inputs, and billing parameters.
  - **Plans & Discounts**: Period schedule generation and child product line item pricing.
- **Footer Buttons**:
  - `Cancel` (outlined)
  - `Preview` (outlined - triggers the Quote Preview Modal)
  - `Save` (outlined)
  - `Submit` (solid blue `bg-[#0f62fe]` - disabled until periods are configured)

---

### Tab 1: Details (Subscription & Quote Details)
Features a two-column layout: the left column contains the form fields grouped into Quote and Subscription details, and the right column houses the Payment Account card.

#### Left Column (Form Fields):
- **Quote details Section**:
  - `Primary contact`: Pre-filled from Opportunity.
  - `Sales Channel`: Dropdown. Defaults to `Direct`.
  - `Operation Type`: Dropdown. Defaults to `New`.
  - `Quote Expiration Date`: Date picker. Defaults to **45 days** from quote creation.
- **Subscription details Section**:
  - `Billing Frequency`: Dropdown. Defaults to `Annual in Advance Anniversary`.
  - `Term Starts on`: Dropdown. Defaults to `Fixed Start Date`.
  - `Term Start Date`: Date picker. Enabled when `Term Starts on` is `Fixed Start Date`. When `Term Starts on` is changed to `Upon Provisioning` or `Customer Signature Date`, `Term Start Date` is disabled, cleared, and the overall subscription start date is reset.
  - `Term End Date`: Date picker. Minimum value restricted to `Term Start Date` to block previous dates.

#### Right Column (Payment Account Card):
- **Payment Account Card**:
  - Bordered container with rounded corners and a soft shadow.
  - Header: **"Payment Account"** with an edit pencil icon.
  - `Primary` pill: Light purple background (`bg-purple-100 text-purple-700`) below the header.
  - Account Name: `XXX XXXXXX` (bold dark text).
  - `Billing Account` & `Payment Account ID`: `XXXXXX-XXXXXX-XXXXXXX`
  - `Billing Address`: `5920 Niagara River Parkway, Niagara Falls ON L2E 6X8 CA`
  - `Billing Currency`: `CAD`

---

### Tab 2: Plans & Discounts
- **Date Inputs**:
  - `Subscription Start Date` (Date picker, pre-filled from Term Start Date).
  - `Subscription End Date` (Date picker, pre-filled from Term End Date, restricted with `[min]="subscriptionStartDate"`).
- **Empty State**:
  - Centered blue button `+ Create subscription periods`.
  - Subtext: `You can choose to create yearly plans or for a custom period`.
- **Ramp Panel Grid**:
  - Generated periods are listed as collapsible card headers (`Period 1`, `Period 2`).
  - **Collapsed Period Header**: Shows Period name, start/end dates, a three-dot menu icon, and a chevron toggle.
  - **Expanded Period Panel**:
    - **Header Row**:
      - `Platform` product dropdown (displays dynamic platform components with price labels resolving dynamically from the 'Months' frequency pricing entry below it).
      - `Period Start date` & `Period End date`: input date fields. Styled with relative calendar icons and active borders. 
        - In **Yearly** mode: disabled (`[disabled]="true"`) with a grey background fallback.
        - In **Custom** mode: fully editable/enabled so the user can input dates manually. Recalculates total term dynamically on change.
        - Under End Date: Displays inclusive calendar-accurate duration label (e.g. `0M 19D (19 Days)`).
      - `Discount` input percentage.
    - **Child Products Table/Rows**:
      - Rows for Looker Core child products: **Standard User**, **Developer User**, **Viewer User**, and **Non-prod** (which changes dynamically based on the selected Platform).
      - Columns include: Product Label & Price (resolving dynamically from the API frequency pricebook entries), `Quantity`, `Region` (loaded from picklist options API), `GCP Project ID`, `Looker Instance Id`, and `Discount`.

---

## 2. Dynamic Bundle Hierarchy Mapping & Price Resolutions

### Dynamic Child Products Resolution
- During initialization, the component reads the dynamic `bundleHierarchy` object fetched from the Opportunity details API.
- In `getDynamicChildProducts`, it maps the four primary child items to the hierarchy components by checking if the component name includes key search tokens:
  - `Standard User` -> searches for `"Standard User"`
  - `Developer User` -> searches for `"Developer User"`
  - `Viewer User` -> searches for `"Viewer User"`
  - `Non-prod` -> searches for `"Nonprod"` or `"Non-prod"`
- In `onPeriodPlatformChange` (when the user selects/changes the Platform product in a period):
  - If a Standard platform is selected, the `Non-prod` child product automatically updates to the standard non-prod component catalog ID/code.
  - If an Enterprise or Premium platform is selected, the `Non-prod` child product updates to the enterprise non-prod component catalog ID/code.

### Base Price Resolutions
- For both Platform and Child products, base prices are resolved from the product component's `prices` array by matching the price entry where the `pricingModel.frequency` is exactly `"Months"` (or falling back to the default/first pricing entry if `"Months"` is missing).
- Display prices follow the format: `$X,XXX.XX / Month`.

---

## 3. Interaction & Behavior

### Screen Initialization & API Integrations
The component initiates a sequential loading cascade on load to resolve Quote parameters and option constraints:
- **Fetch Quote Details**: Calls `CrmService.getQuoteDetails()`, mapping to [Endpoint 8 (Fetch Initial Generated Quote Details)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#8-fetch-initial-generated-quote-details-get) to load root properties.
- **Load Bundle Line Items**: Calls `CrmService.getBundleQuoteLineItems()`, mapping to [Endpoint 9 (Load Active Bundle Quote Line Items)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#9-load-active-bundle-quote-line-items-get) to locate active Looker Core Bundle IDs.
- **Load Dropdown Picklists**: Calls `CrmService.getPicklists()`, mapping to [Endpoint 10 (Load Salesforce Form Picklists)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#10-load-salesforce-form-picklists-get) to fetch Billing Frequency, Term Starts On, Operation Types, and Regions.
- **Fetch Product Child Hierarchy**: Calls `CrmService.getProductDetails()`, mapping to [Endpoint 11 (Fetch PCM Bundle Child Hierarchy)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#11-fetch-pcm-bundle-child-hierarchy-get) to map platform and users component hierarchies.
- **Error Handling**: Propagates errors directly: if any API fails, mock fallbacks are avoided, and the UI throws/shows the error message via a toast warning.

### Period Configuration Generation
- **Yearly Frequency Logic**:
  - Generates N yearly periods bounded to a maximum duration of 1 year.
  - **Validation**: If the selected overall term is not exactly in years (multiple of 12 months, 0 remaining days), period creation is blocked and a toast message warning appears: `"For Yearly, you must select a duration of exact years."`
- **Custom Frequency Logic**:
  - Generates first period. Clicking `+ Add Period` appends a new empty period with blank dates, allowing the user to select them manually.
- **Ramp Table Validation Rules**:
  - Requires `Region`, `GCP Project ID`, and `Looker Instance Id` if child product quantity is **greater than 0**. Bypassed if quantity is **0**.
  - No gaps or overlaps allowed between period dates.

### Quote Submission
- **Submit Quote Details (POST)**: Sends the configured period timelines and seat counts to the server, mapping to [Endpoint 7 & 24 (Place Graph Quote Transaction)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#7-place-graph-quote-transaction-post) to update Quote records and lines atomically.
- **Apply Bulk Discounts (PATCH)**: Updates the individual seat and platform discount rates, mapping to [Endpoint 16 (Apply Selected Discounts / Incentives)](file:///c:/Users/Admin/Documents/sdd/specs/001-quote-subscription-flow/API_SPECIFICATION.md#16-apply-selected-discounts--incentives-patch) in a composite PATCH block.
- **Submission Success Routing**: Shows a **Redirection Success Modal** upon successful submit. Clicking **OK**:
  - Clears all session data (`sessionStorage.clear()`).
  - Redirects the user back to `/opportunities` to start a new transaction.
- **Submission Error Catching**: If submission fails, propagates error response messages directly to the screen via Toast alerts.

---

## 4. Modals & Overlays

### Create Subscription Periods Modal
- Prompts user to select period generation frequency (`Yearly` or `Custom`).

### Quote Preview Modal
- Triggered by clicking the **Preview** button in the footer.
- Renders a styled PDF-style contract preview panel containing:
  - Account Metadata (Prepared For, Account Name, Opportunity Name).
  - Subscription Period breakdown containing inclusive date spans and order term labels.
  - Calculated fees for Platform and individual Child products based on the exact term formula:
    `ListPrice * Quantity * (Days / 31) * (1 - Discount / 100)`
    *Note: `Days` is calculated as the calendar-inclusive days between period start and end dates.*
  - Grand total summation and legal signature columns.

### Submit Success Modal
- Renders confirmation text with a checkmark avatar and a solid blue **OK** confirmation button to route back to `/opportunities` and reset the wizard session.
