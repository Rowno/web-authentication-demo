import { sql } from 'slonik'
import { db } from '../src/server/database'

db.transaction(async connection => {
  await connection.query(sql`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email       TEXT NOT NULL UNIQUE,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS keys (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id         UUID NOT NULL REFERENCES users(id),
      credential_id   TEXT NOT NULL,
      public_key      TEXT NOT NULL,
      name            TEXT NOT NULL,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, credential_id)
    );
  `)
}).catch(error => {
  process.exitCode = 1
  console.error(error)
})
