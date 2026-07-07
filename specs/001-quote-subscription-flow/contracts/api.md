# Interface Contracts: Salesforce & CRM API Mock Schemas

This document defines the REST API endpoints and data payloads assumed for external integrations.

---

## 1. GET `/api/opportunities`
Fetches the active CRM opportunities for display on the landing list.

### Response Header
`Content-Type: application/json`

### Response Payload
```json
[
  {
    "id": "opp-98124",
    "name": "Cymbal Cloud Migration",
    "accountName": "Cymbal",
    "owner": "Marcus Aurelius",
    "amount": 250000.00,
    "closeDate": "2026-10-31",
    "primaryContact": {
      "name": "Sarah Connor",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
    }
  },
  {
    "id": "opp-76512",
    "name": "Acme Workspace Upgrade",
    "accountName": "Acme Corp",
    "owner": "Julius Caesar",
    "amount": 85000.00,
    "closeDate": "2026-08-15",
    "primaryContact": {
      "name": "John Doe",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
    }
  }
]
```

---

## 2. POST `/api/quotes`
Creates a draft Quote pre-associated with the opportunity and product catalog selection.

### Request Header
`Content-Type: application/json`

### Request Payload
```json
{
  "opportunityId": "opp-98124",
  "status": "Draft",
  "configuredProducts": ["Looker Core"]
}
```

### Response Header
`Content-Type: application/json`

### Response Payload
```json
{
  "id": "Q-1234",
  "opportunityId": "opp-98124",
  "status": "Draft",
  "configuredProducts": ["Looker Core"],
  "createdAt": "2026-07-07T10:00:00Z"
}
```

---

## 3. PUT `/api/quotes/{quoteId}`
Updates quote configurations, details fields, and period line items.

### Request Header
`Content-Type: application/json`

### Request Payload
```json
{
  "id": "Q-1234",
  "primaryContact": "Sarah Connor",
  "salesChannel": "Direct",
  "operationType": "New",
  "expirationDate": "2026-08-21",
  "billingFrequency": "Annual in Advance Anniversary",
  "termStartsOn": "Fixed Start Date",
  "termStartDate": "2026-02-01",
  "termEndDate": "2029-01-31",
  "subscriptionPeriods": [
    {
      "periodName": "Period 1",
      "startDate": "2026-02-01",
      "endDate": "2027-01-31",
      "discountPercentage": 50,
      "childProducts": [
        {
          "productLabel": "Standard User",
          "quantity": 10,
          "region": "Dallas (us-south-1)",
          "gcpProjectId": "gcp-proj-123",
          "lookerInstanceId": "looker-inst-123",
          "discountPercentage": 0,
          "basePrice": 30
        }
      ]
    }
  ],
  "status": "Submitted"
}
```

### Response Header
`Content-Type: application/json`

### Response Payload
```json
{
  "id": "Q-1234",
  "status": "Submitted",
  "updatedAt": "2026-07-07T10:15:00Z"
}
```
