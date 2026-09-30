// Deterministic analysis. No LLM: every claim, candidate and conflict is traceable to a line in a document.
import curatedJson from "../../data/curated-answers.json";
import { tokens } from "./retrieve";
import type { Client, Conflict, DocMeta } from "./types";

export type Analysis = {
  answer: string;
  claims: { docId: string; claim: string; relevant: boolean }[];
  conflicts: Conflict[];
  candidates: { answer: string; sourceIds: string[] }[];
};

type Curated = Record<
  string,
  { answer: string; claims: Record<string, { claim: string; relevant: boolean }> }
>;
const curated = curatedJson as Curated;

export const curatedKey = (question: string, clientId: string) =>
  `${clientId}::${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}`;

const AMOUNT =
  /(?:EUR|€)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\b\d+\s?(?:week|weeks|days?|months?|%|percent)\b/gi;

function lines(content: string): string[] {
  return content
    .split(/\n+/)
    .map((l) =>
      l
        .replace(/^[#>*\-\s]+/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter((l) => l.length > 12);
}

/** The line in a document that best answers the question: most keyword overlap, prefers lines with a value. */
function bestLine(
  question: string,
  content: string,
  title: string,
): { line: string; overlap: number } {
  const q = new Set(tokens(question));
  const titleKey = title.toLowerCase();
  let best = { line: "", overlap: 0, hasValue: false };
  for (const line of lines(content)) {
    if (line.toLowerCase() === titleKey || line.toLowerCase().startsWith(titleKey)) continue; // headings are not claims
    const lt = tokens(line);
    const overlap = lt.filter(
      (t) => q.has(t) || [...q].some((x) => x.length > 4 && t.startsWith(x)),
    ).length;
    const hasValue = AMOUNT.test(line);
    AMOUNT.lastIndex = 0;
    const score = overlap + (hasValue ? 1.5 : 0);
    if (score > best.overlap + (best.hasValue ? 1.5 : 0)) best = { line, overlap, hasValue };
  }
  return { line: best.line, overlap: best.overlap };
}

function firstValue(text: string): string | undefined {
  const m = text.match(AMOUNT);
  AMOUNT.lastIndex = 0;
  return m?.[0]?.replace(/\s+/g, " ").replace("€", "EUR ").replace("EUR  ", "EUR ");
}

export function analyse(
  question: string,
  client: Client,
  docs: { meta: DocMeta; content: string }[],
): Analysis {
  const cur = curated[curatedKey(question, client.id)];
  const qTokens = tokens(question);

  const claims = docs.map(({ meta, content }) => {
    const c = cur?.claims[meta.id];
    if (c) return { docId: meta.id, claim: c.claim, relevant: c.relevant };
    const { line, overlap } = bestLine(question, content, meta.title);
    const titleHit = tokens(meta.title).filter((t) => qTokens.includes(t)).length;
    const relevant = overlap >= 3 || (overlap >= 2 && titleHit >= 2);
    return {
      docId: meta.id,
      claim: relevant && line ? line : "Does not address this question.",
      relevant,
    };
  });

  // Candidates: relevant, same-country documents grouped by the value they state.
  const inScope = (m: DocMeta) =>
    m.scope.country === client.country && (!m.scope.pc || m.scope.pc === client.pc);
  const byValue = new Map<string, string[]>();
  for (const { meta } of docs) {
    const cl = claims.find((c) => c.docId === meta.id)!;
    if (!cl.relevant || !inScope(meta)) continue;
    const v = firstValue(cl.claim) ?? cl.claim.slice(0, 60);
    const key = v.toLowerCase().replace(/,/g, ".");
    byValue.set(key, [...(byValue.get(key) ?? []), meta.id]);
  }
  const candidates = [...byValue.entries()].map(([key, ids]) => {
    const cl = claims.find((c) => c.docId === ids[0])!;
    return { answer: firstValue(cl.claim) ?? cl.claim.slice(0, 60), sourceIds: ids, key };
  });

  // Conflicts: two in-scope relevant documents that state different values.
  const conflicts: Conflict[] = [];
  for (let i = 0; i < candidates.length; i += 1)
    for (let j = i + 1; j < candidates.length; j += 1)
      conflicts.push({
        a: candidates[i].sourceIds[0],
        b: candidates[j].sourceIds[0],
        what: `${candidates[i].answer} vs ${candidates[j].answer}`,
      });

  let answer = cur?.answer;
  if (!answer) {
    const relevantDocs = docs.filter(
      (d) => claims.find((c) => c.docId === d.meta.id)?.relevant && inScope(d.meta),
    );
    if (relevantDocs.length === 0)
      answer = "No retrieved document addresses this question for this client and country.";
    else {
      const best = relevantDocs[0];
      const cl = claims.find((c) => c.docId === best.meta.id)!;
      answer = `For ${client.name}: ${cl.claim} (${best.meta.title}, updated ${best.meta.updatedAt}).`;
      if (conflicts.length > 0)
        answer += ` Note: other sources state a different value (${conflicts[0].what}); see the receipt before acting.`;
    }
  }

  return {
    answer,
    claims,
    conflicts,
    candidates: candidates.map(({ answer, sourceIds }) => ({ answer, sourceIds })),
  };
}
