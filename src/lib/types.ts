// Shared contract between the engine (src/lib, src/app/api) and the UI (src/components).
// Change this file only after telling the team.

export type Verdict = "safe" | "verify" | "stop";
export type Level = "green" | "amber" | "red";
export type SignalKey = "freshness" | "ownership" | "scope" | "consensus" | "sourceType";
export type SourceType = "policy" | "cla" | "handover" | "chat";

export type Signal = {
  key: SignalKey;
  level: Level;
  label: string; // short, shown as chip: "Updated 3 months ago"
  detail?: string; // one sentence shown on hover/expand: why this level
};

export type Owner = { name: string; team: string; active: boolean; leftAt?: string };
export type Scope = { country: string; pc?: string; clientId?: string };

export type SourceCard = {
  id: string;
  title: string;
  type: SourceType;
  updatedAt: string; // ISO date
  owner?: Owner;
  scope: Scope;
  claim: string; // what this doc says about the question (LLM-extracted)
  relevant: boolean; // LLM judged it addresses the question
  signals: Signal[];
  score: number; // 0..1 overall reliability for this question
};

export type Conflict = { a: string; b: string; what: string }; // source ids + one-line description

export type AskWho = { name: string; team: string; reason: string };

export type Receipt = {
  verdict: Verdict;
  summary: string; // one sentence: why this verdict
  sources: SourceCard[]; // ranked, best first
  conflicts: Conflict[];
  askWho?: AskWho;
};

export type AskRequest = { question: string; clientId: string };
export type AskResponse = {
  answer: string;
  receipt: Receipt;
  cached?: boolean; // true when the LLM was unavailable and a stored answer was served
  cachedAt?: string;
};

// Corpus shapes (data/manifest.json)
export type DocMeta = {
  id: string;
  title: string;
  type: SourceType;
  updatedAt: string;
  ownerId?: string;
  scope: Scope;
  tags: string[];
  file: string; // relative to data/docs
};
export type Person = { id: string; name: string; team: string; active: boolean; leftAt?: string };
export type Expert = { id: string; name: string; team: string; country: string; topics: string[] };
export type Client = { id: string; name: string; country: string; pc?: string };
export type User = { id: string; name: string; role: string; clients: string[] };
