import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getClient, getUser } from "./corpus";
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

/** Authorization: may this user act for this client? Returns the client or undefined. */
export function authorizeClient(user: User, clientId: string): Client | undefined {
  if (!user.clients.includes(clientId)) return undefined;
  return getClient(clientId);
}
