# Sub-Feature Specification: Quote Details & Subscription Periods Flow

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. User Interface & Layout

The Quote Details & Subscription Periods configuration page is a unified page layout centering the interactive quote cards and forms. The interface features a Salesforce-style light theme with a light grey background (`#f0f2f5`) and clean sans-serif typography (system-ui / Inter).

### Page Header & Actions
- **Top Bar**: Shows the account logo/info (e.g., `Cymbal / cymbal.com` on the left with a circular folder icon), a tabbed document interface (`Quote 1` with a `+` tab), and top-right actions:
  - `Preview approval` (outlined button with a user-card icon)
  - `Create contract` (solid blue button `bg-[#0f62fe]` with a document-add icon)
- **Opportunity Reference**: Displays `Opportunity / Opportunity name` in small grey text in the top right corner.
- **Sub-header Details**:
  - Quote Number(from the api response) & Configured Product (e.g., `Q-1234 Looker Core` in large bold dark text on the left).
  - Details panel on the right (neatly aligned columns):
    - `Contract Start Date`: `Upon provisioning` (or calculated date)
    - `Term`: `36 months`
    - `Total Contract Value`: `$X,XXX,XXX` (bold)
    - A vertical three-dots action icon (`⋮`) at the far right.
- **Double Tabs**:
  - **Details**: Pre-filled CRM details, subscription inputs, and billing parameters.
  - **Plans & Discounts** (or **Products & Discounts**): Period schedule generation and child product line item pricing.
- **Footer Buttons**:
  - `Cancel` (outlined)
  - `Save` (outlined)
  - `Submit` (solid blue `bg-[#0f62fe]` - disabled until periods are configured)

---

### Tab 1: Details (Subscription & Quote Details)

Features a two-column layout: the left column contains the form fields grouped into Quote and Subscription details, and the right column houses the Payment Account card.

#### Left Column (Form Fields):
- **Quote details Section**:
  - `Primary contact`: Dropdown field showing user avatar and name ("Sarah Connor"), pre-filled from Opportunity.
  - `Sales Channel`: Dropdown field. Defaults to `Direct`.
  - `Operation Type`: Dropdown field. Defaults to `New`.
  - `Quote Expiration Date`: Date picker. Defaults to **45 days** from quote creation date (e.g., `Feb 15, 2026`).
- **Subscription details Section**:
  - `Billing Frequency`: Dropdown field. Defaults to `Annual in Advance Anniversary`.
  - `Term Starts on`: Dropdown field. Defaults to `Fixed Start Date`.
  - `Term Start Date`: Date picker. Enabled when `Term Starts on` is `Fixed Start Date`.
  - `Term End Date`: Date picker.

#### Right Column (Payment Account Card):
- **Payment Account Card**:
  - Bordered container with rounded corners and a soft shadow.
  - Header: **"Payment Account"** with an edit pencil icon on the right.
  - `Primary` pill: Light purple background (`bg-purple-100 text-purple-700`) below the header.
  - Account Name: `XXX XXXXXX` (bold dark text).
  - `Billing Account`: `XXXXXX-XXXXXX-XXXXXXX`
  - `Payment Account ID`: `XXXXXX-XXXXXX-XXXXXXX`
  - `Billing Address`: `5920 Niagara River Parkway, Niagara Falls ON L2E 6X8 CA`
  - `Billing Currency`: `CAD`

---

### Tab 2: Plans & Discounts

#### Date Inputs (Top Row):
- Header: **"Subscription Periods"** on the left.
- Date Pickers (Right Aligned):
  - `Subscription Start Date` (Date picker,displays Term Start Date).
  - `Subscription End Date` (Date picker,displays Term End Date).

#### Empty State:
- A light grey bordered container (`bg-[#f8fafc]` / `bg-gray-50`) with rounded corners.
- Contains a centered blue button `+ Create subscription periods` (`bg-[#0f62fe]`).
- Text below the button: `You can choose to create yearly or a custom period`.

