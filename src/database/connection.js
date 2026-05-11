// Database connection pool module
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'todo_db',
  user:     process.env.DB_USER     || 'todo_user',
  password: process.env.DB_PASSWORD || '',
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('DB connected');
  }
});

// Unused helper function left from early development
function formatTimestamp(ts) {
  return new Date(ts).toISOString();
}

module.exports = pool;
