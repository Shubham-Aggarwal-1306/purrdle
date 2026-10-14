# Purrdle — guide for Claude / contributors

Cat-themed, level-based word-guessing game. React Native (Expo dev build), ad-funded, Android/Google Play first, iOS later. Audience 13+ / adult casual (not child-directed).

## Layout

```
apps/mobile      Expo SDK 57 player app (expo-router, dev client — NOT Expo Go), TS strict
apps/api         Fastify 5 (Node 22, ESM). Two deployments: public (/judge only) and admin (generation)
apps/admin       Vite + React admin SPA for content generation — added after release prep
packages/shared  Pure TS: level schema (zod), answer matching, game state machine
docs/            architecture.md (decisions log), compliance.md, privacy policy, app-ads.txt
```

Phase plan: README.md → "Roadmap" (current: **Phase 3 done**). Decisions (region, vendors, budget): `docs/architecture.md` — read it before infra work and append to its log when a decision changes. Budget is **near-free**: prefer free tiers and scale-to-zero.

## `packages/shared` map (Phase 1)

| Module                            | What                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `level/schema.ts`                 | zod `LevelSchema` / `LevelPackSchema`, `parseLevelPack()` (validates untrusted pack JSON, sorts by order)                         |
| `matching/normalize.ts`           | `normalizeGuess()` / `compactForm()` — the one place text is normalized                                                           |
| `matching/damerau-levenshtein.ts` | Unrestricted Damerau–Levenshtein on code points                                                                                   |
| `matching/morphology.ts`          | Inflection heuristic (purring ~ purr) used only to flag `borderline`                                                              |
| `matching/match.ts`               | `matchAnswer()` → `invalid` / `correct` (exact or typo) / `borderline` / `wrong`; numeric `MatchOptions` (Remote Config-friendly) |
| `game/state.ts`                   | `LevelProgress` (persisted JSON), `parseLevelProgress()` for restoring from MMKV                                                  |
| `game/machine.ts`                 | `transition(state, event, ctx) → { state, effect }`; effects drive haptics/sound/analytics/judge/ads                              |
| `game/selectors.ts`, `scoring.ts` | Derived values (guesses left, visible hints, can-reveal, can-grant-extra) and paw stars                                           |

Rules: the state machine never performs I/O. A `needsJudge` effect means the app calls `/judge` and then dispatches `judgeResolved` (dispatch `accepted: false` on timeout/error). Invalid, repeated or out-of-state events return the **same state object** with a `rejected` effect. Bump `PROGRESS_SCHEMA_VERSION` (and migrate or discard) when changing `LevelProgress`. Coverage gate for shared: 95% statements/lines/functions, 90% branches.

## `apps/mobile` map (Phase 2)

```
src/app/               routes only (thin): _layout (fonts + splash), index, levels, level/[id], result/[id], settings
src/features/<area>/   screens + logic: home, level-map, game (LevelScreen, useLevelGame, mascotMood, messages),
                       result, settings (screen + store), progress (store + selectors), levels (bundled pack,
                       repository, images), feedback (pure effect→haptic/sound mapping + device wrappers)
src/components/        presentational only (props in, callbacks out) — no stores, no router
src/theme/tokens.ts    the only place for colors, spacing, radii, fonts, typography
src/lib/storage.ts     MMKV instance + zustand persist adapter
assets/                fonts (Fredoka, OFL), sounds + placeholder level art (scripts/generate-placeholder-assets.mjs)
```

- Persisted stores: `progress` (per-level `LevelProgress`, validated with `parseLevelProgress` on rehydrate) and `settings` (sound, haptics). MMKV is synchronous, so state is ready before first render.
- Level flow: `useLevelGame` dispatches to the shared machine via the progress store, then plays feedback for the returned effect. Route files validate params and redirect (locked/unknown level → `/levels`, unsolved result → level).
- Level images: `placeholder:<key>` → bundled art; `https://…` → remote. Every level shows `credit · license`.
- Reanimated: use `sv.get()` / `sv.set()` (not `.value`) — the React Compiler lint rule forbids mutating `.value`.
- Native permissions are pinned in `app.json` (`android.permissions: []` + `blockedPermissions`). expo-audio's plugin is configured with no microphone/background audio. Re-check the merged manifest whenever a native dep is added.
- AI judge: `features/judge/client.ts` posts to `${EXPO_PUBLIC_API_URL}/judge` with a random per-install
  `X-Installation-Id` (MMKV). Judging is state-driven: whenever a level is in `judging`, `useLevelGame`
  requests a verdict (also resuming one interrupted by an app restart). No API URL → judge disabled →
  borderline guesses count as wrong.
