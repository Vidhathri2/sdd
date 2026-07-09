# API Integration Specification — Deal Studio CPQ
**Status:** Canonical Spec | **Version:** 1.1 | **Protocols:** REST, Composite Graph API, Composite Tree & SObject APIs

This document provides a sequential, step-by-step description of all API endpoints executed across the Deal Studio subscription and commit lifecycle, including helper/ancillary services.

---

## Global API Configuration

*   **Salesforce Instance Base URL:** `https://vector--agivant2.sandbox.my.salesforce.com` (Decoupled and resolved via `ContextService` / Local Token Relay)
*   **Common Headers:**
    *   `Authorization: Bearer <accessToken>`
    *   `Content-Type: application/json`
    *   `Accept: application/json`

---

## 🔑 Authentication Sequence (Local Token Relay Service)

Executed during application startup to obtain dynamic active credentials from the local server.

### 1. Retrieve Active Salesforce Access Token (GET)
*   **Endpoint:** `GET http://localhost:3000/api/access-token`
*   **Service Method:** `ContextService.initContext`
*   **Description:** Requests the latest Salesforce authorization token and target environment instance URL from the local Node.js authentication helper application.
*   **Payload:** None
*   **Sample Response (JSON):**
    ```json
    {
      "success": true,
      "accessToken": "00DDx000000H0YK!ARYAQIIhYSE0z0IppUUpNlJ6.m.yrkRtx4JcPJeD_uWzQXidTLGBWqkoi075pNIYbJinTyEdEM_nb9gzgF1..YRdRsx4yKjS",
      "instanceUrl": "https://vector--agivant2.sandbox.my.salesforce.com"
    }
    ```

---

## 📋 Sequence 1: Opportunities List (Page 1)

### 3. Fetch Opportunities list (GET)
*   **Endpoint:** `/services/data/v65.0/query?q=SELECT Id,Name,StageName,Amount,CloseDate,Owner.Name,AccountId,Account.Name,Account.Website,CreatedDate,(SELECT Contact.Id,Contact.Name FROM OpportunityContactRoles) FROM Opportunity WHERE CreatedDate>=2026-01-28T00:00:00Z ORDER BY CreatedDate DESC LIMIT 5`
*   **Service Method:** `SalesforceApiService.getOpportunities`
*   **Description:** Fetches the five most recently created opportunities for selection.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "totalSize": 2,
      "done": true,
      "records": [
        {
          "attributes": { "type": "Opportunity", "url": "/services/data/v65.0/sobjects/Opportunity/006Dz00000OppId1" },
          "Id": "006Dz00000OppId1",
          "Name": "Acme Corp Cloud Expansion",
          "StageName": "Qualification",
          "Amount": 250000,
          "CloseDate": "2026-12-31",
          "AccountId": "001Dz00002AccId1",
          "Account": {
            "attributes": { "type": "Account", "url": "/services/data/v65.0/sobjects/Account/001Dz00002AccId1" },
            "Name": "Acme Corp",
            "Website": "https://acme.com"
          },
          "Owner": {
            "attributes": { "type": "User", "url": "/services/data/v65.0/sobjects/User/005Dz00000UserId1" },
            "Name": "Sarah Jenkins"
          },
          "CreatedDate": "2026-06-30T10:00:00.000+0000",
          "OpportunityContactRoles": {
            "totalSize": 1,
            "done": true,
            "records": [
              {
                "attributes": { "type": "OpportunityContactRole", "url": "/services/data/v65.0/sobjects/OpportunityContactRole/00KDz00000Role1" },
                "Contact": { "Id": "003Dz00000ContactId1", "Name": "John Doe" }
              }
            ]
          }
        }
      ]
    }
    ```

### 4. Fetch Enriched Opportunity Details (GET)
*   **Endpoint:** `/services/data/v65.0/query/?q=SELECT Id,Name,Amount,CloseDate,AccountId,Account.Name,Owner.Name,Pricebook2Id,Primary_Contact__c,Sales_Channel__c,(SELECT Contact.Name FROM OpportunityContactRoles WHERE IsPrimary = true) FROM Opportunity WHERE Id IN ('<Id1>','<Id2>',...)`
*   **Service Method:** `SalesforceApiService.getOpportunitiesDetails`
*   **Description:** Fetches primary contact role, channel information, and Pricebook settings for active mapping.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "totalSize": 1,
      "done": true,
      "records": [
        {
          "attributes": { "type": "Opportunity", "url": "/services/data/v65.0/sobjects/Opportunity/006Dz00000OppId1" },
          "Id": "006Dz00000OppId1",
          "Name": "Acme Corp Cloud Expansion",
          "Amount": 250000,
          "CloseDate": "2026-12-31",
          "AccountId": "001Dz00002AccId1",
          "Account": { "Name": "Acme Corp" },
          "Owner": { "Name": "Sarah Jenkins" },
          "Pricebook2Id": "01sf4000003ZgtzAAC",
          "Primary_Contact__c": "003Dz00000ContactId1",
          "Sales_Channel__c": "Direct",
          "OpportunityContactRoles": {
            "totalSize": 1,
            "done": true,
            "records": [
              { "Contact": { "Name": "John Doe" } }
            ]
          }
        }
      ]
    }
    ```

