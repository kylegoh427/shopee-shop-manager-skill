import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync, linkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseCSV} from '../skills/shopee-shop-manager/scripts/csv.mjs';
import {auditCatalog} from '../skills/shopee-shop-manager/scripts/reconcile-catalog.mjs';
const inv = (x = {}) => ({sku: 'DEMO-A', product_name: 'Example drink', barcode: '0000000000000', variant: 'Original', unit: 'bottle', pack_quantity: '1', net_content: '500ml', price: '10', stock: '20', stock_counted: 'true', stock_origin: 'owner_confirmed', listing_intent: 'sell', ...x});
const offer = (x = {}) => ({listing_id: 'demo-listing-a', sku: 'DEMO-A', product_name: 'Example drink', barcode: '0000000000000', variant: 'Original', unit: 'bottle', pack_quantity: '1', net_content: '500ml', price: '10', stock: '20', status: 'live', ...x});
test('CSV preserves quoted commas, multiline text, escaped quotes, BOM and CRLF', () => {
  const r = parseCSV('\uFEFFsku,product_name\r\nDEMO-A,"A, B\nSay ""hello"""\r\n');
  assert.deepEqual(r, [{sku: 'DEMO-A', product_name: 'A, B\nSay "hello"'}]);
});
test('malformed CSV fails instead of shifting identity/stock columns', () => {
  for (const s of ['a,a\n1,2', 'a,b\n1', 'a\n"unfinished', 'a\n"x"oops']) assert.throws(() => parseCSV(s));
});
test('exact identity matches but does not grant publication authority', () => {
  const r = auditCatalog([inv()], [offer()]);
  assert.equal(r.rows[0].status, 'MATCHED'); assert.equal(r.rows[0].publish_ready, false);
  assert.equal(r.summary.active_parent_listings, 1);
});
test('a ten-bottle carton cannot masquerade as a single bottle with the same SKU', () => {
  const r = auditCatalog([inv()], [offer({unit: 'carton', pack_quantity: '10', price: '80'})]);
  const c = r.rows[0].comparisons[0]; assert.equal(c.identity_fields_consistent, false);
  assert.ok(c.flags.includes('PACK_QUANTITY_MISMATCH')); assert.ok(!c.flags.includes('PRICE_MISMATCH'));
});
test('two active offers sharing a SKU flag duplicate allocation; delisted does not', () => {
  const a = auditCatalog([inv()], [offer(), offer({listing_id: 'demo-listing-b'})]);
  assert.equal(a.duplicate_live_skus.length, 1);
  const b = auditCatalog([inv()], [offer(), offer({listing_id: 'demo-listing-b', status: 'delisted'})]);
  assert.equal(b.duplicate_live_skus.length, 0);
});
test('default starting quantities never become automatic new listing candidates', () => {
  const r = auditCatalog([inv({stock: '50', stock_origin: 'default'})], []);
  assert.equal(r.rows[0].status, 'NEEDS_STOCK_CONFIRMATION');
});
test('unknown and verified-zero stock are distinct', () => {
  const a = auditCatalog([inv({stock: '', stock_counted: ''})], []).rows[0];
  const b = auditCatalog([inv({stock: '0'})], []).rows[0];
  assert.equal(a.status, 'NEEDS_STOCK_CONFIRMATION'); assert.equal(b.status, 'NO_AVAILABLE_STOCK');
  assert.equal(a.source_stock, null); assert.equal(b.source_stock, 0);
});
test('held product with stock remains held and a live held product is flagged', () => {
  assert.equal(auditCatalog([inv({listing_intent: 'hold'})], []).rows[0].status, 'ON_HOLD');
  assert.ok(auditCatalog([inv({listing_intent: 'hold'})], [offer()]).rows[0].comparisons[0].flags.includes('LIVE_DESPITE_INVENTORY_INTENT'));
});
test('lower available stock is reconciliation, never an automatic restock', () => {
  const r = auditCatalog([inv({stock: '30'})], [offer({stock: '12'})]);
  assert.ok(r.rows[0].comparisons[0].flags.includes('STOCK_RECONCILE'));
  assert.equal(r.read_only, true);
});
test('identical export repeats do not double counts, conflicting repeats stay unresolved', () => {
  const a = auditCatalog([inv()], [offer(), offer()]);
  assert.equal(a.summary.active_offer_rows, 1); assert.equal(a.warnings[0].code, 'DUPLICATE_EXPORT_ROW');
  const b = auditCatalog([inv()], [offer(), offer({price: '11'})]);
  assert.ok(b.warnings.some(w => w.code === 'CONFLICTING_LISTING_ROWS'));
  assert.ok(b.rows[0].comparisons.every(c => !c.identity_fields_consistent));
});
test('legacy alias requires evidence and still checks identity', () => {
  assert.throws(() => auditCatalog([inv()], [offer()], {aliases: [{inventory_sku: 'DEMO-A', listing_id: 'demo-listing-a'}]}));
  const r = auditCatalog([inv()], [offer({sku: '', net_content: '250ml'})], {aliases: [{inventory_sku: 'DEMO-A', listing_id: 'demo-listing-a', verification_note: 'Owner checked label; size remains under review'}]});
  assert.equal(r.rows[0].match_method, 'verified_alias');
  assert.ok(r.rows[0].comparisons[0].flags.includes('NET_CONTENT_MISMATCH'));
});
test('barcode matches require a unique compatible unit; no title guessing', () => {
  assert.equal(auditCatalog([inv({sku: ''})], [offer()]).rows[0].match_method, 'exact_barcode_and_unit');
  assert.equal(auditCatalog([inv({sku: '', barcode: ''})], [offer()]).rows[0].comparisons.length, 0);
});
test('metric units are equivalent only within the same dimension', () => {
  assert.equal(auditCatalog([inv()], [offer({net_content: '0.5l'})]).rows[0].comparisons[0].identity_fields_consistent, true);
  assert.equal(auditCatalog([inv()], [offer({net_content: '500g'})]).rows[0].comparisons[0].identity_fields_consistent, false);
});
test('unknown pack quantity blocks price/unit conclusions and preparation readiness', () => {
  const r = auditCatalog([inv({pack_quantity: ''})], [offer()]);
  assert.equal(r.rows[0].comparisons[0].identity_fields_consistent, false);
  assert.equal(auditCatalog([inv({pack_quantity: ''})], []).rows[0].status, 'UNMATCHED_NEEDS_REVIEW');
});
test('duplicate inventory SKUs are reported even if labels resemble a match', () => {
  const r = auditCatalog([inv(), inv({stock: '4'})], [offer()]);
  assert.ok(r.rows.every(x => x.issues.includes('DUPLICATE_INVENTORY_SKU')));
});
test('matched default quantities still appear in review totals', () => {
  const r = auditCatalog([inv({stock_origin: 'default'})], [offer()]);
  assert.equal(r.summary.rows_needing_review, 1); assert.equal(r.summary.unconfirmed_stock_rows, 1);
  assert.equal(r.rows[0].status, 'MATCHED_WITH_ISSUES');
});
test('missing counterpart barcode or variant cannot establish field consistency', () => {
  for (const changes of [{barcode: ''}, {variant: ''}]) {
    const c = auditCatalog([inv()], [offer(changes)]).rows[0].comparisons[0];
    assert.equal(c.identity_fields_consistent, false);
  }
});
test('a coincident SKU cannot silently equate unrelated names', () => {
  const c = auditCatalog([inv()], [offer({product_name: 'Different product'})]).rows[0].comparisons[0];
  assert.ok(c.flags.includes('PRODUCT_NAME_REVIEW')); assert.equal(c.identity_fields_consistent, false);
});
test('owner-confirmed identity key can support different display titles', () => {
  const c = auditCatalog([inv({identity_key: 'demo-drink-original'})], [offer({product_name: 'Example drink SEO title', identity_key: 'demo-drink-original'})]).rows[0].comparisons[0];
  assert.equal(c.identity_fields_consistent, true);
});
test('duplicate active offers alert the row and the CLI summary', () => {
  const r = auditCatalog([inv()], [offer(), offer({listing_id: 'demo-listing-b'})]);
  assert.equal(r.summary.duplicate_live_sku_count, 1); assert.equal(r.summary.rows_needing_review, 1);
});
test('existing draft is found before proposing a new listing', () => {
  const r = auditCatalog([inv()], [offer({status: 'draft'})]);
  assert.equal(r.rows[0].status, 'EXISTING_INACTIVE_OFFER');
  assert.equal(r.summary.unlisted_candidates, 0); assert.equal(r.rows[0].inactive_matches[0].listing_id, 'demo-listing-a');
});
test('different declared currencies stop monetary comparisons', () => {
  const c = auditCatalog([inv({currency: 'AAA'})], [offer({currency: 'BBB', price: '30'})]).rows[0].comparisons[0];
  assert.ok(c.flags.includes('CURRENCY_MISMATCH')); assert.ok(!c.flags.includes('PRICE_MISMATCH'));
});
test('shared stock pool converts cartons to base units and exposes over-allocation', () => {
  const key = 'demo-drink-original';
  const inventory = [inv({identity_key: key, stock: '30'}), inv({sku: 'DEMO-CASE', identity_key: key, unit: 'carton', pack_quantity: '12', price: '90', stock: '5'})];
  const listings = [offer({identity_key: key, stock: '30'}), offer({listing_id: 'demo-case', sku: 'DEMO-CASE', identity_key: key, unit: 'carton', pack_quantity: '12', price: '90', stock: '5'})];
  const r = auditCatalog(inventory, listings, {stock_pools: [{pool_id: 'demo-pool', identity_key: key, basis: 'available_to_allocate', available_base_units: 60, inventory_skus: ['DEMO-A', 'DEMO-CASE'], verification_note: 'Synthetic owner verified uncommitted bottles'}]});
  assert.equal(r.stock_pools[0].allocated_base_units, 90); assert.equal(r.stock_pools[0].remaining_base_units, -30);
  assert.equal(r.summary.overallocated_stock_pools, 1); assert.equal(r.summary.rows_needing_review, 2);
});
test('ambiguous legacy matches cannot falsely certify an empty shared stock pool', () => {
  const identity_key = 'demo-drink-original';
  const i = inv({sku: 'DEMO-CASE', barcode: '111', identity_key, unit: 'carton', pack_quantity: '12', stock: '5'});
  const a = offer({sku: '', barcode: '111', identity_key, unit: 'carton', pack_quantity: '12', stock: '5'});
  const r = auditCatalog([i], [a, {...a, listing_id: 'demo-listing-b'}], {stock_pools: [{pool_id: 'demo-pool', identity_key, basis: 'available_to_allocate', available_base_units: 60, inventory_skus: ['DEMO-CASE'], verification_note: 'Synthetic verified remaining bottles'}]});
  assert.ok(r.rows[0].issues.includes('AMBIGUOUS_BARCODE'));
  assert.equal(r.stock_pools[0].status, 'UNVERIFIED');
  assert.equal(r.stock_pools[0].allocated_base_units, null); assert.equal(r.stock_pools[0].remaining_base_units, null);
});
test('CLI output cannot overwrite an input, even with overwrite requested', () => {
  const d = mkdtempSync(join(tmpdir(), 'shopee-skill-test-'));
  try {
    const f = join(d, 'inventory.csv'); const g = join(d, 'listings.csv');
    const original = 'sku,product_name\nDEMO-A,Example\n'; writeFileSync(f, original); writeFileSync(g, 'listing_id,sku,status\ndemo-listing-a,DEMO-A,live\n');
    const script = fileURLToPath(new URL('../skills/shopee-shop-manager/scripts/reconcile-catalog.mjs', import.meta.url));
    const sym = join(d, 'alias.csv'), hard = join(d, 'hard.csv'); symlinkSync(f, sym); linkSync(f, hard);
    for (const out of [f, sym, hard]) {
      const r = spawnSync(process.execPath, [script, '--inventory', f, '--listings', g, '--out', out, '--overwrite']);
      assert.equal(r.status, 2); assert.equal(readFileSync(f, 'utf8'), original);
    }
  } finally { rmSync(d, {recursive: true, force: true}); }
});
