import { getCached, putCached } from "./cache";
import { getContent, getPerson } from "./corpus";
import { analyse } from "./llm";
import { retrieve, visibleDocs } from "./retrieve";
import {
  authority,
  buildReceipt,
  consensus,
  freshness,
  ownership,
  reliabilityScore,
  scopeMatch,
  sourceType,
  usage,
} from "./trust";
import type { AskResponse, Client, SourceCard, User } from "./types";

export async function ask(question: string, user: User, client: Client): Promise<AskResponse> {
  const hits = retrieve(question, visibleDocs(user, client));
  if (hits.length === 0) {
    const receipt = buildReceipt(question, client, [], []);
    return { answer: "I found no document that addresses this question for this client.", receipt };
  }

  const docs = hits.map((h) => ({ meta: h.doc, content: getContent(h.doc.id) }));
  let analysis;
  try {
    analysis = await analyse(question, client, docs);
  } catch (e) {
    const cached = getCached(question, client.id);
    if (!cached) throw e;
    console.warn("llm unavailable, serving cached answer from", cached.at);
    return { ...cached.response, cached: true, cachedAt: cached.at };
  }
  const relevantCount = analysis.claims.filter((c) => c.relevant).length;

  const cards: SourceCard[] = docs.map(({ meta }) => {
    const claim = analysis.claims.find((c) => c.docId === meta.id);
    const signals = [
      freshness(meta),
      ownership(meta),
      scopeMatch(meta, client),
      consensus(meta.id, analysis.conflicts, relevantCount),
      sourceType(meta),
      authority(meta),
      usage(meta),
    ];
    const p = getPerson(meta.ownerId);
    return {
      id: meta.id,
      title: meta.title,
      type: meta.type,
      updatedAt: meta.updatedAt,
      owner: p
        ? {
            name: p.name,
            team: p.team,
            title: p.title,
            level: p.level,
            active: p.active,
            leftAt: p.leftAt,
          }
        : undefined,
      scope: meta.scope,
      claim: claim?.claim ?? "Does not address this question.",
      relevant: claim?.relevant ?? false,
      signals,
      score: reliabilityScore(signals),
    };
  });

  const receipt = buildReceipt(question, client, cards, analysis.conflicts, analysis.candidates);
  const response: AskResponse = { answer: analysis.answer, receipt };
  putCached(question, client.id, response);
  return response;
}
