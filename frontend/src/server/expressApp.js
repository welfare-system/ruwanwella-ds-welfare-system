/**
 * Express Application Core (Next.js Unified Serverless Edition)
 * 
 * Provides the full Express middleware stack, database auto-initialization,
 * and route definitions, ready to be mounted inside Next.js API Route handlers
 * or executed standalone in a traditional Node.js container.
 */

const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const db = require('./config/db');
const schema = require('./models/schema');

const app = express();

// Trust reverse proxy headers on Vercel, Render, Railway
app.enable('trust proxy');

// ── CORS Configuration ───────────────────────────────────────────────────────
const DEFAULT_ALLOWED = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000'
];

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [...new Set([...DEFAULT_ALLOWED, ...configuredOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, health probes (no Origin header)
    if (!origin) return callback(null, true);

    try {
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const hostname = new URL(origin).hostname;

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        allowedOrigins.includes('*') ||
        /\.vercel\.app$/.test(hostname) ||
        /\.onrender\.com$/.test(hostname) ||
        /\.railway\.app$/.test(hostname)
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore URL parsing error
    }

    return callback(null, true); // Permissive fallback for seamless cloud operation
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Lazy Database Table & Seed Initialization ────────────────────────────────
let initPromise = null;
function ensureDbInit() {
  if (!initPromise && db.isConfigured()) {
    initPromise = (async () => {
      try {
        await schema.initDatabase();
      } catch (err) {
        console.error('⚠️ Could not initialize database schema in serverless context:', err.message);
        initPromise = null; // allow retry on subsequent invocation
      }
    })();
  }
  return initPromise;
}

// Middleware to ensure DB is initialized before route execution
app.use(async (req, res, next) => {
  if (db.isConfigured()) {
    try {
      await ensureDbInit();
    } catch (e) {
      // Proceed even if init failed, individual queries will handle errors
    }
  }
  next();
});

// ── Root Diagnostic Handlers ─────────────────────────────────────────────────
const rootHandler = (req, res) => {
  res.json({
    status: 'ok',
    service: 'Welfare Management Unified Next.js API',
    version: '1.6.0',
    deployment: 'Vercel Serverless (Unified Fullstack)',
    environment: process.env.NODE_ENV || 'development',
    database: db.isConfigured() ? 'neon-postgresql' : 'in-memory-fallback',
    endpoints: {
      health: '/api/health',
      fundSummary: '/api/fund/summary',
      financeSummary: '/api/finance/summary',
      members: '/api/members',
      loans: '/api/loans'
    }
  });
};

app.get('/', rootHandler);
app.get('/api', rootHandler);

// ── Mount All API Routes ─────────────────────────────────────────────────────
// Mount under both '/api' and '/' so routes resolve whether or not the prefix was stripped
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// ── 404 Fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
