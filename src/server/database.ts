import { createPool, sql } from 'slonik'
import { DATABASE_URL, NODE_ENV } from './config'

export interface User {
  [k: string]: string | number
  id: string
  email: string
  created_at: number
}

export interface Key {
  [k: string]: string | number
  id: string
  user_id: string
  credential_id: string
  public_key: string
  name: string
  created_at: number
}

export const db = createPool(NODE_ENV === 'production' ? DATABASE_URL + '?ssl=1' : DATABASE_URL)

export async function getUserById(userId: string): Promise<User | null> {
  return db.maybeOne<User>(sql`SELECT * FROM users WHERE id = ${userId}`)
}

export async function getUserByEmail(userEmail: string): Promise<User | null> {
  return db.maybeOne<User>(sql`SELECT * FROM users WHERE email = ${userEmail}`)
}

export async function getKeysByUserId(userId: string): Promise<readonly Key[]> {
  return db.any<Key>(sql`SELECT * FROM keys WHERE user_id = ${userId}`)
}

export async function getKeyByUserId(userId: string, credentialId: string): Promise<Key | null> {
  return db.maybeOne<Key>(sql`SELECT * FROM keys WHERE user_id = ${userId} AND credential_id = ${credentialId}`)
}

interface CreateUserParams {
  userId: string
  email: string
  credentialId: string
  publicKey: string
}

export async function createUser({ userId, email, credentialId, publicKey }: CreateUserParams): Promise<void> {
  await db.transaction(async (transaction) => {
    await transaction.query(sql`
      INSERT INTO users
        (id, email)
      VALUES
        (${userId}, ${email})
    `)

    await transaction.query(sql`
      INSERT INTO keys
        (user_id, credential_id, public_key, name)
      VALUES
        (${userId}, ${credentialId}, ${publicKey}, 'Default')
    `)
  })
}
