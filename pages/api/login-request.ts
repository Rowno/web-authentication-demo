import { NextApiRequest, NextApiResponse } from 'next'
import handleError from '../../src/server/handle-error'
import redis from '../../src/server/redis'
import generateChallenge from '../../src/server/generate-challenge'
import { Credential } from '../../src/types'
import user from '../../src/user'

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

  const challenge = generateChallenge()
  await redis.set(`challenge:${user.id}`, challenge, 'EX', 300)

  res.json({
    credentialId: credential.credentialId,
    challenge
  })
}

export default handleError(loginRequest)
