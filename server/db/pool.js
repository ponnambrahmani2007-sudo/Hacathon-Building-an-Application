import 'dotenv/config'
import pg from 'pg'

export const dbConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'Task-Management-System',
}

export const pool = new pg.Pool(dbConfig)

export async function query(text, params) {
  return pool.query(text, params)
}
