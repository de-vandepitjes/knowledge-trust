import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { corpus, getClient, getUser } from "./corpus";
import type { Client, User } from "./types";

const COOKIE = "kt_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
    return "dev-only-insecure-secret-change-me";
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function makeSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, t: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verify(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return undefined;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    const { u } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u: string };
    return u;
  } catch {
    return undefined;
  }
}

export async function currentUser(): Promise<User | undefined> {
  const jar = await cookies();
  const userId = verify(jar.get(COOKIE)?.value);
  return userId ? getUser(userId) : undefined;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, makeSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Password check: constant-time compare of a salted scrypt hash. */
export function verifyPassword(username: string, password: string): User | undefined {
  const user = corpus().users.find((u) => u.username === username.toLowerCase());
  // Always run scrypt so a missing user costs the same time as a wrong password.
  const [salt, stored] = (user?.passwordHash ?? "00:00").split(":");
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(stored, "hex");
  const ok = candidate.length === expected.length && timingSafeEqual(candidate, expected);
  return ok && user ? user : undefined;
}

/** Tiny in-memory brute-force guard: max 10 failed attempts per key per 15 minutes. */
const attempts = new Map<string, { n: number; until: number }>();
export function loginAllowed(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return true;
  if (Date.now() > a.until) {
    attempts.delete(key);
    return true;
  }
  return a.n < 10;
}
export function recordFailure(key: string) {
  const a = attempts.get(key);
  if (a && Date.now() <= a.until) a.n += 1;
  else attempts.set(key, { n: 1, until: Date.now() + 15 * 60 * 1000 });
}
export function clearFailures(key: string) {
  attempts.delete(key);
}

/** Authorization: may this user act for this client? Returns the client or undefined. */
export function authorizeClient(user: User, clientId: string): Client | undefined {
  if (!user.clients.includes(clientId)) return undefined;
  return getClient(clientId);
}
