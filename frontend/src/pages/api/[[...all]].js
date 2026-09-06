/**
 * Next.js API Route Bridge - Catch-All Express Handler
 * 
 * Captures all incoming requests under /api/* and /api and proxies them
 * directly into the Express application instance running as a Vercel Serverless Function.
 * 
 * Configured with:
 * - bodyParser: false (passes raw stream directly to Express body parsers)
 * - externalResolver: true (informs Next.js that the request lifecycle is resolved by Express)
 */

const expressApp = require('../../server/expressApp');

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  return expressApp(req, res);
}
