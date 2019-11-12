import fetch from 'isomorphic-unfetch'
import { create, PublicKeyCredentialWithAttestationJSON } from '@github/webauthn-json'
import { RegisterRequestResponse } from '../server/api-routes/register-request'
import { BASE_URL } from './config'

export default async function register(email: string): Promise<void> {
  const requestRes = await fetch(`${BASE_URL}/api/register-request`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(errorResult.error)
  }

  const requestResult: RegisterRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAttestationJSON
  try {
    credential = await create({
      publicKey: {
        challenge: requestResult.challenge,
        rp: {
          name: 'Web Authentication Demo',
          id: document.location.hostname
        },
        user: {
          id: requestResult.id,
          name: email,
          displayName: email
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

  const verifyRes = await fetch('/api/register-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      clientDataJSON: credential.response.clientDataJSON,
      attestationObject: credential.response.attestationObject
    })
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(errorResult.error)
  }
}
