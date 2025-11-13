import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit, type BrowserContext, type BrowserContextOptions, type BrowserType, type Page } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ensureDir, fileExists, writeFileRecursive } from '../utils/fs.js';
import type { BrowserName, RegisteredAsset, RenderOptions, RenderResult } from '../types.js';
import { SNAPIFY_ASSET_HOST } from './constants.js';

interface SnapshotRuntimeOptions {
  name: string;
  baselinePath: string;
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

export class SnapshotRunner {
  async capture(html: string, options: SnapshotRuntimeOptions): Promise<RenderResult> {
    await ensureDir(options.outputDir);
    await writeFileRecursive(options.htmlPath, html);

    const browserType = getBrowserType(options.browser);
    const browser = await browserType.launch({ headless: true });
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
      return {
        htmlPath: options.htmlPath,
        screenshotPath: options.screenshotPath,
        diffPath: undefined,
        updatedBaseline: true
      };
    }

    const diffPath = await this.diffWithBaseline(options.baselinePath, options.screenshotPath, options.diffPath);

    return {
      htmlPath: options.htmlPath,
      screenshotPath: options.screenshotPath,
      diffPath,
      updatedBaseline: false
    };
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
    const handler = async (route: Parameters<BrowserContext['route']>[1]) => {
      const url = route.request().url();
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

    const baselinePng = PNG.sync.read(baselineBuffer);
    const latestPng = PNG.sync.read(latestBuffer);

    if (baselinePng.width !== latestPng.width || baselinePng.height !== latestPng.height) {
      throw new Error('Baseline and latest screenshots have different dimensions. Ensure viewport settings are stable.');
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
