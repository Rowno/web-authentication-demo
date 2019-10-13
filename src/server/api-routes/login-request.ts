import { NextApiRequest, NextApiResponse } from 'next'
import redis from '../redis'
import generateChallenge from '../generate-challenge'
import { Credential } from '../../types'
import user from '../../user'

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

export default loginRequest
