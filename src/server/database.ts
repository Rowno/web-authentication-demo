import { createPool, sql } from 'slonik'
import { DATABASE_URL } from './config'

export interface User {
  id: string
  email: string
  created_at: number
}

export interface Key {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  name: string
  created_at: number
}

export const db = createPool(DATABASE_URL)

export async function getUserById(userId: string): Promise<User | null> {
  return db.maybeOne<User>(sql`SELECT * FROM users WHERE id = ${userId}`)
}

export async function getUserByEmail(userEmail: string): Promise<User | null> {
  return db.maybeOne<User>(sql`SELECT * FROM users WHERE email = ${userEmail}`)
}

export async function getKeysByUserId(userId: string): Promise<Key[]> {
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
