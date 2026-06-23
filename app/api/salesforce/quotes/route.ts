import { createQuote } from '../../../../lib/salesforce/quotes'
import { cookies } from 'next/headers'
import { parseSessionCookie } from '../../../../lib/session'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const session = parseSessionCookie(cookieStore.toString())

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Session missing or invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const payload = await request.json()
    const quoteResult = await createQuote(session, payload)
    return new Response(JSON.stringify(quoteResult), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
