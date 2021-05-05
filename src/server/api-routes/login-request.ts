import { Request, Response } from 'express'
import joi from 'joi'
import { NotFound } from 'http-errors'
import redis from '../redis'
import generateChallenge from '../generate-challenge'
import { getUserByEmail, getKeysByUserId } from '../database'

export interface LoginRequestResponse {
  credentialIds: string[]
  challenge: string
}

const paramsSchema = joi
  .object()
  .keys({
    email: joi.string().email().required(),
  })
  .required()

interface Params {
  email: string
}

/** Returns the credential IDs linked to the given email and a challenge token for logging in */
export default async function loginRequest(req: Request, res: Response): Promise<void> {
  const { email }: Params = joi.attempt(req.body, paramsSchema)

  const user = await getUserByEmail(email)
  if (!user) {
    throw new NotFound('User not found')
  }

  const keys = await getKeysByUserId(user.id)
  if (keys.length === 0) {
    throw new NotFound('No keys found')
  }

  // Generate and save a random challenge token. This is used to protect against replay attacks.
  const challenge = generateChallenge()
  await redis.set(`challenge:${user.id}`, challenge, 'EX', 300)

  const result: LoginRequestResponse = {
    credentialIds: keys.map((key) => key.credential_id),
    challenge,
  }
  res.json(result)
}
