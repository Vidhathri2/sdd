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
- A dedicated modal allowing users to pick which products receive the discount/incentive.
- **Tabs**: "Product Groups" and "Individual Products".
- **Table Columns**: Product Group, Number of Products, Discount/Incentive Value.
- **Interaction**:
  - Checkboxes to select rows.
  - If Granular is selected, the right-most column becomes an active input field to specify the exact discount/incentive per product group.
- **Action**: Includes an "Upload products" button.

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
4. **Discounts & Incentives**: Additional endpoints or child relationships will be utilized to persist `DiscountPeriod` and `IncentivePeriod` records against the Quote Line Item. (Details TBD based on Salesforce schema).

---

## 6. Edge Cases & Error States

- **Missing Granular Values**: "Please specify the value for all selected granular products before confirming."
- **Max Duration Exceeded**: "Contract duration cannot exceed 5 years." (Blocks save).
- **Date Gaps (Looker)**: "Period dates must be contiguous. Please correct the gaps." (Blocks save).
- **Invalid Shorthand**: "Invalid amount format. Use numbers or shorthands like K, M, B."
- **Empty Fields**: "Please fill the Commit Period details first."
