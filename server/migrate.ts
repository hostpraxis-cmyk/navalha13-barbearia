import type { RowDataPacket } from 'mysql2'
import type { PoolConnection } from 'mysql2/promise'
import { getPool } from './db.js'
import { schemaStatements, schemaVersion } from './migrations.js'

type ColumnRow = RowDataPacket & { COLUMN_NAME: string; IS_NULLABLE: 'YES' | 'NO' }
type IndexRow = RowDataPacket & { NON_UNIQUE: number; COLUMNS_LIST: string | null }
const MIGRATION_LOCK = 'navalha13-schema-migration'

async function hasColumn(connection: PoolConnection, columnName: string): Promise<ColumnRow | undefined> {
  const [rows] = await connection.execute<ColumnRow[]>(
    `SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'n13_app_users' AND COLUMN_NAME = ? LIMIT 1`,
    [columnName],
  )
  return rows[0]
}

async function ensureUniqueSingleColumnIndex(connection: PoolConnection, columnName: 'email' | 'google_sub'): Promise<void> {
  const [indexes] = await connection.execute<IndexRow[]>(
    `SELECT NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') AS COLUMNS_LIST
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'n13_app_users'
     GROUP BY INDEX_NAME, NON_UNIQUE`,
  )
  if (indexes.some((index) => Number(index.NON_UNIQUE) === 0 && index.COLUMNS_LIST === columnName)) return

  const [duplicates] = await connection.execute<RowDataPacket[]>(
    `SELECT \`${columnName}\` FROM n13_app_users
     WHERE \`${columnName}\` IS NOT NULL
     GROUP BY \`${columnName}\` HAVING COUNT(*) > 1 LIMIT 1`,
  )
  if (duplicates.length) {
    throw new Error(`Cannot add unique ${columnName} index: duplicate account values need owner review.`)
  }
  const indexName = columnName === 'email' ? 'uq_n13_users_email' : 'uq_n13_users_google_sub'
  await connection.query(`ALTER TABLE n13_app_users ADD UNIQUE KEY \`${indexName}\` (\`${columnName}\`)`)
}

async function ensureCurrentUserSchema(connection: PoolConnection): Promise<void> {
  let googleSub = await hasColumn(connection, 'google_sub')
  if (!googleSub) {
    await connection.query('ALTER TABLE n13_app_users ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE AFTER id')
    googleSub = await hasColumn(connection, 'google_sub')
  }
  if (googleSub?.IS_NULLABLE === 'NO') {
    await connection.query('ALTER TABLE n13_app_users MODIFY COLUMN google_sub VARCHAR(255) NULL')
  }

  if (!await hasColumn(connection, 'password_hash')) {
    await connection.query('ALTER TABLE n13_app_users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email')
  }
  await ensureUniqueSingleColumnIndex(connection, 'google_sub')
  await ensureUniqueSingleColumnIndex(connection, 'email')
}

async function migrate(): Promise<void> {
  const pool = getPool()
  let connection: PoolConnection | undefined
  let lockAcquired = false
  try {
    connection = await pool.getConnection()
    const [lockRows] = await connection.query<Array<{ acquired: number } & RowDataPacket>>(
      'SELECT GET_LOCK(?, 30) AS acquired',
      [MIGRATION_LOCK],
    )
    if (Number(lockRows[0]?.acquired) !== 1) throw new Error('Could not acquire the schema migration lock.')
    lockAcquired = true

    await connection.query(`CREATE TABLE IF NOT EXISTS n13_schema_migrations (
      version INT NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    const [rows] = await connection.execute<Array<{ version: number } & RowDataPacket>>(
      'SELECT version FROM n13_schema_migrations WHERE version = ?',
      [schemaVersion],
    )
    if (rows.length > 0) {
      console.log(`Navalha schema v${schemaVersion} already applied`)
      return
    }

    for (const statement of schemaStatements) await connection.query(statement)
    await ensureCurrentUserSchema(connection)
    await connection.execute('INSERT IGNORE INTO n13_schema_migrations (version) VALUES (?)', [schemaVersion])
    console.log(`Navalha schema v${schemaVersion} applied`)
  } finally {
    if (connection) {
      if (lockAcquired) {
        try { await connection.query('SELECT RELEASE_LOCK(?)', [MIGRATION_LOCK]) } catch { /* closing connection releases lock */ }
      }
      connection.release()
    }
    await pool.end()
  }
}

migrate().catch((error: unknown) => {
  console.error('Database migration failed:', error instanceof Error ? error.message : 'unknown error')
  process.exitCode = 1
})
