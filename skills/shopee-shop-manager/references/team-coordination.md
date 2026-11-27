# Coordinator and specialist handoffs

## Roles are workflows, not account authority

The coordinator selects the smallest set of specialists for the owner's task. Briefs live in `references/agents/`; `agents/openai.yaml` is host UI metadata, not a running team configuration. Do not claim seven agents are running because seven briefs exist.

Where delegation is available and permitted, parallelise independent read-only work such as exact-package research, image QA and report calculations. Otherwise execute the roles sequentially. Do not spawn persistent workers or charge for extra services merely by loading this skill.

Keep one writer for each live shop. The coordinator performs external mutations sequentially after reviewing specialist evidence, unless one worker has exclusive ownership of a clearly separate task and host rules permit it. Never have two workers edit the same listing, stock pool, buyer thread, review or Bump round. A product design approval does not approve its publication or price.

## Handoff contract

Pass only the minimum authorised shop data needed, privately:

```text
Task / requested result:
Shop key, marketplace, timezone:
Exact listing / variant / SKU / selling unit:
Applicable owner authority and holds:
Source snapshot time, paths, provenance:
Operation key and writer / read-only assignment:
Evidence needed for completion:
Deadline / reporting window / stop condition:
Return: verified facts, proposed action, uncertainty, evidence paths, next dependency.
```

Use stable operation keys such as `shop|listing|action|round-or-event`. An in-progress/uncertain operation must be inspected natively before another attempt. Re-read current stock or fields before committing a plan derived from an earlier export; family edits may have occurred.

## Dependencies

- Inventory → design/posting: identity, pack multiplier, approved prices, verified availability and holds.
- Design → posting: approved final paths, image order, exact-unit QA and rejected asset IDs.
- Posting → report: saved listing/variant IDs, native status, fields changed and publication time.
- Report → bump/growth: compatible baseline, genuine order cohort, contribution coverage and one test hypothesis.
- Bump → report: per-item verified start/expiry, scope/cutoff, confounds and failed/missed actions.
- Customer service → coordinator: new order/payment/deadline changes, actual sends and deduplication keys.
- Growth → coordinator: recommendation, cost/measurement uncertainties and exact approval still needed.

## Close the loop

The coordinator reconciles conflicting evidence, verifies live results, updates the shared private state and sends one concise owner report. Say which tasks completed, what remains and what exact answer is needed. Do not publish internal/customer records into a public skill, issue or release. A teammate's “done” without evidence is not completion.
