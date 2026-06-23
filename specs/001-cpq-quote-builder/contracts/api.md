# API Contracts: Deal Studio CPQ Quote Builder

## Authentication Flow
- Salesforce authentication occurs entirely server-side using username-password credentials from environment variables.
- There is no browser-side OAuth redirect or callback route.
- The app uses a cached Salesforce access token for server-side API requests.

## GET /api/salesforce/opportunities
- Purpose: return the authenticated user's Opportunity list.
- Request: authenticated session cookie only.
- Response:
  - `200 OK`
  - Body:
    ```json
    {
      "opportunities": [
        {
          "id": "006...",
          "name": "Deal Opportunity",
          "accountName": "Acme Inc.",
          "ownerName": "Sales Rep",
          "amount": 125000,
          "closeDate": "2026-07-31"
        }
      ]
    }
    ```
- Errors:
  - `401 Unauthorized` if no valid session exists.
  - `500 Internal Server Error` for Salesforce API failures.

## GET /api/salesforce/products
- Purpose: return a filtered list of CPQ products for selection.
- Query parameters:
  - `family` (optional)
  - `search` (optional)
- Response:
  - `200 OK`
  - Body:
    ```json
    {
      "products": [
        {
          "id": "01t...",
          "name": "Premium Support",
          "family": "Services",
          "description": "Managed premium support",
          "unitPrice": 1250
        }
      ]
    }
    ```
- Errors:
  - `401 Unauthorized` if session missing.
  - `500 Internal Server Error` for Salesforce API failures.

## POST /api/salesforce/quotes
- Purpose: create a quote draft or Salesforce Quote record from selected products.
- Request body:
  ```json
  {
    "opportunityId": "006...",
    "quoteName": "Deal Studio Quote",
    "primaryContactId": "003...",
    "salesChannel": "Direct",
    "quoteStartDate": "2026-07-01",
    "quoteExpirationDate": "2026-08-01",
    "commitmentPeriods": [
      { "periodMonths": 12, "amount": 15000 }
    ],
    "selectedProducts": [
      { "productId": "01t...", "quantity": 1, "unitPrice": 1250 }
    ]
  }
  ```
- Response:
  - `200 OK`
  - Body:
    ```json
    {
      "quoteId": "0Q0...",
      "quoteNumber": "DSQ-0001",
      "quoteName": "Deal Studio Quote",
      "salesforceUrl": "https://yourinstance.lightning.force.com/lightning/r/Quote/0Q0.../view"
    }
    ```
- Errors:
  - `400 Bad Request` for missing required fields.
  - `401 Unauthorized` if there is no active session.
  - `500 Internal Server Error` for quote creation or Salesforce API failures.

## Session and Security
- All Salesforce API requests require the user to be authenticated via the session cookie.
- No Salesforce credentials are exposed in browser-side code.
- The API should validate session state before proxying requests to Salesforce.