---

## 🔍 Sequence 2: Product Discovery & Checkout (Page 2)

### 5. Pre-fetch Product Bundles Catalogue (POST)
*   **Endpoint:** `/services/data/v65.0/connect/pcm/products`
*   **Service Method:** `RcaApiService.getProducts`
*   **Description:** Triggers load of all active products tagged as `Bundle` on category sidebar entrance.
*   **Payload:**
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
      "additionalFields": {
        "Product2": {
          "fields": ["Family", "Name"]
        }
      }
    }
    ```
*   **Sample Response:**
    ```json
    {
      "products": [
        {
          "id": "01tDz00000BundleId1",
          "name": "Looker Enterprise Bundle",
          "description": "Multi-tier Looker Platform and User Bundle for large organizations.",
          "family": "Other",
          "productId": "01tDz00000BundleId1",
          "pricebookEntryId": "01uDz00000PbeId1",
          "categoryId": "cat-other"
        }
      ]
    }
    ```

### 6. Faceted Product Search & Filtering (POST)
*   **Endpoint:** `/services/data/v66.0/connect/pcm/products?productClassificationId=<classificationId>&include=/products`
*   **Service Method:** `RcaApiService.facetedProductSearch`
*   **Description:** Refines product catalogue using sidebar filters.
*   **Payload:**
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
*   **Sample Response:** Standard array format listing filtered products.

### 7. Place Graph Quote Transaction (POST)
*   **Endpoint:** `/services/data/v65.0/connect/rev/sales-transaction/actions/place`
*   **Service Method:** `SalesforceApiService.createQuoteWithLines`
*   **Description:** Creates the parent `Quote` and adds the selected root `QuoteLineItem` bundle atomically.
*   **Payload:**
    ```json
    {
      "pricingPref": "Skip",
      "catalogRatesPref": "Skip",
      "configurationPref": {
        "configurationMethod": "Skip",
        "configurationOptions": {
          "executeConfigurationRules": false,
          "addDefaultConfiguration": false
        }
      },
      "taxPref": "Skip",
      "contextDetails": {},
      "graph": {
        "graphId": "createQuoteWithBundle",
        "records": [
          {
            "referenceId": "refQuote",
            "record": {
              "attributes": {
                "method": "POST",
                "type": "Quote"
              },
              "Name": "DealManagement-2026-07-08T11:00:00Z",
              "OpportunityId": "006Dz00000OppId1",
              "Pricebook2Id": "01sf4000003ZgtzAAC",
              "StartDate": "2026-07-08",
              "ExpirationDate": "2026-08-07"
            }
          },
          {
            "referenceId": "refQuoteLine0",
            "record": {
              "attributes": {
                "type": "QuoteLineItem",
                "method": "POST"
              },
              "QuoteId": "@{refQuote.id}",
              "Product2Id": "01tDz00000BundleId1",
              "PricebookEntryId": "01uDz00000PbeId1",
              "Quantity": 1,
              "StartDate": "2026-07-08",
              "EndDate": "2027-07-07",
              "PeriodBoundary": "Anniversary"
            }
          }
        ]
      }
    }
    ```
*   **Sample Response:**
    ```json
    {
      "salesTransactionId": "00QDz00000QuoteId1",
      "success": true,
      "errors": []
    }
    ```

### 8. Fetch Initial Generated Quote Details (GET)
*   **Endpoint:** `/services/data/v65.0/sobjects/Quote/00QDz00000QuoteId1`
*   **Service Method:** `SalesforceApiService.getQuoteDetails`
*   **Description:** Resolves the internal, Salesforce auto-generated `QuoteNumber` (e.g. Q-000025) before redirecting to the builder screen.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "Id": "00QDz00000QuoteId1",
      "Name": "DealManagement-2026-07-08T11:00:00Z",
      "QuoteNumber": "Q-000025",
      "OpportunityId": "006Dz00000OppId1",
      "Pricebook2Id": "01sf4000003ZgtzAAC"
    }
    ```

