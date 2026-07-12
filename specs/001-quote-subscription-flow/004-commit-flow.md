# Sub-Feature Specification: Quote Commit Flow (Standard & Looker)

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. Overview & Architecture

The Commit Flow allows users to define contractual commitment terms (durations and amounts) or Looker subscription periods for a Salesforce Quote. Additionally, it provides a comprehensive "Discounts and Incentives" configuration interface, allowing granular or overall price modifications over specific date ranges. 

The UI for this is isolated within the `CommitFlowComponent` (and associated child modals) to ensure strict separation of concerns from the generic subscription flow.

---

## 2. User Interface & State Flow

### 2.1 Tabbed Interface
- **Details Tab**: Where the base periods (Standard or Looker) are configured. Standard commitments use a dynamic list of periods (Months, Amount).
- **Discounts & Incentives Tab**: 
  - Displays currently configured Discount Periods and Incentive Periods as collapsible cards.
  - Features a right-hand configuration pane with tabs for "Discounts" and "Incentives".
  - Collects Date Ranges (Start/End dates) for each overlay.
  - Collects Configuration properties (e.g., Granularity, Type, Price Reference).

### 2.2 Right-Pane Configuration
- **Discounts**:
  - Discount Granularity: `Overall` (applies to all selected products equally) or `Granular` (specific values per product).
  - Discount Type: `Flat rate (%)`, `Fixed amount`, etc.
  - Price Reference: `Float`, `Fixed`.
  - Discount Value: Input field (only visible for `Overall` granularity).
  - "Select products" button: Opens the Product Selection Modal.
- **Incentives**:
  - Similar configuration fields, capturing Incentive Types (e.g., "Incentive type 1").

### 2.3 Product Selection Modal
The "Select Products" modal (`SelectProductsModalComponent`) provides the user interface for selecting products to apply discounts or incentives. It currently focuses on "Product Groups" (Bundles) and allows users to define granular or overall discount/incentive values.

**UI Tabs**
- **Product Groups:** Active and implemented. On initialization (`ngOnInit`), it triggers the `CrmService.getProducts()` API to fetch all active product bundles and displays them in a table.
- **Individual Products:** UI Placeholder. Currently hardcoded to show 0 count. Future implementation would likely call an API fetching products without the `Type = 'Bundle'` filter.

**API Interactions (Fetching Product Groups)**
- **Service Method:** `CrmService.getProducts()`
- **Endpoint:** `POST {baseUrl}/services/data/v65.0/connect/pcm/products`
- **Request Payload:** Includes criteria `isActive: true` and `Type: Bundle`.
- **Response Handling:** Maps family from various fallback fields in the Salesforce response, resolves `pricebookEntryId` from nested objects, and falls back to `getMockProducts()` if the API call fails.

**Business Logic & State Management**
- **Modes & Granularity:** Adapts based on `@Input()` properties: `mode` ('Discount' or 'Incentive') and `granularity` ('Overall' or 'Granular').
- **Filtering:** Users can toggle between "Show All" and "Show selected".
- **Confirmation Validation (`isValidToConfirm()`):** Proceeding with 0 selected products is allowed. In 'Granular' mode (or 'Incentive' mode), confirmation is blocked unless every selected product has a non-empty value entered.
- **Confirmation Submission:** Clicking "Confirm" emits the `confirm` event, passing an array of selected products including their `id`, `name`, `family`, and the typed `value`.

### 2.4 Upload Products Modal
- Triggered from the Product Selection Modal.
- Provides a drag-and-drop zone for uploading CSV files.
- Includes a "Download CSV Template" button.
- Automates the population of granular product selections.

### 2.5 Quote Preview Modal
- Triggered by clicking "Preview" or "Preview approval" at the bottom/top of the screen.
- A full-screen or large modal displaying tables:
  - **Quote summary**: Aggregated totals (Commit value, Total Incentives).
  - **Commitment Details**: Breakdown of the base commit periods.
  - **Product**: List of base products.
  - **Discount period X**: Detailed breakdown of applied discounts per product group.
  - **Incentives**: Detailed breakdown of applied incentives.

---

## 3. Data Models

### 3.1 Base Commitments
```typescript
interface CommitmentPeriod {
  months: string | null;
  amount: number | null;
  amountStr?: string; // For shorthand UI input (e.g., '10k')
  isCollapsed: boolean;
}
```

### 3.2 Discounts and Incentives
```typescript
interface DiscountPeriod {
  id: string;
  startDate: string;
  endDate: string;
  granularity: 'Overall' | 'Granular';
  type: string;
  priceReference: string;
  value: number | null; // Used if Overall
  selectedProducts: SelectedProduct[];
}

interface IncentivePeriod {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  selectedProducts: SelectedProduct[];
}

interface SelectedProduct {
  productGroupName: string;
  numberOfProducts: number;
  value: number; // The granular discount % or incentive $ amount
}
```

---

## 4. Interaction & Validation Rules

