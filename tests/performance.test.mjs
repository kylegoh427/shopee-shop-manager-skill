import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {comparePerformance} from '../skills/shopee-shop-manager/scripts/compare-performance.mjs';

function fixture() {
  const scope = {shop_key:'synthetic-shop', timezone:'Asia/Kuala_Lumpur', currency:'MYR', order_type:'confirmed', traffic_source:'all', aggregation_level:'listing'};
  const baseline = {scope, period_start:'2030-01-07T00:00:00+08:00', period_end:'2030-01-08T00:00:00+08:00', reporting_cutoff:'2030-01-07T10:00:00+08:00', rows:[{listing_id:'demo', impressions:100, clicks:5, product_visitors:4, cart_visitors:2, reported_orders:1, units:2, merchandise_sales:20}]};
  const checkpoint = structuredClone(baseline);
  checkpoint.reporting_cutoff='2030-01-07T14:00:00+08:00';
  Object.assign(checkpoint.rows[0], {impressions:180, clicks:9, product_visitors:7, cart_visitors:3});
  return {mode:'cumulative', baseline, checkpoint};
}

test('same-scope cumulative counts retain missing pageviews and distinguish uniques', () => {
  const r=comparePerformance(fixture()), row=r.rows[0];
  assert.equal(r.status,'COMPARABLE');
  assert.equal(row.metrics.impressions.change,80);
  assert.equal(row.metrics.page_views.baseline,null);
  assert.equal(row.metrics.page_views.change,null);
  assert.equal(row.metrics.product_visitors.change,3);
  assert.equal(row.metrics.product_visitors.interpretation,'change_in_cumulative_unique_total_not_interval_unique_visitors');
  assert.equal(row.baseline_rates.ctr,0.05);
  assert.equal(row.checkpoint_rates.ctr,0.05);
  assert.equal(Object.hasOwn(row,'interval_conversion'),false);
});

test('missing row is not fabricated zero or an apparent product loss', () => {
  const x=fixture();x.checkpoint.rows=[];
  const row=comparePerformance(x).rows[0];
  assert.equal(row.status,'MISSING_ROW');
  assert.equal(row.metrics.impressions.checkpoint,null);
  assert.equal(row.metrics.impressions.change,null);
  assert.equal(row.checkpoint_rates,null);
});

test('new checkpoint-only row is also missing baseline rather than zero', () => {
  const x=fixture();x.baseline.rows=[];
  const row=comparePerformance(x).rows[0];
  assert.equal(row.status,'MISSING_ROW');assert.equal(row.metrics.clicks.change,null);
});

test('all scope fields must match before changes are computed', () => {
  for (const [field,value] of Object.entries({shop_key:'different',timezone:'UTC',currency:'SGD',order_type:'completed',traffic_source:'ads',aggregation_level:'variant'})) {
    const x=fixture();x.checkpoint.scope[field]=value;
    if(field==='aggregation_level')x.checkpoint.rows[0].variant_id='v1';
    const r=comparePerformance(x);
    assert.equal(r.status,'INCOMPATIBLE',field);
    assert.ok(r.issues.some(v=>v.includes(field)));
    assert.ok(r.rows.every(row=>row.metrics.impressions.change===null));
  }
});

test('cumulative snapshots cannot compare changing windows or non-later cutoffs', () => {
  const x=fixture();x.checkpoint.period_end='2030-01-09T00:00:00+08:00';
  assert.equal(comparePerformance(x).status,'INCOMPATIBLE');
  const y=fixture();y.checkpoint.reporting_cutoff=y.baseline.reporting_cutoff;
  assert.equal(comparePerformance(y).status,'INCOMPATIBLE');
});

test('zero denominator rates are unavailable, not infinite or zero', () => {
  const x=fixture();Object.assign(x.baseline.rows[0],{impressions:0,clicks:0,product_visitors:0,cart_visitors:0,reported_orders:0});
  assert.deepEqual(comparePerformance(x).rows[0].baseline_rates,{ctr:null,reported_orders_per_product_visitor:null,reported_orders_per_click:null,cart_visitors_per_product_visitor:null});
});

