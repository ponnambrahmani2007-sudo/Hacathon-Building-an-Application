import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { dbConfig } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function ensureDatabase() {
  const admin = new pg.Client({ ...dbConfig, database: 'postgres' })
  await admin.connect()
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbConfig.database])
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE "${dbConfig.database.replaceAll('"', '""')}"`)
  }
  await admin.end()
}

async function setupSchema() {
  const client = new pg.Client(dbConfig)
  await client.connect()
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8')
  await client.query(schema)

  const managers = [
    { username: 'akash', name: 'Akash', password: 'akash', email: 'akash@workflow.local' },
    { username: 'shiva', name: 'Shiva', password: 'shiva', email: 'shiva@workflow.local' },
  ]

  for (const manager of managers) {
    const hash = await bcrypt.hash(manager.password, 12)
    await client.query(
      `INSERT INTO users (username, name, email, password_hash, role, title, department, daily_target_hours)
       VALUES ($1, $2, $3, $4, 'manager', 'Manager', 'Leadership', 8)
       ON CONFLICT (username) DO UPDATE
       SET name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = 'manager',
           title = 'Manager',
           department = 'Leadership',
           is_active = true`,
      [manager.username, manager.name, manager.email, hash],
    )
  }

  await client.end()
}

try {
  await ensureDatabase()
  await setupSchema()
  console.log(`Database "${dbConfig.database}" is ready.`)
  console.log('Seeded manager logins: akash / akash, shiva / shiva')
} catch (error) {
  console.error(error)
  process.exit(1)
}
