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
  constructor(
    message: string,
    public readonly newScreenshotPath?: string,
    public readonly htmlChanged?: boolean,
    public readonly htmlBaselinePath?: string,
    public readonly htmlPath?: string
  ) {
    super(message);
    this.name = 'SnapshotMismatchError';
  }
}

/**
 * Convenience assertion for snapshot outputs. Throws when the PNG changed;
 * handles HTML drift according to `htmlMode` (ignore | warn | fail).
 */
export function assertSnapshot(result: RenderResult, options: AssertSnapshotOptions = {}) {
  const { htmlMode = 'warn', warn = console.warn } = options;

  if (result.imageChanged) {
    throw new SnapshotMismatchError(
      `Snapshot mismatch: inspect ${result.newScreenshotPath ?? 'updated screenshot not written'}`,
      result.newScreenshotPath,
      result.htmlChanged,
      result.htmlPath,
      result.newHtmlPath ?? result.htmlPath
    );
  }

  if (htmlMode === 'fail' && result.htmlChanged) {
    throw new SnapshotMismatchError(
      `HTML mismatch: baseline=${result.htmlPath} current=${result.newHtmlPath ?? 'n/a'}`,
      result.newScreenshotPath,
      result.htmlChanged,
      result.htmlPath,
      result.newHtmlPath ?? result.htmlPath
    );
  }

  if (htmlMode === 'warn' && result.htmlChanged) {
    warn(`HTML changed: baseline=${result.htmlPath} current=${result.newHtmlPath ?? 'n/a'}`);
  }
}
