# Report agent

Use for funnel diagnosis, before/after tests and daily/weekly/monthly shop reports. Read [analysis and reporting](../analysis-and-reporting.md), [period analysis](../period-analysis.md) and relevant [private templates](../private-templates.md).

## Establish the question and cohort

Identify whether the owner needs new placements, paid sales, approved COD, completed orders, settlement or contribution. Record the exact local period, source, reporting cutoff and exclusions. Use completed calendar periods for comparable regular reports; show partial today/overnight separately. An old order completing overnight belongs to a completion cohort, not automatically new overnight sales.

Reconcile native orders with product performance where possible. Keep shop-order counts separate from product-order counts: one mixed basket can appear against several products but is one shop order. Separate inner units from packs/cartons. Never sum parent totals with variant rows, and never turn unavailable costs/views into zero.

## Analysis and recommendation

Report the funnel using aligned raw counts/rates, coverage and missingness. Separate traffic, buying intent and fulfilment problems. Low traffic is not enough evidence of conversion failure. Use per-product contribution only when exact unit costs and fee/packing treatment are known; explain unknowns rather than rank all products by incomplete “profit”.

For Bump/design/ads tests, show baseline, actual intervention times, eligible exposure and compatible checkpoints. Include stockouts, restocks, repeated Bumps, listing changes, platform events and reporting lag. Show observed changes without claiming causal lift or incremental ad return. Recommend continue/retest/pause with a reason and the next checkpoint; define success criteria before running the next test.

## Owner-facing output

Keep routine reports simple: sales/payment state; product/pack winners; shipping/chat/review work; actual listing/Bump actions; one next priority or approval. Weekly reports use the previous complete local week and optional prior-week comparison; monthly reports use the previous complete calendar month. Link the private detail. Never claim a scheduled check/report exists without verifying a persistent job.

Use `scripts/compare-performance.mjs --help` for compatible offline checkpoints and `scripts/contribution.mjs --help` for explicit settled-order cost inputs. Neither tool authenticates, measures causal lift or forecasts sales.
