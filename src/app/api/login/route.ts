import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { corpus, getUser } from "@/lib/corpus";

export const runtime = "nodejs";

// Demo login: pick a persona. No passwords by design; this is a hackathon proof of concept.
export async function GET() {
  return NextResponse.json(corpus().users.map((u) => ({ id: u.id, name: u.name, role: u.role })));
}

export async function POST(req: Request) {
  let body: { userId?: string };
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const user = body.userId ? getUser(body.userId) : undefined;
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 400 });
  await setSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
