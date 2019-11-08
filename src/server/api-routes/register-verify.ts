import { Request, Response } from 'express'
import base64url from 'base64url'
import cbor from 'cbor'
import coseToJwk from 'cose-to-jwk'
import jwkToPem from 'jwk-to-pem'
import joi from '@hapi/joi'
import { NotFound, BadRequest } from 'http-errors'
import redis from '../redis'
import { ALLOWED_ORIGINS } from '../../config'
import { createUser, getUserByEmail } from '../database'

export interface RegisterVerifyResponse {
  ok: boolean
}

const paramsSchema = joi
  .object()
  .keys({
    email: joi
      .string()
      .email()
      .required(),
    clientDataJSON: joi
      .string()
      .base64({ paddingRequired: false, urlSafe: true })
      .required(),
    attestationObject: joi
      .string()
      .base64({ paddingRequired: false, urlSafe: true })
      .required()
  })
  .required()

interface Params {
  email: string
  clientDataJSON: string
  attestationObject: string
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
      .valid('webauthn.create')
      .required()
  })
  .required()

const attestationSchema = joi
  .object()
  .keys({
    authData: joi
      .binary()
      .min(56)
      .required()
  })
  .required()

interface Attestation {
  authData: Buffer
}

export default async function registerVerify(req: Request, res: Response): Promise<void> {
  const { email, clientDataJSON, attestationObject }: Params = joi.attempt(req.body, paramsSchema)

  const user = await getUserByEmail(email)
  if (user) {
    throw new BadRequest('User already exists')
  }

  const pendingUserId: string | undefined = req.session!.pendingUserId
  if (!pendingUserId) {
    throw new BadRequest('Call /api/register-request first')
  }

  const challenge = await redis.get(`challenge:${pendingUserId}`)
  await redis.del(`challenge:${pendingUserId}`)
  if (!challenge) {
    throw new NotFound('Challenge not found')
  }

  const clientData = JSON.parse(base64url.decode(clientDataJSON))

  joi.assert(clientData, clientDataSchema, {
    allowUnknown: true,
    context: {
      challenge
    }
  })

  const attestation = cbor.decode(base64url.toBuffer(attestationObject))

  const { authData }: Attestation = joi.attempt(attestation, attestationSchema, { allowUnknown: true })

  // https://w3c.github.io/webauthn/#authenticator-data
  const credentialIdLength = authData.readUInt16BE(53)
  const credentialId = base64url.encode(authData.slice(55, 55 + credentialIdLength))

  const rawPublicKey = authData.slice(55 + credentialIdLength)
  const jwkPublicKey = coseToJwk(rawPublicKey)
  const pemPublicKey = jwkToPem(jwkPublicKey)

  await createUser({
    userId: pendingUserId,
    email,
    credentialId,
    publicKey: pemPublicKey
  })

  delete req.session!.pendingUserId
  const result: RegisterVerifyResponse = { ok: true }
  res.json(result)
}
