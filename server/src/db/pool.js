import pg from 'pg';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let connectionAttempted = false;

/**
 * Initializes and returns the PostgreSQL connection pool.
 * Gracefully handles missing DATABASE_URL or unreachable databases.
 */
export function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.trim()) {
    return null;
  }

  const useSsl = process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';
  const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

  pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]', err.message);
    isConnected = false;
  });

  return pool;
}

/**
 * Executes a parameterized query using the pool with error safety.
 * Returns null if database is not configured or unavailable.
 * 
 * @param {string} text - SQL query text with parameter placeholders ($1, $2, etc.)
 * @param {Array<any>} params - Parameter values
 * @returns {Promise<pg.QueryResult|null>}
 */
export async function query(text, params = []) {
  const activePool = getPool();
  if (!activePool) {
    return null;
  }

  try {
    const result = await activePool.query(text, params);
    isConnected = true;
    return result;
  } catch (err) {
    console.warn(`[PostgreSQL Query Warning] Failed query: ${err.message}`);
    isConnected = false;
    return null;
  }
}

/**
 * Checks whether PostgreSQL is connected and operational.
 */
export async function checkDbConnection() {
  const activePool = getPool();
  if (!activePool) return false;

  try {
    const res = await activePool.query('SELECT 1 as alive');
    isConnected = Boolean(res && res.rows && res.rows[0]?.alive === 1);
    return isConnected;
  } catch {
    isConnected = false;
    return false;
  }
}

/**
 * Closes the database pool (used in graceful shutdowns and test cleanup).
 */
export async function closePool() {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
    isConnected = false;
    connectionAttempted = false;
  }
}
