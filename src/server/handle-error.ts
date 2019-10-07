import { NextApiRequest, NextApiResponse } from 'next'

export default (func: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await func(req, res)
    } catch (error) {
      console.error(error)
      res.status(500)
      res.json({ error: error.message })
    }
  }
}
