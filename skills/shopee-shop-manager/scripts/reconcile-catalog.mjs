#!/usr/bin/env node
import {readFileSync, writeFileSync, existsSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCSV} from './csv.mjs';

const str = x => String(x ?? '').trim();
const norm = x => str(x).toLowerCase().replace(/\s+/g, ' ');
const number = x => str(x) !== '' && Number.isFinite(Number(x)) ? Number(x) : null;
const yes = x => x === true || ['true', '1', 'yes'].includes(norm(x));
const live = x => ['live', 'active', 'published'].includes(norm(x));
const moneyEqual = (a, b) => Math.abs(a - b) < 0.005;
function measurement(x) {
  const s = norm(x).replace(/\s+/g, '');
  const m = s.match(/^(\d+(?:\.\d+)?)(g|kg|ml|l)$/);
  if (!m) return s;
  const scale = {g: 1, kg: 1000, ml: 1, l: 1000};
  const basis = ['g', 'kg'].includes(m[2]) ? 'g' : 'ml';
  return `${Number(m[1]) * scale[m[2]]}${basis}`;
}
function uniqueOffers(rows, warnings) {
  const groups = new Map();
  for (const r of rows) {
    if (!str(r.listing_id)) throw new Error('Every listing row needs listing_id');
    const key = JSON.stringify([str(r.listing_id), str(r.sku), norm(r.variant)]);
    const group = groups.get(key) ?? [];
    if (group.some(x => JSON.stringify(x) === JSON.stringify(r))) {
      warnings.push({code: 'DUPLICATE_EXPORT_ROW', listing_id: r.listing_id}); continue;
    }
    group.push(r); groups.set(key, group);
  }
  const result = [];
  for (const [key, rs] of groups) {
    if (rs.length > 1) warnings.push({code: 'CONFLICTING_LISTING_ROWS', offer_key: key});
    for (const r of rs) result.push({...r, _conflict: rs.length > 1});
  }
  return result;
}

