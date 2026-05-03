const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        `postgresql://doadmin:${process.env.DB_PASS}@impromatch-do-user-34597668-0.e.db.ondigitalocean.com:25061/taskara-pool`,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

module.exports = { getPool };
