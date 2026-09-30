import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getContent, getDoc, getPerson } from "@/lib/corpus";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const doc = getDoc(id);
  // Same 404 whether the doc does not exist or the user may not see it: do not leak existence.
  if (!doc || (doc.scope.clientId && !user.clients.includes(doc.scope.clientId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owner = getPerson(doc.ownerId);
  return NextResponse.json({
    ...doc,
    owner: owner
      ? { name: owner.name, team: owner.team, active: owner.active, leftAt: owner.leftAt }
      : undefined,
    content: getContent(doc.id),
  });
}