---

## 🛠️ Sequence 3: Subscription & Config (Page 3)

### 9. Load Active Bundle Quote Line Items (GET)
*   **Endpoint:** `/services/data/v60.0/query/?q=SELECT Id,Product2Id,Product2.Name,Product2.Type FROM QuoteLineItem WHERE QuoteId='00QDz00000QuoteId1' AND Product2.Type='Bundle'`
*   **Service Method:** `SalesforceApiService.getBundleQuoteLineItems`
*   **Description:** Fetches the cart items loaded in previous page flow to configure.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "totalSize": 1,
      "done": true,
      "records": [
        {
          "attributes": { "type": "QuoteLineItem", "url": "/services/data/v60.0/sobjects/QuoteLineItem/0QLDz00000BundleLineId1" },
          "Id": "0QLDz00000BundleLineId1",
          "Product2Id": "01tDz00000BundleId1",
          "Product2": {
            "Name": "Looker Enterprise Bundle",
            "Type": "Bundle"
          },
          "PricebookEntryId": "01uDz00000PbeId1"
        }
      ]
    }
    ```

### 10. Load Salesforce Form Picklists (GET)
*   **Endpoint:** `/services/data/v65.0/ui-api/object-info/Quote/picklist-values/012000000000000AAA`
*   **Service Method:** `SalesforceApiService.getAllPicklistValues`
*   **Description:** Dynamically populates form inputs (Billing Frequency, Operation Type, Term Starts On).
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "picklistFieldValues": {
        "Billing_Frequency__c": {
          "values": [
            { "label": "Annual", "value": "Annual" },
            { "label": "Semi-Annual", "value": "Semi-Annual" },
            { "label": "Quarterly", "value": "Quarterly" },
            { "label": "Monthly", "value": "Monthly" }
          ]
        },
        "Operation_Type__c": {
          "values": [
            { "label": "New", "value": "New" },
            { "label": "Migration", "value": "Migration" },
            { "label": "Existing Upgrade", "value": "Existing Customer Upgrade" }
          ]
        }
      }
    }
    ```

