import mysql, { type Pool } from 'mysql2/promise'

let sharedPool: Pool | undefined

export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getPool(): Pool {
  if (sharedPool) return sharedPool

  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) throw new Error('DATABASE_URL is not configured')

  const url = new URL(rawUrl)
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://')
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) throw new Error('DATABASE_URL must include a database name')

  sharedPool = mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    charset: 'utf8mb4',
    timezone: 'Z',
    ssl: { rejectUnauthorized: true },
    connectionLimit: 8,
    enableKeepAlive: true,
    waitForConnections: true,
    queueLimit: 0,
  })

  return sharedPool
}
