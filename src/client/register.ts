import { create, PublicKeyCredentialWithAttestationJSON } from '@github/webauthn-json'
import { SetupRequestResponse } from '../pages/api/setup-request'

export default async function register(): Promise<void> {
  const requestRes = await fetch('/api/setup-request', { method: 'post' })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(errorResult.error)
  }

  const requestResult: SetupRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAttestationJSON
  try {
    credential = await create({
      publicKey: {
        challenge: requestResult.challenge,
        rp: {
          name: 'Test',
          id: document.location.hostname
        },
        user: {
          id: requestResult.id,
          name: requestResult.email,
          displayName: requestResult.name
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          userVerification: 'discouraged'
        },
        attestation: 'none'
      }
    })
  } catch (error) {
    throw new Error(error.message)
  }

  const verifyRes = await fetch('/api/setup-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientDataJSON: credential.response.clientDataJSON,
      attestationObject: credential.response.attestationObject
    })
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(errorResult.error)
  }
}
