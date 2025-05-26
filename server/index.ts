import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedMissingData } from "./data/seed-missing-data";
import { MongoClient } from "mongodb";
import { initializeDatabase } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response for ${req.method} ${req.url}: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.log(`Error Response Body: ${typeof body === 'object' ? JSON.stringify(body) : body}`);
    }
    return originalSend.call(this, body);
  };
  next();
});

(async () => {
  // Initialize database and seed data
  console.log("Initializing database...");
  try {
    await initializeDatabase();
    // Add missing attractions and guides with fixed locations
    await seedMissingData();
    console.log("Database initialization complete");
    console.log("Database ready");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT environment variable with a fallback to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0", // Changed from "localhost" to "0.0.0.0" to bind to all interfaces
  }, () => {
    log(`serving on port ${port}`);
  });
})();
