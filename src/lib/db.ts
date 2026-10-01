import pg from 'pg'

// Deliberately separate from Payload's pool: a wedged/exhausted Payload
// pool must not mask a healthy DB (or vice versa) — this route is the
// readiness signal Docker acts on.
let pool: pg.Pool | null = null

export function getDbPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URI,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 2_000,
    })
    // pg emits 'error' when the DB drops an idle pooled connection
    // (restart/failover). Without a listener Node treats it as uncaught
    // and exits the process — the exact incident this endpoint detects.
    // The pool discards the dead client and recovers on its own.
    pool.on('error', (err) => {
      console.error('[db-pool] idle client error (pool will recover):', err.message)
    })
  }
  return pool
}
