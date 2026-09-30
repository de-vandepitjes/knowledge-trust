# Team & working agreements

## People

| Name                  | GitHub      | Focus |
| --------------------- | ----------- | ----- |
| Sebastian Van Isacker | @Chewie2005 |       |
|                       |             |       |
|                       |             |       |
|                       |             |       |

## Git flow (hackathon mode)

- Everyone commits **straight to `main`**. No PRs, no reviews. Speed wins.
- `main` must still run. Before you push: `npm run check` (or at least `npm run build`). If you break it, fix it first.
- `git pull --rebase` before every push to avoid merge commits and conflicts.
- Commit small and often, message `type: what` (e.g. `feat: trust panel shows source age`).
- Work in separate files/folders where possible so you don't step on each other.
- CI still runs on every push as a safety net; if it goes red, whoever pushed last fixes it.

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
