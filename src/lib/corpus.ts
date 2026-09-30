import fs from "node:fs";
import path from "node:path";
import type { Client, DocMeta, Expert, Person, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_DIR = path.join(DATA_DIR, "docs");

/**
 * Read every markdown document in data/docs once. Paths come from readdirSync only,
 * never from user input or manifest strings, so there is no way to read outside this folder.
 */
function readAllDocs(): Map<string, string> {
  const byFile = new Map<string, string>();
  for (const entry of fs.readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    byFile.set(entry.name, fs.readFileSync(path.join(DOCS_DIR, entry.name), "utf8"));
  }
  return byFile;
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
  const byFile = readAllDocs();
  const content = new Map<string, string>();
  for (const d of manifest.docs) {
    const text = byFile.get(d.file);
    if (text === undefined) throw new Error(`Manifest references missing document: ${d.id}`);
    content.set(d.id, text);
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
