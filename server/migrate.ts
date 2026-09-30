import { getPool } from './db.js'
import { schemaStatements, schemaVersion } from './migrations.js'

async function migrate(): Promise<void> {
  const pool = getPool()
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS n13_schema_migrations (
      version INT NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    const [rows] = await pool.execute<Array<{ version: number } & import('mysql2').RowDataPacket>>(
      'SELECT version FROM n13_schema_migrations WHERE version = ?',
      [schemaVersion],
    )
    if (rows.length > 0) {
      console.log(`Navalha schema v${schemaVersion} already applied`)
      return
    }

    for (const statement of schemaStatements) await pool.query(statement)
    await pool.execute('INSERT IGNORE INTO n13_schema_migrations (version) VALUES (?)', [schemaVersion])
    console.log(`Navalha schema v${schemaVersion} applied`)
  } finally {
    await pool.end()
  }
}

migrate().catch((error: unknown) => {
  console.error('Database migration failed:', error instanceof Error ? error.message : 'unknown error')
  process.exitCode = 1
})
