# Data Model: Deal Studio CPQ Quote Builder

## Opportunity
- Source: Salesforce Opportunity
- Key fields:
  - `Id`: Salesforce Opportunity Id
  - `Name`: Opportunity Name
  - `AccountId`: related Account Id
  - `Account.Name`: Account Name
  - `Owner.Name`: Opportunity Owner
  - `Amount`: Opportunity Amount
  - `CloseDate`: Opportunity Close Date
  - `StageName`: Opportunity Stage
- Use: populate the Opportunities landing page and provide context for quote creation.

## Account
- Source: Salesforce Account
- Key fields:
  - `Id`: Salesforce Account Id
  - `Name`: Account Name
  - `Website`: Account Website
  - `BillingAddress`: Billing Address fields
  - `BillingAccountId`: billing account identifier if present in account metadata
  - `BillingCurrency`: Currency for billing
- Use: display contract summary and account metadata on the Configure Quote page.

## Product
- Source: Salesforce CPQ Product2 and related price-book objects
- Key fields:
  - `Id`: Salesforce Product2 Id
  - `Name`: Product Name
  - `Family`: Product Family
  - `Description`: Product description or informational text
  - `UnitPrice`: selected price from a price book entry or product catalog
- Use: product search, filtering by family, and selected product list on the Select Products page.

## QuoteDraft
- Source: application state in the demo UI
- Fields:
  - `opportunityId`: selected Opportunity Id
  - `accountId`: selected Account Id
  - `quoteNumber`: generated quote number for preview purposes
  - `quoteName`: default quote name derived from opportunity or account
  - `primaryContactId`: chosen contact for the quote
  - `salesChannel`: selected sales channel
  - `quoteStartDate`: configured quote start date
  - `quoteExpirationDate`: configured quote expiration date
  - `commitmentPeriods`: array of commitment period items
  - `selectedProducts`: list of selected Product items with quantity and unit price
- Use: represent the quote configuration before final submission.

## CommitmentPeriod
- Fields:
  - `periodMonths`: number of months for this commitment period
  - `amount`: quoted amount for the period
- Use: support the Configure Quote page requirement for a Total Commitment Period section.

## QuoteSummary
- Derived from the quote draft and related Salesforce records
- Fields:
  - `contractStartDate`
  - `term`
  - `paymentAccount`
  - `billingAccount`
  - `billingAccountId`
  - `billingAddress`
  - `billingCurrency`
- Use: display the read-only contract summary panel on Configure Quote.

## Relationships
- Opportunity → Account: one-to-one via `AccountId`
- Opportunity → QuoteDraft: one quote draft per selected opportunity in the demo flow
- Product → QuoteDraft.selectedProducts: many selected products can be added to a quote draft
- QuoteDraft → CommitmentPeriod: a quote draft can include multiple commitment periods
