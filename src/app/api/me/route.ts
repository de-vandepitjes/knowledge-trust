import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getClient } from "@/lib/corpus";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const clients = user.clients.map(getClient).filter(Boolean);
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, clients });
}
