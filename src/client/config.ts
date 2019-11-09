export const { NODE_ENV = 'development' } = process.env

const isProd = NODE_ENV === 'production'

export const BASE_URL = isProd ? 'https://rowno-web-authentication-demo.herokuapp.com' : 'http://localhost:3000'
