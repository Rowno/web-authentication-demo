import { FunctionComponent } from 'react'
import { create, PublicKeyCredentialWithAttestationJSON } from '@github/webauthn-json'
import { SetupRequestResponse } from './api/setup-request'

async function auth(): Promise<void> {
  const setupRes = await fetch('/api/setup-request', {
    method: 'post'
  })

  if (!setupRes.ok) {
    throw new Error(`HTTP error ${setupRes.status}`)
  }

  const setupResult: SetupRequestResponse = await setupRes.json()

  let credential: PublicKeyCredentialWithAttestationJSON

  try {
    credential = await create({
      publicKey: {
        challenge: setupResult.challenge,
        rp: {
          name: 'Test',
          id: 'localhost'
        },
        user: {
          id: setupResult.id,
          name: setupResult.email,
          displayName: setupResult.name
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
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
    throw new Error(`HTTP error ${verifyRes.status}`)
  }
}

const Home: FunctionComponent = () => {
  return (
    <div>
      <h1>Web Authentication</h1>
      <button onClick={auth}>Auth</button>
    </div>
  )
}

export default Home
