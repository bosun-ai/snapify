# snapify

Visual regression snapshots for Shopify themes using Playwright — no running dev server required.

This enables drastic refactoring without the fear of breaking existing themes, and makes it easy to add visual tests for new Liquid templates as you build them.

## Key ideas

- ✨ Render OS 2.0 JSON or Liquid templates entirely in-memory with LiquidJS and custom Shopify helpers.
- 🧱 Resolves sections, snippets, and local-path includes just like a deployed theme.
- 🎨 Inlines CSS/JS assets (including `{{ 'theme.css' | asset_url | stylesheet_tag }}`) so snapshots reflect final storefront styling.
- 🖼️ Replaces `shopify://shop_images/...` references with deterministic SVG placeholders (respecting requested width/height) so tests never need the real CDN assets.
- 🌐 Respects Shopify locale strings: load `locales/en.default.json` (or pass `locale`/`SNAPIFY_LOCALE`) and `{{ 'sections.*' | t }}` renders with the same copy as production.
- 📸 Uses Playwright to capture screenshots and `pixelmatch` to diff against baselines.
- 🧪 Ships both a programmatic API (`render`) and a CLI (`snapify render`).

## Installation

```bash
npm save --dev @bosun-ai/snapify playwright
npx playwright install --with-deps chromium
```

You can then write your tests, or run the CLI against the current repository root (which already contains a full theme).

## CLI usage

```bash
snapify render <template> [options]
```

Common flags:

- `--theme-root` – root of the Shopify theme (defaults to `process.cwd()`).
- `--layout` – override layout file (without `.liquid`).
- `--data` – inline JSON or a path to a JSON file providing Liquid data.
- `--styles`/`--styles-file` – inject additional CSS.
- `--viewport 1440x900` – customize Playwright viewport.
- `--baseline-dir` and `--output-dir` – control artifact locations (`.snapify/baseline` and `.snapify/artifacts` by default).
- `--update` – rebuild the baseline snapshot.

Example:

```bash
snapify render index --theme-root .. --viewport 1440x900 --data ./fixtures/home.json
```

## Programmatic API (with assertions)

The `assertSnapshot` helper makes PNG the source of truth while still surfacing HTML drift for debugging.

```ts
import { render, assertSnapshot } from 'snapify';

const snapshot = await render({
  themeRoot: '/path/to/theme',
  template: 'product',
  locale: 'en.default',
  layout: 'checkout',
  data: { product: { title: 'Sample' } },
  styles: '.debug-outline { outline: 1px solid red; }',
  viewport: { width: 1440, height: 900 },
  snapshot: {
    name: 'product-page',
    dir: './__snapshots__',
    accept: process.env.CI ? false : true
  }
});

assertSnapshot(snapshot, { htmlMode: 'warn' });
```

The resolved object includes:

- `htmlPath` / `screenshotPath` – stored baseline snapshot files.
- `newHtmlPath` / `newScreenshotPath` – `.new` files written only when output differs.
- `htmlChanged` / `imageChanged` – booleans for diff detection.
- `status` – `'matched' | 'updated' | 'changed'`.

## Extending Liquid constructs

Snapify exposes the underlying LiquidJS engine so you can add your own tags and filters, using the same API Liquid provides:

```ts
import { TemplateAssembler } from 'snapify/core/templateAssembler.js';

const assembler = new TemplateAssembler('/path/to/theme');

assembler.extend((engine) => {
  engine.registerFilter('shout', (value) => String(value ?? '').toUpperCase());
  engine.registerTag('hello', {
    parse() {},
    async render() {
      return '<span data-custom="hello">hello</span>';
    }
  });
});

const html = await assembler.compose({ template: 'index', layout: false });
```

Custom constructs participate in the same render pipeline as built-ins, so they work with snapshots and diagnostics.

## Using Snapify in automated tests

Snapify slots into Node's built-in test runner (or Jest/Vitest) so you can assert against baselines inside regular CI suites:

