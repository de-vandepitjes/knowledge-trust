// Answer cache. Two jobs:
// 1. Speed: the same question for the same client returns instantly.
// 2. Resilience: if the LLM free tier is down, a previously computed answer is served and marked as cached.
// The file is committed so a deployed demo has the demo questions pre-warmed.
import fs from "node:fs";
import path from "node:path";
import type { AskResponse } from "./types";

const FILE = path.join(process.cwd(), "data", "answers-cache.json");

type Entry = { question: string; clientId: string; at: string; response: AskResponse };

let mem: Record<string, Entry> | undefined;

function load(): Record<string, Entry> {
  if (mem) return mem;
  try {
    mem = JSON.parse(fs.readFileSync(FILE, "utf8")) as Record<string, Entry>;
  } catch {
    mem = {};
  }
  return mem;
}

export function cacheKey(question: string, clientId: string): string {
  const q = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${clientId}::${q}`;
}

export function getCached(question: string, clientId: string): Entry | undefined {
  return load()[cacheKey(question, clientId)];
}

export function putCached(question: string, clientId: string, response: AskResponse) {
  const store = load();
  store[cacheKey(question, clientId)] = {
    question,
    clientId,
    at: new Date().toISOString(),
    response,
  };
  // Best effort: read-only filesystems (Vercel) just keep it in memory.
  try {
    fs.writeFileSync(FILE, JSON.stringify(store, null, 2) + "\n");
  } catch {
    /* ignore */
  }
}
