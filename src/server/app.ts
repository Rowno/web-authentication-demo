import express from 'express'
import helmet from 'helmet'
import next from 'next'
import { Server } from 'http'
import session from 'express-session'
import connectRedis from 'connect-redis'
import moment from 'moment'
import { NODE_ENV, SESSION_SECRET } from './config'
import apiRoutes from './api-routes'
import redis from './redis'

const SessionRedisStore = connectRedis(session)

let nextApp: ReturnType<typeof next> | undefined
// Run next.js in a separate process during development so that every server-side
// change doesn't cause webpack to be restarted
if (NODE_ENV !== 'development') {
  nextApp = next({ dev: false })
}

const app = express()
// Trust the x-forwarded-for header set by the load balancer
app.set('trust proxy', true)

// Set a bunch of security related headers
app.use(helmet())
// Setup redis backed session management
app.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: moment.duration(1, 'week').asMilliseconds(),
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    },
    name: 'session_token',
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: new SessionRedisStore({ prefix: 'session:', client: redis }),
    unset: 'destroy',
  })
)
app.use(express.json())

// Mount the API routes
app.use(apiRoutes)

if (nextApp) {
  const nextRequestHandler = nextApp.getRequestHandler()
  // Pass all other requests to next.js
  app.all('*', (req, res, next) => {
    nextRequestHandler(req, res).catch(next)
  })
}

export async function startServer(port: number): Promise<Server> {
  if (nextApp) {
    await nextApp.prepare()
  }

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      resolve(server)
    })
  })
}
