import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import base64url from 'base64url'
import { get } from 'lodash'
import handleError from '../../lib/handle-error'
import redis from '../../lib/redis'
import { Credential } from '../../lib/types'
import user from '../user'

export interface LoginVerifyResponse {
  ok: boolean
}

async function loginVerify(req: NextApiRequest, res: NextApiResponse<LoginVerifyResponse>): Promise<void> {
  const rawAuthenticatorData: unknown = get(req.body, 'authenticatorData')
  const clientDataJSON: unknown = get(req.body, 'clientDataJSON')
  const rawSignature: unknown = get(req.body, 'signature')

  if (typeof rawAuthenticatorData !== 'string') {
    throw new Error(`'authenticatorData' isn't a string`)
  }

  if (typeof clientDataJSON !== 'string') {
    throw new Error(`'clientDataJSON' isn't a string`)
  }

  if (typeof rawSignature !== 'string') {
    throw new Error(`'signature' isn't a string`)
  }

  const challenge = await redis.get(`challenge:${user.id}`)
  await redis.del(`challenge:${user.id}`)

  if (challenge === null) {
    throw new Error('Challenge not found')
  }

  const rawCredential = await redis.get(`credential:${user.id}`)
  if (rawCredential === null) {
    throw new Error(`No key setup`)
  }

  const credential: Credential = JSON.parse(rawCredential)

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

  if (clientDataOrigin !== 'http://localhost:3000') {
    throw new Error(`Invalid 'origin'`)
  }

  if (clientDataType !== 'webauthn.get') {
    throw new Error(`Unexpected webauthn operation`)
  }

  const hash = crypto.createHash('sha256')
  hash.update(base64url.toBuffer(clientDataJSON))
  const clientDataJSONHash = hash.digest()

  const authenticatorData = base64url.toBuffer(rawAuthenticatorData)
  const signedData = Buffer.concat([authenticatorData, clientDataJSONHash])
  const signature = base64url.toBuffer(rawSignature)

  const isValidSignature = crypto
    .createVerify('sha256')
    .update(signedData)
    .verify(credential.publicKey, signature)

  if (!isValidSignature) {
    throw new Error(`Invalid signature`)
  }

  res.json({ ok: true })
}

export default handleError(loginVerify)
