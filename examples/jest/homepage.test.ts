/**
 * @jest-environment node
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, assertSnapshot } from 'snapify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('snapify jest example', () => {
  const themeRoot = path.resolve(__dirname, '../../tests/theme');
  const baselineDir = path.join(themeRoot, '.snapify', 'baseline');
  const artifactsDir = path.join(themeRoot, '.snapify', 'artifacts');
  const update = process.env.SNAPIFY_UPDATE_BASELINES === '1';

  it('matches existing baseline for index template', async () => {
    const snapshot = await render({
      themeRoot,
      template: 'index',
      snapshot: {
        name: 'index-jest',
        baselineDir,
        outputDir: artifactsDir,
        update
      }
    });

    if (update) {
      expect(snapshot.updatedBaseline).toBe(true);
      return;
    }

    assertSnapshot(snapshot, { htmlMode: 'warn' });
  });
});
