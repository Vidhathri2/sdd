import { fetchProducts } from '../../../../lib/salesforce/products'
import { cookies } from 'next/headers'
import { parseSessionCookie } from '../../../../lib/session'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const family = url.searchParams.get('family') ?? undefined
  const search = url.searchParams.get('search') ?? undefined

  try {
    const cookieStore = cookies()
    const session = parseSessionCookie(cookieStore.toString())

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Session missing or invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const products = await fetchProducts(session, family, search)
    return new Response(JSON.stringify({ products }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
