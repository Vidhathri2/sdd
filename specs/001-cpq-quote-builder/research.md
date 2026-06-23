# Research: Deal Studio CPQ Quote Builder

## Decision: Use server-side Next.js API routes for Salesforce integration

Rationale:
- The project is a Next.js POC and already includes an `app/` router.
- Salesforce OAuth and REST API calls must never expose credentials to the browser.
- Server-side routes keep Salesforce integration separate from UI rendering.

Alternatives considered:
- Client-side Salesforce API calls: rejected because Salesforce secrets would be exposed and OAuth flow would be harder to secure.
- External backend service: unnecessary for this POC since Next.js API routes provide built-in server-side capabilities.

## Decision: Use live Salesforce CPQ records for product selection

Rationale:
- The feature clarification explicitly requires sourcing product data from live Salesforce CPQ product records.
- A live source ensures the demo reflects actual org data and prevents divergence from Salesforce catalog structure.

Alternatives considered:
- Mock catalog or seeded local data: rejected because it does not meet the live-data requirement.

## Decision: Use in-memory/demo session state

Rationale:
- The app is a standalone POC and does not require persistent user sessions beyond browser flow.
- An in-memory or cookie-backed session is sufficient to retain OAuth tokens across the demo and simplify implementation.

Alternatives considered:
- Database-backed session storage: unnecessary for the POC and adds deployment complexity.

## Decision: Keep quote creation flow lightweight

Rationale:
- The POC emphasizes a working quote-building workflow over full CPQ pricing and approval logic.
- Quote creation will focus on product selection, quote metadata, contract summary, and page navigation.

Alternatives considered:
- Full CPQ rules engine integration: out of scope for this demo and would delay the core feature delivery.

## Assumptions clarified

- Salesforce Connected App credentials are managed via environment variables.
- Opportunity, Account, and Product2 records exist in the connected Salesforce org.
- Quote creation can be represented through the current app flow even if some Salesforce CPQ fields are placeholders.
