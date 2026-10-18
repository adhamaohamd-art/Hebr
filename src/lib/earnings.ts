/**
 * Writer earnings. One "sale" is written per novel/book line when an admin approves an order.
 * The writer's share is a percentage of what the reader REALLY paid for that line (after discounts).
 */
export const DEFAULT_WRITER_SHARE_PERCENT = 70;

export function cleanSharePercent(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_WRITER_SHARE_PERCENT;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

export interface SplitLine {
  gross: number;
  discount: number;
  net: number;
  writerShare: number;
  platformShare: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function splitLine(price: number, discount: number, sharePercent: number): SplitLine {
  const gross = Math.max(0, Number(price) || 0);
  const disc = Math.min(gross, Math.max(0, Number(discount) || 0));
  const net = round2(gross - disc);
  const writerShare = round2((net * cleanSharePercent(sharePercent)) / 100);
  return { gross, discount: round2(disc), net, writerShare, platformShare: round2(net - writerShare) };
}

/**
 * Spreads an order-level discount over the lines it applies to, proportionally to their price.
 * `eligible[i]` false = the line gets no discount (e.g. a writer coupon for another novel, or a plan).
 * The rounding remainder goes to the last eligible line so the parts always add up to the total.
 */
export function allocateDiscount(prices: number[], eligible: boolean[], totalDiscount: number): number[] {
  const out = prices.map(() => 0);
  const base = prices.reduce((s, p, i) => s + (eligible[i] ? Math.max(0, p) : 0), 0);
  const total = Math.min(Math.max(0, Number(totalDiscount) || 0), base);
  if (base <= 0 || total <= 0) return out;
  let given = 0;
  let lastIdx = -1;
  prices.forEach((p, i) => {
    if (!eligible[i]) return;
    lastIdx = i;
    out[i] = round2((Math.max(0, p) / base) * total);
    given += out[i];
  });
  if (lastIdx >= 0) out[lastIdx] = round2(out[lastIdx] + (total - given));
  return out;
}

export interface SaleLike {
  novelId: string;
  writerShare: number;
  net: number;
}

export function summarizeSales(sales: SaleLike[]): { count: number; net: number; writerShare: number; byNovel: Record<string, { count: number; writerShare: number }> } {
  const byNovel: Record<string, { count: number; writerShare: number }> = {};
  let net = 0;
  let writerShare = 0;
  for (const s of sales) {
    net += Number(s.net) || 0;
    writerShare += Number(s.writerShare) || 0;
    const b = (byNovel[s.novelId] ||= { count: 0, writerShare: 0 });
    b.count += 1;
    b.writerShare += Number(s.writerShare) || 0;
  }
  return { count: sales.length, net: round2(net), writerShare: round2(writerShare), byNovel };
}
