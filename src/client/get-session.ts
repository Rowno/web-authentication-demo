import { SessionResponse } from '../server/api-routes/session'

export default async function getSession(): Promise<SessionResponse> {
  const sessionRes = await fetch('/api/session')

  if (!sessionRes.ok) {
    const errorResult = await sessionRes.json()
    throw new Error(errorResult.error)
  }

  return sessionRes.json()
}
