import test from 'node:test';
import assert from 'node:assert/strict';
import {contribution} from '../skills/shopee-shop-manager/scripts/contribution.mjs';
const order = {currency: 'EXAMPLE', seller_payout: 20, goods_cost: 12, packing_cost: 1, other_variable_costs: 0, ad_spend: 3, retained_profit_target: 2};
test('uses payout after fees without deducting marketplace fees again', () => {
  const r = contribution(order); assert.equal(r.before_ad_contribution, 7);
  assert.equal(r.after_ad_contribution, 4); assert.equal(r.maximum_acquisition_spend, 5);
});
test('missing packing never defaults to zero', () => {
  const r = contribution({...order, packing_cost: null}); assert.equal(r.status, 'INCOMPLETE');
  assert.deepEqual(r.missing, ['packing_cost']); assert.equal(r.maximum_acquisition_spend, null);
});
test('no retained-profit target means no invented CPA ceiling', () => {
  const r = contribution({...order, retained_profit_target: undefined}); assert.equal(r.maximum_acquisition_spend, null);
});
test('negative headroom stays visible rather than suggesting ads are affordable', () => {
  const r = contribution({...order, goods_cost: 22}); assert.equal(r.maximum_acquisition_spend, -5);
  assert.equal(r.retained_target_affordable_before_ads, false);
});
test('invalid money types and missing currency fail explicitly', () => {
  for (const x of [{...order, packing_cost: -1}, {...order, seller_payout: '20'}, {...order, currency: ''}]) assert.throws(() => contribution(x));
});
