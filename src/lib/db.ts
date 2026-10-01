import pg from 'pg'

let pool: pg.Pool | null = null

export function getDbPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URI,
      max: 5,
      idleTimeoutMillis: 10_000,
    })
  }
  return pool
}