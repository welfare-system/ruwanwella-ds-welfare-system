const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const apiRoutes = require('./routes/api');
const db = require('./config/db');
const schema = require('./models/schema');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (essential for Render, Railway, AWS, Heroku)
app.set('trust proxy', 1);

// ── Production & Local CORS Configuration ──────────────────────────────────
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
        /\.onrender\.com$/.test(hostname)
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore URL parsing error
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Welfare Management Backend API',
    version: '1.5.0',
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
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
async function startServer() {
  // Initialize PostgreSQL schema if configured
  if (db.isConfigured()) {
    try {
      await db.testConnection();
      await schema.initDatabase();
    } catch (err) {
      console.error('⚠️ Could not initialize database schema on startup:', err.message);
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`🚀 Backend server listening on port ${PORT} (0.0.0.0)`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: ${db.isConfigured() ? 'Neon PostgreSQL' : 'Local Fallback'}`);
    console.log(`🌐 Health check: /api/health`);
    console.log(`🔒 Allowed Origins:`, allowedOrigins);
    console.log(`========================================`);
  });

  // Graceful shutdown for cloud container signals (Render, Docker, Kubernetes)
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await db.closeDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
