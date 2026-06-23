import { SalesforceSession } from './types'

const SESSION_COOKIE_NAME = 'deal_studio_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 1 day

export function createSessionCookie(session: SalesforceSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64')
  const cookie = `${SESSION_COOKIE_NAME}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
  return cookie
}

export function parseSessionCookie(cookieHeader: string | null): SalesforceSession | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(/;\s*/)
  const cookie = cookies.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!cookie) return null

  try {
    const encoded = cookie.split('=')[1]
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const session = JSON.parse(decoded) as SalesforceSession
    return session
  } catch {
    return null
  }
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
