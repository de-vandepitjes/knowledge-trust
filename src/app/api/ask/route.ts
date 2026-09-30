import { NextResponse } from "next/server";
import { ask } from "@/lib/ask";
import { authorizeClient, currentUser } from "@/lib/auth";
import type { AskRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: Partial<AskRequest>;
  try {
    body = (await req.json()) as Partial<AskRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  if (question.length < 5 || !clientId)
    return NextResponse.json({ error: "question and clientId are required" }, { status: 400 });

  const client = authorizeClient(user, clientId);
  if (!client)
    return NextResponse.json({ error: "You have no access to this client" }, { status: 403 });

  try {
    const result = await ask(question, user, client);
    return NextResponse.json(result);
  } catch (e) {
    console.error("ask failed", e);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Try again." },
      { status: 502 },
    );
  }
}
