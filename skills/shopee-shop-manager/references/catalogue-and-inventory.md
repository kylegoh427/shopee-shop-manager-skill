# Catalogue and inventory

## Scope and identity

For a full audit, obtain the complete authorised export and record filters, pagination, snapshot time and coverage. Keep the original unchanged; record incremental verified updates separately. Report total rows, counted quantities, positive priced selling units, held/excluded rows and matched/unmatched/ambiguous records. Variants, duplicate imports and old starting quantities are not necessarily distinct ready products. Label a recent-changes audit honestly.

Match exact dependable SKU, then verify barcode, brand, product type, flavour, net content and outer pack count. Use explicit verified aliases for legacy listings without SKUs. Fuzzy names or equal prices alone do not establish identity.

Record inner item, selling unit, stock count in those selling units and physical pool separately. Ten 150 ml bottles per bundle and 12 available bundles mean 120 bottles, not 120 bundles. Separate source rows do not prove separate physical stocks.

Different online weights may be product versions or merchant errors. Ask what is printed on the actual pack or obtain exact authoritative evidence. Do not change the owner's weight to fit the first image found. Fine/coarse grind, coffee with sugar and packet weight are different attributes.

## Stock reconciliation

Unknown is not a verified zero. Configured starting quantities, demonstrations and imports need actual confirmation even if a database's counted flag is true. Check provenance and dates.

Physical on-hand and online available stock can differ because of reservations, shipped units, offline sales or allocations. Identify those movements before raising quantities; avoid deducting orders twice if inventory already synchronises them. Do not overwrite concurrent family edits from an old export.

Verify shared-pool base units and each offer's multiplier. For example, 20 singles plus 5 six-packs allocate 50 bottles. A source quantity of 30 cannot support that allocation without another verified pool. If an export omits pool/hold fields, state the limitation.

## Variations and duplicates

Group compatible pack sizes/flavours of the same product when current category rules permit. A shared brand does not make different product types interchangeable. Verify current variation counts, price ranges, category rules and per-variant shipping constraints; historical numbers are not universal rules.

Record listing/variant IDs, reviews, sales, prices and stock before consolidation. Choose a survivor deliberately, preserve reviews/identity, then add options with clear allocation. Before hiding a duplicate, verify the retained offer is accurate, available and purchasable for the intended selling unit; a Live label alone does not establish buyer eligibility. If this cannot be established, record the limitation and keep the removal step on hold. Then reversibly delist only the authorised duplicate, and verify both the retained offer and the duplicate's non-public status again. Do not rely solely on a check after removal. Reviews do not automatically migrate. Prefer an authorised reversible delisting over deleting a reviewed listing.

Find duplicate live SKUs across listings. If the same stock is accidentally offered twice, correct within owner authority and verify the retained option remains purchasable. Do not delist unrelated products to simplify an audit.

## Buyer visibility

Inspect Live, reviewing, violations, drafts, delisted, sold-out and restrictions separately. Open the public listing and full shop catalogue. Curated home sections, filters, sorting, pagination, lazy loading and stale counts can hide apparent coverage. Compare unique IDs across pages; recommendation repeats are not extra products. Test direct URLs when counts disagree. A desktop buyer view does not reproduce a phone-app issue.

Use only an owner-approved delivery location for eligibility checks. A free-delivery checkout does not prove seller funding or universal eligibility.

## Helper contract

`reconcile-catalog.mjs` is read-only. Map actual export headers to these canonical fields before running it:

- Inventory: `sku,product_name,barcode,variant,unit,pack_quantity,net_content,price,stock,stock_counted,stock_origin,listing_intent`
- Listing offers: `listing_id,sku,product_name,barcode,variant,unit,pack_quantity,net_content,price,stock,status`

One inventory row represents a selling unit; one listing row represents an offer/variant. `pack_quantity` is inner items per selling unit and `net_content` is per inner item. Use explicit `1` for singles. Blank facts stay blank. Origins include `physical_count`, `owner_confirmed`, `seed`, `default`, `import`, `unknown`. Intent is `sell`, `hold`, `skip`, `unknown`.

Use one shop and currency per run. Optional `currency` columns are compared when supplied on both sides. Optional `identity_key` denotes an owner-verified inner product/flavour identity (not its outer pack); the same key can support different SEO titles. Without it, differing names require review. Missing counterpart barcode/variant information is flagged. `identity_fields_consistent` describes compared fields, not proof of a physically verified product.

Optional config allows verified unit/variant aliases and explicit inventory-to-offer aliases. Explain each alias; identity checks still apply. Exact duplicate export rows are deduplicated with a warning; conflicting rows or inventory SKUs are flagged. Existing inactive/draft SKU records are reported before suggesting preparation of a new listing. Duplicate active offers and unverified source stock appear in summary alerts too.

For shared physical stock, `stock_pools` can contain `pool_id`, matching `identity_key`, `inventory_skus`, `available_base_units`, `basis: "available_to_allocate"`, and a `verification_note`. Available base units must already account for reservations/commitments. Each member needs that same verified identity key; offer quantities/multipliers must be consistent. An incomplete pool stays UNVERIFIED. A calculated surplus is not automatic restock authority.

`UNLISTED_CANDIDATE` only supports preparation—photos, shipping, eligibility, category and publication authority still need checking.
