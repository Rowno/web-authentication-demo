import { Request, Response } from 'express'
import uuidv4 from 'uuid/v4'
import joi from '@hapi/joi'
import redis from '../redis'
import generateChallenge from '../generate-challenge'
import { getUserByEmail } from '../database'
import { BadRequest } from 'http-errors'

export interface SetupRequestResponse {
  id: string
  challenge: string
}

const paramsSchema = joi
  .object()
  .keys({
    email: joi
      .string()
      .email()
      .required()
  })
  .required()

interface Params {
  email: string
}

async function setupRequest(req: Request, res: Response): Promise<void> {
  const { email }: Params = joi.attempt(req.body, paramsSchema)

  const user = await getUserByEmail(email)
  if (user) {
    throw new BadRequest('User already exists')
  }

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
