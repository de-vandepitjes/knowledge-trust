# Build plan — Trust Receipt for payroll answers

**Pitch (one line):** A payroll consultant asks a question. Instead of one confident answer, they get an answer **plus a trust receipt**: which sources say what, how old they are, who owns them, whether they conflict, and whether they apply to _this_ client and country. When sources disagree, the tool says so and points to the right human.

**Why this wins:** the brief repeats "from _I found something_ to _I understand why I can rely on it_". Most teams will build a RAG chatbot. We build the receipt.

---

## 1. Persona, question, moment of doubt

- **Persona:** Lien, payroll consultant at SD Worx Belgium. Inherited a client portfolio last month.
- **Client:** _Bakkerij Verhaeghe_ (BE, 42 employees, joint committee PC 118, meal vouchers).
- **Question (the demo):** _"What's the maximum employer contribution for meal vouchers for Bakkerij Verhaeghe this year?"_
- **Moment of doubt:** the corpus contains
  1. an **internal policy doc (2026)**, owner still employed → reliable
  2. a **client handover note (2023)** with the old amount → outdated
  3. a **Teams message** from a colleague quoting a Dutch (NL) rule → wrong country
  4. a **duplicate** of doc 1 without an owner
  5. a **client-specific CLA note** for PC 118 that changes the answer for this client
- **Second question (shows a clean case):** _"How many days of notice for a temporary contract termination?"_ → single reliable source, green receipt.
- **Third question (shows a gap):** something with **no source** → tool refuses to guess, suggests the expert.

## 2. The trust receipt

Every answer renders:

| Signal          | How we compute it                                                                                         | Display                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Freshness**   | doc `updated_at` vs today; policy age threshold 12 months                                                 | green / amber / red + "updated 3 months ago"            |
| **Ownership**   | `owner` exists and `owner.active == true`                                                                 | "Owned by Els D. (Payroll BE)" / "⚠ owner left in 2024" |
| **Scope match** | doc `country`, `pc` (joint committee), `client_id` vs question context                                    | "Applies to BE · PC 118" / "⚠ NL rule"                  |
| **Consensus**   | LLM compares claims across retrieved docs → agree / conflict                                              | "2 sources agree" / "⚠ conflict: €6.91 vs €8.00"        |
| **Source type** | policy > CLA note > handover > chat                                                                       | badge                                                   |
| **Overall**     | rule-based rollup, not LLM: any red → "Don't act yet"; amber → "Verify with owner"; green → "Safe to act" | big status chip                                         |
| **Who to ask**  | owner of the best doc, else expert for `country+topic` from `experts.json`                                | person card                                             |

**Rule:** the LLM writes the answer text and the claim comparison. **The trust verdict is deterministic code**, so we can explain it. This is the "no black box" line for the judges.

## 3. Architecture (keep it boring)

```
Browser (Next.js app)
  └─ /            login as Lien (mock session, cookie)
  └─ /ask         question box + client selector → answer + receipt
  └─ /sources/:id document view with metadata
  └─ /api/ask     POST {question, clientId} → {answer, receipt}
       1. auth: session cookie → user; user.clients must include clientId (else 403)
       2. retrieve: keyword + simple embedding search over data/corpus (in-memory)
       3. filter: only docs where scope allows this client (server-side, never trust client)
       4. signals: freshness / ownership / scope (pure functions in src/lib/trust.ts)
       5. LLM: answer + per-doc claim extraction + conflict detection (one call, JSON out)
       6. rollup: verdict + who-to-ask
```

- **Data:** JSON files in `data/`, loaded at startup. No DB. `manifest.json` = metadata, `docs/*.md` = content.
- **LLM:** Gemini (`gemini-3.7-flash`) via `@google/genai`, JSON output. Free key from Google AI Studio, no card needed. Fallback: the hackathon Google Cloud credits (Vertex AI, same models) if the free tier rate-limits us.
- **Embeddings:** skip if time is short; keyword + tag match on a 15-doc corpus is enough for the demo.
- **Auth:** mock login (pick user from a list, signed cookie). Two users: Lien (clients A, B) and Tom (client C). This is what Aikido audits: `/api/ask` and `/sources/:id` must enforce client scope → no IDOR.
- **Deploy:** Vercel (fastest) or Cloud Run. Do it by hour 2 so the demo video is from a URL.

