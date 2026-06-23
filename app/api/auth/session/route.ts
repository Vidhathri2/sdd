import { cookies } from 'next/headers'
import { parseSessionCookie } from '../../../../lib/session'

export async function GET() {
  try {
    const cookieStore = cookies()
    const cookieHeader = cookieStore.toString()
    const session = parseSessionCookie(cookieHeader)
    return Response.json({ session })
  } catch (error) {
    return Response.json({ session: null })
  }
}
