# Private working templates

Copy only the templates needed into an owner-controlled directory outside the public skill/repository. Replace examples with verified values; unknown remains unknown. Do not commit filled templates or signed media URLs.

## Current state

```text
Shop key / marketplace / timezone / currency:
Owner's current goal and applicable authority:
Sources and snapshot/reporting cutoff:
Completed and verified (IDs, timestamps, evidence paths):
In progress / uncertain operations (inspect before retry):
Held / skipped / blocked, with exact missing facts:
Next action / owner decision / approved deadline:
Existing scheduler job IDs and notification dedupe record:
```

## Per-product readiness

| Product/SKU | Exact unit/content | Existing listing/variant | Stock basis/allocation | Approved price | Images/attributes/shipping | Hold or next action |
|---|---|---|---|---|---|---|

Readiness states: planned, in progress, verified, uncertain, blocked, held, skipped. A source default is not a verified count.

## Experiment ledger

```text
Experiment key / shop / listing / variant / selling unit:
Question / hypothesis / owner goal:
Baseline period, scope, cutoff, extraction time and source path:
Pre-existing order IDs and test/cancellation exclusions (private):
Action and verified start / evidence / actual exposure:
Checkpoint timestamps, compatible metrics and genuine order cohort:
Stock, costs/fees/packing coverage and actual contribution:
Confounds / missing data / partial exposure / uncertainty:
Continue / retest / pause criteria set before test:
Observed result, next action, next checkpoint and required approval:
```

For each Bump: operation key, round/deadline, exact ID/unit, verified stock/price, start/countdown/estimated expiry, evidence path, result, missing targets and bounded retry job ID. Actual totals come from verified records.

## Simple morning report

```text
Period and data cutoff:
Sales: new genuine paid orders/value; approved COD separately; cancellations.
Products: exact packs/units sold; costs/contribution known or missing.
Operations: shipping deadlines, chats/reviews, actual replies sent.
Work: verified listings/stock changes and successful free Bumps.
Next: one priority or smallest owner decision.
```

## Weekly or monthly report

```text
Period, comparison period, timezone and completeness:
Shop totals: genuine orders, paid/COD, merchandise, settlement; refunds/cancellations.
Product table: listing/unit, orders, units, sales, traffic, contribution/coverage.
Funnel: raw impressions/clicks/visitors/carts/orders; comparable rates; N/A fields.
Experiments: actual actions/exposure, observed outcomes, confounds, no causal claim.
Service: fulfilment/deadlines, customer questions, review replies.
Decision: one promotion priority and why; next test/checkpoint/approval.
```

## Notification deduplication

Store operation/event key, state last seen, first/last check, verified action time, notification time and evidence. Review requests also need matching buyer/thread, covered order IDs, eligibility, previous-send checks and exact sent text privately. Distinguish public review responses from buyer messages. Do not repeat unchanged alerts or treat a scheduled task as successful execution.
