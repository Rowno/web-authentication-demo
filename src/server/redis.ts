import Redis from 'ioredis'
import { REDIS_URL, REDIS_TLS_URL } from './config'

export default new Redis(REDIS_TLS_URL ?? REDIS_URL, {
  tls: {
    rejectUnauthorized: false,
  },
})
