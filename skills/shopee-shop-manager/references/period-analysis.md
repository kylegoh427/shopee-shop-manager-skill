# Period analysis and promotion experiments

## Choose the right period

| Readout | Default scope to offer, then confirm owner preference |
|---|---|
| Immediate Bump check | Pre-action baseline and the next compatible reporting cutoff; record the gap from cutoff to actual click |
| Morning operations | Previous complete local calendar day, with overnight queue/status changes separately labelled |
| Daily sales | Placements/paid/approved-COD cohorts for that local day, not all older orders updated today |
| Weekly review | Previous completed local week with explicit week-start day; compare the previous matching week |
| Monthly review | Previous complete calendar month; show different day counts and per-day context |
| Product experiment | Actual first verified action through the planned observation window, with partial exposure labelled |

Use half-open intervals `[start, end)` to avoid counting midnight twice. Store timestamps with UTC offsets and the IANA reporting timezone. Snapshot date range, reporting cutoff, order type, traffic source, currency, shop, listing/variant and aggregation level must travel with the numbers. Save raw exports privately and preserve the original. A late report can revise earlier counts; state extraction time as well as reporting cutoff.

## Metric definitions

| Metric | Interpretation and useful calculation |
|---|---|
| Impressions | Product shown; not pageviews or unique people |
| Product clicks | Click events; CTR = clicks / impressions within one scope |
| Product visitors | Unique product visitors for that report period; uniqueness may reset by day |
| Pageviews | Actual pageview metric only when supplied; unavailable = N/A |
| Cart visitors | Unique visitors adding to cart, using the source's definition |
| Reported product orders | Source aggregate; identify confirmed/completed/attributed definition |
| Shop orders | Deduplicated genuine order IDs; one mixed basket is one order |
| Units / merchandise sales | Selling units and merchandise value; distinguish inner-unit equivalents and buyer payment |
| Seller payout | After marketplace deductions; settlement/estimate distinction matters |
| Contribution | Payout less goods, packing and other not-yet-deducted variable costs; less ads for after-ad contribution |

Show raw counts beside rates. Reported orders / product visitors is only a same-scope product-order rate, not necessarily distinct buyers or causal conversion. If only clicks exist label orders / clicks explicitly. Use N/A for zero denominators. Do not average product CTRs to obtain shop CTR; a weighted ratio needs additive, compatible underlying events. Unique visitors cannot be summed across days, products or variants to claim unique shop visitors.

## Compare snapshots honestly

**Same-period cumulative snapshots:** require the same shop, period start/end, timezone, currency, aggregation level, order type and source, with the later cutoff at or after the first. Differences in additive counters (impressions/clicks/pageviews/orders/units/sales) describe changes in reported totals, not exact post-action events when lag/revisions exist. A decrease needs investigation, not a negative-traffic claim. Differences in cumulative unique visitors/cart visitors are changes in unique totals, NOT unique people during the later interval. Do not calculate interval conversion from those differences. Per-snapshot rates remain useful.

**Matched periods:** use equal-duration windows, equivalent reporting completeness, the same scope and comparable hours/day types. Label unmatched holidays, payday, promotions and month lengths. Do not compare a partial afternoon with a full day as if exposure were equal. Another product provides context, not automatically an equivalent control. An observational before/after change does not establish causal lift.

**Daily series:** keep each day's complete report separate. Add only metrics whose source definitions are additive. Do not subtract a rolling 30-day counter to infer yesterday's events; the departing day changes the result too. Use exports scoped to the required day.

## Order cohort and exclusions

Save all pre-existing native order IDs before an intervention, including pending/unpaid orders. An old pending order becoming approved after the Bump is a status change, not a newly acquired order. Track new genuine placements, paid prepaid, approved COD, shipped, completed, cancellations, returns and payout separately. Exclude known owner tests and avoid subtracting the same test from more than one aggregate. If the aggregate cannot be corrected, state that limitation and use the verified order cohort for business outcomes.

Mixed-product orders may count in several product rows. Deduplicate order IDs for shop totals, and preserve lines for pack/variant analysis. Separate carton counts from inner packets. Attribution from the ad platform is not proof of incrementality; reconcile it with real order/payment state and return lag where available.

## Test record and decisions

Before acting, record hypothesis, candidate, baseline scope, exact change, unchanged factors, observation window, minimum evidence/owner business target, maximum risk and continue/retest/pause criteria. Do not impose a universal “enough clicks” threshold on every shop. Low counts or unknown costs can justify an inconclusive result.

After each verified action persist its exact target, start, countdown/status and evidence. At later approved checks capture matching traffic, order cohort and stock context. Log repeated Bumps, stockout/restock, listing/price/cover edits, catalogue additions, social activity, platform campaigns, reporting lag and cancellations. Separate a partial first day from a full later day. Intentional interruption is not product failure.

Decide using the funnel:

- Few impressions: verify live/buyer eligibility, discovery/category/title relevance and test free exposure.
- Impressions but weak clicks: check thumbnail, intent and unit/price clarity; test one cover/title change.
- Clicks but few carts: inspect exact variant, label/trust information and delivered checkout cost.
- Carts but few orders: check delivery options, estimates, variant stock and checkout conditions.
- Orders but weak contribution: verify exact cost, fees, packing, cancellations and basket economics before increasing traffic.

Recommend one next action, why, missing information and next checkpoint. Do not change price or start paid ads from a report recommendation without applicable authority.

## Offline comparison helper

`node scripts/compare-performance.mjs checkpoints.json` prints JSON without network access or account changes. Input:

```json
{
  "mode": "cumulative",
  "baseline": {
    "scope": {"shop_key":"demo", "timezone":"Asia/Kuala_Lumpur", "currency":"MYR", "order_type":"confirmed", "traffic_source":"all", "aggregation_level":"listing"},
    "period_start":"2030-01-07T00:00:00+08:00",
    "period_end":"2030-01-08T00:00:00+08:00",
    "reporting_cutoff":"2030-01-07T10:00:00+08:00",
    "rows":[{"listing_id":"demo-coffee", "impressions":100, "clicks":5, "product_visitors":4, "page_views":null, "cart_visitors":2, "reported_orders":1, "units":2, "merchandise_sales":20}]
  },
  "checkpoint": {
    "scope": {"shop_key":"demo", "timezone":"Asia/Kuala_Lumpur", "currency":"MYR", "order_type":"confirmed", "traffic_source":"all", "aggregation_level":"listing"},
    "period_start":"2030-01-07T00:00:00+08:00",
    "period_end":"2030-01-08T00:00:00+08:00",
    "reporting_cutoff":"2030-01-07T14:00:00+08:00",
    "rows":[{"listing_id":"demo-coffee", "impressions":180, "clicks":9, "product_visitors":7, "page_views":null, "cart_visitors":3, "reported_orders":1, "units":2, "merchandise_sales":20}]
  },
  "confounds":["Repeated free Bumps; cumulative cutoff does not coincide with action time"]
}
```

Modes: `cumulative` (same period, later cutoff) or `matched-period` (equal duration and cutoff completeness; non-overlapping ordered windows). Rows are unique listing IDs, or listing + required `variant_id` when aggregation is `variant`. Do not mix parent totals and variants. Metrics must be explicit non-negative numbers, count fields integers; omitted/null metrics stay unavailable. Missing rows stay missing. Timestamps require offsets. For comparison, all scope fields must match. The helper checks these structural conditions, not whether native metric meanings, source evidence, business exclusions, weekday effects or an experimental control are valid. It does not calculate genuine order cohorts or causal lift.
