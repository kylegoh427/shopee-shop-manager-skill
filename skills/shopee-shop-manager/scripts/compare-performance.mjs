#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const counts = ['impressions', 'clicks', 'product_visitors', 'page_views', 'cart_visitors', 'reported_orders', 'units'];
const metrics = [...counts, 'merchandise_sales'];
const unique = new Set(['product_visitors', 'cart_visitors']);
const scopeKeys = ['shop_key', 'timezone', 'currency', 'order_type', 'traffic_source', 'aggregation_level'];
const ratio = (n, d) => n === null || d === null || d === 0 ? null : n / d;
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);

function timestamp(value, label) {
  if (typeof value !== 'string' || !/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    throw new Error(`${label} needs an ISO timestamp with offset`);
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Error(`${label} is invalid`);
  // Date.parse normalises impossible calendar dates on some Node versions.
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!parts) throw new Error(`${label} is invalid`);
  const [, y, m, d, hour, minute, second] = parts.map(Number);
  if (hour > 23 || minute > 59 || second > 59) throw new Error(`${label} has an invalid clock time`);
  const calendar = new Date(0);
  calendar.setUTCFullYear(y, m - 1, d);
  if (calendar.getUTCFullYear() !== y || calendar.getUTCMonth() !== m - 1 || calendar.getUTCDate() !== d)
    throw new Error(`${label} has an invalid calendar date`);
  return result;
}

function snapshot(raw, label) {
  if (!isObject(raw) || !isObject(raw.scope)) throw new Error(`${label}.scope is required`);
  for (const k of scopeKeys) if (typeof raw.scope[k] !== 'string' || !raw.scope[k].trim())
    throw new Error(`${label}.scope.${k} is required`);
  try { new Intl.DateTimeFormat('en', {timeZone: raw.scope.timezone}); }
  catch { throw new Error(`${label}.scope.timezone must be an IANA timezone`); }
  if (!['listing', 'variant'].includes(raw.scope.aggregation_level)) throw new Error(`${label} aggregation_level must be listing or variant`);
  const start = timestamp(raw.period_start, `${label}.period_start`);
  const end = timestamp(raw.period_end, `${label}.period_end`);
  const cutoff = timestamp(raw.reporting_cutoff, `${label}.reporting_cutoff`);
  if (!(end > start && cutoff >= start && cutoff <= end)) throw new Error(`${label} cutoff must be inside a positive period`);
  if (!Array.isArray(raw.rows)) throw new Error(`${label}.rows must be an array`);
  const rows = new Map();
  for (const row of raw.rows) {
    if (!isObject(row) || typeof row.listing_id !== 'string' || !row.listing_id.trim()) throw new Error(`${label} row needs listing_id`);
    const variant = row.variant_id ?? null;
    if (raw.scope.aggregation_level === 'variant' && (typeof variant !== 'string' || !variant.trim()))
      throw new Error(`${label} variant row needs variant_id; parent totals cannot mix with variants`);
    if (raw.scope.aggregation_level === 'listing' && variant !== null)
      throw new Error(`${label} listing aggregate cannot contain variant rows`);
    const key = JSON.stringify([row.listing_id, variant]);
    if (rows.has(key)) throw new Error(`${label} duplicate listing/variant row`);
    const values = {};
    for (const metric of metrics) {
      const v = row[metric];
      if (v === null || v === undefined) { values[metric] = null; continue; }
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || (counts.includes(metric) && !Number.isSafeInteger(v)))
        throw new Error(`${label} ${metric} must be a non-negative ${counts.includes(metric) ? 'safe integer' : 'number'} or null`);
      values[metric] = v;
    }
    rows.set(key, {listing_id: row.listing_id, variant_id: variant, metrics: values});
  }
  return {raw, start, end, cutoff, rows};
}

function rates(row) {
  if (!row) return null;
  const m = row.metrics;
  return {
    ctr: ratio(m.clicks, m.impressions),
    reported_orders_per_product_visitor: ratio(m.reported_orders, m.product_visitors),
    reported_orders_per_click: ratio(m.reported_orders, m.clicks),
    cart_visitors_per_product_visitor: ratio(m.cart_visitors, m.product_visitors),
  };
}

