import { NextApiRequest, NextApiResponse } from 'next'
import base64url from 'base64url'
import cbor from 'cbor'
import coseToJwk from 'cose-to-jwk'
import jwkToPem from 'jwk-to-pem'
import joi from '@hapi/joi'
import redis from '../redis'
import { Credential } from '../../types'
import { ALLOWED_ORIGINS } from '../../config'
import user from '../../user'

export interface SetupVerifyResponse {
  ok: boolean
}

const paramsSchema = joi
  .object()
  .keys({
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

async function setupVerify(req: NextApiRequest, res: NextApiResponse<SetupVerifyResponse>): Promise<void> {
  const { clientDataJSON, attestationObject }: Params = joi.attempt(req.body, paramsSchema)

  const challenge = await redis.get(`challenge:${user.id}`)
  await redis.del(`challenge:${user.id}`)
  if (challenge === null) {
    throw new Error('Challenge not found')
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

  const credential: Credential = {
    credentialId,
    publicKey: pemPublicKey
  }

  await redis.set(`credential:${user.id}`, JSON.stringify(credential))

  res.json({ ok: true })
}

export default setupVerify
