# Repository Guidelines

## Project Structure & Module Organization

`src/` hosts the TypeScript source: `core/` contains the `TemplateAssembler` and `SnapshotRunner`, `utils/` covers helpers such as slug generation, and `cli.ts`/`render.ts` bridge the public API to the CLI. Build artifacts land in `dist/` (never edit manually). Integration and unit tests live in `tests/`, with fixture themes under `tests/theme/` so snapshots mirror a real Shopify storefront. Coverage output goes to `coverage/`, while `.snapify/**` folders inside the theme hold baseline and artifact PNGs generated at runtime.

## Build, Test, and Development Commands

- `npm run build` (or `just build`) bundles `src/index.ts` and `src/cli.ts` via `tsup`, emitting ESM code plus d.ts files.
- `npm run dev` watches the same entry points for rapid iteration.
- `npm run clean` removes `dist/`; rebuilding after API changes keeps `types` in sync.
- `npm run render -- <template>` exercises the compiled CLI against the current theme; pass `--theme-root` when targeting a different checkout.
- `npm test` → `c8` + `npm run test:all`; use `npm run test:unit` and `npm run test:integration` when troubleshooting specific suites.

## Coding Style & Naming Conventions

TypeScript (ES2022 modules) with 2-space indentation is the default; keep imports type-safe (`import type`) and prefer `const` + arrow functions for helpers. Classes (e.g., `TemplateAssembler`) use `PascalCase`, exported functions use `camelCase`, and CLI commands stay kebab-cased. Run `npm run build` before sending a PR to ensure `tsup` and TypeScript catch regressions; no separate linter is configured, so rely on compiler warnings and Playwright typings.

## Testing Guidelines

All tests use `tsx --test` and live under `tests/**/*.test.ts`. Organize new suites by feature (`featureName.test.ts`) and keep Playwright-heavy checks in `tests/shopify.integration.test.ts` to avoid slowing unit runs. `npm test` must finish cleanly with coverage reported by `c8`; aim to keep new logic above the existing project average before merging. When refreshing baselines, run `SNAPIFY_UPDATE_BASELINES=1 npm run test:integration` and include the resulting `.png` changes so reviewers can compare diffs.

## Commit & Pull Request Guidelines

Semantic-release is configured, so follow Conventional Commits (`feat(core): add section blocks`, `fix(cli): guard missing template`) to trigger the correct release notes. Keep messages imperative and scoped; avoid generic subjects like “cleanup” when introducing behavior changes. Pull requests should link the relevant issue, describe baseline updates, and attach screenshots or diff paths when Playwright output changes. Include the exact commands you ran (`npm test`, `npm run build`) in the PR description so reviewers can reproduce your verification steps quickly.
