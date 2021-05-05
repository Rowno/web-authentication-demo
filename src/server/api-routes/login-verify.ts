import { Request, Response } from 'express'
import crypto from 'crypto'
import base64url from 'base64url'
import joi from 'joi'
import { NotFound, BadRequest } from 'http-errors'
import redis from '../redis'
import { ALLOWED_ORIGINS } from '../config'
import { getUserByEmail, getKeyByUserId } from '../database'

export interface LoginVerifyResponse {
  ok: boolean
}

const paramsSchema = joi
  .object()
  .keys({
    email: joi.string().email().required(),
    credentialId: joi.string().required(),
    authenticatorData: joi.string().base64({ paddingRequired: false, urlSafe: true }).required(),
    clientDataJSON: joi.string().base64({ paddingRequired: false, urlSafe: true }).required(),
    signature: joi.string().base64({ paddingRequired: false, urlSafe: true }).required(),
  })
  .required()

interface Params {
  email: string
  /** The credentialId that the browser used sign the challenge */
  credentialId: string
  /** The authenticatorData returned by the browser */
  authenticatorData: string
  /** The clientDataJSON returned by the browser */
  clientDataJSON: string
  /** The signature that the browser generated for the challenge and the other data it returned */
  signature: string
}

const clientDataSchema = joi
  .object()
  .keys({
    challenge: joi
      .string()
      // Make sure that the clientDataJSON contain the correct challenge token
      // (protects against replay attacks)
      .valid(joi.ref('$challenge'))
      .required()
      .error(new Error('Invalid challenge')),
    origin: joi
      .string()
      // Make sure the request came from one of the whitelisted origins
      .valid(...ALLOWED_ORIGINS)
      .required()
      .error(new Error('Invalid origin')),
    type: joi
      .string()
      // Make sure it's the right type of request
      .valid('webauthn.get')
      .required(),
  })
  .required()

/** Verifies the signature and data returned by the browser and logs in the user */
export default async function loginVerify(req: Request, res: Response): Promise<void> {
  const {
    email,
    credentialId,
    authenticatorData: rawAuthenticatorData,
    clientDataJSON: rawClientDataJSON,
    signature: rawSignature,
  }: Params = joi.attempt(req.body, paramsSchema)

  const user = await getUserByEmail(email)
  if (!user) {
    throw new NotFound('User not found')
  }

  const challenge = await redis.get(`challenge:${user.id}`)
  // Make sure the challenge token can't be reused (protects against replay attacks)
  await redis.del(`challenge:${user.id}`)
  if (!challenge) {
    throw new NotFound('Challenge not found')
  }

  // Get the public key associated with the user's credentialId
  const key = await getKeyByUserId(user.id, credentialId)
  if (!key) {
    throw new NotFound('Key not found')
  }

  const clientData = JSON.parse(base64url.decode(rawClientDataJSON))

  // Verify the clientDataJSON
  joi.assert(clientData, clientDataSchema, {
    allowUnknown: true,
    context: {
      challenge,
    },
  })

  const hash = crypto.createHash('sha256')
  hash.update(base64url.toBuffer(rawClientDataJSON))
  const clientDataJSONHash = hash.digest()

  // Combine the data signed by the browser
  const authenticatorData = base64url.toBuffer(rawAuthenticatorData)
  const signedData = Buffer.concat([authenticatorData, clientDataJSONHash])
  const signature = base64url.toBuffer(rawSignature)

  // Verify the signature using the stored public key
  const isValidSignature = crypto.createVerify('sha256').update(signedData).verify(key.public_key, signature)

  if (!isValidSignature) {
    throw new BadRequest(`Invalid signature`)
  }

  // Login the user
  req.session.userId = user.id

  const result: LoginVerifyResponse = { ok: true }
  res.json(result)
}
