import path from 'node:path';
import { TemplateAssembler } from './core/templateAssembler.js';
import { SnapshotRunner } from './core/snapshotRunner.js';
import { slugifySnapshotName } from './utils/naming.js';
import type { BrowserName, RenderOptions, RenderResult } from './types.js';

/**
 * Renders a Shopify template into deterministic HTML, captures a screenshot, and diffs/refreshes baselines.
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

  const themeRoot = path.resolve(options.themeRoot ?? process.cwd());
  const assembler = new TemplateAssembler(themeRoot);
  const html = await assembler.compose(options);
  const assetManifest = assembler.getAssetManifest();

  const name = slugifySnapshotName(options.snapshot?.name ?? options.template);
  const snapshotDir = path.resolve(themeRoot, resolveSnapshotDir(options.snapshot));
  const browser = resolveBrowser(options.browser);

  const runner = new SnapshotRunner();

  return runner.capture(html, {
    name,
    snapshotDir,
    snapshotPath: path.join(snapshotDir, `${name}.png`),
    snapshotHtmlPath: path.join(snapshotDir, `${name}.html`),
    newSnapshotPath: path.join(snapshotDir, `${name}.new.png`),
    newSnapshotHtmlPath: path.join(snapshotDir, `${name}.new.html`),
    viewport: options.viewport,
    beforeSnapshot: options.beforeSnapshot,
    updateBaseline: options.snapshot?.update,
    browser,
    assetManifest,
    fullPage: options.snapshot?.fullPage
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
  if (snapshot?.baselineDir) return snapshot.baselineDir;
  if (snapshot?.outputDir) return snapshot.outputDir;
  return '__snapshots__';
}

function isBrowserName(value: string | undefined): value is BrowserName {
  return value === 'chromium' || value === 'firefox' || value === 'webkit';
}
