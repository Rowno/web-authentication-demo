import { get, PublicKeyCredentialWithAssertionJSON } from '@github/webauthn-json'
import { LoginRequestResponse } from '../server/api-routes/login-request'

export default async function login(email: string): Promise<void> {
  const requestRes = await fetch('/api/login-request', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(errorResult.error)
  }

  const requestResult: LoginRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAssertionJSON
  try {
    credential = await get({
      publicKey: {
        challenge: requestResult.challenge,
        allowCredentials: requestResult.credentialIds.map(id => ({
          id,
          type: 'public-key'
        })),
        userVerification: 'discouraged'
      }
    })
  } catch (error) {
    throw new Error(error.message)
  }

  const verifyRes = await fetch('/api/login-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      authenticatorData: credential.response.authenticatorData,
      clientDataJSON: credential.response.clientDataJSON,
      signature: credential.response.signature
    })
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(errorResult.error)
  }
}
