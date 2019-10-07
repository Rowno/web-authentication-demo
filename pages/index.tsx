import { FunctionComponent } from 'react'
import {
  create,
  get,
  PublicKeyCredentialWithAttestationJSON,
  PublicKeyCredentialWithAssertionJSON
} from '@github/webauthn-json'
import { SetupRequestResponse } from './api/setup-request'
import { LoginRequestResponse } from './api/login-request'

async function register(): Promise<void> {
  const requestRes = await fetch('/api/setup-request', { method: 'post' })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(`HTTP error ${requestRes.status}: ${errorResult.error}`)
  }

  const requestResult: SetupRequestResponse = await requestRes.json()

  let credential: PublicKeyCredentialWithAttestationJSON
  try {
    credential = await create({
      publicKey: {
        challenge: requestResult.challenge,
        rp: {
          name: 'Test',
          id: 'localhost'
        },
        user: {
          id: requestResult.id,
          name: requestResult.email,
          displayName: requestResult.name
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

  console.log(credential)

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
    throw new Error(`HTTP error ${verifyRes.status}: ${errorResult.error}`)
  }
}

async function login(): Promise<void> {
  const requestRes = await fetch('/api/login-request', { method: 'post' })

  if (!requestRes.ok) {
    const errorResult = await requestRes.json()
    throw new Error(`HTTP error ${requestRes.status}: ${errorResult.error}`)
  }

  const requestResult: LoginRequestResponse = await requestRes.json()
  console.log(requestResult)

  let credential: PublicKeyCredentialWithAssertionJSON
  try {
    credential = await get({
      publicKey: {
        challenge: requestResult.challenge,
        allowCredentials: [
          {
            id: requestResult.credentialId,
            type: 'public-key'
          }
        ],
        userVerification: 'discouraged'
      }
    })
  } catch (error) {
    throw new Error(error.message)
  }

  console.log(credential)

  const verifyRes = await fetch('/api/login-verify', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authenticatorData: credential.response.authenticatorData,
      clientDataJSON: credential.response.clientDataJSON,
      signature: credential.response.signature
    })
  })

  if (!verifyRes.ok) {
    const errorResult = await verifyRes.json()
    throw new Error(`HTTP error ${verifyRes.status}: ${errorResult.error}`)
  }
}

const Home: FunctionComponent = () => {
  return (
    <div>
      <h1>Web Authentication</h1>
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
    </div>
  )
}

export default Home
