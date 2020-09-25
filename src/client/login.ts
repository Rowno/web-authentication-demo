import { get, PublicKeyCredentialWithAssertionJSON } from '@github/webauthn-json'
import { LoginRequestResponse } from '../server/api-routes/login-request'
import { BASE_URL } from './config'

export default async function login(email: string): Promise<void> {
  // Request list of credential IDs and challenge token
  const requestRes = await fetch(`${BASE_URL}/api/login-request`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(errorResult.error)
  }

  const requestResult: LoginRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAssertionJSON
  try {
    // Ask the browser if it has a credential matching one of the IDs and have it
    // sign the challenge token using the credential's hardware key
    credential = await get({
      publicKey: {
        challenge: requestResult.challenge,
        allowCredentials: requestResult.credentialIds.map((id) => ({
          id,
          type: 'public-key',
        })),
        // Don't require the user to enter a pin code or password to access their hardware key
        // (user confirmation will still be required)
        userVerification: 'discouraged',
      },
    })
  } catch (error) {
    throw new Error(error.message)
  }

  // Send the challenge signature to the server for verification to get a session cookie
  const verifyRes = await fetch('/api/login-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      credentialId: credential.id,
      authenticatorData: credential.response.authenticatorData,
      clientDataJSON: credential.response.clientDataJSON,
      signature: credential.response.signature,
    }),
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(errorResult.error)
  }
}
