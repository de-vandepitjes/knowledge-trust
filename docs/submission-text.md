# Builderbase submission text (paste-ready)

## Project name

Trust Receipt

## One-liner

Payroll answers with a visible trust receipt: what the sources say, how fresh they are, who owns them, whether they conflict, and whether they apply to this client and country.

## Description

Every payroll consultant at SD Worx knows the moment: a client asks something urgent, search returns five documents, and three of them disagree. Finding is easy. Knowing which answer you can act on is the real problem.

Trust Receipt is a proof of concept for that moment. A consultant picks a client, asks a question, and gets an answer together with a receipt. The receipt scores every retrieved source on five signals: freshness, ownership (is the owner still here?), scope (right country, joint committee and client?), consensus (does anything contradict it?) and source type (policy, client agreement, handover note or chat). The signals roll up into one of three verdicts: safe to act, verify first, or stop. When sources disagree, the tool says so, names the conflict, and points to the person who owns the winning document.

The whole pipeline is deterministic code: claims are lifted from document lines, candidate answers are grouped by the value they state, and the verdict is a rule over the signals. Every chip on the receipt explains why it is green, amber or red, the weights are shown, and marking the answer you acted on feeds back into the source scores and weights. Nothing is hidden behind a black box.

Security is part of trust. Users only see the clients they are assigned to. Authorization is enforced server-side on every request, out-of-scope documents do not exist as far as the user can tell, and document content is treated as data so a planted "ignore previous instructions" line in a Teams export changes nothing.

Built in one evening with Next.js and TypeScript. Corpus is fictional Belgian payroll data with planted problems: a stale handover note, an ownerless duplicate, a Dutch rule quoted in a Belgian thread, and a client-specific agreement that changes the answer.

## Live demo

https://knowledge-trust.vercel.app (demo accounts are in docs/demo-accounts.md in the repo; sign in as lien and click the first example question)

## Repository

https://github.com/de-vandepitjes/knowledge-trust

## Tech

Next.js 16, TypeScript, Tailwind, Vercel. Security audit by Aikido.
