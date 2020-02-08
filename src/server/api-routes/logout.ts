import { Request, Response } from 'express'

export interface User {
  id: string
  email: string
}

export interface LogoutResponse {
  ok: boolean
}

/** Logs out the user */
export default async function logout(req: Request, res: Response): Promise<void> {
  let result: LogoutResponse

  // Resets the session with a new session token
  req.session!.regenerate(error => {
    if (error) {
      console.error(error)
    }

    result = { ok: true }
    res.json(result)
  })
}
