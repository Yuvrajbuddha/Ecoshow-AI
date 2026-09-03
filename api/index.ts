import app from "../server.js";

/**
 * Vercel Serverless Function entry point.
 * Forwards requests to the Express application.
 */
export default function handler(req: any, res: any) {
  return app(req, res);
}
