export type SalesforceSession = {
  accessToken: string
  refreshToken?: string
  instanceUrl: string
  userId: string
  issuedAt: string
  isMock?: boolean
  username?: string
}

export type OpportunityDto = {
  id: string
  name: string
  accountName: string
  ownerName: string
  amount: number | null
  closeDate: string
  stageName?: string
}

export type ProductDto = {
  id: string
  name: string
  family: string
  description?: string
  unitPrice: number
}

export type QuoteDraftPayload = {
  opportunityId: string
  quoteName: string
  primaryContactId?: string
  salesChannel?: string
  quoteStartDate?: string
  quoteExpirationDate?: string
  commitmentPeriods?: Array<{ periodMonths: number; amount: number }>
  selectedProducts: Array<{ productId: string; quantity: number; unitPrice: number }>
}

export type SalesforceQuoteResult = {
  quoteId: string
  quoteNumber: string
  quoteName: string
  salesforceUrl: string
}
