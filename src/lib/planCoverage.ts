import type { Plan } from '../types';

/**
 * Plans that REALLY unlock a given novel. Mirrors libraryService.subscriptionCoversNovel
 * and firestore.rules: a plan covers a novel when it is active and either unlocks every novel
 * (accessAll) or lists the novel in novelIds. Sorted by cheapest monthly price first.
 */
export function plansCoveringNovel(plans: Plan[] | null | undefined, novelId: string): Plan[] {
  if (!plans || !novelId) return [];
  return plans
    .filter(p => p.active !== false && (p.accessAll === true || (p.novelIds || []).includes(novelId)))
    .sort((a, b) => (Number(a.priceMonthly) || 0) - (Number(b.priceMonthly) || 0));
}

/** Lowest monthly price among the given plans, or null when there are none. */
export function cheapestMonthlyPrice(plans: Plan[]): number | null {
  if (plans.length === 0) return null;
  return Math.min(...plans.map(p => Number(p.priceMonthly) || 0));
}