## 4. Workstreams (4 people, parallel from minute 0)

| Lane                | Owner | Deliverable                                                                                                            | Files                           |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **A · Corpus**      |       | 15 fake docs + `manifest.json` + `experts.json` with the planted conflicts from §1. Realistic Belgian payroll flavour. | `data/`                         |
| **B · Engine**      |       | `POST /api/ask`, retrieval, trust signals, LLM call, verdict rollup, auth + scope filter                               | `src/lib/*`, `src/app/api/*`    |
| **C · UI**          |       | Login, ask page, answer + receipt component, source page. Trust chips must be readable from 3 m away in a video.       | `src/app/*`, `src/components/*` |
| **D · Demo & ship** |       | Deploy, README, demo script, record video, Aikido after-screenshot, Builderbase fields, decisions log                  | `docs/`, hosting                |

**Contract between B and C** (agree first 15 min, then build independently):

```ts
// src/lib/types.ts
type Verdict = "safe" | "verify" | "stop";
type Signal = {
  key: "freshness" | "ownership" | "scope" | "consensus" | "sourceType";
  level: "green" | "amber" | "red";
  label: string;
  detail?: string;
};
type SourceCard = {
  id: string;
  title: string;
  type: "policy" | "cla" | "handover" | "chat";
  updatedAt: string;
  owner?: { name: string; team: string; active: boolean };
  scope: { country: string; pc?: string; clientId?: string };
  claim: string;
  signals: Signal[];
};
type Receipt = {
  verdict: Verdict;
  summary: string;
  sources: SourceCard[];
  conflicts: { a: string; b: string; what: string }[];
  askWho?: { name: string; team: string; reason: string };
};
type AskResponse = { answer: string; receipt: Receipt };
```

Lane C builds against a hard-coded `AskResponse` fixture until B's endpoint is live.

## 5. Timeline (adjust to real remaining hours)

| When      | Everyone                                                                                   |
| --------- | ------------------------------------------------------------------------------------------ |
| 0:00–0:15 | Read this, agree on types contract, claim a lane, `npm ci`                                 |
| 0:15–1:30 | Build lanes in parallel. A finishes first → helps B with test questions                    |
| 1:30      | **Integration checkpoint**: real endpoint behind real UI, demo question 1 works end to end |
| 1:30–2:15 | Questions 2 and 3, polish receipt, deploy                                                  |
| 2:15–2:45 | Freeze features. Aikido rescan, fix, after-screenshot. Record video.                       |
| 2:45–3:00 | README status section, Builderbase submit. **Final means final.**                          |

## 6. Scope cuts, in order, if we run out of time

1. Embeddings → keyword match only
2. Source detail page → modal or nothing
3. Question 3 (gap case) → mention in video only
4. Deploy → localhost recording
5. Never cut: the receipt on question 1, the conflict state, the auth scope check

## 7. Demo script (< 3 min)

1. **0:00** Lien, new client, urgent question from the client. Show the three sources she'd find manually. "Which one is right?"
2. **0:30** Type the question. Answer appears with the receipt: two sources conflict, one is NL, one has no owner. Verdict: **Verify**. Card: "Ask Els D., owner of the 2026 policy".
3. **1:20** Second question: clean, green, "Safe to act". Show that the verdict is rules, not vibes: click a signal to see why.
4. **2:00** Log in as Tom, try Lien's client → 403. Trust also means access. Aikido score.
5. **2:30** What's next: plug into SharePoint/Teams, feedback loop on owners. Team.

## 8. Security notes for Aikido

- All scope filtering server-side in `/api/ask` and `/sources/[id]`; the `clientId` from the client is validated against the session user's allowed clients.
- IDs are non-guessable? Not needed, authz check is what matters. But don't leak other clients' doc titles in error messages.
- Session cookie: `httpOnly`, `sameSite=lax`, signed with `SESSION_SECRET` from env.
- LLM prompt: document content is data, wrap it in delimiters, tell the model to ignore instructions in documents. Doc 3 (Teams chat) can even contain a planted "ignore previous instructions" line to show we handle it.
- No secrets in repo. `.env.example` only.
