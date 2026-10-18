/**
 * Chapter release cadence for writers (mirrored by hand in firestore.rules, function writerReleaseOk()).
 *
 *  - The FIRST 3 chapters of a novel can be released at any time, back to back.
 *  - After that, ONE chapter every 3 days. No stockpiling: waiting longer does not give extra chapters.
 *
 * Counters live on the novel: releaseCount (chapters released so far, never decreases) and
 * lastReleaseAt (server time of the latest release).
 */
export const FIRST_RELEASE_BATCH = 3;
export const RELEASE_INTERVAL_DAYS = 3;
export const RELEASE_INTERVAL_MS = RELEASE_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

export interface ReleaseStatus {
  canRelease: boolean;
  /** Chapters still available in the initial batch (0 once it is used up). */
  remainingFirstBatch: number;
  /** When the next release unlocks (ms). null when a release is possible right now. */
  nextAllowedAtMs: number | null;
  /** Milliseconds left to wait (0 when a release is possible). */
  waitMs: number;
}

export function releaseStatus(
  releaseCount: number | null | undefined,
  lastReleaseAtMs: number | null | undefined,
  now: number = Date.now()
): ReleaseStatus {
  const count = Math.max(0, Math.floor(Number(releaseCount) || 0));
  if (count < FIRST_RELEASE_BATCH) {
    return { canRelease: true, remainingFirstBatch: FIRST_RELEASE_BATCH - count, nextAllowedAtMs: null, waitMs: 0 };
  }
  const last = Number(lastReleaseAtMs) || 0;
  const next = last + RELEASE_INTERVAL_MS;
  if (now >= next) {
    return { canRelease: true, remainingFirstBatch: 0, nextAllowedAtMs: null, waitMs: 0 };
  }
  return { canRelease: false, remainingFirstBatch: 0, nextAllowedAtMs: next, waitMs: next - now };
}

/** "2 يوم و5 ساعات" / "2d 5h" style countdown. */
export function formatWait(waitMs: number, ar: boolean): string {
  const totalMin = Math.max(1, Math.ceil(waitMs / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (ar) {
    if (days > 0) return hours > 0 ? `${days} يوم و${hours} ساعة` : `${days} يوم`;
    if (hours > 0) return mins > 0 ? `${hours} ساعة و${mins} دقيقة` : `${hours} ساعة`;
    return `${mins} دقيقة`;
  }
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}
