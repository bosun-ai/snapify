import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../src/render.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const THEME_ROOT = path.join(here, 'theme');
const SNAPSHOT_ROOT = path.join(here, '__snapshots__');
const BASELINE_DIR = path.join(SNAPSHOT_ROOT, 'baseline');
const ARTIFACT_DIR = path.join(SNAPSHOT_ROOT, 'artifacts');

async function fileExists(target: string) {
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

test('README example render matches baseline (HTML + PNG)', { concurrency: false }, async (t) => {
  const name = 'readme-example';
  const baselineExists = await fileExists(path.join(BASELINE_DIR, `${name}.png`));
  const updateFlag = process.env.SNAPIFY_UPDATE_BASELINES === '1';
  const update = updateFlag || (!baselineExists && process.env.CI !== 'true');
  try {
    const result = await render({
      themeRoot: THEME_ROOT,
      template: 'index',
      viewport: { width: 1280, height: 720 },
      snapshot: {
        name,
        baselineDir: BASELINE_DIR,
        outputDir: ARTIFACT_DIR,
        update
      }
    });

    if (update) {
      assert.equal(result.updatedBaseline, true);
      return;
    }

    assert.equal(result.updatedBaseline, false, 'should not rewrite baseline during regression run');
    assert.equal(result.diffPath, undefined, 'image diff should be clean');
    assert.equal(result.htmlChanged, false, 'HTML should match baseline');

    const baselinePng = await readFile(path.join(BASELINE_DIR, `${name}.png`));
    const latestPng = await readFile(result.screenshotPath);
    assert.ok(baselinePng.equals(latestPng), 'screenshot bytes should match baseline');
  } catch (error) {
    if (isPlaywrightLaunchError(error)) {
      t.diagnostic('Skipping README snapshot check: Playwright could not launch in this environment.');
      t.skip();
      return;
    }
    throw error;
  }
});

test('examples/jest homepage example remains valid', { concurrency: false }, async (t) => {
  const name = 'index-jest';
  const baselineExists = await fileExists(path.join(BASELINE_DIR, `${name}.png`));
  const updateFlag = process.env.SNAPIFY_UPDATE_BASELINES === '1';
  const update = updateFlag || (!baselineExists && process.env.CI !== 'true');
  try {
    const result = await render({
      themeRoot: THEME_ROOT,
      template: 'index',
      snapshot: {
        name,
        baselineDir: BASELINE_DIR,
        outputDir: ARTIFACT_DIR,
        update
      }
    });

    if (update) {
      assert.equal(result.updatedBaseline, true);
      return;
    }

    assert.equal(result.updatedBaseline, false);
    assert.equal(result.diffPath, undefined);
    assert.equal(result.htmlChanged, false);
  } catch (error) {
    if (isPlaywrightLaunchError(error)) {
      t.diagnostic('Skipping Jest example check: Playwright could not launch in this environment.');
      t.skip();
      return;
    }
    throw error;
  }
});
