import 'express-session'

declare module 'express-session' {
  interface SessionData {
    pendingUserId?: string
    userId?: string
  }
}