### 11. Fetch PCM Bundle Child Hierarchy (GET)
*   **Endpoint:** `/services/data/v65.0/connect/pcm/products/01tDz00000BundleId1`
*   **Service Method:** `RcaApiService.getProductDetails`
*   **Description:** Fetches allowed sub-products in the bundle (e.g., Platforms, Developer seats, Viewer seats) for Looker multi-tier layouts.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "id": "01tDz00000BundleId1",
      "name": "Looker Enterprise Bundle",
      "childProducts": [
        {
          "productId": "01tDz00000PlatformId1",
          "name": "Looker Enterprise Platform",
          "relationshipType": "Platform"
        },
        {
          "productId": "01tDz00000DevUserId",
          "name": "Looker Developer User",
          "relationshipType": "User"
        }
      ]
    }
    ```

### 12. Fetch Child Product Unit Prices (GET)
*   **Endpoint:** `/services/data/v65.0/query/?q=SELECT Id,Pricebook2Id,UnitPrice,IsActive,Product2Id FROM PricebookEntry WHERE Product2Id IN ('01tDz00000PlatformId1','01tDz00000DevUserId')`
*   **Service Method:** `SalesforceApiService.getPricebookEntries`
*   **Description:** Resolves unit list prices based on active Pricebook configurations.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "totalSize": 2,
      "done": true,
      "records": [
        {
          "Id": "01uDz00000PlatformPbe1",
          "Pricebook2Id": "01sf4000003ZgtzAAC",
          "UnitPrice": 60000.0,
          "IsActive": true,
          "Product2Id": "01tDz00000PlatformId1"
        },
        {
          "Id": "01uDz00000DevUserPbe",
          "Pricebook2Id": "01sf4000003ZgtzAAC",
          "UnitPrice": 1200.0,
          "IsActive": true,
          "Product2Id": "01tDz00000DevUserId"
        }
      ]
    }
    ```

### 13. Fetch Quote Live Document/Approval Preview (GET - Parallel execution)
*   **Endpoint:** `forkJoin` of two sub-requests:
    1.  `GET /services/data/v66.0/query/?q=SELECT Id,Name,QuoteNumber,Status,GrandTotal,StartDate,ExpirationDate,Pricebook2Id,Opportunity.Name,Opportunity.Sales_Channel__c... FROM Quote WHERE Id='00QDz00000QuoteId1'`
    2.  `GET /services/data/v66.0/query/?q=SELECT Id,QuoteId,Product2Id,PricebookEntryId,Product2.Name,Product2.ProductCode,Product2.Family,Product2.Type,Product2.Description,Quantity,UnitPrice,TotalPrice,ListPrice,StartDate,EndDate,Discount,Incentive__c,NetUnitPrice,SortOrder FROM QuoteLineItem WHERE QuoteId='00QDz00000QuoteId1' ORDER BY SortOrder ASC LIMIT 2000`
*   **Service Method:** `SalesforceApiService.getQuotePreview`
*   **Description:** Retrieves state of updated database values to render visual PDF previews.
*   **Payload:** None
*   **Sample Response (Joined):**
    ```json
    {
      "quote": {
        "Id": "00QDz00000QuoteId1",
        "QuoteNumber": "Q-000025",
        "GrandTotal": 124500,
        "StartDate": "2026-07-08",
        "ExpirationDate": "2026-08-07",
        "Opportunity": { "Name": "Acme Corp Cloud Expansion" },
        "Account": { "Name": "Acme Corp", "Website": "https://acme.com" }
      },
      "lines": [
        {
          "Id": "0QLDz00000BundleLineId1",
          "Product2": { "Name": "Looker Enterprise Bundle", "ProductCode": "LKR-ENT-BND" },
          "Quantity": 1,
          "UnitPrice": 124500,
          "TotalPrice": 124500
        }
      ]
    }
    ```

---

## 💾 Sequence 4: Commit Flow (Submission & Creation)

Executed sequentially when "Create Contract" or "Submit" is triggered.

### 14. Save Term & Date Configurations (PATCH)
*   **Endpoint:** `/services/data/v65.0/composite/sobjects`
*   **Service Method:** `SalesforceApiService.updateQuoteDates`
*   **Description:** Performs bulk patch updates to set start/expiration boundaries, global terms, and custom Quote Line Item fields.
*   **Payload:**
    ```json
    {
      "allOrNone": true,
      "records": [
        {
          "attributes": {
            "type": "Quote"
          },
          "id": "00QDz00000QuoteId1",
          "StartDate": "2026-07-08",
          "ExpirationDate": "2026-08-07",
          "Term__c": 36,
          "Total_Commitment_Value__c": 181200
        }
      ]
    }
    ```
