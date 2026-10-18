import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plansCoveringNovel, cheapestMonthlyPrice } from '../src/lib/planCoverage';
import type { Plan } from '../src/types';

const mk = (o: Partial<Plan>): Plan => ({
  id: 'p', name: 'P', priceMonthly: 50, priceYearly: 500, description: '', active: true, books: [], ...o,
});

test('no plans or no novel id -> nothing', () => {
  assert.deepEqual(plansCoveringNovel([], 'n1'), []);
  assert.deepEqual(plansCoveringNovel(null, 'n1'), []);
  assert.deepEqual(plansCoveringNovel([mk({ accessAll: true })], ''), []);
});

test('only plans that include the novel (or accessAll) are returned', () => {
  const plans = [
    mk({ id: 'a', novelIds: ['n1'], priceMonthly: 60 }),
    mk({ id: 'b', novelIds: ['n2'], priceMonthly: 20 }),
    mk({ id: 'c', accessAll: true, priceMonthly: 90 }),
  ];
  assert.deepEqual(plansCoveringNovel(plans, 'n1').map(p => p.id), ['a', 'c']);
  assert.deepEqual(plansCoveringNovel(plans, 'n3').map(p => p.id), ['c']);
});

test('inactive plans never count', () => {
  assert.deepEqual(plansCoveringNovel([mk({ accessAll: true, active: false })], 'n1'), []);
});

test('cheapest price', () => {
  assert.equal(cheapestMonthlyPrice([]), null);
  assert.equal(cheapestMonthlyPrice([mk({ priceMonthly: 70 }), mk({ priceMonthly: 35 })]), 35);
});
