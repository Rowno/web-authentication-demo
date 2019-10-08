import crypto from 'crypto'
import base64url from 'base64url'

export default function generateChallenge(): string {
  // 64 bytes is the max allowed by the Web Authentication API
  return base64url.encode(crypto.randomBytes(64))
}
