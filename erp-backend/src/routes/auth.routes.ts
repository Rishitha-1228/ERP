import { Router } from "express";
import { z } from "zod";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

/* ===========================
   REGISTER VALIDATION
=========================== */

const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name is too long"),

    email: z
      .string()
      .email("Valid email is required"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    role: z.enum([
      "SALES",
      "WAREHOUSE",
      "ACCOUNTS",
    ]),
  }),
});

/* ===========================
   LOGIN VALIDATION
=========================== */

const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Valid email is required"),

    password: z
      .string()
      .min(1, "Password is required"),

    role: z
      .enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"])
      .optional(),
  }),
});

/* ===========================
   REFRESH VALIDATION
=========================== */

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, "refreshToken is required"),
  }),
});

/* ===========================
   ROUTES
=========================== */

// Create Account
router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

// Login
router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

// Refresh Token
router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh
);

// Logout
router.post(
  "/logout",
  authController.logout
);

// Current Logged-in User
router.get(
  "/me",
  authenticate,
  authController.getMe
);

export default router;