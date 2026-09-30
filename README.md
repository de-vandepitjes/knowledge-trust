# knowledge-trust

Tectonic Hackathon 2026 · SD Worx challenge: **Unlock the Knowledge Within** — _Find it. Understand it. Trust it._

> How might we turn fragmented organisational knowledge into a trusted shared resource?

**Pitch:** Ask a payroll question, get an answer **plus a trust receipt**: which sources say what, how fresh they are, who owns them, whether they conflict and whether they apply to this client and country. When sources disagree, the tool says so and names the person to ask. Full plan: [docs/build-plan.md](docs/build-plan.md).

## Run it

```bash
npm ci
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

`npm run check` runs lint, typecheck and build (same as CI).

## Repo map

| Path             | What                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `src/app`        | Next.js app router: pages and API routes                          |
| `src/components` | UI components                                                     |
| `src/lib`        | Shared logic (retrieval, trust signals, …)                        |
| `data/`          | Synthetic demo corpus (fake data only)                            |
| `scripts/`       | Seed and helper scripts                                           |
| `docs/`          | Challenge brief, decisions, submission checklist, team agreements |

## Deploy

Vercel, region Frankfurt. Env vars: `GOOGLE_API_KEY`, `SESSION_SECRET`. `vercel --prod` from `main`.

## What is unfinished / known limits

- Retrieval is keyword matching over a 10-document fake corpus. Real deployment would index SharePoint, Teams and the DMS.
- Login is persona selection without passwords. Authorization (per-client scope) is real and enforced server-side; authentication is mocked.
- The Gemini free tier is unstable. Answers are cached in `data/answers-cache.json` and served with a visible "cached" badge when the model is down.
- Trust weights are hand-set. In production they would be tuned per document type and validated with consultants.

## Status

- [x] Concept chosen
- [x] Synthetic corpus
- [x] Core flow (API)
- [x] Trust signals UI
- [ ] Aikido baseline + fixes
- [ ] Demo video

## Team

See [docs/team.md](docs/team.md).

## Engine (done)

- `POST /api/ask` `{question, clientId}` → `{answer, receipt}` (see `src/lib/types.ts` for the contract)
- `POST /api/login` `{userId}` (demo personas: `lien`, `tom`), `POST /api/logout`, `GET /api/me`
- `GET /api/sources/:id` document + metadata, 404 if out of scope
- Trust rules are deterministic in `src/lib/trust.ts`; the LLM (Gemini, `src/lib/llm.ts`) only writes the answer and extracts claims/conflicts.
- Demo questions (log in as Lien, client `verhaeghe` unless noted):
  1. "What is the maximum employer contribution for meal vouchers for Bakkerij Verhaeghe this year?" → **verify**, conflict 6.91 vs 5.91, ask Anke
  2. "How many days of notice does the employer give to terminate a fixed-term contract early after two months?" → **safe**
  3. "What is the bicycle allowance for a cross-border worker living in Luxembourg?" → **stop**, no source
  4. client `delcour`: "What is the maximum eco voucher amount for Delcour Logistics?" → **verify**, stale source
  5. log in as Tom, ask about `verhaeghe` → **403**
