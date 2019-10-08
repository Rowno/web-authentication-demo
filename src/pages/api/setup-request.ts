import { NextApiRequest, NextApiResponse } from 'next'
import redis from '../../server/redis'
import handleError from '../../server/handle-error'
import generateChallenge from '../../server/generate-challenge'
import user from '../../user'

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
