import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";

// Optional single-process hosting outside the development preview.
// API paths pass through to Nest. Non-API HTML routes serve the React SPA.
export function serveFrontend(app: Express) {
  const directory = process.env.SERVE_FRONTEND_DIR;
  if (!directory) return;
  const root = path.resolve(directory);
  if (!existsSync(path.join(root, "index.html"))) throw new Error("Frontend build directory does not contain index.html");
  app.use(express.static(root, { index: false }));
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/") || !req.accepts("html")) { next(); return; }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(root, "index.html"));
  });
}
