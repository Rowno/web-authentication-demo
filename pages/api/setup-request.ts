import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import base64url from 'base64url'
import redis from '../../src/server/redis'
import handleError from '../../src/server/handle-error'
import user from '../../src/user'

export interface SetupRequestResponse {
  id: string
  name: string
  email: string
  challenge: string
}

async function setupRequest(_req: NextApiRequest, res: NextApiResponse<SetupRequestResponse>): Promise<void> {
  const challenge = base64url.encode(crypto.randomBytes(32))
  await redis.set(`challenge:${user.id}`, challenge, 'EX', 300)

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    challenge
  })
}

export default handleError(setupRequest)
