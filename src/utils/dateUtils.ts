/**
 * Formats a Unix timestamp (seconds) into a human-readable date string.
 * Uses a fixed locale ("en-US") to prevent server/client hydration mismatches.
 */
export function formatDate(unix: number | undefined): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns a relative time string (e.g. "3h ago") for a Unix timestamp (seconds).
 * Returns "—" for missing timestamps to avoid calling Date.now() during the initial
 * server render, preventing hydration mismatches.
 */
export function formatRelative(unix: number | undefined): string {
  if (!unix) return "—";
  const diff = Math.floor(Date.now() / 1000 - unix);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
