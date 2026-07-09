# Sub-Feature Specification: Quote Details & GCP Commitment Periods Flow
 
**Part of Feature**: `001-quote-subscription-flow`
 
---
 
## 1. User Interface & Layout
 
The Quote Details & GCP Commitment Periods page is a split, double-tab interface where standard GCP commitments are defined, configured, and submitted. The interface features a Salesforce-style light theme with a light grey background (`#f0f2f5`) and clean sans-serif typography (system-ui / Inter).
 
### Page Header & Actions
- **Top Bar**: Shows the account logo/info (e.g., `Cymbal / cymbal.com` on the left with a circular folder icon), a tabbed document interface (`Quote 1` with a `+` tab), and top-right actions:
  - `Preview approval` (outlined button with a user-card icon)
  - `Create contract` (solid blue button `bg-[#0f62fe]` with a document-add icon)
- **Opportunity Reference**: Displays `Opportunity / Opportunity name` in small grey text in the top right corner.
- **Sub-header Details**:
  - Quote Number & Configured Product (e.g., `Q-1234 Google Cloud Platform (Commit)` in large bold dark text on the left).
  - Details panel on the right (neatly aligned columns):
    - `Contract Start Date`: `[StartDate]`
    - `Term`: `[Calculated months, e.g. 12 months]`
    - `Total Contract Value`: `$[Calculated price]` (bold)
    - A vertical three-dots action icon (`⋮`) at the far right.
- **Double Tabs**:
  - **Details**: Pre-filled CRM details and billing parameters.
  - **Plans & Discounts**: Accordion list containing commitment periods.
- **Footer Buttons**:
  - `Cancel` (outlined)
  - `Save` (outlined)
  - `Submit` (solid blue `bg-[#0f62fe]` - disabled until at least one valid commitment period is defined)
 
### Tab 1: Details (Subscription & Quote Details)

Features a two-column layout: the left column contains the form fields grouped into Quote details, and the right column houses the Payment Account card.

#### Left Column (Form Fields):
- **Quote details Section**:
  - `Primary contact`: Dropdown field showing user avatar and name ("Sarah Connor"), pre-filled from Opportunity.
  - `Sales Channel`: Dropdown field. Defaults to `Direct`.
  - `Quote Start Date`: Date picker. Defaults to today's date.
  - `Quote Expiration Date`: Disabled text input. Automatically defaults to **30 days** from Quote Start Date (e.g., `Feb 15, 2026`).

#### Right Column (Payment Account Card):
- **Payment Account Card**:
  - Bordered container with rounded corners and a soft shadow.
  - Header: **"Payment Account"** with an edit pencil icon on the right.
  - `Primary` pill: Light purple background (`bg-purple-100 text-purple-700`) below the header.
  - Displays primary account holder name (`XXX XXXXXX` bold dark text), billing account number (`XXXXXX-XXXXXX-XXXXXXX`), payment account ID, billing address, and currency.
 
### Tab 2: Plans & Discounts

#### Date Inputs (Top Row):
- Header: **"Commitment Periods"** on the left.
- Date Pickers (Right Aligned):
  - `Subscription Start Date` (Date picker, read-only: displays Quote Start Date from Tab 1).
  - `Subscription End Date` (Date picker, read-only: displays calculated end date from the sum of all commitment period months).

