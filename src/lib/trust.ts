// Deterministic trust rules. No LLM in this file: every level has a stated reason.
import { corpus, getPerson } from "./corpus";
import type {
  AskWho,
  Client,
  Conflict,
  DocMeta,
  Level,
  Receipt,
  Signal,
  SourceCard,
  Verdict,
} from "./types";

const MONTH = 1000 * 60 * 60 * 24 * 30.4;

export function monthsSince(iso: string, now = new Date()): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / MONTH);
}

function ago(months: number): string {
  if (months < 1) return "this month";
  if (months < 24) return `${Math.round(months)} months ago`;
  return `${(months / 12).toFixed(1)} years ago`;
}

export function freshness(doc: DocMeta, now = new Date()): Signal {
  const m = monthsSince(doc.updatedAt, now);
  const level: Level = m <= 12 ? "green" : m <= 24 ? "amber" : "red";
  return {
    key: "freshness",
    level,
    label: `Updated ${ago(m)}`,
    detail:
      level === "green"
        ? "Updated within the last 12 months."
        : level === "amber"
          ? "Between 1 and 2 years old. Payroll amounts are indexed yearly, so verify."
          : "Older than 2 years. Amounts and rules have very likely changed.",
  };
}

export function ownership(doc: DocMeta): Signal {
  const p = getPerson(doc.ownerId);
  if (!p)
    return {
      key: "ownership",
      level: "red",
      label: "No owner",
      detail: "Nobody is responsible for keeping this document correct.",
    };
  if (!p.active)
    return {
      key: "ownership",
      level: "amber",
      label: `Owner left (${p.name})`,
      detail: `${p.name} left ${p.leftAt ?? "the company"}. Nobody has taken over this document.`,
    };
  return {
    key: "ownership",
    level: "green",
    label: `Owned by ${p.name}`,
    detail: `${p.name} (${p.team}) is active and responsible for this document.`,
  };
}

export function scopeMatch(doc: DocMeta, client: Client): Signal {
  if (doc.scope.country !== client.country)
    return {
      key: "scope",
      level: "red",
      label: `${doc.scope.country} rule, client is ${client.country}`,
      detail: "Different country, different legislation. Do not apply.",
    };
  if (doc.scope.clientId && doc.scope.clientId === client.id)
    return {
      key: "scope",
      level: "green",
      label: `Specific to ${client.name}`,
      detail: "Written for this client. Overrides general policy where it differs.",
    };
  if (doc.scope.pc && doc.scope.pc !== client.pc)
    return {
      key: "scope",
      level: "red",
      label: `PC ${doc.scope.pc}, client is PC ${client.pc}`,
      detail: "Different joint committee. Sector rules differ.",
    };
  return {
    key: "scope",
    level: "green",
    label: `Applies to ${client.country}`,
    detail: "General rule for this country. Check for client or sector exceptions.",
  };
}

export function sourceType(doc: DocMeta): Signal {
  const map: Record<DocMeta["type"], [Level, string]> = {
    policy: ["green", "Official policy"],
    cla: ["green", "Client agreement"],
    handover: ["amber", "Handover note"],
    chat: ["amber", "Chat message"],
  };
  const [level, label] = map[doc.type];
  return {
    key: "sourceType",
    level,
    label,
    detail:
      level === "green"
        ? "Reviewed document with a formal status."
        : "Informal. Useful for context, not as the final word.",
  };
}

export function consensus(docId: string, conflicts: Conflict[], relevantCount: number): Signal {
  const inConflict = conflicts.some((c) => c.a === docId || c.b === docId);
  if (inConflict)
    return {
      key: "consensus",
      level: "red",
      label: "Contradicted by another source",
      detail: "Another retrieved source states a different value or rule.",
    };
  if (relevantCount <= 1)
    return {
      key: "consensus",
      level: "green",
      label: "Only source, not contradicted",
      detail: "No second source was found, but nothing contradicts it either.",
    };
  return {
    key: "consensus",
    level: "green",
    label: "Consistent with other sources",
    detail: "Other retrieved sources agree.",
  };
}