```ts
// tests/homepage.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { render } from 'snapify';

const THEME_ROOT = path.resolve('tests/theme');
const SNAPSHOT_DIR = path.join(THEME_ROOT, '__snapshots__');
const ACCEPT = Boolean(process.env.SNAPIFY_UPDATE_BASELINES);

test('index template matches stored baseline', async () => {
  const snapshot = await render({
    themeRoot: THEME_ROOT,
    template: 'index',
    data: { hero: { headline: 'Golden hour' } },
    viewport: { width: 1280, height: 720 },
    snapshot: {
      name: 'index',
      dir: SNAPSHOT_DIR,
      accept: ACCEPT
    }
  });

  if (ACCEPT) {
    // Baselines refreshed locally; fail fast if this ever happens on CI.
    assert.equal(snapshot.status, 'updated');
    return;
  }

  assert.equal(snapshot.imageChanged, false, `Snapshot drift detected. Inspect ${snapshot.newScreenshotPath ?? 'n/a'} for details.`);
  assert.equal(snapshot.htmlChanged, false, 'Rendered HTML should match the stored baseline');
});
```

Tips:

- `SNAPIFY_UPDATE_BASELINES=1 npm test` refreshes every snapshot in bulk.
- Keep `.snapify/**` artifacts in source control so reviewers can see diffs.
- Push diff artifacts to CI logs (or GitHub Actions annotations) for quick triage.

### Jest example

Using Snapify inside Jest with TypeScript just requires enabling ESM support and invoking `render` + `assertSnapshot` within a test:

```ts
/**
 * @jest-environment node
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, assertSnapshot } from 'snapify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEME_ROOT = path.resolve(__dirname, '../theme');

describe('product template', () => {
  const snapshotDir = path.join(THEME_ROOT, '__snapshots__');
  const accept = process.env.SNAPIFY_UPDATE_BASELINES === '1';

  it('matches the stored baseline', async () => {
    const snapshot = await render({
      themeRoot: THEME_ROOT,
      template: 'product',
      snapshot: {
        name: 'product',
        dir: snapshotDir,
        accept
      }
    });

    if (accept) {
      expect(snapshot.status).toBe('updated');
      return;
    }

    assertSnapshot(snapshot, { htmlMode: 'warn' });
  });
});

// See examples/jest/homepage.test.ts in this repository for a complete, runnable example.
```

Set up Jest with `"type": "module"` (or `transform` rules for CommonJS), run `SNAPIFY_UPDATE_BASELINES=1 npx jest` locally to refresh baselines, and `npx jest` in CI to verify snapshots.

## How rendering works

1. **Liquid + sections.** `TemplateAssembler` configures LiquidJS with Shopify-like defaults, resolves JSON templates (sections, block order, `custom_css`) and plain `.liquid` templates.
2. **Inline assets.** Filters such as `asset_url`, `stylesheet_tag`, and `script_tag` are re-implemented to read from `assets/` and inline their contents directly into the `<head>`.
3. **Head injection.** Anything coming from filters or user-provided `styles` is piped through `content_for_header` (or injected at the top of `<head>` if a layout omits it) so the snapshot matches storefront styling.
4. **Playwright capture.** HTML is handed to a headless Chromium page via `page.setContent`, and the resulting screenshot is compared with the baseline using `pixelmatch`.

### Local-path includes

Snapify keeps Liquid's `relativeReference` behavior enabled, so you can co-locate fixtures next to the template you are testing:

```liquid
{%- comment -%}sections/__snapify__/hero.liquid{%- endcomment -%}
<section class="hero">
  {% render './partials/cta', label: 'Book a demo' %}
</section>
```

Place `sections/__snapify__/partials/cta.liquid` next to it and the renderer will resolve the relative include without needing to copy files into `snippets/`.

## Testing multiple templates

This repository uses the Node test runner plus the `SNAPIFY_UPDATE_BASELINES` flag shown above. Run the following from the repo root:

```bash
# Refresh baselines locally
SNAPIFY_UPDATE_BASELINES=1 npm test

# Validate without touching stored baselines
npm test
```

Artifacts land under `.snapify/**` inside your theme root so they can be reviewed or committed.
