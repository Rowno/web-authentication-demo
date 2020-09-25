import { create, PublicKeyCredentialWithAttestationJSON } from '@github/webauthn-json'
import { RegisterRequestResponse } from '../server/api-routes/register-request'
import { BASE_URL } from './config'

export default async function register(email: string): Promise<void> {
  // Request a challenge token and a pending user ID to save in the browser with the credential
  const requestRes = await fetch(`${BASE_URL}/api/register-request`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(errorResult.error)
  }

  const requestResult: RegisterRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAttestationJSON
  try {
    // Ask the browser to create a new credential and have it sign the challenge token
    // using the credential's hardware key
    credential = await create({
      publicKey: {
        challenge: requestResult.challenge,
        rp: {
          // Website name
          name: 'Web Authentication Demo',
          // The origin the credential should be scoped to
          id: document.location.hostname,
        },
        user: {
          id: requestResult.id,
          name: email,
          displayName: email,
        },
        // Desired credential features
        // -7 indicates the elliptic curve algorithm ECDSA with SHA-256
        // https://www.iana.org/assignments/cose/cose.xhtml#algorithms
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          // Don't require the user to enter a pin code or password to access
          // their hardware key (user confirmation will still be required)
          userVerification: 'discouraged',
        },
        // Don't require details about hardware key (can contain PII)
        attestation: 'none',
      },
    })
  } catch (error) {
    throw new Error(error.message)
  }

  // Send the credential ID and public key to the server for verification and
  // saving to the database
  const verifyRes = await fetch('/api/register-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      clientDataJSON: credential.response.clientDataJSON,
      attestationObject: credential.response.attestationObject,
    }),
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(errorResult.error)
  }
}
