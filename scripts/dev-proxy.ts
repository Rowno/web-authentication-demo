import http from 'http'
import url from 'url'
import httpProxy from 'http-proxy'
import { defaultTo } from 'lodash'

const proxy = httpProxy.createProxyServer({})

proxy.on('error', (error, _req, res) => {
  console.error(error)
  res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' })
  res.end('Internal Server Error')
})

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(defaultTo(req.url, ''))
  const pathname = defaultTo(parsedUrl.pathname, '')

  let target: string
  if (pathname.startsWith('/api/')) {
    target = 'http://localhost:3001'
  } else {
    target = 'http://localhost:3002'
  }

  proxy.web(req, res, { target })
})

server.listen(3000, () => {
  console.log(`Development server listening at http://localhost:3000`)
})
