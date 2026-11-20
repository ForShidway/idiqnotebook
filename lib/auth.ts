import { NextRequest } from "next/server";
import crypto from "crypto";

// Rate limiting sederhana in-memory per IP untuk mitigasi Brute Force (OWASP A07)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Perbandingan string secara timing-safe (OWASP A07: Identification and Authentication Failures)
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const headerPassword =
    request.headers.get("x-admin-password") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!headerPassword) {
    return false;
  }

  return safeCompare(headerPassword, adminPassword);
}