#### Commitment Accordion List:
- Commitment periods are listed as collapsible card headers (`Commit Period 1`, `Commit Period 2`, etc.).
- **Card Header Controls**:
  - **Expand/Collapse** arrow toggle (`v`).
  - **Duplicate Period** icon button (clones current period's Months and Amount into a new card).
  - **Remove Period** trash icon (deletes the card; disabled if only one card exists).
- **Expanded Period Panel**:
  - Light grey bordered container (`bg-[#f8fafc]` / `bg-gray-50`) with rounded corners.
  - `Months`: Text input allowing positive integers representing the length of the commitment block.
  - `Amount`: Text input accepting numeric inputs or shorthand notation (e.g., `100k` or `2.5M`).
- **Accordion Footer Controls**:
  - A `+ Add Period` button with a blue icon and text sits below the period list to append a new card (disabled once 5 periods are created, or if the last period has empty values).
 
### Visual Mocks Reference
- **Screen 5**: Explains the default view of the `Details` tab.
- **Screen 12**: Shows the empty state or first block in `Plans & Discounts` for GCP Commitment.
- **Screen 13**: Shows multiple commitment accordion cards in collapsed and expanded states.
- **Screen 14**: Shows shorthand parsing validation on the Amount inputs.
 
---
 
## 2. Interaction & Behavior
 
### Quote Details Autofill & Expiration
- **Primary Contact**: Autofilled via Opportunity API hook.
- **Sales Channel**: Autofilled via Opportunity API hook.
- **Expiration Date Logic**:
  - When the user changes `Quote Start Date`, `Quote Expiration Date` is automatically updated to exactly 30 days after the new start date.
 
### Commitment Period Management & Date Sync
- **Adding Periods**:
  - Clicking `+ Add Period` appends a new blank accordion card at the bottom of the list.
  - Up to **5 periods** maximum can be added. The add button is disabled when the count reaches 5.
- **Removing Periods**:
  - Clicking the remove button deletes the selected period from the array.
  - The system must enforce a minimum of **1 period**; the remove button is disabled when only one period is left.
- **Duplicating Periods**:
  - Clicking the duplicate icon duplicates the current card's `months` and `amount` and pushes it as a new period card.
- **Shorthand Currency Parsing**:
  - The `Amount` text input supports keyboard shorthands. On `blur` (focus out), the value is parsed and converted to the full numeric value:
    - `k` / `K` -> Multiply by 1,000 (e.g. `50k` or `50K` -> `$50,000`)
    - `m` / `M` -> Multiply by 1,000,000 (e.g. `1.5M` -> `$1,500,000`)
    - `b` / `B` -> Multiply by 1,000,000,000 (e.g. `2B` -> `$2,000,000,000`)
  - If a user inputs non-numeric characters without valid multipliers, the input is reset and an error message is shown.
- **Dynamic Subscription End Date Calculation**:
  - The system sums all `Months` fields across all configured commitment periods.
  - The calculated term (in months) is added to the `Subscription Start Date` to determine the `Subscription End Date` (calculated as `StartDate + sum(Months) - 1 Day`).
  - Changing a period's month length dynamically updates the overall contract duration and Subscription End Date in real-time.
 
---
 
## 3. Data Dictionary & Field Specs
 
| Field / UI Element | Type | Input Method | Default Value | Validation / Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Quote Start Date** | Date | Calendar Picker | Today's Date | Must be a valid date. Updates expiration date. |
| **Quote Expiration Date**| Date | Disabled Input | Start Date + 30 Days | Non-editable. Dynamic recalculation. |
| **Commitment Months** | Integer | Text Input | None | Mandatory. Must be a positive integer. |
| **Commitment Amount** | String | Text Input | None | Mandatory. Parsed to number on blur. Supports K, M, B. |
| **+ Add Period** | Button | Action Link | - | Disabled if count >= 5. Appends a new blank block. |
| **Duplicate Period** | Icon | Click Event | - | Clones current months/amount to a new period. |
| **Remove Period** | Icon | Click Event | - | Disabled if only 1 period exists. Deletes period. |
 
---
 
## 4. Edge Cases & Error States
 
- **Invalid Shorthand Value**: If a user enters `10xyz` in the Amount input, the input fails verification on blur, displaying an inline error: *"Invalid amount format. Use numbers or shorthands like K, M, B."*
- **Empty / Incomplete Period Fields**: If a user switches tabs or clicks Save/Submit while a period has empty `Months` or `Amount` inputs, a toast is shown: *"Please fill the Commit Period details first"* and the empty fields are outlined in red.
- **Shift in Start Date**: If the user shifts the start date in the details tab, the start date of Period 1 is adjusted accordingly, and subsequent dates are recalculated without clearing the months/amount configurations.
