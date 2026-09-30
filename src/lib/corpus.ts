// All demo data is imported statically. The app never touches the filesystem at runtime.
import manifestJson from "../../data/manifest.json";
import docsJson from "../../data/docs.json";
import expertsJson from "../../data/experts.json";
import usersJson from "../../data/users.json";
import type { Client, DocMeta, Expert, Person, User } from "./types";

type Manifest = { people: Person[]; clients: Client[]; docs: DocMeta[] };

const manifest = manifestJson as Manifest;
const experts = expertsJson as Expert[];
const users = usersJson as User[];
const content = new Map<string, string>(Object.entries(docsJson as Record<string, string>));

for (const d of manifest.docs) {
  if (!content.has(d.id)) throw new Error(`Manifest references missing document: ${d.id}`);
}

export function corpus() {
  return { manifest, experts, users, content };
}

export const getUser = (id: string) => users.find((u) => u.id === id);
export const getClient = (id: string) => manifest.clients.find((c) => c.id === id);
export const getPerson = (id?: string) =>
  id ? manifest.people.find((p) => p.id === id) : undefined;
export const getDoc = (id: string) => manifest.docs.find((d) => d.id === id);
export const getContent = (id: string) => content.get(id) ?? "";
