import { Request, Response, NextFunction } from 'express'
import createRouter from 'express-promise-router'
import setupRequest from './setup-request'
import setupVerify from './setup-verify'
import loginRequest from './login-request'
import loginVerify from './login-verify'

const router = createRouter()
export default router

router.post('/api/setup-request', setupRequest)
router.post('/api/setup-verify', setupVerify)
router.post('/api/login-request', loginRequest)
router.post('/api/login-verify', loginVerify)

router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500)
  res.json({ error: error.message })
})
