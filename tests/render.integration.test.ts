import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../src/render.js';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const THEME_ROOT = path.resolve(DIRNAME, '..', '..');
const SNAPSHOT_ROOT = path.join('snapify', '.snapshots');

async function exists(target: string) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

test('renders index template and writes baseline artifacts', async () => {
  const result = await render({
    themeRoot: THEME_ROOT,
    template: 'index',
    browser: 'webkit',
    snapshot: {
      name: 'integration-homepage',
      baselineDir: path.join(SNAPSHOT_ROOT, 'baseline'),
      outputDir: path.join(SNAPSHOT_ROOT, 'artifacts'),
      update: true
    },
    viewport: { width: 1200, height: 800 }
  });

  assert.ok(await exists(result.htmlPath), 'html artifact should exist');
  assert.ok(await exists(result.screenshotPath), 'screenshot should exist');
  assert.equal(result.updatedBaseline, true, 'baseline should be rewritten for deterministic test');
});
