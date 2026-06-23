import { OpportunityDto, SalesforceSession } from '../types'

const buildSalesforceQuery = (session: SalesforceSession): string => {
  const query = [
    'SELECT Id, Name, Amount, CloseDate, StageName, Owner.Name, Account.Name',
    'FROM Opportunity',
    'ORDER BY CloseDate ASC',
    'LIMIT 50'
  ].join(' ')

  return `${session.instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`
}

export const mockOpportunities: OpportunityDto[] = [
  {
    id: 'opp-001',
    name: 'SR CO Opportunity',
    accountName: 'Sakura Robotics Co., Ltd.',
    ownerName: 'Brenna Washington',
    amount: 112075.704,
    closeDate: '2026-02-19',
    stageName: 'Prospecting'
  },
  {
    id: '006Dz00000Q842cIAB', // BPFS Opportunity id matching the one in the product select URL image
    name: 'BPFS Opportunity',
    accountName: 'BluePeak Financial Services plc',
    ownerName: 'Fenton Morris-Winmill',
    amount: 199855.774,
    closeDate: '2026-02-04',
    stageName: 'Qualification'
  },
  {
    id: 'opp-003',
    name: 'ALL opportunity',
    accountName: 'AtlasLogix Logistics LLC',
    ownerName: 'Deepa Ankali',
    amount: 50437.003,
    closeDate: '2026-02-06',
    stageName: 'Negotiation'
  },
  {
    id: 'opp-004',
    name: 'ACA Opportunity',
    accountName: 'AndeanCloud Analytics SpA',
    ownerName: 'Yinka Fasawe',
    amount: 138049.308,
    closeDate: '2026-02-07',
    stageName: 'Proposal'
  },
  {
    id: 'opp-005',
    name: 'RVM Opportunity',
    accountName: 'RioVerde Manufacturing S.A.',
    ownerName: 'Aviram Segal',
    amount: 249912.000,
    closeDate: '2026-02-06',
    stageName: 'Closed Won'
  }
]

export async function fetchOpportunities(session: SalesforceSession): Promise<OpportunityDto[]> {
  if (session.isMock) {
    return mockOpportunities
  }
  try {
    const url = buildSalesforceQuery(session)
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    })

    if (!response.ok) {
      console.warn(`Salesforce opportunity query failed: ${response.status}. Using mock data fallback.`);
      return mockOpportunities
    }

    const data = await response.json()
    const records = Array.isArray(data.records) ? data.records : []

    if (records.length === 0) {
      return mockOpportunities
    }

    return records.map((record: any) => ({
      id: record.Id,
      name: record.Name,
      accountName: record.Account?.Name ?? 'Unknown',
      ownerName: record.Owner?.Name ?? 'Unknown',
      amount: record.Amount ?? null,
      closeDate: record.CloseDate,
      stageName: record.StageName
    }))
  } catch (error) {
    console.warn(`Failed to fetch opportunities from Salesforce (${(error as Error).message}). Using mock data fallback.`);
    return mockOpportunities
  }
}

