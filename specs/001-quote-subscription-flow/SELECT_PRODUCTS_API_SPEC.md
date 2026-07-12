# Select Products & Discounts UI Specification

**Module:** Discount & Incentive Select Products Modal Flow
**Scope:** Covers the logical flow and APIs for selecting Product Groups vs Individual Products and applying discounts in the Deal Studio application.

---

## 1. UI Flow & Concept
When configuring discounts or incentives, the user interacts with the "Select products" modal. The application differentiates between logical groups of products (Bundles) and distinct individual line items.

### Concept: Product Groups
- Represents pre-defined Salesforce bundles (e.g., "Looker Enterprise Bundle").
- Fetched dynamically from the PCM catalog.
- If selected, any discount or incentive assigned is structurally applied to the parent bundle and cascades downwards logically.

### Concept: Individual Products
- Represents individual standard products (non-bundles).
- Relies on the **Faceted Search UI**, which provides dynamic filtering without type constraints.
- Allows highly specific line-item discounts to bypass group logic.

---

## 2. API Implementations

### API A: Fetch Product Groups (Bundles)
*   **Trigger:** Modal Initialization (Default Tab: "Product Groups").
*   **Endpoint:** `POST /services/data/v65.0/connect/pcm/products`
*   **Service Method:** `CrmService.getProducts`
*   **Description:** Retrieves all active products tagged as `Type='Bundle'` to display under the Product Groups tab.
*   **Request Payload:**
    ```json
    {
      "language": "en_US",
      "filter": {
        "criteria": [
          { "property": "isActive", "operator": "eq", "value": true },
          { "property": "Type", "operator": "eq", "value": "Bundle" }
        ]
      },
      "offset": 0,
      "pageSize": 100,
      "additionalFields": { "Product2": { "fields": ["Family", "Name"] } }
    }
    ```

### API B: Fetch Individual Products via Faceted Search
*   **Trigger:** Clicking the "Individual Products" tab.
*   **Endpoint:** `POST /services/data/v66.0/connect/pcm/products?q=<searchTerm>&include=/products`
*   **Service Method:** `CrmService.facetedProductSearch`
*   **Description:** Leverages the faceted search UI endpoint to bypass the `Bundle` filter and fetch discrete standard products/SKUs.
*   **Request Payload:**
    ```json
    {
      "language": "en_US",
      "filter": {
        "criteria": [
          { "property": "isActive", "operator": "eq", "value": true }
        ]
      },
      "offset": 0,
      "pageSize": 100
    }
    ```

---

## 3. Applying Discounts and Logic Execution

Once the user selects the products (whether groups or individual) and inputs the percentage (%) or flat amount ($):

*   **Trigger:** Clicking "Confirm" in the modal.
*   **Validation:** 
    *   If **Granular Mode**, every selected product must have a value entered.
    *   If **Overall Mode**, a single value is collected and applied to all selections.
*   **Execution Strategy:** The modal emits the `confirm` event, passing the array of selected items to the parent page. 

### API C: Apply Selected Discounts / Incentives (PATCH)
*   **Endpoint:** `PATCH /services/data/v65.0/composite/sobjects`
*   **Service Method:** `SalesforceApiService.updateQuoteLineDiscounts`
*   **Description:** Executes a bulk patch update on the corresponding `QuoteLineItem` records to apply the UI-configured `Discount` (%) or `Incentive__c` ($) values.
*   **Request Payload Example (Granular Discount):**
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