*   **Sample Response:**
    ```json
    [
      {
        "id": "00QDz00000QuoteId1",
        "success": true,
        "errors": []
      }
    ]
    ```

### 15. Create Commitment Periods Tree (POST)
*   **Endpoint:** `/services/data/v65.0/composite/tree/Commitment_Details__c`
*   **Service Method:** `SalesforceApiService.createQuoteLineCommitments`
*   **Description:** Creates all relational nested period objects inside Salesforce representing the Looker platform, users, and durations.
*   **Payload:**
    ```json
    {
      "records": [
        {
          "attributes": {
            "type": "Commitment_Details__c",
            "referenceId": "refPeriod1_Platform"
          },
          "Name": "Looker Enterprise Platform - Period 1",
          "Start_Date__c": "2026-07-08",
          "End_Date__c": "2027-07-07",
          "Discount__c": 10,
          "Quantity__c": 1,
          "Product__c": "01tDz00000PlatformId1",
          "Price_Book_Entry_Id__c": "01uDz00000PlatformPbe1",
          "Quote_Line_Item__c": "0QLDz00000BundleLineId1",
          "Relationship_Type_Id__c": "Platform",
          "Period_Number__c": 1
        }
      ]
    }
    ```
*   **Sample Response:**
    ```json
    {
      "hasErrors": false,
      "results": [
        {
          "referenceId": "refPeriod1_Platform",
          "id": "a00Dz00000CommitId1"
        }
      ]
    }
    ```

---

## 🛠️ Sequence 5: Active Helper & Ancillary APIs

These APIs are active and triggered by sub-components or nested pages during configuration.

### 16. Fetch Product Classifications (GET)
*   **Endpoint:** `/services/data/v66.0/query?q=SELECT Id,Name,Code,It_has_Bundle_Products__c,No_Of_Child_Products__c,Status FROM ProductClassification WHERE Parent_Bundle_Product_ID__c='<parentBundleId>'`
*   **Service Method:** `RcaApiService.getProductClassifications`
*   **Description:** Fetches classification groups related to a bundle to categorize products.
*   **Payload:** None
*   **Sample Response:**
    ```json
    {
      "totalSize": 2,
      "done": true,
      "records": [
        {
          "Id": "11BDz00000000NvMAI",
          "Name": "Looker Enterprise Platform",
          "Code": "LKR-PLATFORM"
        }
      ]
    }
    ```

### 17. Fetch CPQ Products under Classification (POST)
*   **Endpoint:** `/services/data/v61.0/connect/cpq/products?limit=<limit>&offset=<offset>`
*   **Service Methods:** `RcaApiService.getCpqProducts` / `RcaApiService.getProductsByClassification`
*   **Description:** Retrieves individual CPQ product options and PricebookEntryIds for pricing mapping.
*   **Payload:**
    ```json
    {
      "productClassificationId": "11BDz00000000NvMAI",
      "priceBookId": "01sf4000003ZgtzAAC",
      "additionalFields": {
        "Product2": {
          "fields": ["RCA_Sort_order__c"]
        }
      }
    }
    ```
*   **Sample Response:**
    ```json
    {
      "result": [
        {
          "productId": "01tDz00000PlatformId1",
          "pricebookEntryId": "01uDz00000PlatformPbe1",
          "sortOrder": 1
        }
      ]
    }
    ```

### 18. Fetch Dropdown Options (POST)
*   **Endpoint:** `/services/data/v61.0/connect/cpq/products`
*   **Service Method:** `RcaApiService.getDropdownOptions`
*   **Description:** Fetch CPQ items (up to limit 999) under a classification to extract filter options in dropdowns.
*   **Payload:**
    ```json
    {
      "limit": 999,
      "productClassificationId": "11BDz00000000NvMAI",
      "priceBookId": "01sf4000003ZgtzAAC"
    }
    ```

