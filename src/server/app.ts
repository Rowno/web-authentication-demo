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
if (NODE_ENV !== 'development') {
  nextApp = next({ dev: false })
}

const app = express()
app.set('trust proxy', true)

app.use(helmet())
app.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: moment.duration(1, 'week').asMilliseconds(),
      sameSite: 'lax',
      secure: NODE_ENV === 'production'
    },
    name: 'session_token',
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: new SessionRedisStore({ prefix: 'session:', client: redis as any }),
    unset: 'destroy'
  })
)
app.use(express.json())

app.use(apiRoutes)

if (nextApp) {
  const nextRequestHandler = nextApp.getRequestHandler()
  app.all('*', (req, res) => {
    nextRequestHandler(req, res)
  })
}

export async function startServer(port: number): Promise<Server> {
  if (nextApp) {
    await nextApp.prepare()
  }

  return new Promise(resolve => {
    const server = app.listen(port, () => {
      resolve(server)
    })
  })
}
