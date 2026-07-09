# Quickstart Validation Guide
 
This guide describes how to run and validate the Quote Creation, Subscription Period, & GCP Commitment configuration application.
 
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
1. On the product selection page, search for "Looker" or "Platform" in the keyword search bar. Verify cards filter dynamically.
2. Select the `GCP` filter from the left sidebar. Verify only `Google Cloud Platform` and `Looker Core` cards are visible.
3. Click `+ Add` on either card and verify it is added to the cart drawer on the right.
4. Click `Continue` in the cart drawer. Verify you are redirected to the double-tab quote editor at `/configure-quote/{quoteId}`.
 
### Scenario 3: Looker Date Sync, Period Ramp Generation, & Submit
1. In the **Details** tab for a Looker quote, select `Fixed Start Date` under `Term Starts on`.
2. Select `Feb 1, 2026` for `Term Start Date` and `Jan 31, 2029` for `Term End Date` (exactly 3 years/36 months).
3. Swap to the **Plans & Discounts** tab. Verify the read-only `Subscription Start Date` matches `Feb 1, 2026` and `Subscription End Date` matches `Jan 31, 2029`.
4. Click **+ Create subscription periods**, select `Yearly` in the modal, and click **Create**.
5. Verify 3 sequential 1-year periods are generated with no overlaps.
6. Expand Period 1, set `Developer User` quantity to `5`, and try to click **Submit**. Verify that inline errors highlight empty `Region`, `GCP Project ID`, and `Looker Instance Id` in red.
7. Fill in the missing values and click **Submit**. Verify quote submission success toast is shown.
 
### Scenario 4: GCP Commitment Accordion & Shorthand Parsing
1. In the **Details** tab for a GCP quote, change the `Quote Start Date` to `Feb 1, 2026`.
2. Verify `Quote Expiration Date` automatically shifts to `Mar 3, 2026` (30 days later) and is disabled.
3. Swap to the **Plans & Discounts** tab. Verify `Subscription Start Date` is `Feb 1, 2026`.
4. Verify that exactly one commitment period card (`Commit Period 1`) exists by default.
5. Expand the card, set `Months` to `12` and type `100k` in the `Amount` field.
6. Blur the input and verify it parses shorthand to `$100,000` and `Subscription End Date` calculates to `Jan 31, 2027`.
7. Click **+ Add Period**. Verify `Commit Period 2` is appended.
8. Set `Months` to `24` and `Amount` to `1.5M` (parsed to `$1,500,000`). Verify `Subscription End Date` shifts to `Jan 31, 2029`.
9. Click **Submit** and verify the successful submission screen state.
