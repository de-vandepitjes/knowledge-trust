import fs from "node:fs";
import path from "node:path";
import type { Client, DocMeta, Expert, Person, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

type Manifest = { people: Person[]; clients: Client[]; docs: DocMeta[] };

let cache:
  | {
      manifest: Manifest;
      experts: Expert[];
      users: User[];
      content: Map<string, string>;
    }
  | undefined;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

export function corpus() {
  if (cache) return cache;
  const manifest = readJson<Manifest>("manifest.json");
  const content = new Map<string, string>();
  for (const d of manifest.docs) {
    content.set(d.id, fs.readFileSync(path.join(DATA_DIR, "docs", d.file), "utf8"));
  }
  cache = {
    manifest,
    experts: readJson<Expert[]>("experts.json"),
    users: readJson<User[]>("users.json"),
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
