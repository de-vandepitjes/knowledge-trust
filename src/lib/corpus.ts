import fs from "node:fs";
import path from "node:path";
import type { Client, DocMeta, Expert, Person, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_DIR = path.join(DATA_DIR, "docs");

/** Only plain markdown file names inside data/docs are ever read. No separators, no traversal. */
function safeDocPath(file: string): string {
  if (!/^[a-z0-9-]+\.md$/.test(file)) throw new Error(`Invalid document file name: ${file}`);
  const resolved = path.resolve(DOCS_DIR, file);
  if (path.dirname(resolved) !== DOCS_DIR) throw new Error(`Document outside docs dir: ${file}`);
  return resolved;
}

type Manifest = { people: Person[]; clients: Client[]; docs: DocMeta[] };

let cache:
  | {
      manifest: Manifest;
      experts: Expert[];
      users: User[];
      content: Map<string, string>;
    }
  | undefined;

const JSON_FILES = {
  manifest: path.join(DATA_DIR, "manifest.json"),
  experts: path.join(DATA_DIR, "experts.json"),
  users: path.join(DATA_DIR, "users.json"),
} as const;

function readJson<T>(name: keyof typeof JSON_FILES): T {
  return JSON.parse(fs.readFileSync(JSON_FILES[name], "utf8")) as T;
}

export function corpus() {
  if (cache) return cache;
  const manifest = readJson<Manifest>("manifest");
  const content = new Map<string, string>();
  for (const d of manifest.docs) {
    content.set(d.id, fs.readFileSync(safeDocPath(d.file), "utf8"));
  }
  cache = {
    manifest,
    experts: readJson<Expert[]>("experts"),
    users: readJson<User[]>("users"),
    content,
  };
  return cache;
}

export const getUser = (id: string) => corpus().users.find((u) => u.id === id);
export const getClient = (id: string) => corpus().manifest.clients.find((c) => c.id === id);
export const getPerson = (id?: string) =>
  id ? corpus().manifest.people.find((p) => p.id === id) : undefined;
export const getDoc = (id: string) => corpus().manifest.docs.find((d) => d.id === id);
export const getContent = (id: string) => corpus().content.get(id) ?? "";
