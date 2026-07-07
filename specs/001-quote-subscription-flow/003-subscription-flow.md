# Sub-Feature Specification: Quote Details & Subscription Periods Flow

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. User Interface & Layout

The Quote Details & Subscription Periods configuration page is a split, double-tab interface where the quote properties and temporal ramp schedules are defined and configured.

### Page Header & Actions
- **Top Bar**: Shows the account logo/info (e.g. `Cymbal / cymbal.com`), a tabbed document interface (`Quote 1` with a `+` tab), and top-right actions:
  - `Preview approval` (outlined button)
  - `Create contract` (solid blue button)
- **Sub-header Details**:
  - Quote Number (e.g., `Q-1234`)
  - Configured Product (e.g., `Looker Core`)
  - Info indicators: `Contract Start Date: Upon provisioning`, `Term: [Calculated months, e.g. 36 months]`, `Total Contract Value: $[Calculated price]`, and a vertical three-dots action icon.
- **Double Tabs**:
  - **Details**: Pre-filled CRM details and billing parameters.
  - **Plans & Discounts**: Period schedule generation and child product line item pricing.
- **Footer Buttons**:
  - `Cancel` (outlined)
  - `Save` (outlined)
  - `Submit` (solid blue - disabled until periods are configured)

### Tab 1: Details (Subscription & Quote Details)
- **Quote details Section**:
  - `Primary contact`: Dropdown field. Pre-filled from Opportunity contact (e.g. "Sarah Connor" with profile picture).
  - `Sales Channel`: Dropdown field. Defaults to `Direct`.
  - `Operation Type`: Dropdown field. Defaults to `New`.
  - `Quote Expiration Date`: Date picker. Defaults to **45 days** from quote creation date (e.g., `Feb 15, 2026`).
- **Subscription details Section**:
  - `Billing Frequency`: Dropdown field. Defaults to `Annual in Advance Anniversary`.
  - `Term Starts on`: Dropdown field. Defaults to `Fixed Start Date`.
  - `Term Start Date`: Date picker. Enabled when `Term Starts on` is `Fixed Start Date`.
  - `Term End Date`: Date picker.
- **Payment Account Card (Right-Side)**:
  - Displays primary account holder name, billing account number, payment account ID, billing address, currency, and an edit icon.

### Tab 2: Plans & Discounts
- **Date Inputs (Top Bar)**:
  - `Subscription Start Date` (Date picker, read-only: displays Term Start Date).
  - `Subscription End Date` (Date picker, read-only: displays Term End Date).
- **Empty State**:
  - A gray container box showing a blue `+ Create subscription periods` button, and text below: `You can choose to create yearly or a custom period`.
- **Ramp Panel Grid (Periods Configured)**:
  - Generated periods are listed as collapsible card headers (`Period 1`, `Period 2`, `Period 3`).
  - **Collapsed Period Header**: Shows Period name, start date, and end date (e.g., `Period 2 Start date: Feb 1, 2027 / Period 2 End date: Jan 31, 2028`).
  - **Expanded Period Panel**:
    - **Header Row**:
      - `Platform` product dropdown (e.g., "Standard Annual Subscription" with price label "$5,000.00 / year").
      - `Period Start date` and `Period End date` (e.g., `Feb 1, 2026` to `Jan 31, 2027`).
      - `Discount` input (e.g., `50%`).
    - **Child Products Rows**: Displays four columns (Quantity, Region, GCP Project ID, Looker Instance Id, Discount) for the child products of Looker Core:
      1. **Standard User** (Base price: `$30 / Year`)
      2. **Developer User** (Base price: `$60 / Year`)
      3. **Viewer User** (Base price: `$30 / Year`)
      4. **Non-prod** (Base price: `$416.67 / Year`)
  - **Manual Period Addition**: A `+ Add Period` button sits below the period list to append custom segments.

### Visual Mocks Reference
- **Screen 5**: Explains the default view of the `Details` tab.
- **Screen 6**: Shows the dropdown picklist options for `Billing Frequency`.
- **Screen 7**: Shows the dropdown picklist options for `Term Starts on` and date selection.
- **Screen 8**: Shows the empty state of the `Plans & Discounts` tab.
- **Screen 9**: Shows the "Create Subscription Periods" frequency modal overlay.
- **Screen 10 & 11**: Shows the populated period configuration list and child product grids.

---

## 2. Interaction & Behavior

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
  - System automatically calculates and populates the dates sequentially based on the overall term start date (e.g. Feb 1, 2026 to Jan 31, 2027, etc.).
- **Custom Frequency Logic**:
  - Generates the first period and prompts the user to define custom dates, with sequential periods appended manually via `+ Add Period`.
- **Ramp Table Validation Rules**:
  - If a child product row quantity is **greater than 0**, the user MUST input a valid `Region` (dropdown, e.g. "Dallas (us-south-1)"), `GCP Project ID` (string), and `Looker Instance Id` (string).
  - If the quantity is **0**, these validations are bypassed.
  - The final date of the last period must exactly match the overall `Subscription End Date`.
  - There must be no gaps or overlaps between periods.

---

## 3. Data Dictionary & Field Specs

| Field / UI Element | Type | Input Method | Default Value | Validation / Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Billing Frequency** | String | Dropdown | `Annual in Advance Anniversary` | Fetched via API. Dropdown list of 5 billing frequency options. |
| **Term Starts on** | String | Dropdown | `Fixed Start Date` | Options: `Fixed Start Date`, `Upon Provisioning`, `Customer Signature Date` |
| **Term Start Date** | Date | Calendar Picker | None | Mandatory if `Term Starts on` is `Fixed Start Date` |
| **Term End Date** | Date | Calendar Picker | None | Mandatory. Must be after `Term Start Date` |
| **Frequency** | String | Dropdown Modal | `Yearly` | Options: `Yearly`, `Custom` |
| **Discount (Period)** | Percentage | Text Input | None | Float percentage between `0%` and `100%` |
| **Quantity (Child)** | Integer | Text Input | `0` | Must be a positive integer |
| **Region (Child)** | String | Dropdown | `Select` | Options fetched via API (e.g., `Dallas (us-south-1)`) |
| **GCP Project ID** | String | Text Input | None | Mandatory if Quantity > 0. Alphanumeric. |
| **Looker Instance Id** | String | Text Input | None | Mandatory if Quantity > 0. Alphanumeric. |

---

## 4. Edge Cases & Error States

- **Mismatch in Term Dates**: If a user attempts to manually configure period dates that result in a gap (e.g. Period 1 ends Dec 31, 2026, and Period 2 starts Jan 5, 2027), a validation error is highlighted: *"Period dates must be contiguous. Please correct the gaps."*
- **Submit with Unfilled Mandatory Row Info**: If a child product quantity is set to 5 but the GCP Project ID is empty, clicking Submit highlights the field in red: *"GCP Project ID is required when quantity is greater than 0."*
- **Term Date Shift Reset**: If the user has configured periods in Tab 2 and then changes `Term Start Date` in Tab 1, a confirmation modal warns: *"Modifying the subscription term dates will clear and reset all configured periods. Do you wish to proceed?"* If accepted, all configured periods and child values are cleared.
