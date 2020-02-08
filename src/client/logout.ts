import fetch from 'isomorphic-unfetch'
import { LogoutResponse } from '../server/api-routes/logout'
import { BASE_URL } from './config'

export default async function logout(): Promise<LogoutResponse> {
  // Request the session to be reset
  const logoutRes = await fetch(`${BASE_URL}/api/logout`, { method: 'POST' })

  if (!logoutRes.ok) {
    const errorResult = await logoutRes.json()
    throw new Error(errorResult.error)
  }

  return logoutRes.json()
}