test('cumulative counter decreases remain visible with revision warning', () => {
  const x=fixture();x.checkpoint.rows[0].impressions=90;
  const row=comparePerformance(x).rows[0];
  assert.equal(row.metrics.impressions.change,-10);
  assert.ok(row.warnings.some(w=>w.includes('decreased')));
});

test('source cart/visitor inconsistency is flagged without inventing a cause', () => {
  const x=fixture();x.checkpoint.rows[0].cart_visitors=8;
  assert.ok(comparePerformance(x).rows[0].warnings.some(w=>w.includes('verify source definitions')));
});

test('duplicate rows and parent/variant mixtures fail instead of double-counting', () => {
  const x=fixture();x.baseline.rows.push({...x.baseline.rows[0]});
  assert.throws(()=>comparePerformance(x),/duplicate/);
  const y=fixture();y.baseline.rows[0].variant_id='variant';
  assert.throws(()=>comparePerformance(y),/cannot contain variant/);
  const z=fixture();z.baseline.scope.aggregation_level='variant';
  assert.throws(()=>comparePerformance(z),/needs variant_id/);
});

test('distinct variants compare individually and never aggregate unique visitors', () => {
  const x=fixture();
  for(const s of [x.baseline,x.checkpoint]){s.scope.aggregation_level='variant';s.rows[0].variant_id='packet';s.rows.push({...s.rows[0],variant_id:'carton'});}
  const r=comparePerformance(x);
  assert.equal(r.rows.length,2);assert.equal(r.status,'COMPARABLE');
  assert.equal(Object.hasOwn(r,'total_product_visitors'),false);
});

test('matched periods need equal duration, completeness and non-overlap', () => {
  const x=fixture();x.mode='matched-period';
  x.checkpoint.period_start='2030-01-14T00:00:00+08:00';x.checkpoint.period_end='2030-01-15T00:00:00+08:00';x.checkpoint.reporting_cutoff='2030-01-14T10:00:00+08:00';
  assert.equal(comparePerformance(x).status,'COMPARABLE');
  x.checkpoint.reporting_cutoff='2030-01-14T14:00:00+08:00';
  assert.equal(comparePerformance(x).status,'INCOMPATIBLE');
  x.checkpoint.period_end='2030-01-16T00:00:00+08:00';
  assert.ok(comparePerformance(x).issues.some(i=>i.includes('duration')));
  const y=fixture();y.mode='matched-period';
  assert.ok(comparePerformance(y).issues.some(i=>i.includes('non-overlapping')));
});

test('bad or absent scope, timestamps, periods and metrics fail explicitly', () => {
  for(const mutate of [x=>delete x.baseline.scope.shop_key,x=>x.baseline.scope.timezone='Not/AZone',x=>x.baseline.reporting_cutoff='2030-01-07T10:00:00',x=>x.baseline.period_start='2030-02-30T00:00:00Z',x=>x.baseline.reporting_cutoff='2030-01-09T00:00:00Z',x=>x.baseline.rows[0].clicks='5',x=>x.baseline.rows[0].clicks=-1,x=>x.baseline.rows[0].units=1.5,x=>x.baseline.rows[0].impressions=Infinity,x=>x.confounds='not-an-array']) {
    const x=fixture();mutate(x);assert.throws(()=>comparePerformance(x));
  }
});

test('helper does not mutate source snapshots or confound records', () => {
  const x=fixture();x.confounds=['new stock'];const before=structuredClone(x);
  comparePerformance(x);assert.deepEqual(x,before);
});

test('normalised midnight notation cannot shift a reported cutoff silently', () => {
  const x=fixture();x.baseline.reporting_cutoff='2030-01-07T24:00:00+08:00';
  assert.throws(()=>comparePerformance(x),/invalid clock time/);
});

test('CLI synthetic example works; malformed input returns nonzero', () => {
  const script=fileURLToPath(new URL('../skills/shopee-shop-manager/scripts/compare-performance.mjs',import.meta.url));
  const example=fileURLToPath(new URL('../examples/performance-checkpoints.json',import.meta.url));
  assert.equal(JSON.parse(execFileSync(process.execPath,[script,example],{encoding:'utf8'})).status,'COMPARABLE');
  assert.equal(spawnSync(process.execPath,[script,'missing-file.json']).status,2);
});
