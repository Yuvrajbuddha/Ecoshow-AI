import app from "../server.js";

/**
 * Direct Vercel Serverless Function route for /api/health.
 * Ensures zero-config compatibility even without vercel.json rewrites.
 */
export default function handler(req: any, res: any) {
  return app(req, res);
}
