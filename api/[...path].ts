import app from "../server.js";

/**
 * Catch-all Vercel Serverless Function route for all dynamic /api/* endpoints.
 * Ensures complete compatibility for endpoints like /api/ml/status, /api/ml/classify, etc.
 */
export default function handler(req: any, res: any) {
  return app(req, res);
}
