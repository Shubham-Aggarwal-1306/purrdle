# Architecture & decisions

Living record of product/infra decisions. Items marked _(tentative)_ belong to later phases and are re-checked against current pricing/docs when that phase starts.

## Decisions log

| Date       | Decision                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-08 | Name **Purrdle** is the business name; keep it. Revisit only if a trademark complaint arrives.                                   |
| 2026-10-08 | Android application ID / iOS bundle ID: `com.purrdle.app` (permanent after first Play upload).                                   |
| 2026-10-14 | No accounts in v1. Progress is device-local (MMKV); lost on reinstall unless Android backup restores it.                         |
| 2026-10-14 | Font: **Fredoka**.                                                                                                               |
| 2026-10-14 | One monorepo, three apps: `mobile` (players), `admin` (content generation), `api` (judge + generation).                          |
| 2026-10-14 | Free app, ad-monetized; no paid UA for now → no MMP (AppsFlyer/Adjust); Firebase Analytics only.                                 |
| 2026-10-14 | Early players mostly India; ad revenue focus US. Host in **US (`us-central1`)**; latency only affects `/judge`.                  |
| 2026-10-14 | Spelling: levels use **US English**; UK / Indian English spellings go in `acceptedVariants`.                                     |
| 2026-10-14 | Redis: **Upstash** (serverless, same region as API).                                                                             |
| 2026-10-14 | Admin app: **Vite + React + TypeScript SPA**.                                                                                    |
| 2026-10-14 | Text generation model: **Claude via OpenRouter**. Jev is used only for typed decisions (judge, quality checks).                  |
| 2026-10-14 | Budget: **as close to free as possible** — prefer free tiers and scale-to-zero everywhere.                                       |
| 2026-10-14 | Phase order: ship the player app first; generation backend + admin app come after release prep.                                  |
| 2026-10-14 | Answer matching: answers of **≤3 letters must be exact** (no typo/near-miss leniency); 4–6 letters allow 1 typo, longer allow 2. |

## Components

```
apps/mobile     Expo player app                        → Google Play (iOS later)
apps/admin      Vite + React SPA: word queue, generate, review, publish packs   (after release)
apps/api        Fastify, one codebase, two deployments:
                  public  → /judge only. No admin routes, no generation keys.
                  admin   → generation jobs, RAG, publishing. Only reachable by admin users.
packages/shared level schema, answer matching, game state machine (used by all three)
```

The public and admin deployments are separate entry points registering different route sets, so a
public-side bug or leaked token cannot reach the content pipeline.

## Level content flow

- v1: ~30 bundled levels in the app (offline), then hand-curated packs.
- Later: admin generates drafts → RAG facts (Postgres + pgvector) → Claude writes hints/explanation →
  Jev scores quality ("does hint 1 give the word away?", "are hints monotonic?") → image search
  (Unsplash/Pexels, credit + license stored) → **human approval** → publish immutable versioned pack
  JSON to object storage + CDN → app downloads & caches.
- RAG source licensing: prefer permissive sources (e.g. WordNet). Wiktionary/Wikipedia are CC BY-SA —
  generate original text grounded in facts and keep a source note per level; get the policy reviewed.

## Near-free hosting plan _(tentative — verify free tiers when each phase starts)_

| Need                         | Plan                                                                                       | Why                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Public `/judge` API          | Cloud Run `us-central1`, scale to zero                                                     | Free monthly request/CPU allowance; no idle cost.               |
| Rate limit + judge cache     | Upstash Redis (GCP `us-central1`)                                                          | Free tier, pay-per-request after.                               |
| Abuse protection             | Firebase App Check (Play Integrity)                                                        | No accounts → device IDs are spoofable; every judge call costs. |
| Secrets                      | Secret Manager                                                                             | Small free allowance.                                           |
| Level packs + images         | Object storage + CDN — evaluate Cloudflare R2 vs Firebase Hosting/Storage                  | Images dominate bandwidth; R2 has no egress fees.               |
| Generation DB (later)        | Neon Postgres free tier with pgvector (instead of Cloud SQL)                               | Cloud SQL has no free tier.                                     |
| Admin hosting + auth (later) | Firebase Hosting + Firebase Auth (Google sign-in, allowlisted emails verified server-side) | Avoids the load balancer that classic IAP needs.                |
| Generation jobs (later)      | Cloud Tasks → admin Cloud Run service                                                      | Long LLM calls off the request path.                            |

Variable costs that free tiers don't remove: Jev calls (only for `borderline` guesses, cached globally
by `(levelId, normalizedGuess)`), and Claude calls during content generation (per level, occasional).
