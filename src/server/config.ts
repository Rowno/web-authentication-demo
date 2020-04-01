import { defaultTo } from 'lodash'

export const PORT = parseInt(defaultTo(process.env.PORT, '3000'), 10)
// Origins where web authentication requests can originate from
export const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://rowno-web-authentication-demo.herokuapp.com']
export const {
  NODE_ENV = 'development',
  REDIS_URL,
  DATABASE_URL = 'postgres://postgres@localhost/postgres',
  SESSION_SECRET = 'test',
} = process.env

if (NODE_ENV === 'production') {
  if (SESSION_SECRET === 'test') {
    throw new Error('SESSION_SECRET environment variable not set')
  }
}
