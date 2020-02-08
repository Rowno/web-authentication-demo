import fetch from 'isomorphic-unfetch'
import { SessionResponse } from '../server/api-routes/session'
import { BASE_URL } from './config'

export default async function getSession(cookieHeader?: string): Promise<SessionResponse> {
  const sessionRes = await fetch(`${BASE_URL}/api/session`, {
    headers: {
      // Forward the cookie header during server-side rendering
      Cookie: cookieHeader ?? ''
    }
  })

  if (!sessionRes.ok) {
    const errorResult = await sessionRes.json()
    throw new Error(errorResult.error)
  }

  return sessionRes.json()
}
