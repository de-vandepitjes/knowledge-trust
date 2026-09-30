# data/

Synthetic corpus for the demo lives here (policies, chat exports, handover notes, …).

Rules:

- **Fake data only.** No real SD Worx, client or personal data. Ever.
- Plant the friction on purpose: duplicates, contradictions, stale docs, docs whose owner has left.
- `manifest.json` holds each document's metadata (owner, date, scope, tags). `docs.json` holds the content keyed by document id. Both are imported statically; the app does not read files at runtime.
