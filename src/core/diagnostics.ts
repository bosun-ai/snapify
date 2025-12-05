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
 * Tracks unsupported Liquid constructs encountered during rendering so callers (or HTML consumers)
 * can see what needs to be implemented. Keeps a deterministic payload for easy machine parsing.
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
