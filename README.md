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

## Status / unfinished

- [x] Concept chosen
- [ ] Synthetic corpus
- [ ] Core flow
- [ ] Trust signals UI
- [ ] Aikido baseline + fixes
- [ ] Demo video

## Team

See [docs/team.md](docs/team.md).
