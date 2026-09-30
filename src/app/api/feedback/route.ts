import { NextResponse } from "next/server";
import { authorizeClient, currentUser } from "@/lib/auth";
import { getDoc, nudgeWeight, recordUse } from "@/lib/corpus";
import { authority, currentWeights, freshness, ownership, sourceType, usage } from "@/lib/trust";
import type { FeedbackRequest } from "@/lib/types";

export const runtime = "nodejs";

/**
 * "I used this answer." Two effects, both deterministic:
 * 1. Each supporting source is consulted once more (usage signal rises).
 * 2. Signal weights drift toward what distinguished the chosen sources: a signal that was green
 *    on them gains a little weight, a signal that was red loses a little.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let body: Partial<FeedbackRequest>;
  try {
    body = (await req.json()) as Partial<FeedbackRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  const client = authorizeClient(user, clientId);
  if (!client)
    return NextResponse.json({ error: "You have no access to this client" }, { status: 403 });
  const ids = Array.isArray(body.sourceIds)
    ? body.sourceIds.filter((x): x is string => typeof x === "string").slice(0, 10)
    : [];

  const docs = ids
    .map(getDoc)
    .filter((d): d is NonNullable<typeof d> => !!d)
    // Only sources this user may see for this client.
    .filter(
      (d) =>
        !d.scope.clientId || (d.scope.clientId === client.id && user.clients.includes(client.id)),
    );
  if (docs.length === 0) return NextResponse.json({ error: "No valid sources" }, { status: 400 });

  for (const d of docs) {
    recordUse(d.id);
    for (const sig of [freshness(d), ownership(d), sourceType(d), authority(d), usage(d)]) {
      if (sig.level === "green") nudgeWeight(sig.key, 0.1);
      if (sig.level === "red") nudgeWeight(sig.key, -0.05);
    }
  }
  return NextResponse.json({ ok: true, weights: currentWeights() });
}