### 19. Fetch Bundle Product Components (POST)
*   **Endpoint:** `/services/data/v65.0/connect/cpq/products/<bundleId>`
*   **Service Method:** `SalesforceApiService.getBundleDetails`
*   **Description:** Resolves product group components inside the CPQ connector.
*   **Payload:** `{}`
*   **Sample Response:** Array of component records in the bundle.

### 20. Fetch Product Relationship Type ID (GET)
*   **Endpoint:** `/services/data/v65.0/query/?q=SELECT Id, Name FROM ProductRelationshipType WHERE Name = 'Bundle to Bundle Component Relationship' LIMIT 1`
*   **Service Method:** `SalesforceApiService.getProductRelationshipType`
*   **Description:** Checks bundling relationships for Salesforce record rules.
*   **Payload:** None

### 21. Fetch Quote Line Items List (GET)
*   **Endpoint:** `/services/data/v59.0/query/?q=SELECT Id,Product2Id,PricebookEntryId FROM QuoteLineItem WHERE QuoteId='<quoteId>'`
*   **Service Method:** `SalesforceApiService.getQuoteLineItems`
*   **Description:** Retrieves basic IDs of all QuoteLineItems mapped to the quote.
*   **Payload:** None

### 22. Perform Salesforce Connect Global Search (POST)
*   **Endpoint:** `/services/data/v65.0/connect/pcm/products?include=/products`
*   **Service Method:** `RcaApiService.searchProducts`
*   **Description:** Searches products in the catalog by term.
*   **Payload:**
    ```json
    {
      "filter": {
        "criteria": [
          { "property": "isActive", "operator": "eq", "value": true }
        ]
      },
      "pageSize": 20,
      "offset": 0,
      "searchTerm": "Looker"
    }
    ```

### 23. Update Quote Dates via SObject PATCH (PATCH)
*   **Endpoint:** `/services/data/v65.0/sobjects/Quote/<quoteId>`
*   **Service Method:** `SalesforceApiService.patchQuoteDates`
*   **Description:** Standard REST PATCH to adjust start and end date of Quote without changing sub-lines.
*   **Payload:**
    ```json
    {
      "StartDate": "2026-07-08",
      "ExpirationDate": "2026-08-07"
    }
    ```

### 24. Place Graph Request without Save parameter (POST)
*   **Endpoint:** `/services/data/v65.0/connect/rev/sales-transaction/actions/place`
*   **Service Method:** `SalesforceApiService.placeGraphRequest`
*   **Description:** Performs Place API actions with the `save` property stripped from request body.

---

## 💤 Sequence 6: Declared Helpers (Not Actively Called in UI)

These API methods are declared in `SalesforceApiService` but not actively referenced or bound inside page or component controller logic:

1.  **`placeOrder(payload)`** (Visualforce Remoting: `QuoteController.placeOrder`)
2.  **`getOpportunityDetails(opportunityId)`** (GET: `/services/data/v65.0/query/?q=SELECT Id, Name, AccountId, Account.Name, Pricebook2Id, Primary_Contact__c, Sales_Channel__c FROM Opportunity WHERE Id = '<id>'`) - *Note: opportunities.component uses getOpportunitiesDetails instead.*
3.  **`getAccountDetails(accountId)`** (GET: `/services/data/v65.0/sobjects/Account/<accountId>`)
4.  **`getContactDetails(contactId)`** (GET: `/services/data/v65.0/sobjects/Contact/<contactId>`)
5.  **`getRecentProducts()`** (GET: `/services/data/v65.0/query?q=SELECT Id, Name, Family, LastModifiedDate FROM Product2 ORDER BY LastModifiedDate DESC LIMIT 5`)
6.  **`getProductPicklistValues()`** (GET: `/services/data/v65.0/ui-api/object-info/Product2/picklist-values/012000000000000AAA/`)
7.  **`globalSearchProducts(...)`** (POST: `/services/data/v65.0/connect/pcm/products?include=/products`)
