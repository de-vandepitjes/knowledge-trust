// Deterministic trust rules. No LLM in this file: every level has a stated reason.
import { corpus, getPerson } from "./corpus";
import type {
  AskWho,
  Candidate,
  Client,
  Conflict,
  DocMeta,
  Level,
  Receipt,
  Signal,
  SignalKey,
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

/** Who wrote it: a legal lead outranks a consultant's note. */
export function authority(doc: DocMeta): Signal {
  const p = getPerson(doc.ownerId);
  const level = p?.level ?? 0;
  if (level >= 3)
    return {
      key: "authority",
      level: "green",
      label: `Author: ${p!.title}`,
      detail: "Written or owned by a legal lead or subject expert.",
    };
  if (level === 2)
    return {
      key: "authority",
      level: "green",
      label: `Author: ${p!.title}`,
      detail: "Senior author with client responsibility.",
    };
  if (level === 1)
    return {
      key: "authority",
      level: "amber",
      label: `Author: ${p!.title}`,
      detail: "Consultant-level author. Not a formal sign-off.",
    };
  return {
    key: "authority",
    level: "red",
    label: "Unknown author",
    detail: "No accountable author on record.",
  };
}

/** How often colleagues consult it: a well-used document has been checked by many eyes. */
export function usage(doc: DocMeta): Signal {
  if (doc.views >= 40)
    return {
      key: "usage",
      level: "green",
      label: `Consulted ${doc.views}×`,
      detail: "Frequently used across the team; errors would likely have surfaced.",
    };
  if (doc.views >= 10)
    return {
      key: "usage",
      level: "amber",
      label: `Consulted ${doc.views}×`,
      detail: "Moderately used.",
    };
  return {
    key: "usage",
    level: "amber",
    label: `Rarely consulted (${doc.views}×)`,
    detail: "Few people have relied on this. Less battle-tested.",
  };
}

const VALUE: Record<Level, number> = { green: 1, amber: 0.5, red: 0 };

export function currentWeights(): Record<SignalKey, number> {
  return { ...corpus().weights };
}

export function reliabilityScore(signals: Signal[]): number {
  const w = corpus().weights;
  const total = signals.reduce((s, x) => s + w[x.key], 0);
  const got = signals.reduce((s, x) => s + w[x.key] * VALUE[x.level], 0);
  return total ? Math.round((got / total) * 100) / 100 : 0;
}

/**
 * Candidate answers: each distinct answer the sources give, scored by its supporting sources.
 * Score = best supporting source, plus a small bonus per extra in-scope source that agrees.
 */
export function scoreCandidates(
  raw: { answer: string; sourceIds: string[] }[],
  cards: SourceCard[],
): { candidates: Candidate[]; margin: number } {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const usable = (id: string) => {
    const c = byId.get(id);
    return c && c.relevant && !c.signals.some((s) => s.key === "scope" && s.level === "red")
      ? c
      : undefined;
  };
  const scored = raw
    .map((r) => {
      const support = r.sourceIds.map(usable).filter((c): c is SourceCard => !!c);
      if (support.length === 0) return undefined;
      const best = Math.max(...support.map((c) => c.score));
      const score = Math.min(1, best + 0.05 * (support.length - 1));
      return { answer: r.answer, sourceIds: support.map((c) => c.id), score, share: 0 };
    })
    .filter((c): c is Candidate => !!c)
    .sort((a, b) => b.score - a.score);
  const total = scored.reduce((s, c) => s + c.score, 0) || 1;
  for (const c of scored) c.share = Math.round((c.score / total) * 100) / 100;
  const margin =
    scored.length === 0
      ? 0
      : scored.length === 1
        ? 1
        : Math.round((scored[0].share - scored[1].share) * 100) / 100;
  return { candidates: scored, margin };
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

// Signals that can change the verdict. Authority and usage only move the score.
const VERDICT_KEYS: SignalKey[] = ["scope", "freshness", "consensus", "ownership"];

export function verdict(
  ranked: SourceCard[],
  candidates: Candidate[],
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
  const sig = best.signals.filter((s) => VERDICT_KEYS.includes(s.key));
  const reds = sig.filter((s) => s.level === "red" && s.key !== "consensus");
  const ambers = sig.filter((s) => s.level === "amber");
  // A second candidate answer backed by a reasonably reliable source is a live disagreement.
  if (candidates.length > 1 && candidates[1].score >= 0.5)
    return {
      verdict: "verify",
      summary: `Sources disagree (${candidates[0].answer} vs ${candidates[1].answer}). Confirm with the owner before acting.`,
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
  rawCandidates: { answer: string; sourceIds: string[] }[] = [],
): Receipt {
  const ranked = rank(cards);
  const { candidates, margin } = scoreCandidates(rawCandidates, cards);
  let v = verdict(ranked, candidates);
  // Several answers close together is a reason to verify even without an explicit conflict.
  if (v.verdict === "safe" && candidates.length > 1 && margin < 0.25)
    v = {
      verdict: "verify",
      summary: `Two answers score close together (${candidates[0].answer} vs ${candidates[1].answer}). Confirm before acting.`,
    };
  return {
    ...v,
    sources: ranked,
    conflicts,
    candidates,
    margin,
    askWho: askWho(question, ranked, client),
  };
}
