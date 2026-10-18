import type { CartItem, Coupon } from '../types';

/** A coupon with a novelId belongs to a writer and only discounts that novel (its novel/book lines). */
export function couponAppliesToItem(coupon: Pick<Coupon, 'novelId'> | null | undefined, item: Pick<CartItem, 'type' | 'refId'>): boolean {
  if (!coupon) return false;
  if (!coupon.novelId) return true; // site-wide coupon: everything
  return (item.type === 'novel' || item.type === 'book') && item.refId === coupon.novelId;
}

export function computeCartDiscount(
  items: Array<Pick<CartItem, 'type' | 'refId' | 'price'>>,
  coupon: Pick<Coupon, 'type' | 'value' | 'novelId'> | null | undefined
): number {
  if (!coupon) return 0;
  const base = items.reduce((s, i) => s + (couponAppliesToItem(coupon, i) ? i.price : 0), 0);
  if (base <= 0) return 0;
  return coupon.type === 'percent'
    ? Math.min(base, Math.round((base * coupon.value) / 100))
    : Math.min(base, coupon.value);
}
