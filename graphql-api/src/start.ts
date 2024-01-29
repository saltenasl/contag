import server from './server'
import fs from 'node:fs'

const SERVER_LISTEN_PATH = process.env['NODE_SERVER_LISTEN_PATH']

export const DEFAULT_PORT = 4000

export const DEFAULT_HANDLE = SERVER_LISTEN_PATH || DEFAULT_PORT

const startServer = async (handle: number | string = DEFAULT_HANDLE) => {
  server.listen(handle, () => {
    if (SERVER_LISTEN_PATH) {
      // in heroku.

      fs.openSync('/tmp/app-initialized', 'w') // To inform nginx buildpack that app is ready, see see https://github.com/heroku/heroku-buildpack-nginx#requirements-proxy-mode for more information

      console.log(`🚀  Server is listening on "${handle}"`)

      return
    }
    console.log(`🚀  Server is listening on "http://localhost:${handle}"`)
  })
}

export default startServer