- Typed routes are off (they need generated files from `expo start`, which CI doesn't run).

## `apps/api` map (Phase 3)

```
src/server.ts        public entry: loadConfig → createPublicDeps → buildPublicApp → listen
src/app.ts           buildPublicApp(deps): /health + POST /judge only (admin routes never registered here)
src/deps.ts          wires config → store (Upstash | memory), judge (mock | jev), limiter, rules
src/config.ts        zod-validated env; fails fast (production requires Upstash)
src/routes/judge.ts  attest → x-installation-id → body (zod, strict) → rate limit → JudgeService
src/judge/           AnswerJudge interface, MockJudge, JevJudge (stub — TODO(jev)), JudgeService
src/store/           KeyValueStore: MemoryStore (dev/tests), UpstashStore (REST via fetch, no SDK)
src/security/        RateLimiter (fixed windows per device + per IP), RequestAttestor (App Check TODO phase 5)
```

- `JudgeService.decide`: shared `matchAnswer` first (correct/wrong never reach the AI) → shared cache keyed by
  normalized answer forms + guess (rejections cached too) → daily budget counter → judge with timeout →
  accept only `sameWord && confidence ≥ threshold`. Store/budget failures fail **closed** (503).
- Responses: 200 `{accepted, source: rules|cache|judge}`, 400 bad input/missing installation id, 401
  attestation, 413 body > 4 KB, 429 + `Retry-After`, 503 unavailable. The app treats anything but
  `accepted: true` as a wrong guess (4 s client timeout).
- Jest maps `@purrdle/shared` to its TS source (its `dist` is ESM). Coverage gate: 95/90/90/95.

## Commands (run from repo root)

| Command                                      | What                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm install`                               | install everything (pnpm 10, `node-linker=hoisted`)                    |
| `pnpm check`                                 | format:check + lint + typecheck + tests — run before every commit      |
| `pnpm test` / `pnpm typecheck` / `pnpm lint` | per-workspace via `pnpm -r`                                            |
| `pnpm build`                                 | tsc build of `packages/shared` → `apps/api` (topological)              |
| `pnpm --filter @purrdle/api dev`             | API with watch (reads `apps/api/.env`)                                 |
| `pnpm --filter @purrdle/mobile start`        | Metro for the dev client                                               |
| `pnpm --filter @purrdle/mobile android`      | `expo run:android` — builds the dev client locally (needs Android SDK) |

Add mobile native deps with `npx expo install <pkg>` from `apps/mobile` (picks SDK-compatible versions), never plain `pnpm add`. In network-restricted sandboxes prefix `EXPO_OFFLINE=1`.

## Conventions

- **Imports inside `packages/shared` and `apps/api` use `.ts` extensions** (`import { x } from './x.ts'`). `tsc` rewrites them to `.js` on build (`rewriteRelativeImportExtensions`). This lets one source tree work in Metro (consumes shared from `src/` via the `react-native` export condition), Jest (ts-jest, CJS), and Node (consumes `dist/`). Do not use `.js` specifiers — Metro won't resolve them.
- `@purrdle/shared` must stay **pure and platform-free**: no React, no RN, no Node built-ins, no I/O. Game state must be serializable (persisted via MMKV).
- Business logic lives in `packages/shared` or app-level modules (`apps/mobile/src/features/*`, stores); components stay presentational.
- Expo Router routes live in `apps/mobile/src/app/`. **Only route files there** — tests and helpers go elsewhere (`src/__tests__`, `src/components`, …) or they become routes. `@/*` aliases `apps/mobile/src/*`.
- Content uses **US English**; UK / Indian English spellings go in `acceptedVariants`.
- Theme tokens (colors/spacing/radii/typography) are centralized in one module (Phase 2) — no hard-coded colors in components.
- Never call the AI provider (Jev) from the app. API keys live only in `apps/api/.env` / server secrets. `EXPO_PUBLIC_*` vars are bundled into the app — never secrets.
- Ads: Google **test** ad unit IDs in all non-release builds; frequency capping lives only in `AdManager`.
- Conventional commits (`feat(shared): …`, `chore(mobile): …`), small focused commits.
- Ask before adding dependencies not in the approved list (README → "Dependencies").
- Native folders (`android/`, `ios/`) are generated by `expo prebuild` (CNG) and git-ignored; configure via `app.json` + config plugins.

## Testing

- `packages/shared`, `apps/api`: Jest 30 + ts-jest (`*.test.ts` next to source). API tests use `app.inject()`, no network.
- `apps/mobile`: `jest-expo` preset + React Native Testing Library 14 (async `render` **and** async `fireEvent` — always `await`), tests in `src/__tests__/`, helpers in `src/test-utils/`. `jest.setup.ts` mocks MMKV (in-memory), sound and haptics; `react-native-worklets/jest/resolver.js` loads worklets' JS implementation. `levels-data.test.ts` validates the bundled pack (schema, no hint leaks the answer, 2–4 sentence explanations, image credit).

## Versions (verified 2026-10)

Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6.0 (TS 7 not yet supported by typescript-eslint / ts-jest), Fastify 5, Jest 30, ESLint 9 (flat config; eslint-config-expo's import plugin doesn't support ESLint 10 yet).