#### Ramp Panel Grid (Periods Configured):
- Generated periods are listed as collapsible card headers (`Period 1`, `Period 2`, `Period 3`).
- **Collapsed Period Header**: Shows Period name, start date, and end date (e.g., `Period 2 Start date: Feb 1, 2027 / Period 2 End date: Jan 31, 2028`), a vertical three-dot menu icon (`⋮`), and a collapse chevron arrow (`v`).
- **Expanded Period Panel**:
  - **Header Row**:
    - `Platform` product dropdown (e.g., showing selection like `Standard Annual Subscription`, with a grey price label `$5,000.00 / year` directly below it).
    - `Period 1 Start date` (disabled/readonly date picker, e.g., `Feb 1, 2026`).
    - `Period 1 End date` (readonly date picker, e.g., `Jan 31, 2027`, with a duration label like `12M 0D (365 Days)` directly below it).
    - `Discount` input (e.g., numeric input with percentage sign, showing `50%`).
  - **Child Products Table/Rows**:
    - Displays rows for four Looker Core child products:
      1. **Standard User** (Base price indicator: `$30 / Year`)
      2. **Developer User** (Base price indicator: `$60 / Year`)
      3. **Viewer User** (Base price indicator: `$30 / Year`)
      4. **Non-prod** (Base price indicator: `$416.67 / Year`)
    - Columns for each child product row:
      - Product Label & Price (Left aligned, bold text with small grey subtext)
      - `Quantity` input field (e.g., default `0` or numeric value)
      - `Region` dropdown select (e.g., `Dallas (us-south-1)`)
      - `GCP Project ID` text input (placeholder `Enter` or alphanumeric value)
      - `Looker Instance Id` text input (placeholder `Enter` or alphanumeric value)
      - `Discount` percentage input (placeholder `Enter` or percentage value)
  - **Manual Period Addition**: A `+ Add Period` button sits below the period list with a blue icon and text to append custom segments.

---

## 2. Interaction & Behavior

### Screen Initialization & Loading APIs
- When the subscription configuration page is loaded, the system must trigger the following API calls:
  - **Fetch Initial Generated Quote Details (GET)**: Called using the cached Quote ID to retrieve initial quote properties (Quote Number, products configured, etc.).
  - **Load Salesforce Form Picklists (GET)**: Fetches dynamic dropdown options for the form fields (Billing Frequency, Term Starts on, and Operation Type).

### Quote Details Autofill & Picklists
- **Primary Contact**: Autofilled via Opportunity API hook.
- **Billing Frequency Options**:
  - `Quarterly in Advance Anniversary`
  - `Annual in Advance Anniversary` (Default)
  - `Monthly in Arrears`
  - `Quarterly in Advance`
  - `Annual in Advance`
- **Term Starts On Options**:
  - `Fixed Start Date` (Default)
  - `Upon Provisioning` (Disables `Term Start Date` input; defaults start date to provisioning date)
  - `Customer Signature Date` (Disables `Term Start Date` input; defaults start date to signature date)

### Period Configuration Generation
- Clicking `+ Create subscription periods` launches the frequency modal.
- The user selects a frequency (`Yearly` or `Custom`) and clicks `Create`.
- **Yearly Frequency Logic**:
  - Calculates the total term duration in months.
  - Automatically generates N periods where N is the term in years (e.g., a 36-month term produces 3 periods).
  - Each generated period is bounded to a **maximum duration of 1 year** (365/366 days).
  - System automatically calculates and populates the dates sequentially based on the overall term start date.
- **Custom Frequency Logic**:
  - Generates the first period and prompts the user to define custom dates, with sequential periods appended manually via `+ Add Period`.
- **Ramp Table Validation Rules**:
  - If a child product row quantity is **greater than 0**, the user MUST input a valid `Region`, `GCP Project ID`, and `Looker Instance Id`.
  - If the quantity is **0**, these validations are bypassed.
  - The final date of the last period must exactly match the overall `Subscription End Date`.
  - There must be no gaps or overlaps between periods.

---

## 3. Modals & Overlays

### Create Subscription Periods Modal
- Displayed as a centered modal dialog box with rounded corners and a soft drop shadow, overlaying a dimmed background backdrop.
- **Header**: **"Create Subscription Periods"** (bold dark text).
- **Body**: 
  - Subtitle: `Choose the frequency at which you want to ramp up your subscription.`
  - `Frequency` select dropdown: Displays options (e.g., `Yearly`, `Custom`).
- **Actions**: Aligned to the bottom right:
  - `Cancel` (blue text link button)
  - `Create` (blue text link button)

---

## 4. Edge Cases & Error States

- **Mismatch in Term Dates**: If a user attempts to manually configure period dates that result in a gap, a validation error is highlighted: *"Period dates must be contiguous. Please correct the gaps."*
- **Submit with Unfilled Mandatory Row Info**: If a child product quantity is set to 5 but the GCP Project ID is empty, clicking Submit highlights the field in red: *"GCP Project ID is required when quantity is greater than 0."*
- **Term Date Shift Reset**: If the user has configured periods in Tab 2 and then changes `Term Start Date` in Tab 1, a confirmation modal warns: *"Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?"* If accepted, all configured periods and child values are cleared.
