import path from 'node:path';
import { TemplateAssembler } from './core/templateAssembler.js';
import { SnapshotRunner } from './core/snapshotRunner.js';
import { slugifySnapshotName } from './utils/naming.js';
import type { BrowserName, RenderOptions, RenderResult } from './types.js';

export async function render(options: RenderOptions): Promise<RenderResult> {
  if (!options.template) {
    throw new Error('render() requires a template name.');
  }

  const themeRoot = path.resolve(options.themeRoot ?? process.cwd());
  const assembler = new TemplateAssembler(themeRoot);
  const html = await assembler.compose(options);
  const assetManifest = assembler.getAssetManifest();

  const name = slugifySnapshotName(options.snapshot?.name ?? options.template);
  const baselineDir = path.resolve(themeRoot, options.snapshot?.baselineDir ?? path.join('.snapify', 'baseline'));
  const outputDir = path.resolve(themeRoot, options.snapshot?.outputDir ?? path.join('.snapify', 'artifacts'));
  const browser = resolveBrowser(options.browser);

  const runner = new SnapshotRunner();

  return runner.capture(html, {
    name,
    baselinePath: path.join(baselineDir, `${name}.png`),
    outputDir,
    htmlPath: path.join(outputDir, `${name}.html`),
    screenshotPath: path.join(outputDir, `${name}.png`),
    diffPath: path.join(outputDir, `${name}.diff.png`),
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

function isBrowserName(value: string | undefined): value is BrowserName {
  return value === 'chromium' || value === 'firefox' || value === 'webkit';
}
