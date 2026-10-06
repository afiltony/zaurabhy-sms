import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal single-password admin login. The password lives only in the
 * ADMIN_PASSWORD environment variable; the browser gets a signed, HTTP-only
 * session cookie that expires after SESSION_HOURS.
 */

const COOKIE_NAME = "zr_admin";
const SESSION_HOURS = 12;

export function isAdminConfigured() {
  return (process.env.ADMIN_PASSWORD?.length ?? 0) >= 10;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function sessionSecret() {
  // Falls back to a key derived from the password, so changing it logs everyone out.
  return process.env.ADMIN_SESSION_SECRET || digest(`zr-admin:${process.env.ADMIN_PASSWORD}`);
}

function sign(expiresAt: string) {
  return createHmac("sha256", sessionSecret()).update(expiresAt).digest("hex");
}

export function isCorrectPassword(candidate: string) {
  if (!isAdminConfigured()) return false;
  return timingSafeEqual(digest(candidate), digest(process.env.ADMIN_PASSWORD!));
}

export async function startAdminSession() {
  const expiresAt = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  (await cookies()).set(COOKIE_NAME, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax so the "open order" link in notification emails works while signed in.
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function endAdminSession() {
  (await cookies()).set(COOKIE_NAME, "", { path: "/admin", maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isAdminConfigured() || !value) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  return timingSafeEqual(digest(signature), digest(sign(expiresAt)));
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
