import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { api } from './routes/api.js'
import { pool } from './db/pool.js'

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180 }))
app.use('/api', api)

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
})

app.use((err, _req, res, next) => {
  void next
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server.' })
})

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
