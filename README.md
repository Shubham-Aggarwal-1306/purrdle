# Purrdle 🐾

A cozy, cat-themed word-guessing game. Each level hides one word; you get up to 5 hints (vague → obvious) and 3 guesses. Fewer hints = more paw stars.

## Quick start

Requirements: Node ≥ 22.18, pnpm 10 (`corepack enable`), Android Studio + SDK for device builds.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
pnpm check                                   # format, lint, typecheck, tests

pnpm --filter @purrdle/api dev               # API on :3000
pnpm --filter @purrdle/mobile android        # build + install the dev client (first time / after native changes)
pnpm --filter @purrdle/mobile start          # Metro for the installed dev client
```

The app uses a **development build** (`expo-dev-client`), not Expo Go, because it depends on native modules (AdMob, MMKV, Firebase).

## Structure

- `apps/mobile` — Expo / React Native app (expo-router)
- `apps/api` — Fastify API (AI answer judge; later content generation)
- `apps/admin` — content admin SPA (later phase)
- `packages/shared` — level schema, answer matching, game state machine (pure TS)
- `docs/` — Play Store compliance tracking, privacy policy draft, app-ads.txt

See [CLAUDE.md](./CLAUDE.md) for architecture and conventions.

## Roadmap

0. Scaffold ✅
1. Core logic — level schema, answer matching, game state machine ✅
2. Gameplay UI — theme, screens, bundled levels, MMKV persistence, haptics/sound
3. Public API + AI judge — `/judge` (mock + Jev stub), Upstash rate limiting/cache, App Check
4. Ads + consent — UMP (incl. US state privacy messages), AdManager caps, rewarded/interstitial/banner (test IDs)
5. Firebase — analytics, crashlytics, remote config
6. Android release prep — EAS profiles, targetSdk 36, compliance docs
7. Generation backend — Postgres + pgvector RAG, Claude drafts, Jev quality checks, pack publishing
8. Admin app — Vite + React: word queue, generate/review/approve, pack versioning

Architecture and decisions: [docs/architecture.md](./docs/architecture.md).

## Dependencies

Approved list lives in the project brief. Anything else needs sign-off first. Added in Phase 0 beyond the brief, as required peers/tooling:
`expo-linking`, `expo-constants`, `react-native-safe-area-context`, `react-native-screens` (expo-router peers), `test-renderer` + `@react-native/jest-preset` (RNTL / jest-expo peers), `typescript-eslint`, `eslint-config-expo`, `eslint-config-prettier`, `ts-jest`.
