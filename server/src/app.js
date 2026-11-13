import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter, { webhookHandler } from "./routes/payments.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins }));

  // Razorpay signs the *raw* body, so this route must come BEFORE express.json()
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), webhookHandler);

  app.use(express.json({ limit: "50kb" }));
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.name === "ValidationError" ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 && env.isProd ? "Something went wrong." : err.message });
  });
  return app;
}
