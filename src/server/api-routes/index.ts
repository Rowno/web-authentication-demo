import { Request, Response, NextFunction } from 'express'
import createRouter from 'express-promise-router'
import registerRequest from './register-request'
import registerVerify from './register-verify'
import loginRequest from './login-request'
import loginVerify from './login-verify'
import session from './session'
import { NODE_ENV } from '../../config'

const router = createRouter()
export default router

router.post('/api/register-request', registerRequest)
router.post('/api/register-verify', registerVerify)
router.post('/api/login-request', loginRequest)
router.post('/api/login-verify', loginVerify)
router.get('/api/session', session)

router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  let message = 'Internal server error'
  let statusCode = 500
  const errorStatusCode = error.statusCode || error.status

  if (error.expose && (errorStatusCode >= 400 && errorStatusCode <= 499)) {
    statusCode = errorStatusCode
    message = error.message
  }

  // Only return the error message in development
  if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    message = error.message || error
  }

  console.error(error)
  res.status(statusCode)
  res.json({ error: message })
})
