// All demo data is imported statically. The app never touches the filesystem at runtime.
import manifestJson from "../../data/manifest.json";
import docsJson from "../../data/docs.json";
import expertsJson from "../../data/experts.json";
import usersJson from "../../data/users.json";
import weightsJson from "../../data/weights.json";
import type { Client, DocMeta, Expert, Person, SignalKey, User } from "./types";

type Manifest = { people: Person[]; clients: Client[]; docs: DocMeta[] };

const manifest = manifestJson as Manifest;
const experts = expertsJson as Expert[];
const users = usersJson as User[];
const content = new Map<string, string>(Object.entries(docsJson as Record<string, string>));

for (const d of manifest.docs) {
  if (!content.has(d.id)) throw new Error(`Manifest references missing document: ${d.id}`);
}

// Signal weights. Start from the committed defaults and drift with user feedback (in memory).
const weights: Record<SignalKey, number> = { ...(weightsJson as Record<SignalKey, number>) };

export function corpus() {
  return { manifest, experts, users, content, weights };
}

/** Feedback: a source backed the answer the user chose. */
export function recordUse(docId: string) {
  const d = manifest.docs.find((x) => x.id === docId);
  if (d) d.views += 1;
}
export function nudgeWeight(key: SignalKey, delta: number) {
  weights[key] = Math.round(Math.max(0.5, Math.min(4, weights[key] + delta)) * 100) / 100;
}

export const getUser = (id: string) => users.find((u) => u.id === id);
export const getClient = (id: string) => manifest.clients.find((c) => c.id === id);
export const getPerson = (id?: string) =>
  id ? manifest.people.find((p) => p.id === id) : undefined;
export const getDoc = (id: string) => manifest.docs.find((d) => d.id === id);
export const getContent = (id: string) => content.get(id) ?? "";
