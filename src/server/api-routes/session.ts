import { Request, Response } from 'express'
import { getUserById } from '../database'

export interface User {
  id: string
  email: string
}

export interface SessionResponse {
  user?: User
}

export default async function session(req: Request, res: Response): Promise<void> {
  let result: SessionResponse

  const userId: string | undefined = req.session!.userId
  if (!userId) {
    result = {}
    res.json(result)
    return
  }

  const user = await getUserById(userId)
  if (!user) {
    result = {}
    res.json(result)
    return
  }

  result = {
    user: {
      id: user.id,
      email: user.email
    }
  }
  res.json(result)
}