export function auditCatalog(inventory, listings, config = {}) {
  if (!Array.isArray(inventory) || !Array.isArray(listings)) throw new Error('Inputs must be arrays');
  const skuKey = x => config.case_sensitive_skus ? str(x) : str(x).toUpperCase();
  const unit = x => norm(config.unit_aliases?.[str(x)] ?? x);
  const variant = x => norm(config.variant_aliases?.[str(x)] ?? x);
  const warnings = [];
  const offers = uniqueOffers(listings, warnings);
  const active = offers.filter(r => live(r.status));
  const invSkus = new Map();
  for (const r of inventory) if (str(r.sku)) {
    const k = skuKey(r.sku); invSkus.set(k, (invSkus.get(k) ?? 0) + 1);
  }
  const duplicateLiveSkus = [];
  const bySku = new Map();
  for (const r of active) if (str(r.sku)) {
    const k = skuKey(r.sku); const rs = bySku.get(k) ?? []; rs.push(r); bySku.set(k, rs);
  }
  for (const [sku, rs] of bySku) {
    if (rs.length > 1) duplicateLiveSkus.push({sku, listing_ids: [...new Set(rs.map(r => str(r.listing_id)))],
      reason: 'Multiple active offers use this SKU; verify duplicate offers and physical allocation.'});
  }
  const aliases = config.aliases ?? [];
  for (const a of aliases) {
    if (!str(a.inventory_sku) || !str(a.listing_id) || !str(a.verification_note))
      throw new Error('Each alias needs inventory_sku, listing_id and verification_note');
  }
  const rows = inventory.map((r, index) => {
    const issues = [];
    const price = number(r.price), stock = number(r.stock), pack = number(r.pack_quantity);
    for (const f of ['price', 'stock', 'pack_quantity']) {
      const n = number(r[f]);
      if (str(r[f]) && (n === null || n < 0 || (f !== 'price' && !Number.isInteger(n))))
        issues.push(`INVALID_${f.toUpperCase()}`);
    }
    if (pack === 0) issues.push('INVALID_PACK_QUANTITY');
    const intent = norm(r.listing_intent) || 'unknown';
    if (!['sell', 'hold', 'skip', 'unknown'].includes(intent)) issues.push('INVALID_LISTING_INTENT');
    if (!str(r.product_name)) issues.push('MISSING_PRODUCT_NAME');
    if (str(r.sku) && invSkus.get(skuKey(r.sku)) > 1) issues.push('DUPLICATE_INVENTORY_SKU');
    const stockVerified = yes(r.stock_counted) && ['physical_count', 'owner_confirmed'].includes(norm(r.stock_origin));
    if (!stockVerified) issues.push('STOCK_PROVENANCE_UNVERIFIED');
    let matches = str(r.sku) ? (bySku.get(skuKey(r.sku)) ?? []) : [];
    let method = matches.length ? 'exact_sku' : null;
    if (!matches.length && str(r.sku)) {
      const as = aliases.filter(a => skuKey(a.inventory_sku) === skuKey(r.sku));
      matches = active.filter(o => as.some(a => str(a.listing_id) === str(o.listing_id) &&
        (!str(a.listing_sku) || skuKey(a.listing_sku) === skuKey(o.sku)) &&
        (!str(a.variant) || variant(a.variant) === variant(o.variant))));
      if (matches.length) method = 'verified_alias';
      if (as.length && matches.length > 1) issues.push('AMBIGUOUS_ALIAS');
    }
    if (!matches.length && str(r.barcode) && unit(r.unit) && pack > 0 && str(r.net_content)) {
      const bs = active.filter(o => str(o.barcode) === str(r.barcode) && unit(o.unit) === unit(r.unit) &&
        number(o.pack_quantity) === pack && measurement(o.net_content) === measurement(r.net_content) &&
        variant(o.variant) === variant(r.variant));
      if (bs.length === 1) { matches = bs; method = 'exact_barcode_and_unit'; }
      else if (bs.length > 1) issues.push('AMBIGUOUS_BARCODE');
    }
    if (matches.length > 1) issues.push('DUPLICATE_ACTIVE_OFFERS');
    const inactiveMatches = offers.filter(o => !live(o.status) && str(r.sku) && skuKey(o.sku) === skuKey(r.sku))
      .map(o => ({listing_id: str(o.listing_id), status: str(o.status), variant: str(o.variant)}));
    const comparisons = matches.map(o => {
      const flags = [];
      if (o._conflict) flags.push('CONFLICTING_OFFER_DATA');
      for (const [field, normalize] of [['unit', unit], ['net_content', measurement]]) {
        if (!str(r[field]) || !str(o[field])) flags.push(`${field.toUpperCase()}_UNVERIFIED`);
        else if (normalize(r[field]) !== normalize(o[field])) flags.push(`${field.toUpperCase()}_MISMATCH`);
      }
      const op = number(o.pack_quantity);
      if (!(pack > 0) || !(op > 0) || !Number.isInteger(op)) flags.push('PACK_QUANTITY_UNVERIFIED');
      else if (pack !== op) flags.push('PACK_QUANTITY_MISMATCH');
      if (!!str(r.barcode) !== !!str(o.barcode)) flags.push('BARCODE_UNVERIFIED');
      else if (str(r.barcode) && str(r.barcode) !== str(o.barcode)) flags.push('BARCODE_MISMATCH');
      if (!!str(r.variant) !== !!str(o.variant)) flags.push('VARIANT_UNVERIFIED');
      else if (str(r.variant) && variant(r.variant) !== variant(o.variant)) flags.push('VARIANT_MISMATCH');
      if (str(r.identity_key) || str(o.identity_key)) {
        if (!str(r.identity_key) || !str(o.identity_key)) flags.push('IDENTITY_KEY_UNVERIFIED');
        else if (str(r.identity_key) !== str(o.identity_key)) flags.push('IDENTITY_KEY_MISMATCH');
      } else if (!str(r.product_name) || !str(o.product_name)) flags.push('PRODUCT_NAME_UNVERIFIED');
      else if (norm(r.product_name) !== norm(o.product_name)) flags.push('PRODUCT_NAME_REVIEW');
      if (str(r.currency) && str(o.currency) && norm(r.currency) !== norm(o.currency)) flags.push('CURRENCY_MISMATCH');
      const identityVerified = flags.length === 0;
      const opPrice = number(o.price), os = number(o.stock);
      if (identityVerified) {
        if (price === null || opPrice === null || price < 0 || opPrice < 0) flags.push('PRICE_UNVERIFIED');
        else if (!moneyEqual(price, opPrice)) flags.push('PRICE_MISMATCH');
        if (stock === null || os === null || stock < 0 || os < 0 || !Number.isInteger(os)) flags.push('STOCK_UNVERIFIED');
        else if (stock !== os) flags.push('STOCK_RECONCILE');
      }
      if (['hold', 'skip'].includes(intent)) flags.push('LIVE_DESPITE_INVENTORY_INTENT');
      return {listing_id: str(o.listing_id), listing_sku: str(o.sku), variant: str(o.variant),
        identity_fields_consistent: identityVerified, price: opPrice, stock: os, flags};
    });
    const basicIdentity = (str(r.sku) || str(r.barcode)) && unit(r.unit) && pack > 0 && str(r.net_content);
    let status = 'MATCHED';
    if (!matches.length) {
      status = intent === 'skip' ? 'EXCLUDED' : intent === 'hold' ? 'ON_HOLD' : inactiveMatches.length ? 'EXISTING_INACTIVE_OFFER' :
        intent !== 'sell' ? 'NEEDS_INTENT' : !stockVerified ? 'NEEDS_STOCK_CONFIRMATION' :
        stock === 0 ? 'NO_AVAILABLE_STOCK' : !(stock > 0) || !(price > 0) || !basicIdentity || issues.length ?
        'UNMATCHED_NEEDS_REVIEW' : 'UNLISTED_CANDIDATE';
    } else if (comparisons.some(c => c.flags.length) || issues.length) status = 'MATCHED_WITH_ISSUES';
    return {inventory_row: index + 1, sku: str(r.sku), product_name: str(r.product_name),
      status, match_method: method, source_price: price, source_stock: stock,
      stock_confirmed: stockVerified, comparisons, inactive_matches: inactiveMatches, issues, publish_ready: false,
      note: 'Read-only audit. Stock differences need movement/allocation reconciliation; unlisted candidates still need publication checks.'};
  });
  const stockPools = (config.stock_pools ?? []).map(pool => {
    const available = number(pool.available_base_units);
    if (!str(pool.pool_id) || !str(pool.identity_key) || !str(pool.verification_note) ||
      pool.basis !== 'available_to_allocate' || available === null || available < 0 || !Number.isInteger(available) ||
      !Array.isArray(pool.inventory_skus) || !pool.inventory_skus.length)
      throw new Error('Stock pools need pool_id, identity_key, verification_note, basis available_to_allocate, non-negative integer available_base_units and inventory_skus');
    const keys = new Set(pool.inventory_skus.map(skuKey));
    const members = inventory.map((r, i) => ({r, i})).filter(x => keys.has(skuKey(x.r.sku)));
    if (members.length !== keys.size) throw new Error(`Stock pool ${pool.pool_id}: missing or duplicate inventory SKU`);
    let verified = members.every(x => str(x.r.identity_key) === str(pool.identity_key) &&
      !rows[x.i].issues.some(code => /^(AMBIGUOUS_|DUPLICATE_INVENTORY_SKU|INVALID_)/.test(code)));
    const selected = new Map();
    for (const {i} of members) for (const c of rows[i].comparisons) {
      const os = active.filter(o => str(o.listing_id) === c.listing_id && str(o.sku) === c.listing_sku && str(o.variant) === c.variant);
      if (!c.identity_fields_consistent || os.length !== 1) { verified = false; continue; }
      const o = os[0], stock = number(o.stock), pack = number(o.pack_quantity);
      if (stock === null || stock < 0 || !Number.isInteger(stock) || !(pack > 0) || !Number.isInteger(pack)) { verified = false; continue; }
      selected.set(JSON.stringify([o.listing_id, o.sku, o.variant]), stock * pack);
    }
    const allocated = verified ? [...selected.values()].reduce((a, b) => a + b, 0) : null;
    const status = !verified ? 'UNVERIFIED' : allocated > available ? 'OVERALLOCATED' : 'WITHIN_VERIFIED_POOL';
    if (status !== 'WITHIN_VERIFIED_POOL') for (const {i} of members) {
      rows[i].issues.push(`STOCK_POOL_${status}:${pool.pool_id}`);
      if (rows[i].comparisons.length) rows[i].status = 'MATCHED_WITH_ISSUES';
    }
    return {pool_id: str(pool.pool_id), status, available_base_units: available,
      allocated_base_units: allocated, remaining_base_units: verified ? available - allocated : null,
      note: 'Owner-verified allocation basis; not an instruction to restock or publish.'};
  });
  return {schema_version: 1, read_only: true,
    summary: {inventory_rows: inventory.length, listing_export_rows: listings.length,
      distinct_offer_rows: offers.length, active_offer_rows: active.length,
      active_parent_listings: new Set(active.map(r => str(r.listing_id))).size,
      matched_inventory_rows: rows.filter(r => r.comparisons.length).length,
      duplicate_live_sku_count: duplicateLiveSkus.length,
      conflicting_offer_groups: warnings.filter(w => w.code === 'CONFLICTING_LISTING_ROWS').length,
      unconfirmed_stock_rows: rows.filter(r => !r.stock_confirmed).length,
      existing_inactive_inventory_rows: rows.filter(r => r.inactive_matches.length).length,
      overallocated_stock_pools: stockPools.filter(p => p.status === 'OVERALLOCATED').length,
      unlisted_candidates: rows.filter(r => r.status === 'UNLISTED_CANDIDATE').length,
      rows_needing_review: rows.filter(r => r.issues.length || r.comparisons.some(c => c.flags.length) ||
        ['NEEDS_INTENT', 'NEEDS_STOCK_CONFIRMATION', 'UNMATCHED_NEEDS_REVIEW'].includes(r.status)).length},
    duplicate_live_skus: duplicateLiveSkus, stock_pools: stockPools, warnings, rows};
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Read-only catalogue audit\nnode reconcile-catalog.mjs --inventory inventory.csv --listings listings.csv [--config config.json] [--out audit.json] [--overwrite]\nCanonical fields and semantics: references/catalogue-and-inventory.md. Inputs are never overwritten.'); return;
  }
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--overwrite') { opts.overwrite = true; continue; }
    if (!['--inventory', '--listings', '--config', '--out'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--'))
      throw new Error(`Invalid argument: ${args[i] ?? ''}; use --help`);
    opts[args[i].slice(2)] = args[++i];
  }
  if (!opts.inventory || !opts.listings) throw new Error('Both --inventory and --listings are required');
  const sameFile = (a, b) => {
    if (resolve(a) === resolve(b)) return true;
    if (!existsSync(a) || !existsSync(b)) return false;
    const x = statSync(a), y = statSync(b); return x.dev === y.dev && x.ino === y.ino;
  };
  if (opts.out && [opts.inventory, opts.listings, opts.config].filter(Boolean).some(f => sameFile(f, opts.out)))
    throw new Error('Output must not overwrite an input');
  const inventory = parseCSV(readFileSync(opts.inventory, 'utf8'));
  const listings = parseCSV(readFileSync(opts.listings, 'utf8'));
  const config = opts.config ? JSON.parse(readFileSync(opts.config, 'utf8')) : {};
  const report = auditCatalog(inventory, listings, config);
  const result = JSON.stringify(report, null, 2) + '\n';
  if (opts.out) {
    if (existsSync(opts.out) && !opts.overwrite) throw new Error('Output exists; choose another file or use --overwrite');
    writeFileSync(opts.out, result, {mode: 0o600}); console.log(JSON.stringify(report.summary));
  } else process.stdout.write(result);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 2; }
}
