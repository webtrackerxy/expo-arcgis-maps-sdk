/**
 * Pure iOS helpers used by the config-plugin mods.
 */

/** Parses a `"major.minor"` version into a comparable tuple. */
function parseVersion(version: string): [number, number] {
  const [major, minor] = version.split('.');
  return [Number.parseInt(major, 10) || 0, Number.parseInt(minor ?? '0', 10) || 0];
}

/** Returns negative/0/positive like a comparator for two `major.minor` strings. */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = parseVersion(a);
  const [bMajor, bMinor] = parseVersion(b);
  if (aMajor !== bMajor) {
    return aMajor - bMajor;
  }
  return aMinor - bMinor;
}

/**
 * Returns the deployment target to write: `minimum` when the current value is
 * absent or lower, otherwise the (equal/higher) current value. Never lowers a
 * consumer's existing target.
 */
export function ensureMinimumDeploymentTarget(
  current: string | undefined,
  minimum: string
): string {
  if (!current) {
    return minimum;
  }
  return compareVersions(current, minimum) >= 0 ? current : minimum;
}
