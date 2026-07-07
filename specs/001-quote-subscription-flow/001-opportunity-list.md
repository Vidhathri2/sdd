# Sub-Feature Specification: Opportunity List & Navigation

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. User Interface & Layout

The Opportunity List is the entry page of the **Deal Studio** workspace. It provides a tabular overview of sales opportunities in the organization.

### UI Structure (Landing Page)
- **Header**: Contains the "Deal Studio" title on the left, a "Search" input field in the middle, and status/profile icons on the right.
- **Main Content**: A structured table titled "Opportunities" displaying active opportunity records.
- **Table Columns**:
  - `Checkbox` (for selecting rows)
  - `Opportunity Name` (with ascending sort arrow indicator `↑`)
  - `Account Name`
  - `Owner`
  - `Amount`
  - `Close Date`
  - `Action Menu` (represented by a vertical three-dot icon `⋮` at the end of each row)
- **Footer (Pagination)**:
  - `Rows per page` selector (dropdown, defaults to `10`)
  - Range and Total indicator (e.g., `1-10 of 33`)
  - Pagination navigation buttons: First Page (`|<`), Previous Page (`<`), Next Page (`>`), Last Page (`>|`).

### Visual Mocks Reference
- **Screen 1**: Displays the Deal Studio page with opportunities data, illustrating pagination and the hover interaction on a table row showing the "Create Quote" action.

---

## 2. Interaction & Behavior

### Paginated Loading
- When the page loads, the system fetches all opportunity records.
- To maintain optimal performance, the table must limit display to **10 records per page** by default.
- If the user changes `Rows per page` (e.g., to 20, 50, 100), the table re-renders the selected amount of rows.
- Navigation buttons are enabled/disabled dynamically based on the current page index.

### Action Menu & Quote Ingress
- The action menu (three-dots icon `⋮`) at the end of each row is shown on hover or when a row is selected.
- Clicking the three-dots icon opens a small floating dropdown menu/overlay containing a single option:
  - **Create Quote** (with a circular `+` icon)
- Clicking the "Create Quote" button initiates a navigation transition, taking the user directly to the **Product Selection & Discovery** page. The selected Opportunity's details (Opportunity ID, Opportunity Name, Primary Contact, etc.) must be cached in the session state to be passed forward to the Quote generation step.

---

## 3. Data Dictionary & Field Specs

| Field / UI Element | Type | Input Method | Default Value | Validation / Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Search bar** | String | Text Input | Empty | Real-time keyword filter on Opportunity list |
| **Opportunity Name** | String | Sortable Header | - | Ascending/Descending sort on click |
| **Rows per page** | Integer | Dropdown | `10` | Options: `10`, `25`, `50`, `100` |
| **Create Quote** | Button | Action Link | - | Clicking navigates to `/select-products` passing Opportunity context |

---

## 4. Edge Cases & Error States

- **No Opportunities Found**: If the organization has zero opportunities, the table body should display a centered info state: *"No opportunities found. Please create an opportunity to start."*
- **Network / API Load Timeout**: If the backend API call to fetch opportunities fails, a red warning toast must appear: *"Failed to load opportunities. Please refresh the page."*
