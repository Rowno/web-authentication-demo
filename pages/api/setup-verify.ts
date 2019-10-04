import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { get } from 'lodash'
import base64url from 'base64url'
import cbor from 'cbor'
import redis from '../../lib/redis'
import handleError from '../../lib/handle-error'
import user from '../user'

export interface SetupVerifyResponse {
  ok: boolean
}

async function setup(req: NextApiRequest, res: NextApiResponse<SetupVerifyResponse>): Promise<void> {
  const clientDataJSON: unknown = get(req.body, 'clientDataJSON')
  const attestationObject: unknown = get(req.body, 'attestationObject')

  if (typeof clientDataJSON !== 'string') {
    throw new Error(`'clientDataJSON' isn't a string`)
  }
  if (typeof attestationObject !== 'string') {
    throw new Error(`'attestationObject' isn't a string`)
  }

  const clientData = JSON.parse(base64url.decode(clientDataJSON))
  console.log(clientData)

  const challenge = await redis.get(`challenge:${user.id}`)
  await redis.del(`challenge:${user.id}`)

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
    console.log(clientDataChallenge, challenge)
    throw new Error(`Invalid 'challenge'`)
  }
  if (clientDataOrigin !== 'http://localhost:3000') {
    throw new Error(`Invalid 'origin'`)
  }

  console.log(cbor.decode(base64url.toBuffer(attestationObject)))

  res.json({ ok: true })
}

export default handleError(setup)
