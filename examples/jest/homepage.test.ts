/**
 * @jest-environment node
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, assertSnapshot } from 'snapify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('snapify jest example', () => {
  const themeRoot = path.resolve(__dirname, '../../tests/theme');
  const snapshotDir = path.join(themeRoot, '__snapshots__');
  const update = process.env.SNAPIFY_UPDATE_BASELINES === '1';

  it('matches existing baseline for index template', async () => {
    const snapshot = await render({
      themeRoot,
      template: 'index',
      snapshot: {
        name: 'index-jest',
        dir: snapshotDir,
        accept: update
      }
    });

    if (update) {
      expect(snapshot.status).toBe('updated');
      return;
    }

    assertSnapshot(snapshot, { htmlMode: 'warn' });
  });
});
