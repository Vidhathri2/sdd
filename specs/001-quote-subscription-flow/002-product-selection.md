# Sub-Feature Specification: Product Selection & Discovery

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. User Interface & Layout

The Product Selection page allows sales representatives to discover product bundles, filter them by family, and add them to a shopping cart before creating a formal quote.

### UI Structure (Catalog & Cart)
- **Header**: Displays `← Select products` (with a back arrow button to return to the opportunity landing page).
- **Search bar**: A full-width search input field with placeholder `Search by keyword` and a magnifying glass search icon.
- **Two-Column Layout**:
  - **Left Sidebar**: "Product family" filter panel showing list items:
    - `GCP`
    - `Workspace`
    - `Chrome`
    - `Maps`
    - `PSO`
  - **Right Main Panel**: Grouped list of available product bundles showing a title header and individual product cards.
- **Product Card Content**:
  - Group Header (e.g., `Chrome OS`, `Google Cloud Platform`, `Looker Core`)
  - Product Icon & Label (e.g., Chrome, GCP, Maps, Workspace)
  - Action Button (`+ Add` on the right side)
- **Cart View (Right Slide-out Drawer)**:
  - Slide-out pane titled `Added products` with a close `X` button.
  - List of selected products, showing their icon and product name (e.g. `GCP / Looker Core`).
  - Action Button at the bottom: `Continue` (solid blue).

### Visual Mocks Reference
- **Screen 2**: Shows the full product catalog list.
- **Screen 3**: Shows the filtered view when the `GCP` product family is selected in the sidebar (showing only Google Cloud Platform and Looker Core products).
- **Screen 4**: Shows the cart drawer expanded on the right side when a product (Looker Core) is added.

---

## 2. Interaction & Behavior

### Filtering & Search
- **Keyword Search**: Entering text in "Search by keyword" dynamically filters the main panel product cards by matching product names or family labels.
- **Sidebar Filtering**: Clicking on a product family item in the sidebar filters the list on the right.
  - Selecting `GCP` filters the catalog to show only `Google Cloud Platform` (GCP) and `Looker Core` (GCP) bundles.
  - Selecting another family (e.g. `Chrome`) displays Chrome-related bundles.
  - The clicked sidebar item gets a highlighted background (light gray/blue) to denote the selected state.

### Cart Lifecycle
- Clicking `+ Add` on a product card:
  - Changes the button text and style on the card to `✓ Added` (in a light blue, disabled state).
  - Slides out the `Added products` pane from the right side.
  - Appends the product name and icon to the cart list.
- Clicking the close `X` button on the cart panel hides the drawer, but retains added items.
- Clicking `Continue` in the cart:
  - Validates that the cart is not empty.
  - Creates a Quote record in the database pre-associated with the selected Opportunity.
  - Copies the selected bundle products into the Quote Line Items.
  - Navigates the user to the **Quote Details & Subscription Flow** page.

### MVP Scope Constraints
- Under this MVP, the system strictly supports configuration for the following core product bundles:
  1. **Google Cloud Platform (Commit)**
  2. **Looker Core (Subscription)**

---

## 3. Data Dictionary & Field Specs

| Field / UI Element | Type | Input Method | Default Value | Validation / Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Search by keyword** | String | Text Input | Empty | Real-time filter matching product metadata |
| **Product Family** | List Item | Click Select | None | Filters product cards by family ID |
| **+ Add** | Button | Action Click | - | Transitions card to `✓ Added` and opens cart |
| **Continue** | Button | Action Click | - | Redirects to quote configuration details |

---

## 4. Edge Cases & Error States

- **Empty Search Results**: If a search query does not match any products, display a placeholder text: *"No products match your search. Try a different keyword."*
- **Cart Session Expiry**: If the user leaves the page idle for too long and session caches clear, clicking "Continue" must prompt: *"Your session has expired. Please select the opportunity again."*
