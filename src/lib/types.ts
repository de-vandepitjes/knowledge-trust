// Shared contract between the engine (src/lib, src/app/api) and the UI (src/components).
// Change this file only after telling the team.

export type Verdict = "safe" | "verify" | "stop";
export type Level = "green" | "amber" | "red";
export type SignalKey =
  "freshness" | "ownership" | "scope" | "consensus" | "sourceType" | "authority" | "usage";
export type SourceType = "policy" | "cla" | "handover" | "chat";

export type Signal = {
  key: SignalKey;
  level: Level;
  label: string; // short, shown as chip: "Updated 3 months ago"
  detail?: string; // one sentence shown on hover/expand: why this level
};

export type Owner = {
  name: string;
  team: string;
  title?: string;
  level?: number;
  active: boolean;
  leftAt?: string;
};
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

/** One distinct answer the sources support, with the evidence behind it. */
export type Candidate = {
  answer: string; // short: "EUR 6.91 employer share"
  sourceIds: string[]; // relevant sources that state this
  score: number; // 0..1 from the supporting sources
  share: number; // 0..1 share of total candidate score
};

export type Receipt = {
  verdict: Verdict;
  summary: string; // one sentence: why this verdict
  sources: SourceCard[]; // ranked, best first
  conflicts: Conflict[];
  candidates: Candidate[]; // ranked, best first
  margin: number; // top candidate share minus runner-up share (1 if only one)
  askWho?: AskWho;
};

export type FeedbackRequest = { question: string; clientId: string; sourceIds: string[] };

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
  views: number; // how often consulted
};
export type Person = {
  id: string;
  name: string;
  team: string;
  title?: string;
  level?: number; // 1 consultant · 2 senior · 3 lead / legal expert
  active: boolean;
  leftAt?: string;
};
export type Expert = { id: string; name: string; team: string; country: string; topics: string[] };
export type Client = { id: string; name: string; country: string; pc?: string };
export type User = {
  id: string;
  username: string;
  passwordHash: string; // "salt:scryptHex", never sent to the client
  name: string;
  role: string;
  clients: string[];
};
export type PublicUser = Pick<User, "id" | "name" | "role">;
