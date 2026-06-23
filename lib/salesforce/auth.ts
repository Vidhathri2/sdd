import { SalesforceSession } from '../types'
import { cookies } from 'next/headers'
import { parseSessionCookie } from '../session'

let cachedSession: SalesforceSession | null = null

const getEnv = (): {
  username: string
  password: string
  securityToken: string
  consumerKey: string
  consumerSecret: string
  instanceUrl: string
} => {
  const username = process.env.SF_USERNAME
  const password = process.env.SF_PASSWORD
  const securityToken = process.env.SF_SECURITY_TOKEN
  const consumerKey = process.env.SF_CONSUMER_KEY
  const consumerSecret = process.env.SF_CONSUMER_SECRET
  const instanceUrl = process.env.SF_INSTANCE_URL

  if (!username || !password || !securityToken || !consumerKey || !consumerSecret || !instanceUrl) {
    throw new Error('Missing Salesforce username-password configuration')
  }

  return { username, password, securityToken, consumerKey, consumerSecret, instanceUrl }
}

export async function authenticateDirectly(): Promise<SalesforceSession> {
  const { username, password, securityToken, consumerKey, consumerSecret, instanceUrl } = getEnv()
  const tokenUrl = `${instanceUrl.replace(/\/$/, '')}/services/oauth2/token`
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: consumerKey,
    client_secret: consumerSecret,
    username,
    password: `${password}${securityToken}`
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error_description || `Authentication failed with status ${response.status}`)
  }

  const data = await response.json()

  if (!data.access_token || !data.instance_url) {
    throw new Error('Salesforce authentication returned invalid payload')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    instanceUrl: data.instance_url,
    userId: data.id ?? 'unknown',
    issuedAt: `${Date.now()}`,
    isMock: false,
    username
  }
}

export async function getSalesforceSession(): Promise<SalesforceSession> {
  // 1. Try to get session from cookie
  try {
    const cookieStore = cookies()
    const cookieHeader = cookieStore.toString()
    const session = parseSessionCookie(cookieHeader)
    if (session) {
      return session
    }
  } catch (error) {
    // Ignore error if cookies() is called outside request context (e.g. static generation)
  }

  // 2. Fall back to cached session
  if (cachedSession) {
    return cachedSession
  }

  // 3. Authenticate with env variables directly
  try {
    const session = await authenticateDirectly()
    cachedSession = session
    return session
  } catch (error) {
    console.warn(`Salesforce authentication failed: ${(error as Error).message}. Using mock session fallback.`);
    const mockSession = getMockSession()
    cachedSession = mockSession
    return mockSession
  }
}

export function getMockSession(): SalesforceSession {
  return {
    accessToken: 'mock-access-token',
    instanceUrl: 'https://agivant-8f-dev-ed.develop.my.salesforce.com',
    userId: 'mock-user-id',
    issuedAt: `${Date.now()}`,
    isMock: true,
    username: process.env.SF_USERNAME || 'googledemoorg@agivant.com'
  }
}


