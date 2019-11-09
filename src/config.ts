import { defaultTo } from 'lodash'

export const PORT = parseInt(defaultTo(process.env.PORT, '3000'), 10)
export const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://rowno-web-authentication-demo.herokuapp.com']
export const {
  NODE_ENV = 'development',
  REDIS_URL,
  DATABASE_URL = 'postgres://postgres@localhost/postgres',
  SESSION_SECRET = 'test'
} = process.env

const isProd = NODE_ENV === 'production'

export const BASE_URL = isProd ? 'https://rowno-web-authentication-demo.herokuapp.com' : 'http://localhost:3000'

if (isProd) {
  if (SESSION_SECRET === 'test') {
    throw new Error('SESSION_SECRET environment variable not set')
  }
}
