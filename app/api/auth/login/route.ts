import { cookies } from 'next/headers'
import { authenticateDirectly, getMockSession } from '../../../../lib/salesforce/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { mode } = body

    if (mode === 'mock') {
      const session = getMockSession()
      cookies().set('deal_studio_session', Buffer.from(JSON.stringify(session)).toString('base64'), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24
      })
      return Response.json({ success: true, isMock: true, username: session.username })
    }

    const session = await authenticateDirectly()
    cookies().set('deal_studio_session', Buffer.from(JSON.stringify(session)).toString('base64'), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    return Response.json({ success: true, isMock: false, username: session.username })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: (error as Error).message || 'Salesforce authentication failed.'
    }, { status: 400 })
  }
}
