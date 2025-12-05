import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit, type BrowserContext, type BrowserContextOptions, type BrowserType, type Page, type Route, type Request } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ensureDir, fileExists, writeFileRecursive } from '../utils/fs.js';
import type { BrowserName, RegisteredAsset, RenderOptions, RenderResult } from '../types.js';
import { SNAPIFY_ASSET_HOST } from './constants.js';

interface SnapshotRuntimeOptions {
  name: string;
  baselinePath: string;
  baselineHtmlPath: string;
  outputDir: string;
  htmlPath: string;
  screenshotPath: string;
  diffPath: string;
  viewport?: BrowserContextOptions['viewport'];
  beforeSnapshot?: RenderOptions['beforeSnapshot'];
  updateBaseline?: boolean;
  browser?: BrowserName;
  assetManifest?: Map<string, RegisteredAsset>;
  fullPage?: boolean;
}

/**
 * Owns the Playwright lifecycle for snapshotting rendered HTML and diffing it against stored baselines.
 * Exported so higher-level tooling can subclass it (e.g., to stub browsers during tests).
 *
 * @example
 * ```ts
 * const runner = new SnapshotRunner();
 * const result = await runner.capture('<div>hi</div>', {
 *   name: 'example',
 *   baselinePath: '/tmp/baseline/example.png',
 *   baselineHtmlPath: '/tmp/baseline/example.html',
 *   outputDir: '/tmp/output',
 *   htmlPath: '/tmp/output/example.html',
 *   screenshotPath: '/tmp/output/example.png',
 *   diffPath: '/tmp/output/example.diff.png'
 * });
 * console.log(result.screenshotPath);
 * ```
 */
export class SnapshotRunner {
  /**
   * Writes the supplied HTML to disk, captures a Playwright screenshot, and either refreshes the baseline or diffs against it.
   */
  async capture(html: string, options: SnapshotRuntimeOptions): Promise<RenderResult> {
    await ensureDir(options.outputDir);
    await writeFileRecursive(options.htmlPath, html);
    await ensureDir(path.dirname(options.baselineHtmlPath));

    const browser = await this.launchBrowser(options.browser);
    try {
      const context = await browser.newContext({ viewport: options.viewport ?? { width: 1280, height: 720 } });
      const cleanupRouting = await this.setupAssetRouting(context, options.assetManifest);
      const page = await context.newPage();
      await this.renderHtml(page, html, options.beforeSnapshot);
      await page.screenshot({ path: options.screenshotPath, fullPage: options.fullPage ?? true });
      if (cleanupRouting) {
        await cleanupRouting();
      }
      await context.close();
    } finally {
      await browser.close();
    }

    if (options.updateBaseline || !(await fileExists(options.baselinePath))) {
      await ensureDir(path.dirname(options.baselinePath));
      const latestBuffer = await readFile(options.screenshotPath);
      await writeFileRecursive(options.baselinePath, latestBuffer);
      await writeFileRecursive(options.baselineHtmlPath, html);
      return {
        htmlPath: options.htmlPath,
        htmlBaselinePath: options.baselineHtmlPath,
        htmlChanged: false,
        screenshotPath: options.screenshotPath,
        diffPath: undefined,
        updatedBaseline: true
      };
    }

    const htmlChanged = await this.diffHtml(html, options.baselineHtmlPath);
    const diffPath = await this.diffWithBaseline(options.baselinePath, options.screenshotPath, options.diffPath);

    return {
      htmlPath: options.htmlPath,
      htmlBaselinePath: options.baselineHtmlPath,
      htmlChanged,
      screenshotPath: options.screenshotPath,
      diffPath,
      updatedBaseline: false
    };
  }

  protected async launchBrowser(name?: BrowserName) {
    const browserType = getBrowserType(name);
    return browserType.launch({ headless: true });
  }

  private async renderHtml(page: Page, html: string, beforeSnapshot?: RenderOptions['beforeSnapshot']) {
    await page.setContent(html, { waitUntil: 'networkidle' });
    if (beforeSnapshot) {
      await beforeSnapshot(page);
    }
    await page.waitForLoadState('networkidle');
  }

  private async setupAssetRouting(context: BrowserContext, manifest?: Map<string, RegisteredAsset>) {
    if (!manifest || manifest.size === 0) {
      return undefined;
    }

    const pattern = `${SNAPIFY_ASSET_HOST}/assets/*`;
    const handler = async (route: Route, request: Request) => {
      const url = request.url();
      const asset = manifest.get(url);
      if (!asset) {
        await route.continue();
        return;
      }
      await route.fulfill({
        body: asset.body,
        headers: {
          'content-type': asset.mimeType,
          'cache-control': 'public, max-age=31536000'
        }
      });
    };

    await context.route(pattern, handler);
    return async () => {
      await context.unroute(pattern, handler);
    };
  }

  private async diffWithBaseline(baselinePath: string, candidatePath: string, diffPath: string) {
    const [baselineBuffer, latestBuffer] = await Promise.all([
      readFile(baselinePath),
      readFile(candidatePath)
    ]);

    let baselinePng: PNG = PNG.sync.read(baselineBuffer);
    let latestPng: PNG = PNG.sync.read(latestBuffer);

    if (baselinePng.width !== latestPng.width || baselinePng.height !== latestPng.height) {
      const targetWidth = Math.max(baselinePng.width, latestPng.width);
      const targetHeight = Math.max(baselinePng.height, latestPng.height);
      baselinePng = padPng(baselinePng, targetWidth, targetHeight);
      latestPng = padPng(latestPng, targetWidth, targetHeight);
    }

    const diff = new PNG({ width: baselinePng.width, height: baselinePng.height });
    const mismatch = pixelmatch(
      baselinePng.data,
      latestPng.data,
      diff.data,
      baselinePng.width,
      baselinePng.height,
      {
        threshold: 0.1,
        alpha: 0.4
      }
    );

    if (mismatch === 0) {
      return undefined;
    }

    await writeFileRecursive(diffPath, PNG.sync.write(diff));
    return diffPath;
  }

  private async diffHtml(currentHtml: string, baselinePath: string) {
    if (!(await fileExists(baselinePath))) {
      await writeFileRecursive(baselinePath, currentHtml);
      return false;
    }
    const baseline = await readFile(baselinePath, 'utf8');
    return baseline !== currentHtml;
  }
}

function getBrowserType(name: BrowserName | undefined): BrowserType {
  switch (name) {
    case 'firefox':
      return firefox;
    case 'webkit':
      return webkit;
    default:
      return chromium;
  }
}

function padPng(source: PNG, width: number, height: number) {
  if (source.width === width && source.height === height) {
    return source;
  }
  const target = new PNG({ width, height });
  const sourceStride = source.width * 4;
  const targetStride = width * 4;
  for (let y = 0; y < source.height; y += 1) {
    source.data.copy(
      target.data,
      y * targetStride,
      y * sourceStride,
      y * sourceStride + sourceStride
    );
  }
  return target;
}
