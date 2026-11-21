import './config.js'
import { assertSessionConfig } from './lib/session.js'
import { createApp } from './app.js'

assertSessionConfig()

const port = Number(process.env.PORT || 5000)
const app = createApp()

const server = app.listen(port, () => {
  console.log(`AccessCenter API listening on http://localhost:${port}`)
})

function shutdown(signal) {
  console.log(`${signal} received, closing server...`)
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
