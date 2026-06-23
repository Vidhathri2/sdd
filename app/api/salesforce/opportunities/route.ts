import { fetchOpportunities } from '../../../../lib/salesforce/opportunities'
import { cookies } from 'next/headers'
import { parseSessionCookie } from '../../../../lib/session'

export async function GET() {
  try {
    const cookieStore = cookies()
    const session = parseSessionCookie(cookieStore.toString())
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Session missing or invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const opportunities = await fetchOpportunities(session)
    return new Response(JSON.stringify({ opportunities }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
