# Team & working agreements

## People

| Name                  | GitHub      | Focus |
| --------------------- | ----------- | ----- |
| Sebastian Van Isacker | @Chewie2005 |       |
|                       |             |       |
|                       |             |       |
|                       |             |       |

## Git flow

- `main` is **always demo-able**. If it's broken, fixing it comes first.
- Branch per task: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Open a PR into `main`, one approval, **squash merge**. Small PRs, merge often.
- Commit messages: `type: what` (e.g. `feat: trust panel shows source age`). Not enforced.
- CI must be green before merge (lint, typecheck, format, build).

## Secrets & data

- Keys go in `.env.local` only. `.env*` is gitignored. Copy `.env.example` to start.
- If a key leaks into git: rotate it immediately, then tell the team.
- `data/` contains fake data only. No real client, employee or SD Worx data.

## Local setup

```bash
nvm use            # or any Node >= 22
npm ci
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + build, same as CI
```

## Communication

- One shared channel for the team; decisions get written into `docs/decisions.md`.
- Blocked? Say so early; use the `blocked` label on GitHub.
