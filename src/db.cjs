/**
 * backend/src/db.cjs
 * CommonJS Postgres pool wrapper so require(...) works in server CJS code.
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
const useConnectionString = !!connectionString;

const cfg = useConnectionString ? { connectionString } : {
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'ai_sprint_manager',
  user: process.env.PGUSER || 'postgres',
  password: (process.env.PGPASSWORD !== undefined && process.env.PGPASSWORD !== null) ? String(process.env.PGPASSWORD) : '',
  max: parseInt(process.env.PG_MAX_CLIENTS || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '2000', 10)
};

const pool = new Pool(cfg);

console.log('[src/db.cjs] DB: using connectionString?', useConnectionString ? "YES" : "NO");
if (!useConnectionString) {
  console.log(`[src/db.cjs] DB: host=${cfg.host} port=${cfg.port} db=${cfg.database} user=${cfg.user}`);
}

const originalQuery = pool.query.bind(pool);

async function query(text, params = []) {
  try {
    return await originalQuery(text, params);
  } catch (err) {
    console.error('DB query error:', { text: (text || '').toString().slice(0, 300), params, message: err.message });
    throw err;
  }
}

module.exports = pool;
module.exports.query = query;
module.exports.close = async () => {
  try {
    await pool.end();
  } catch (e) {
    console.warn('Error closing DB pool', e && e.message ? e.message : e);
  }
};
