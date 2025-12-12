import path from 'node:path';
import { TemplateAssembler } from './core/templateAssembler.js';
import { SnapshotRunner } from './core/snapshotRunner.js';
import { slugifySnapshotName } from './utils/naming.js';
import type { BrowserName, RenderOptions, RenderResult } from './types.js';
import { loadConfig, mergeRenderOptions } from './config.js';

/**
 * Renders a Shopify template into deterministic HTML, captures a screenshot, and diffs/refreshes baselines.
 *
 * If a `snapify.config.*` file exists in the theme root, its values are merged as defaults.
 *
 * @param options Render configuration (template name, data, theme root, snapshot paths, etc.).
 * @returns Paths to the generated HTML, screenshot, and any diff/baseline updates.
 *
 * @example
 * ```ts
 * import { render } from '@bosun-ai/snapify';
 *
 * await render({
 *   themeRoot: '/path/to/theme',
 *   template: 'product',
 *   data: { product: { title: 'Test' } },
 *   snapshot: { update: true }
 * });
 * ```
 */
export async function render(options: RenderOptions): Promise<RenderResult> {
  if (!options.template) {
    throw new Error('render() requires a template name.');
  }

  const config = await loadConfig(path.resolve(options.themeRoot ?? process.cwd()));
  const merged = mergeRenderOptions(config, options);

  const themeRoot = path.resolve(merged.themeRoot ?? process.cwd());
  const assembler = new TemplateAssembler(themeRoot);
  const html = await assembler.compose(merged);
  const assetManifest = assembler.getAssetManifest();

  const name = slugifySnapshotName(merged.snapshot?.name ?? merged.template);
  const snapshotDir = path.resolve(themeRoot, resolveSnapshotDir(merged.snapshot));
  const browser = resolveBrowser(merged.browser);

  const runner = new SnapshotRunner();

  const accept = merged.snapshot?.accept ?? merged.snapshot?.update ?? false;

  return runner.capture(html, {
    name,
    snapshotDir,
    snapshotPath: path.join(snapshotDir, `${name}.png`),
    snapshotHtmlPath: path.join(snapshotDir, `${name}.html`),
    newSnapshotPath: path.join(snapshotDir, `${name}.new.png`),
    newSnapshotHtmlPath: path.join(snapshotDir, `${name}.new.html`),
    viewport: merged.viewport,
    beforeSnapshot: merged.beforeSnapshot,
    updateBaseline: accept,
    browser,
    assetManifest,
    fullPage: merged.snapshot?.fullPage
  });
}

function resolveBrowser(explicit?: BrowserName) {
  const envValue = process.env.SNAPIFY_BROWSER as BrowserName | undefined;
  if (explicit) return explicit;
  if (isBrowserName(envValue)) return envValue;
  return 'chromium';
}

function resolveSnapshotDir(snapshot?: RenderOptions['snapshot']) {
  if (snapshot?.dir) return snapshot.dir;
  const envValue = process.env.SNAPIFY_SNAPSHOT_DIR;
  if (envValue) return envValue;
  return '__snapshots__';
}

function isBrowserName(value: string | undefined): value is BrowserName {
  return value === 'chromium' || value === 'firefox' || value === 'webkit';
}
