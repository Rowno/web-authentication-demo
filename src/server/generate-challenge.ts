import crypto from 'crypto'
import base64url from 'base64url'

export default function generateChallenge(): string {
  return base64url.encode(crypto.randomBytes(32))
}
