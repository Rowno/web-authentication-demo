import { Request, Response } from 'express'
import uuidv4 from 'uuid/v4'
import redis from '../redis'
import generateChallenge from '../generate-challenge'

export interface SetupRequestResponse {
  id: string
  challenge: string
}

async function setupRequest(req: Request, res: Response): Promise<void> {
  const pendingUserId = uuidv4()
  const challenge = generateChallenge()
  await redis.set(`challenge:${pendingUserId}`, challenge, 'EX', 300)
  req.session!.pendingUserId = pendingUserId

  const result: SetupRequestResponse = {
    id: pendingUserId,
    challenge
  }
  res.json(result)
}

export default setupRequest
