import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import base64url from 'base64url'
import joi from '@hapi/joi'
import redis from '../redis'
import { Credential } from '../../types'
import { ALLOWED_ORIGINS } from '../../config'
import user from '../../user'

export interface LoginVerifyResponse {
  ok: boolean
}

const paramsSchema = joi
  .object()
  .keys({
    authenticatorData: joi
      .string()
      .base64({ paddingRequired: false, urlSafe: true })
      .required(),
    clientDataJSON: joi
      .string()
      .base64({ paddingRequired: false, urlSafe: true })
      .required(),
    signature: joi
      .string()
      .base64({ paddingRequired: false, urlSafe: true })
      .required()
  })
  .required()

interface Params {
  authenticatorData: string
  clientDataJSON: string
  signature: string
}

const clientDataSchema = joi
  .object()
  .keys({
    challenge: joi
      .string()
      .valid(joi.ref('$challenge'))
      .required()
      .error(new Error('Invalid challenge')),
    origin: joi
      .string()
      .valid(...ALLOWED_ORIGINS)
      .required()
      .error(new Error('Invalid origin')),
    type: joi
      .string()
      .valid('webauthn.get')
      .required()
  })
  .required()

async function loginVerify(req: NextApiRequest, res: NextApiResponse<LoginVerifyResponse>): Promise<void> {
  const {
    authenticatorData: rawAuthenticatorData,
    clientDataJSON: rawClientDataJSON,
    signature: rawSignature
  }: Params = joi.attempt(req.body, paramsSchema)

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
  const clientData = JSON.parse(base64url.decode(rawClientDataJSON))

  joi.assert(clientData, clientDataSchema, {
    allowUnknown: true,
    context: {
      challenge
    }
  })

  const hash = crypto.createHash('sha256')
  hash.update(base64url.toBuffer(rawClientDataJSON))
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

export default loginVerify
