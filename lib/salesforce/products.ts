import { ProductDto, SalesforceSession } from '../types'

const buildProductQuery = (family?: string, search?: string): string => {
  const filters: string[] = []
  if (family) {
    filters.push(`Family = '${family.replace(/'/g, "\\'")}'`)
  }
  if (search) {
    const escaped = search.replace(/'/g, "\\'")
    filters.push(`Name LIKE '%${escaped}%'`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  return [
    'SELECT Id, Name, Family, Description, IsActive',
    'FROM Product2',
    whereClause,
    'ORDER BY Name ASC',
    'LIMIT 100'
  ]
    .filter(Boolean)
    .join(' ')
}

const buildProductUrl = (session: SalesforceSession, family?: string, search?: string): string => {
  const query = buildProductQuery(family, search)
  return `${session.instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`
}

export const mockProducts: ProductDto[] = [
  {
    id: 'prod-001',
    name: 'Google Cloud Platform RCA',
    family: 'GCP',
    description: 'Core compute, storage, and observability services for enterprise workloads.',
    unitPrice: 2750
  },
  {
    id: 'prod-006',
    name: 'Looker New RCA',
    family: 'GCP',
    description: 'Business intelligence and embedded analytics platform.',
    unitPrice: 3200
  },
  {
    id: 'prod-002',
    name: 'Google Workspace Secure Suite',
    family: 'Google Workspace',
    description: 'Team collaboration tools with advanced security and compliance.',
    unitPrice: 999
  },
  {
    id: 'prod-003',
    name: 'Maps Platform NextGen',
    family: 'Maps',
    description: 'Location intelligence and route optimization for global fleets.',
    unitPrice: 420
  },
  {
    id: 'prod-004',
    name: 'Chrome Enterprise Plus',
    family: 'Chrome',
    description: 'Managed browser platform for secure device fleets.',
    unitPrice: 129
  },
  {
    id: 'prod-005',
    name: 'PSO Advisory Pack',
    family: 'PSO',
    description: 'Professional services engagement to accelerate cloud adoption.',
    unitPrice: 15900
  }
]

export async function fetchProducts(
  session: SalesforceSession,
  family?: string,
  search?: string
): Promise<ProductDto[]> {
  if (session.isMock) {
    return filterMockProducts(family, search)
  }
  try {
    const url = buildProductUrl(session, family, search)
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    })

    if (!response.ok) {
      console.warn(`Salesforce product query failed: ${response.status}. Using mock products fallback.`);
      return filterMockProducts(family, search)
    }

    const data = await response.json()
    const records = Array.isArray(data.records) ? data.records : []

    if (records.length === 0) {
      return filterMockProducts(family, search)
    }

    return records
      .filter((record: any) => record.IsActive)
      .map((record: any) => ({
        id: record.Id,
        name: record.Name,
        family: record.Family ?? 'Unknown',
        description: record.Description ?? '',
        unitPrice: 100 // default or mock unit price
      }))
  } catch (error) {
    console.warn(`Failed to fetch products from Salesforce (${(error as Error).message}). Using mock products fallback.`);
    return filterMockProducts(family, search)
  }
}

function filterMockProducts(family?: string, search?: string): ProductDto[] {
  return mockProducts.filter((product) => {
    const matchesFamily = family ? product.family.toLowerCase() === family.toLowerCase() : true
    const matchesSearch = search ? product.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchesFamily && matchesSearch
  })
}

