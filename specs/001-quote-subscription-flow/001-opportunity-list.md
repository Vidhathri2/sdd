# Sub-Feature Specification: Opportunity List & Navigation

**Part of Feature**: `001-quote-subscription-flow`

---

## 1. User Interface & Layout

The Opportunity List is the entry page of the **Deal Studio** workspace, presenting a clean Salesforce-style light theme interface with a light grey background (`#f0f2f5`).

### UI Structure (Landing Page)
- **Top Navigation Bar / Header**: 
  - Rendered as a horizontal bar with a light grey background (`#f3f4f6`), rounded corners, and a thin border.
  - **Left side**: Hamburger menu icon (`≡`) followed by the "Deal Studio" title.
  - **Middle**: Centralized pill-shaped search input field (placeholder "Search") with a search icon on the right.
  - **Right side**: Icons for Notifications (bell), AI (sparkle), Help (question mark), Settings (gear), and User Profile.
- **Opportunities Card**: 
  - A white background container (`bg-white`) with rounded corners, a soft shadow, and a subtle border.
  - Titled **"Opportunities"** at the top-left.
- **Table Columns**:
  - `Checkbox` (for selecting rows)
  - `Opportunity Name` (with ascending sort arrow indicator `↑`)
  - `Account Name`
  - `Owner`
  - `Amount`
  - `Close Date`
  - `Action Menu` (represented by a vertical three-dot icon `⋮` at the end of each row)
- **Actions Popover**:
  - A light blue-ish grey menu popup (`bg-[#eef2f6]`) with rounded corners and a soft shadow, triggered below the vertical three-dot icon.
  - Contains a single button **"Create Quote"** displaying a circular plus `+` icon.
- **Footer (Pagination)**:
  - Right-aligned at the bottom of the card.
  - `Rows per page` selector dropdown.
  - Range and Total indicator (e.g., `1-10 of 33`).
  - Simple navigation control buttons: First Page (`|<`), Previous Page (`<`), Next Page (`>`), Last Page (`>|`).

### Visual Mocks Reference
- **Screen 1**: Displays the Deal Studio page with opportunities data, illustrating pagination and the hover interaction on a table row showing the "Create Quote" action.

---

## 2. Interaction & Behavior

### Paginated Loading
- When the page loads, the system fetches all opportunity records usin **Fetch Opportunities list (GET)**(it is present in api_specification.md file clearly).
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
