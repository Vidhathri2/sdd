# Quickstart: Deal Studio CPQ Quote Builder

## Prerequisites
- Clone the repository and install dependencies.
- Configure Salesforce Connected App credentials in environment variables.
- Ensure the demo Salesforce org has accessible Opportunity, Account, and CPQ product records.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `SF_USERNAME`
   - `SF_PASSWORD`
   - `SF_SECURITY_TOKEN`
   - `SF_CONSUMER_KEY`
   - `SF_CONSUMER_SECRET`
   - `SF_INSTANCE_URL`
3. Start the app:
   - `npm install`
   - `npm run dev`

## Validation flow
1. Open the browser at `http://localhost:3000`.
2. Click the Salesforce login action.
3. Verify server-side Salesforce username-password authentication succeeds when the app starts.
4. Confirm the app redirects to the Opportunities landing page.
5. Verify live Opportunity rows are displayed with `Opportunity Name`, `Account Name`, `Owner`, `Amount`, and `Close Date`.
6. Select `Create Quote` from a row to navigate to product selection.
7. Filter products by family and search by keyword.
8. Add at least one product to the Added Products panel.
9. Click `Continue` to go to the Configure Quote page.
10. Verify the Configure Quote page shows:
    - Account name
    - Quote Number and Quote Name
    - `View in Salesforce` deep link
    - Details and Discounts and Incentives tabs
    - Total Commitment Period section with a stepper and amount fields
    - Contract summary panel with Billing Account, Billing Address, and Billing Currency
11. Click `Preview Approval` and confirm the placeholder button action is visible.

## Expected outcomes
- Salesforce login succeeds and the Opportunities list loads.
- Product selection and quote configuration flow works with at least one product added.
- The Configure Quote page displays quote metadata and contract summary fields.
- The demo remains server-side-only for Salesforce data access.