/** Compare source aggregates; never estimates unique interval visitors or causal lift. */
export function comparePerformance(input) {
  if (!isObject(input) || !['cumulative', 'matched-period'].includes(input.mode)) throw new Error('mode must be cumulative or matched-period');
  if (input.confounds !== undefined && (!Array.isArray(input.confounds) || input.confounds.some(x => typeof x !== 'string')))
    throw new Error('confounds must be an array of strings');
  const a = snapshot(input.baseline, 'baseline');
  const b = snapshot(input.checkpoint, 'checkpoint');
  const issues = scopeKeys.filter(k => a.raw.scope[k] !== b.raw.scope[k]).map(k => `Scope differs: ${k}`);
  if (input.mode === 'cumulative') {
    if (a.start !== b.start || a.end !== b.end) issues.push('Cumulative snapshots require the same period');
    if (b.cutoff <= a.cutoff) issues.push('Checkpoint cutoff must be later than baseline cutoff');
  } else {
    if (a.end - a.start !== b.end - b.start) issues.push('Matched periods require equal duration');
    if (a.cutoff - a.start !== b.cutoff - b.start) issues.push('Matched periods require equal reporting completeness');
    if (b.start < a.end) issues.push('Matched periods must be ordered and non-overlapping');
  }
  const comparable = issues.length === 0;
  const rows = [];
  for (const key of new Set([...a.rows.keys(), ...b.rows.keys()])) {
    const ar = a.rows.get(key), br = b.rows.get(key), identity = ar ?? br;
    const warnings = [];
    if (!ar || !br) warnings.push('Row unavailable in one snapshot; missing does not mean zero');
    for (const [name, row] of [['baseline', ar], ['checkpoint', br]]) {
      if (!row) continue;
      const m = row.metrics;
      if (m.cart_visitors !== null && m.product_visitors !== null && m.cart_visitors > m.product_visitors)
        warnings.push(`${name}: cart visitors exceed product visitors; verify source definitions`);
    }
    const changes = {};
    for (const m of metrics) {
      const av = ar?.metrics[m] ?? null, bv = br?.metrics[m] ?? null;
      const delta = comparable && av !== null && bv !== null ? bv - av : null;
      changes[m] = {baseline: av, checkpoint: bv, change: delta,
        interpretation: input.mode === 'cumulative' && unique.has(m) ? 'change_in_cumulative_unique_total_not_interval_unique_visitors' : 'change_in_reported_totals'};
      if (input.mode === 'cumulative' && delta !== null && delta < 0)
        warnings.push(`${m}: cumulative total decreased; investigate revisions/filters before interpreting`);
    }
    rows.push({listing_id: identity.listing_id, variant_id: identity.variant_id,
      status: !comparable ? 'INCOMPATIBLE' : !ar || !br ? 'MISSING_ROW' : 'COMPARABLE',
      metrics: changes, baseline_rates: rates(ar), checkpoint_rates: rates(br), warnings});
  }
  return {status: comparable ? 'COMPARABLE' : 'INCOMPATIBLE', mode: input.mode, issues,
    baseline_scope: a.raw.scope, checkpoint_scope: b.raw.scope,
    baseline_period: {start: a.raw.period_start, end: a.raw.period_end, reporting_cutoff: a.raw.reporting_cutoff},
    checkpoint_period: {start: b.raw.period_start, end: b.raw.period_end, reporting_cutoff: b.raw.reporting_cutoff},
    rows, confounds: input.confounds ?? [],
    limitations: ['Structural comparability only; verify native definitions, exclusions and source evidence.',
      'Reported orders are source aggregates, not verified genuine new order cohorts.',
      'No causal lift, interval-unique conversion, profit ranking or attribution is inferred.',
      'Do not sum unique visitors across rows or periods; partial data and reporting lag remain material.']};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--help')) console.log('node compare-performance.mjs checkpoints.json\nRead-only offline comparison. mode: cumulative or matched-period. Requires two scoped snapshots with offset timestamps and unique listing/variant rows. See references/period-analysis.md. Missing metrics remain null; no causal lift or interval-unique conversion.');
    else {
      if (process.argv.length !== 3) throw new Error('Provide one JSON input file, or --help');
      console.log(JSON.stringify(comparePerformance(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
    }
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
