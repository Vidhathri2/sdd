import { cookies } from 'next/headers'

export async function POST() {
  cookies().set('deal_studio_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0
  })
  return Response.json({ success: true })
}
