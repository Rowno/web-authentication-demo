import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import base64url from 'base64url'
import handleError from '../../src/handle-error'
import redis from '../../src/redis'
import { Credential } from '../../src/types'
import user from '../user'

export interface LoginRequestResponse {
  credentialId: string
  challenge: string
}

async function loginRequest(_req: NextApiRequest, res: NextApiResponse<LoginRequestResponse>): Promise<void> {
  const rawCredential = await redis.get(`credential:${user.id}`)
  if (rawCredential === null) {
    throw new Error(`No key setup`)
  }

  const credential: Credential = JSON.parse(rawCredential)

  const challenge = base64url.encode(crypto.randomBytes(32))
  await redis.set(`challenge:${user.id}`, challenge, 'EX', 300)

  res.json({
    credentialId: credential.credentialId,
    challenge
  })
}

export default handleError(loginRequest)
