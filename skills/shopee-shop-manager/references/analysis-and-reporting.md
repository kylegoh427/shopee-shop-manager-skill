# Analysis, fees and reports

Read [period analysis](period-analysis.md) for daily/weekly/monthly windows, cumulative checkpoints, unique visitors, pre-existing order exclusions and the offline comparison tool. The [Report agent](agents/report.md) owns the readout; [Growth and ads](agents/growth-ads.md) prepares any next test. Use [private templates](private-templates.md) for concise repeatable reports.

## Metric evidence

Record shop, listing/variant/selling unit, period/timezone, reporting cutoff, order type and traffic source. Unavailable views/costs are N/A or MISSING, not zero. Distinguish impressions, clicks, unique product visitors, page views, cart visitors, confirmed/completed orders, units and merchandise sales.

Do not add parent and child rows. Deduplicate repeated export/page rows by stable record identity. Do not combine incompatible windows, attributed conversions or currencies. Exclude tests, cancellations and returns appropriately; if native aggregates cannot exclude a test, state that limitation. Lifetime sold counts are not today's orders; an old order completing tonight is not necessarily a new sale tonight.

## Diagnose before spending

| Observation | Investigate |
|---|---|
| Few impressions | Discovery/indexing, stock eligibility, search/category relevance, free exposure |
| Impressions but few clicks | Main image, title, intent, price/pack clarity |
| Clicks but few carts | Unit/variant clarity, trust, label details, delivered cost |
| Carts but few orders | Shipping eligibility, delivery estimate, checkout friction, variant availability |
| Sales but weak contribution | Landed cost, fees, packing, basket size, cancellations/refunds |

Low traffic is not proven conversion failure. Show raw counts beside rates. CTR is clicks/impressions. Use confirmed orders/product visitors only with aligned definitions/windows; if only clicks exist label orders/clicks separately. Leave zero-denominator rates blank.

## Contribution

For settled orders:

`before-ad contribution = seller payout − goods cost − packing − other variable costs not already deducted`

`after-ad contribution = before-ad contribution − attributable ad expense`

Payout often already deducts fees; do not deduct them twice. Contribution is not net business profit after rent/wages/income tax. Approved COD is not cash received. Track settlement, returns and refunds separately.

For a prospective quote, verify account/category/programme fee rates, fee bases, tax, fixed order charges, basket units, seller-funded shipping/discounts and landed SKU cost. Count each order charge once. An app's stored zero is not proof packing or commission is free.

`maximum acquisition spend per comparable order = before-ad contribution − profit the owner wants to retain`

A negative result makes that target unaffordable. Missing costs or unknown paid response prevent a firm profitable-ads claim. `contribution.mjs` implements only the settled-order form with explicit inputs; it does not forecast orders or model every marketplace fee.

## Experiments and paid proposals

Define candidate, hypothesis, baseline, intervention, unchanged factors, window, exclusions and checkpoint. Prefer comparable hours/day types; another product is context, not automatically an equivalent control. Log stockouts/restocks, listing changes, platform campaigns, repeated Bumps, social posts and delayed reporting. A late-afternoon Bump is not a full-day treatment; tiny samples remain inconclusive.

Paid proposals need listing/stock readiness, verified costs, measurement and current native settings. Propose one concrete test with daily/total spend, duration, retained-profit goal, monitoring and loss/stop condition. Verify an enforceable cap: daily budget times days is not automatically a hard lifetime limit. Do not enable unlimited budget or auto-top-up as setup convenience. Draft until authorised; interest in ads is not spend approval.

Separate platform-attributed GMV/orders/ROAS from incremental contribution. Ordinary organic orders do not prove ad payback. Consider lag, cancellations and returns before calling a test a winner.

## Simple reports

Use the owner's language/cadence. A morning report can cover:

1. New genuine paid orders and merchandise amount; approved COD separately.
2. Packing/shipping work, nearest deadline, delivered versus completed changes.
3. Chats/reviews needing attention and replies actually sent.
4. Verified listing/stock work and actual free Bumps, not scheduled counts.
5. One missing fact or owner decision.

A weekly report adds a product/pack table: orders, units, merchandise amount, known contribution or MISSING, and comparable traffic. Prior-week comparisons need matching scope. Explain one promotion priority with facts, hypotheses and missing inputs. Targets are not forecasts or guarantees. Keep detailed evidence private and link the audit rather than recounting every click.
