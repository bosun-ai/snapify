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

export class SnapshotMismatchError extends Error {
  constructor(message: string, public readonly diffPath?: string, public readonly htmlChanged?: boolean, public readonly htmlBaselinePath?: string, public readonly htmlPath?: string) {
    super(message);
    this.name = 'SnapshotMismatchError';
  }
}

/**
 * Convenience assertion for snapshot outputs. Throws when the PNG diff is present;
 * handles HTML drift according to `htmlMode` (ignore | warn | fail).
 */
export function assertSnapshot(result: RenderResult, options: AssertSnapshotOptions = {}) {
  const { htmlMode = 'warn', warn = console.warn } = options;

  if (result.diffPath) {
    throw new SnapshotMismatchError(`Snapshot mismatch: see diff at ${result.diffPath}`, result.diffPath, result.htmlChanged, result.htmlBaselinePath, result.htmlPath);
  }

  if (htmlMode === 'fail' && result.htmlChanged) {
    throw new SnapshotMismatchError(`HTML mismatch: baseline=${result.htmlBaselinePath ?? 'n/a'} current=${result.htmlPath}`, result.diffPath, result.htmlChanged, result.htmlBaselinePath, result.htmlPath);
  }

  if (htmlMode === 'warn' && result.htmlChanged) {
    warn(`HTML changed: baseline=${result.htmlBaselinePath ?? 'n/a'} current=${result.htmlPath}`);
  }
}
