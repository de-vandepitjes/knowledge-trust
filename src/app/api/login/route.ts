import { NextResponse } from "next/server";
import { clearFailures, loginAllowed, recordFailure, setSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim().slice(0, 64) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  if (!username || !password)
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}:${username.toLowerCase()}`;
  if (!loginAllowed(key))
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const user = verifyPassword(username, password);
  if (!user) {
    recordFailure(key);
    // Same message for unknown user and wrong password: no account enumeration.
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  clearFailures(key);
  await setSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
