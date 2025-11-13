# snapify

Visual regression snapshots for Shopify themes using Playwright — no running dev server required.

## Key ideas

- ✨ Render OS 2.0 JSON or Liquid templates entirely in-memory with LiquidJS and custom Shopify helpers.
- 🧱 Resolves sections, snippets, and local-path includes just like a deployed theme.
- 🎨 Inlines CSS/JS assets (including `{{ 'theme.css' | asset_url | stylesheet_tag }}`) so snapshots reflect final storefront styling.
- 🖼️ Replaces `shopify://shop_images/...` references with deterministic SVG placeholders (respecting requested width/height) so tests never need the real CDN assets.
- 📸 Uses Playwright to capture screenshots and `pixelmatch` to diff against baselines.
- 🧪 Ships both a programmatic API (`render`) and a CLI (`snapify render`).

## Installation

```bash
cd snapify
npm install
npx playwright install --with-deps chromium
npm run build
npm run test:integration
```

You can then link it into another Shopify theme, or run the CLI against the current repository root (which already contains a full theme).

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

## Programmatic API

```ts
import { render } from 'snapify';

await render({
  themeRoot: '/path/to/theme',
  template: 'product',
  layout: 'checkout',
  data: { product: { title: 'Sample' } },
  styles: '.debug-outline { outline: 1px solid red; }',
  viewport: { width: 1440, height: 900 },
  snapshot: {
    name: 'product-page',
    baselineDir: './.snapify/baseline',
    outputDir: './.snapify/artifacts',
    update: process.env.CI ? false : true
  }
});
```

The resolved object includes:

- `htmlPath` – rendered document saved to disk for inspection.
- `screenshotPath` – Playwright capture for the latest run.
- `diffPath` – optional PNG diff if the baseline mismatches.
- `updatedBaseline` – `true` if the baseline image was re-written this run.

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

## Next steps

- Add configuration discovery (`snapify.config.ts`) so command invocations stay minimal.
- Expand Liquid helper coverage (e.g. `image_url`, `form`, predictive search).
- Allow parallel snapshot execution and section-specific fixtures.
- Integrate with CI providers (GitHub Actions annotations, inline diff previews).

## Testing multiple templates

Repository-level tests live in `tests/` (outside this package) and import the compiled Snapify build. From the repo root:

```bash
# build snapify first
npm run snapify:build

# refresh baselines across index/product/cart
SNAPIFY_UPDATE_BASELINES=1 npm run snapify:test:templates

# validate against existing baselines
npm run snapify:test:templates
```

Artifacts land under `.snapify/templates/{baseline,artifacts}` at the repo root so they can be reviewed or committed.
