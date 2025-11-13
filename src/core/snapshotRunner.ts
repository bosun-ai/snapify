import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { chromium, type BrowserContextOptions, type Page } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ensureDir, fileExists, writeFileRecursive } from '../utils/fs.js';
import type { RenderOptions, RenderResult } from '../types.js';

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
}

export class SnapshotRunner {
  async capture(html: string, options: SnapshotRuntimeOptions): Promise<RenderResult> {
    await ensureDir(options.outputDir);
    await writeFileRecursive(options.htmlPath, html);

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: options.viewport ?? { width: 1280, height: 720 } });
      const page = await context.newPage();
      await this.renderHtml(page, html, options.beforeSnapshot);
      await page.screenshot({ path: options.screenshotPath, fullPage: true });
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
