import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TemplateAssembler } from '../src/core/templateAssembler.js';
import { render } from '../src/render.js';
import { SNAPIFY_ASSET_HOST } from '../src/core/constants.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_THEME = path.join(here, 'theme');
const SNAPSHOT_ROOT = path.join(here, '.snapshots');
const BASELINE_DIR = path.join(SNAPSHOT_ROOT, 'baseline');
const ARTIFACT_DIR = path.join(SNAPSHOT_ROOT, 'artifacts');

test('captures baseline snapshot (html + image) for fixture', { concurrency: false }, async (t) => {
  try {
    const result = await render({
      themeRoot: FIXTURE_THEME,
      template: 'index',
      browser: 'chromium',
      viewport: { width: 800, height: 600 },
      snapshot: {
        name: 'fixture-index',
        baselineDir: BASELINE_DIR,
        outputDir: ARTIFACT_DIR,
        update: true
      }
    });

    assert.ok(await pathExists(result.htmlPath), 'HTML artifact missing');
    assert.ok(await pathExists(result.screenshotPath), 'Screenshot artifact missing');
    assert.ok(await pathExists(result.htmlBaselinePath!), 'Baseline HTML should be stored');
    assert.equal(result.diffPath, undefined, 'Diff should not be generated when forcing baseline updates');
    assert.equal(result.updatedBaseline, true, 'Baseline should refresh during integration run');
  } catch (error) {
    if (isPlaywrightLaunchError(error)) {
      t.diagnostic('Skipping snapshot capture: Playwright could not launch in this environment (requires Chromium permissions).');
      t.skip();
      return;
    }
    throw error;
  }
});

test('matches snapshot HTML and image against baseline', { concurrency: false }, async (t) => {
  try {
    const result = await render({
      themeRoot: FIXTURE_THEME,
      template: 'index',
      browser: 'chromium',
      viewport: { width: 800, height: 600 },
      snapshot: {
        name: 'fixture-index',
        baselineDir: BASELINE_DIR,
        outputDir: ARTIFACT_DIR,
        update: false
      }
    });

    assert.equal(result.updatedBaseline, false, 'Should not rewrite baseline during regression run');
    const baselinePng = await readFile(path.join(BASELINE_DIR, 'fixture-index.png'));
    const latestPng = await readFile(result.screenshotPath);
    assert.equal(result.diffPath, undefined, 'Image diff should be clean against baseline');
    assert.ok(baselinePng.equals(latestPng), 'Screenshot bytes should match baseline exactly');

    const escapedHost = escapeRegExp(SNAPIFY_ASSET_HOST);
    const html = await readFile(result.htmlPath, 'utf8');
    assert.equal(result.htmlChanged, false, 'HTML should match stored baseline');
    assert.match(html, /Book a demo/, 'button label should render from section settings');
    assert.match(html, new RegExp(`href="${escapedHost}\/assets\/main\.css`), 'asset_url links should persist in HTML snapshot');
    assert.match(html, /data-section="hero"/, 'section wrappers should remain intact');
  } catch (error) {
    if (isPlaywrightLaunchError(error)) {
      t.diagnostic('Skipping snapshot comparison: Playwright could not launch in this environment (requires Chromium permissions).');
      t.skip();
      return;
    }
    throw error;
  }
});

async function pathExists(target: string) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function isPlaywrightLaunchError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return message.includes('bootstrap_check_in') || message.includes('Abort trap');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
