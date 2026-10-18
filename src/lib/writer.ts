import type { Plan, UserProfile } from '../types';

/**
 * Writer (كاتب) quota helpers. Mirrored by hand in firestore.rules (function writerQuota()).
 *
 * A reader may write/publish novels when EITHER
 *  - an admin granted them a personal quota (users/{uid}.writerLimit), OR
 *  - their active subscription's plan has writerNovelLimit > 0 (e.g. the "Hebr Team" plan = 2 novels).
 * The effective quota is the larger of the two.
 */

function cleanLimit(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function computeWriterLimit(
  profile: Pick<UserProfile, 'writerLimit' | 'subscription'> | null | undefined,
  plan: Pick<Plan, 'id' | 'writerNovelLimit'> | null | undefined,
  now: number = Date.now()
): number {
  if (!profile) return 0;
  const personal = cleanLimit(profile.writerLimit);
  const sub = profile.subscription;
  const subActive = Boolean(sub && sub.expiresAt > now && sub.planId !== 'admin_grant');
  const fromPlan = subActive && plan && plan.id === sub!.planId ? cleanLimit(plan.writerNovelLimit) : 0;
  return Math.max(personal, fromPlan);
}

/** Can the writer create one more novel? */
export function canCreateNovel(limit: number, currentCount: number): boolean {
  return limit > 0 && currentCount < limit;
}

export function remainingNovels(limit: number, currentCount: number): number {
  return Math.max(0, limit - currentCount);
}
