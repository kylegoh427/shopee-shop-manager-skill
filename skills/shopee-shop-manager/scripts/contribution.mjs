#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Order totals, same currency. Payout already includes marketplace deductions. */
export function contribution(order) {
  const keys = ['seller_payout', 'goods_cost', 'packing_cost', 'other_variable_costs', 'ad_spend'];
  const missing = keys.filter(k => order[k] === null || order[k] === undefined || order[k] === '');
  for (const k of [...keys, 'retained_profit_target']) {
    if (order[k] !== null && order[k] !== undefined && order[k] !== '' &&
      (typeof order[k] !== 'number' || !Number.isFinite(order[k]) || order[k] < 0))
      throw new Error(`${k} must be an explicit non-negative number`);
  }
  if (!order.currency || typeof order.currency !== 'string') throw new Error('currency is required');
  if (missing.length) return {status: 'INCOMPLETE', currency: order.currency, missing,
    before_ad_contribution: null, after_ad_contribution: null, maximum_acquisition_spend: null};
  const round = x => Math.round((x + Math.sign(x) * Number.EPSILON) * 100) / 100;
  const before = order.seller_payout - order.goods_cost - order.packing_cost - order.other_variable_costs;
  const hasTarget = typeof order.retained_profit_target === 'number';
  return {status: 'COMPLETE', currency: order.currency, missing: [],
    before_ad_contribution: round(before), after_ad_contribution: round(before - order.ad_spend),
    maximum_acquisition_spend: hasTarget ? round(before - order.retained_profit_target) : null,
    retained_target_affordable_before_ads: hasTarget ? before >= order.retained_profit_target : null,
    note: 'Observed settled-order contribution, not net business profit or a forecast. Fees already deducted from seller payout are not subtracted again.'};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--help')) console.log('node contribution.mjs order.json\nRequired explicit same-currency order totals: currency, seller_payout, goods_cost, packing_cost, other_variable_costs, ad_spend. Optional retained_profit_target. Missing costs never default to zero.');
    else {
      if (process.argv.length !== 3) throw new Error('Provide one JSON input file, or --help');
      console.log(JSON.stringify(contribution(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
    }
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
