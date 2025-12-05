import type { RenderResult } from './types.js';

export type HtmlMode = 'ignore' | 'warn' | 'fail';

export interface AssertSnapshotOptions {
  /**
   * How strictly to treat HTML diffs. Defaults to 'warn' (log, but do not throw).
   */
  htmlMode?: HtmlMode;
  /** Optional logger (defaults to console.warn) for warnings. */
  warn?: (message: string) => void;
}

/**
 * Convenience assertion for snapshot outputs. Throws when the PNG diff is present;
 * handles HTML drift according to `htmlMode` (ignore | warn | fail).
 */
export function assertSnapshot(result: RenderResult, options: AssertSnapshotOptions = {}) {
  const { htmlMode = 'warn', warn = console.warn } = options;

  if (result.diffPath) {
    throw new Error(`Snapshot mismatch: see diff at ${result.diffPath}`);
  }

  if (htmlMode === 'fail' && result.htmlChanged) {
    throw new Error(`HTML mismatch: baseline=${result.htmlBaselinePath ?? 'n/a'} current=${result.htmlPath}`);
  }

  if (htmlMode === 'warn' && result.htmlChanged) {
    warn(`HTML changed: baseline=${result.htmlBaselinePath ?? 'n/a'} current=${result.htmlPath}`);
  }
}
