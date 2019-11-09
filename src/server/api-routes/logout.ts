import { Request, Response } from 'express'

export interface User {
  id: string
  email: string
}

export interface LogoutResponse {
  ok: boolean
}

export default async function logout(req: Request, res: Response): Promise<void> {
  let result: LogoutResponse

  req.session!.regenerate(error => {
    if (error) {
      console.error(error)
    }

    result = { ok: true }
    res.json(result)
  })
}
