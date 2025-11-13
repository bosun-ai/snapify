/**
 * Produces a filesystem-safe snapshot name while keeping templates with similar handles stable.
 */
export function slugifySnapshotName(input: string) {
  const value = (input ?? '').toString().trim();
  const primary = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 100);
  if (primary) {
    return primary;
  }
  if (value) {
    const fallback = value
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]+/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    if (fallback) {
      return fallback.toLowerCase();
    }
  }
  return 'snapshot';
}
