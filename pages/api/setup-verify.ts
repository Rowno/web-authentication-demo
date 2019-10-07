import { NextApiRequest, NextApiResponse } from 'next'
import { get } from 'lodash'
import base64url from 'base64url'
import cbor from 'cbor'
import coseToJwk from 'cose-to-jwk'
import jwkToPem from 'jwk-to-pem'
import redis from '../../src/server/redis'
import { Credential } from '../../src/types'
import handleError from '../../src/server/handle-error'
import { allowedOrigins } from '../../src/config'
import user from '../../src/user'

export interface SetupVerifyResponse {
  ok: boolean
}

async function setupVerify(req: NextApiRequest, res: NextApiResponse<SetupVerifyResponse>): Promise<void> {
  const clientDataJSON: unknown = get(req.body, 'clientDataJSON')
  const attestationObject: unknown = get(req.body, 'attestationObject')

  if (typeof clientDataJSON !== 'string') {
    throw new Error(`'clientDataJSON' isn't a string`)
  }

  if (typeof attestationObject !== 'string') {
    throw new Error(`'attestationObject' isn't a string`)
  }

  const challenge = await redis.get(`challenge:${user.id}`)
  await redis.del(`challenge:${user.id}`)

  if (challenge === null) {
    throw new Error('Challenge not found')
  }

  const clientData = JSON.parse(base64url.decode(clientDataJSON))

  const clientDataChallenge: unknown = get(clientData, 'challenge')
  const clientDataOrigin: unknown = get(clientData, 'origin')
  const clientDataType: unknown = get(clientData, 'type')

  if (
    typeof clientDataChallenge !== 'string' ||
    typeof clientDataOrigin !== 'string' ||
    typeof clientDataType !== 'string'
  ) {
    throw new Error(`Invalid 'clientDataJSON'`)
  }

  if (clientDataChallenge !== challenge) {
    throw new Error(`Invalid 'challenge'`)
  }

  if (!allowedOrigins.includes(clientDataOrigin)) {
    throw new Error(`Invalid 'origin'`)
  }

  if (clientDataType !== 'webauthn.create') {
    throw new Error(`Unexpected webauthn operation`)
  }

  const attestation = cbor.decode(base64url.toBuffer(attestationObject))
  const authData: unknown = get(attestation, 'authData')

  if (!Buffer.isBuffer(authData)) {
    throw new Error(`Invalid 'attestationObject'`)
  }

  // https://w3c.github.io/webauthn/#authenticator-data
  const credentialIdLength = authData.readUInt16BE(53)
  const credentialId = base64url.encode(authData.slice(55, 55 + credentialIdLength))
  console.log('credentialId', credentialId)

  const rawPublicKey = authData.slice(55 + credentialIdLength)
  const jwkPublicKey = coseToJwk(rawPublicKey)
  console.log(jwkPublicKey)
  const pemPublicKey = jwkToPem(jwkPublicKey)
  console.log(pemPublicKey)

  const credential: Credential = {
    credentialId,
    publicKey: pemPublicKey
  }

  await redis.set(`credential:${user.id}`, JSON.stringify(credential))

  res.json({ ok: true })
}

export default handleError(setupVerify)
