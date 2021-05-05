import { once } from 'lodash'
import { startServer } from './app'
import { PORT } from './config'
import { Server } from 'http'

let server: Server | undefined

startServer(PORT)
  .then((s) => {
    server = s
    console.log(`Server listening at http://localhost:${PORT}`)
  })
  .catch((error) => {
    // Server errored during startup so exit the process
    handleUncaught(error, 'unhandledRejection')
    // Leave time for logging / error capture
    setTimeout(() => process.exit(1), 300)
  })

const gracefulShutdown = once((exitCode: number) => {
  if (!server) {
    return
  }

  console.log('Server stopping...')

  server.close(() => {
    console.log('Server stopped')
    // Leave time for logging / error capture
    setTimeout(() => process.exit(exitCode), 300)
  })

  // Forcibly shutdown after 8 seconds (Docker forcibly kills after 10 seconds)
  setTimeout(() => {
    console.error('Forcibly shutting down')
    // Leave time for logging / error capture
    setTimeout(() => process.exit(1), 300)
  }, 8000)
})

function handleUncaught(error: any, crashType: string): void {
  error.crashType = crashType
  console.error('😱  Server crashed', error)
}

process.on('uncaughtException', (error) => {
  handleUncaught(error, 'uncaughtException')
  gracefulShutdown(1)
})
process.on('unhandledRejection', (error) => {
  handleUncaught(error, 'unhandledRejection')
  gracefulShutdown(1)
})

// Termination signal sent by Docker on stop
process.on('SIGTERM', () => {
  gracefulShutdown(0)
})
// Interrupt signal sent by Ctrl+C
process.on('SIGINT', () => {
  gracefulShutdown(0)
})
