/**
 * Neon PostgreSQL Connection Pool & Query Interface
 * 
 * Manages connections to Neon Serverless PostgreSQL using 'pg'.
 * Automatically enables SSL for Neon connection strings.
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let pool = null;
let isConnected = false;

if (connectionString) {
  const isNeon = connectionString.includes('neon.tech') || 
                 connectionString.includes('sslmode=require') || 
                 process.env.NODE_ENV === 'production';

  pool = new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : false,
    max: 20, // Max concurrent connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
  });

  pool.on('connect', () => {
    // Only log once to avoid spamming
    if (!isConnected) {
      isConnected = true;
      console.log('✅ Connected to Neon PostgreSQL database pool.');
    }
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
  });
} else {
  console.warn('⚠️ DATABASE_URL is not defined in environment variables. Running in local in-memory fallback mode.');
}

/**
 * Executes a parameterized SQL query against PostgreSQL
 * @param {string} text SQL query string
 * @param {Array} params Parameter array
 * @returns {Promise<import('pg').QueryResult>} Query result
 */
async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please set DATABASE_URL.');
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SQL] (${duration}ms) ${text.trim().substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
    return res;
  } catch (err) {
    console.error(`[SQL Error] in query: "${text}":`, err.message);
    throw err;
  }
}

/**
 * Acquires a client for multi-statement transactions
 */
async function getClient() {
  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please set DATABASE_URL.');
  }
  return await pool.connect();
}

/**
 * Checks if the database is reachable
 */
async function testConnection() {
  if (!pool) return false;
  try {
    const res = await pool.query('SELECT NOW() AS now, current_database() AS db');
    isConnected = true;
    console.log(`📡 Neon PostgreSQL online: database "${res.rows[0].db}" at ${res.rows[0].now}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.error('❌ Failed to connect to Neon PostgreSQL:', err.message);
    return false;
  }
}

/**
 * Gracefully close the connection pool
 */
async function closeDb() {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL connection pool closed.');
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closeDb,
  isConfigured: () => Boolean(pool),
  isConnected: () => isConnected
};
