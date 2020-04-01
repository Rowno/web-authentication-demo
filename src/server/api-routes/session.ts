import { Request, Response } from 'express'
import { getUserById } from '../database'

export interface User {
  id: string
  email: string
}

export interface SessionResponse {
  user?: User
}

/** Returns the user currently logged in */
export default async function session(req: Request, res: Response): Promise<void> {
  let result: SessionResponse

  const userId: string | undefined = req.session?.userId
  if (!userId) {
    result = {}
    res.json(result)
    return
  }

  // If the user ID in the session can't be found, logout the user
  const user = await getUserById(userId)
  if (!user) {
    req.session?.regenerate((error) => {
      if (error) {
        console.error(error)
      }

      result = {}
      res.json(result)
    })
    return
  }

  result = {
    user: {
      id: user.id,
      email: user.email,
    },
  }
  res.json(result)
}