const WEIGHT: Record<Signal["key"], number> = {
  scope: 3,
  freshness: 2,
  consensus: 2,
  ownership: 1,
  sourceType: 1,
};
const VALUE: Record<Level, number> = { green: 1, amber: 0.5, red: 0 };

export function reliabilityScore(signals: Signal[]): number {
  const total = signals.reduce((s, x) => s + WEIGHT[x.key], 0);
  const got = signals.reduce((s, x) => s + WEIGHT[x.key] * VALUE[x.level], 0);
  return total ? Math.round((got / total) * 100) / 100 : 0;
}

export function rank(cards: SourceCard[]): SourceCard[] {
  return [...cards].sort((a, b) => {
    if (a.relevant !== b.relevant) return a.relevant ? -1 : 1;
    // Client-specific, in-scope docs first: they override general policy.
    const aSpec =
      a.scope.clientId && a.signals.some((s) => s.key === "scope" && s.level === "green");
    const bSpec =
      b.scope.clientId && b.signals.some((s) => s.key === "scope" && s.level === "green");
    if (aSpec !== bSpec) return aSpec ? -1 : 1;
    return b.score - a.score;
  });
}

export function verdict(
  ranked: SourceCard[],
  conflicts: Conflict[],
): { verdict: Verdict; summary: string } {
  const usable = ranked.filter(
    (c) => c.relevant && !c.signals.some((s) => s.key === "scope" && s.level === "red"),
  );
  if (usable.length === 0)
    return {
      verdict: "stop",
      summary: "No reliable source applies to this client and country. Ask an expert.",
    };
  const best = usable[0];
  const reds = best.signals.filter((s) => s.level === "red" && s.key !== "consensus");
  const ambers = best.signals.filter((s) => s.level === "amber");
  const liveConflict = conflicts.filter((c) => {
    const other = c.a === best.id ? c.b : c.b === best.id ? c.a : undefined;
    if (!other) return false;
    const o = usable.find((u) => u.id === other);
    // A conflict only matters if the other source is itself still usable and reasonably reliable.
    return !!o && o.score >= 0.5;
  });
  if (liveConflict.length > 0)
    return {
      verdict: "verify",
      summary: `Sources disagree (${liveConflict[0].what}). Confirm with the owner before acting.`,
    };
  if (reds.length > 0)
    return {
      verdict: "stop",
      summary: `Best source has a blocking issue: ${reds[0].label.toLowerCase()}.`,
    };
  if (ambers.length > 0)
    return {
      verdict: "verify",
      summary: `Usable, but ${ambers.map((a) => a.label.toLowerCase()).join(" and ")}. Quick check advised.`,
    };
  return { verdict: "safe", summary: "Current, owned, in scope and consistent. Safe to act on." };
}

export function askWho(question: string, ranked: SourceCard[], client: Client): AskWho | undefined {
  // 1. Active owner of the best in-scope source.
  for (const c of ranked) {
    const scope = c.signals.find((s) => s.key === "scope");
    if (c.relevant && scope?.level === "green" && c.owner?.active)
      return { name: c.owner.name, team: c.owner.team, reason: `Owns "${c.title}"` };
  }
  // 2. Expert by country + topic overlap.
  const q = question.toLowerCase();
  const experts = corpus().experts.filter((e) => e.country === client.country);
  const scored = experts
    .map((e) => ({ e, n: e.topics.filter((t) => q.includes(t.toLowerCase())).length }))
    .sort((a, b) => b.n - a.n);
  const top = scored[0];
  if (top && top.n > 0)
    return {
      name: top.e.name,
      team: top.e.team,
      reason: `Expert on ${top.e.topics.join(", ")} for ${client.country}`,
    };
  return undefined;
}

export function buildReceipt(
  question: string,
  client: Client,
  cards: SourceCard[],
  conflicts: Conflict[],
): Receipt {
  const ranked = rank(cards);
  const v = verdict(ranked, conflicts);
  return { ...v, sources: ranked, conflicts, askWho: askWho(question, ranked, client) };
}
