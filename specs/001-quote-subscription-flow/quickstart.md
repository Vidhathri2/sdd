# Quickstart Validation Guide

This guide describes how to run and validate the Quote Creation & Subscription Period Configuration application.

---

## 1. Prerequisites & Installation

1. Install **Node.js** (v18 or higher recommended).
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 2. Running the Application Locally

1. Start the Vite development server:
   ```bash
   npm run dev
   ```
2. Open the URL printed in the terminal (typically `http://localhost:5173`) in your web browser.

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Opportunity Selection & Navigation
1. Open the landing page. Verify the "Deal Studio" title and the "Opportunities" table loaded.
2. Hover over any row (e.g., "Cymbal Cloud Migration"). Click the three-dots icon `⋮` on the right.
3. Verify a floating popup shows the **Create Quote** action with a `+` icon.
4. Click **Create Quote**. Verify the URL updates and the system transitions to the **Select Products** catalog page.

### Scenario 2: Product Discovery & Cart Slide-Out
1. On the product selection page, search for "Looker" in the keyword search bar. Verify cards filter dynamically.
2. Select the `GCP` filter from the left sidebar. Verify only `Google Cloud Platform` and `Looker Core` cards are visible.
3. Click `+ Add` on `Looker Core`.
4. Verify the button text changes to `✓ Added` and the `Added products` cart drawer slides out from the right.
5. Click `Continue` in the cart drawer. Verify you are redirected to the double-tab quote editor at `/configure-quote/{quoteId}`.

### Scenario 3: Date Sync & Validation Rules
1. In the **Details** tab, select `Fixed Start Date` under `Term Starts on`.
2. Select `Feb 1, 2026` for `Term Start Date` and `Jan 31, 2029` for `Term End Date` (exactly 3 years/36 months).
3. Swap to the **Plans & Discounts** tab. Verify the read-only `Subscription Start Date` matches `Feb 1, 2026` and `Subscription End Date` matches `Jan 31, 2029`.
4. Return to the **Details** tab and change the start date to `Mar 1, 2026`.
5. Switch back to **Plans & Discounts** and verify the read-only dates synced.

### Scenario 4: Period Ramp Generation & Submit
1. In the **Plans & Discounts** tab, click **+ Create subscription periods**.
2. Select `Yearly` frequency in the modal and click **Create**.
3. Verify that 3 sequential periods are generated:
   - Period 1: `Mar 1, 2026` to `Feb 28, 2027`
   - Period 2: `Mar 1, 2027` to `Feb 28, 2028`
   - Period 3: `Mar 1, 2028` to `Feb 28, 2029`
4. Expand Period 1. Change the `Developer User` quantity from `0` to `5`.
5. Click **Submit**. Verify that inline validation errors highlight the empty `Region`, `GCP Project ID`, and `Looker Instance Id` fields in red.
6. Populate the child license inputs:
   - Region: `Dallas (us-south-1)`
   - GCP Project ID: `gcp-proj-looker`
   - Looker Instance Id: `looker-inst-1`
7. Click **Submit**. Verify that the quote transitions successfully, the table/wizard locks, and a success confirmation notification displays.
