/**
 * Deterministic payload describing unsupported Liquid constructs encountered during rendering.
 */
export interface DiagnosticsSnapshot {
  /** Unknown or unimplemented tags seen while rendering. */
  tags: string[];
  /** Unknown or unimplemented filters seen while rendering. */
  filters: string[];
}

/**
 * Tracks unsupported Liquid constructs during rendering so HTML consumers can discover gaps and fix them.
 * Emits a deterministic payload for machine parsing (e.g., CI gating or editor hints).
 *
 * @example
 * ```ts
 * const diagnostics = new Diagnostics();
 * diagnostics.recordFilter('money_with_currency');
 * const script = diagnostics.renderScriptTag();
 * // => <script type="application/json" data-snapify-diagnostics>{"tags":[],"filters":["money_with_currency"]}</script>
 * ```
 */
export class Diagnostics {
  private tags = new Set<string>();
  private filters = new Set<string>();

  reset() {
    this.tags.clear();
    this.filters.clear();
  }

  recordTag(name: string) {
    if (name) this.tags.add(name);
  }

  recordFilter(name: string) {
    if (name) this.filters.add(name);
  }

  snapshot(): DiagnosticsSnapshot {
    return {
      tags: Array.from(this.tags).sort(),
      filters: Array.from(this.filters).sort()
    };
  }

  renderScriptTag() {
    const payload = this.snapshot();
    if (!payload.tags.length && !payload.filters.length) return '';
    const json = JSON.stringify(payload);
    return `<script type="application/json" data-snapify-diagnostics>${json}</script>`;
  }
}
