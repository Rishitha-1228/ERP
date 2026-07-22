import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import "express-async-errors"; // lets async route handlers throw and hit errorHandler
import dotenv from "dotenv";
dotenv.config();

import { logger, morganStream } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import inventoryRoutes from "./routes/inventory.routes";
import challanRoutes from "./routes/challan.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("combined", { stream: morganStream }));

// Global rate limit - 300 requests per 15 minutes per IP.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Tighter limit specifically on login, to slow down credential stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});
app.use("/api/auth/login", loginLimiter);

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`VertexERP API running on http://localhost:${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
});
