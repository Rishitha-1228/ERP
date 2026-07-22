import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/database";
import { AppError } from "../utils/AppError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

function msFromExpiry(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);

  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const [, num, unit] = match;
  const n = Number(num);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  return n * multipliers[unit];
}

/* ===========================
   REGISTER
=========================== */

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const allowedRoles = ["SALES", "WAREHOUSE", "ACCOUNTS"];

  if (!allowedRoles.includes(role)) {
    throw AppError.badRequest("Invalid role selected.");
  }

  const existingUser = await query(
    `SELECT id FROM users WHERE email = $1`,
    [cleanEmail]
  );

  if (existingUser.rows.length > 0) {
    throw AppError.badRequest("Email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `
      INSERT INTO users
      (name,email,password_hash,role)
      VALUES($1,$2,$3,$4)
      RETURNING id,name,email,role
    `,
    [
      cleanName,
      cleanEmail,
      passwordHash,
      role,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: result.rows[0],
  });
}

/* ===========================
   LOGIN
=========================== */

      export async function login(req: Request, res: Response) {
  console.log("===== LOGIN REQUEST =====");
  console.log("Request Body:", req.body);

  const { email, password, role } = req.body;

  const cleanEmail = email.trim().toLowerCase();

  const result = await query(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        is_active
      FROM users
      WHERE email = $1
    `,
    [cleanEmail]
  );

  const user = result.rows[0];

  console.log("Selected Role:", role);
  console.log("Database Role:", user?.role);

  if (!user || !user.is_active) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isMatch) {
    throw AppError.unauthorized("Invalid email or password");
  }

  // Role validation
  if (role && user.role !== role) {
    throw AppError.unauthorized(
      "The selected role does not match this account."
    );
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(
    Date.now() +
      msFromExpiry(
        process.env.JWT_REFRESH_EXPIRES_IN || "7d"
      )
  );

  await query(
    `
      INSERT INTO refresh_tokens
      (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `,
    [
      user.id,
      refreshToken,
      expiresAt,
    ]
  );

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
}
  
/* ===========================
   REFRESH TOKEN
=========================== */

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw AppError.badRequest("refreshToken is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await query(
    `
      SELECT
      id,
      revoked,
      expires_at
      FROM refresh_tokens
      WHERE token = $1
    `,
    [refreshToken]
  );

  const record = stored.rows[0];

  if (
    !record ||
    record.revoked ||
    new Date(record.expires_at) < new Date()
  ) {
    throw AppError.unauthorized(
      "Refresh token is no longer valid. Please log in again."
    );
  }

  await query(
    `
      UPDATE refresh_tokens
      SET revoked = true
      WHERE id = $1
    `,
    [record.id]
  );

  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  const expiresAt = new Date(
    Date.now() +
      msFromExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "7d")
  );

  await query(
    `
      INSERT INTO refresh_tokens
      (user_id,token,expires_at)
      VALUES($1,$2,$3)
    `,
    [
      payload.id,
      newRefreshToken,
      expiresAt,
    ]
  );

  res.status(200).json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
}

/* ===========================
   LOGOUT
=========================== */

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await query(
      `
        UPDATE refresh_tokens
        SET revoked = true
        WHERE token = $1
      `,
      [refreshToken]
    );
  }

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
}

/* ===========================
   GET CURRENT USER
=========================== */

export async function getMe(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    data: req.user,
  });
}