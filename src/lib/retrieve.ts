import { corpus, getContent } from "./corpus";
import type { Client, DocMeta, User } from "./types";

const STOP = new Set(
  "the a an is are for of to in on at and or what how many much does do this that our my their with per be".split(
    " ",
  ),
);

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëïîôöùûüç.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Docs this user may see for this client. Server-side only; never trust the client. */
export function visibleDocs(user: User, client: Client): DocMeta[] {
  return corpus().manifest.docs.filter((d) => {
    // Client-scoped docs: only the client we are asking about, and only if the user may see it.
    if (d.scope.clientId) return d.scope.clientId === client.id && user.clients.includes(client.id);
    // Unscoped docs (general policies, chats): visible to everyone, any country.
    return true;
  });
}

export type Hit = { doc: DocMeta; score: number };

export function retrieve(question: string, docs: DocMeta[], limit = 6): Hit[] {
  const q = tokens(question);
  if (q.length === 0) return [];
  const hits: Hit[] = docs.map((doc) => {
    const title = tokens(doc.title);
    const tags = doc.tags.flatMap(tokens);
    const body = tokens(getContent(doc.id));
    let score = 0;
    for (const t of q) {
      if (title.includes(t)) score += 3;
      if (tags.includes(t)) score += 2;
      const n = body.filter((b) => b === t || b.startsWith(t)).length;
      score += Math.min(n, 5) * 0.5;
    }
    return { doc, score: score / q.length };
  });
  return hits
    .filter((h) => h.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
