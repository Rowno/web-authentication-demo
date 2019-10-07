import { NextApiRequest, NextApiResponse } from 'next'
import redis from '../../src/server/redis'
import handleError from '../../src/server/handle-error'
import generateChallenge from '../../src/server/generate-challenge'
import user from '../../src/user'

export interface SetupRequestResponse {
  id: string
  name: string
  email: string
  challenge: string
}

async function setupRequest(_req: NextApiRequest, res: NextApiResponse<SetupRequestResponse>): Promise<void> {
  const challenge = generateChallenge()
  await redis.set(`challenge:${user.id}`, challenge, 'EX', 300)

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    challenge
  })
}

export default handleError(setupRequest)