### 4.1 Strict Validations
1. **Details Prerequisite**: Users cannot configure Discounts or Incentives if the base Commitment Periods are empty or invalid.
2. **Date Boundaries**: Discount and Incentive date ranges should ideally fall within the overarching term start and end dates.
3. **Granular Value Requirements**: If a user selects "Granular", they CANNOT add the incentive/discount without specifying the exact price/percentage beside the selected product in the modal.
4. **Max Commit Periods**: The UI supports adding up to 5 base commit periods.

### 4.2 State Management
- Maintains isolated arrays for `commitmentPeriods`, `discountPeriods`, and `incentivePeriods`.
- Recalculates totals dynamically for the Preview Modal.

### 4.3 Timezone Safety
- All date math (calculating offsets, adding months) MUST use `getUTCDate()` and `Date.UTC` to prevent off-by-one errors caused by browser timezones shifting midnight UTC boundaries.

---

## 5. API Integration Sequence (Salesforce Composite)

Upon clicking Save (`onSkipAndSave`), if the state has changed:
1. **Update Dates**: `sfApi.updateQuoteDates(...)` - PATCH `/services/data/v65.0/composite/sobjects` to update `StartDate`, `ExpirationDate`, `Term__c`, `Total_Commitment_Value__c`.
2. **Build Records**: `buildCommitmentRecords()` parses the `StartDate` dynamically and advances it based on each period's `months`.
3. **Create Commitments**: `sfApi.createQuoteLineCommitments(...)` - POST `/services/data/v65.0/composite/tree/Commitment_Details__c` to insert standard records.
4. **Discounts & Incentives**: Additional endpoints or child relationships will be utilized to persist `DiscountPeriod` and `IncentivePeriod` records against the Quote Line Item.
5. **Apply Selected Discounts / Incentives (PATCH)**: 
   - **Endpoint:** `PATCH /services/data/v65.0/composite/sobjects`
   - **Service Method:** `CrmService.updateQuoteLineDiscounts`
   - **Description:** Executes a bulk patch update on the corresponding `QuoteLineItem` records to apply the UI-configured `Discount` (%) or `Incentive__c` ($) values.
   - **Request Payload Example (Granular Discount):**
     ```json
     {
       "allOrNone": true,
       "records": [
         {
           "attributes": { "type": "QuoteLineItem" },
           "id": "0QLDz00000BundleLineId1",
           "Discount": 45.0
         },
         {
           "attributes": { "type": "QuoteLineItem" },
           "id": "0QLDz00000BundleLineId2",
           "Discount": 20.0
         }
       ]
     }
     ```
---

## 6. Edge Cases & Error States

- **Missing Granular Values**: "Please specify the value for all selected granular products before confirming."
- **Max Duration Exceeded**: "Contract duration cannot exceed 5 years." (Blocks save).
- **Date Gaps (Looker)**: "Period dates must be contiguous. Please correct the gaps." (Blocks save).
- **Invalid Shorthand**: "Invalid amount format. Use numbers or shorthands like K, M, B."
- **Empty Fields**: "Please fill the Commit Period details first."

---

## 7. Test-Driven Development (TDD) Cases

### 7.1 Global Search Debounce & Execution
*   **Test Case**: Verify that the global search input debounces keystrokes.
*   **Action**: Type "L-o-o-k-e-r" rapidly without pausing into the global search bar on the Individual Products tab.
*   **Expected Result**: The API should NOT fire 6 times. It should wait 300ms after typing stops and fire exactly one `POST` request to `connect/pcm/products` passing `"searchTerm": "Looker"`.

### 7.2 Global Search Reset
*   **Test Case**: Verify that clearing the global search resets the product list.
*   **Action**: Highlight the search term "Looker" and delete it (leaving the search bar empty).
*   **Expected Result**: The component should immediately trigger `facetedProductSearch` (without a `searchTerm` in the payload) to restore the default unfiltered individual product list.

### 7.3 Facet Selection (Checkboxes)
*   **Test Case**: Verify that selecting a sidebar facet dynamically modifies the search payload.
*   **Action**: Check the "Google Cloud" checkbox under the "Product Family" facet group.
*   **Expected Result**: The UI should immediately fire a `POST` request to `connect/pcm/products` where `filter.criteria` includes `{ property: "Family", operator: "eq", value: "GCP" }`. The right-side table should update to show only GCP products.

### 7.4 Facet Deselection
*   **Test Case**: Verify that unchecking a facet removes the rule and updates the list.
*   **Action**: Uncheck the previously checked "Google Cloud" checkbox.
*   **Expected Result**: The UI should immediately fire a `POST` request to `connect/pcm/products` where the `Family` criteria object has been cleanly removed from the `filter.criteria` array.

### 7.5 Combined Global & Faceted Search
*   **Test Case**: Verify that the global search string and facet checkboxes can act together.
*   **Action**: Check the "Recurring" checkbox under Billing Type, then type "Storage" in the global search bar.
*   **Expected Result**: The API payload should successfully include BOTH `"searchTerm": "Storage"` at the root level AND `{ property: "Billing_Type__c", operator: "eq", value: "Recurring" }` inside the `filter.criteria` array.
