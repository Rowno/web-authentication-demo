import { Request, Response } from 'express'
import crypto from 'crypto'
import base64url from 'base64url'
import joi from '@hapi/joi'
import { NotFound, BadRequest } from 'http-errors'
import redis from '../redis'
import { ALLOWED_ORIGINS } from '../../config'
import { getUserByEmail, getKeysByUserId } from '../database'

export interface LoginVerifyResponse {
  ok: boolean
}

const paramsSchema = joi
  .object()
  .keys({
    email: joi
      .string()
      .email()
      .required(),
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
  email: string
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

export default async function loginVerify(req: Request, res: Response): Promise<void> {
  const {
    email,
    authenticatorData: rawAuthenticatorData,
    clientDataJSON: rawClientDataJSON,
    signature: rawSignature
  }: Params = joi.attempt(req.body, paramsSchema)

  const user = await getUserByEmail(email)
  if (!user) {
    throw new NotFound('User not found')
  }

  const challenge = await redis.get(`challenge:${user.id}`)
  await redis.del(`challenge:${user.id}`)
  if (!challenge) {
    throw new NotFound('Challenge not found')
  }

  const keys = await getKeysByUserId(user.id)
  if (keys.length === 0) {
    throw new NotFound('No keys found')
  }

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
    .verify(keys[0].public_key, signature)

  if (!isValidSignature) {
    throw new BadRequest(`Invalid signature`)
  }

  const result: LoginVerifyResponse = { ok: true }
  res.json(result)
}
