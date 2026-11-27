# Shopee Shop Manager — an AI agent skill

A community skill for running **authorised Shopee seller workflows**: catalogue and stock audits, product uploads, customer enquiries, multilingual reviews, free Bumps, scheduling and performance reports.

Built from practical seller-operation lessons and released as an adaptable playbook. **v0.3** adds a 24-case scenario evaluation library and evidence-linked agent scorecard to the guided coordinator, seven specialist playbooks and period-analysis tools. This is an independent community skill, not an official Shopee integration. Account access, browser/connector tools, image generation and persistent scheduling must be supplied by the host agent and shop owner.

## What it covers

| Work | Examples |
|---|---|
| Catalogue | Full inventory-to-listing audits, selling units, pack allocation, variants, duplicates, buyer visibility |
| Listings | Exact package references, owner styling, generated-photo policies, attributes, shipping, draft/publish verification |
| Customer service | Order/payment states, ship-by deadlines, new enquiries, FAQ/away replies, escalation |
| Reviews | Customer-language responses, star-only reviews, complaint handling, optional neutral requests with duplicate checks |
| Free exposure | Verified native free Bumps, real cooldowns, bounded retries, actual execution records |
| Analysis | Traffic funnels, small-sample limits, contribution after fees/packing, capped paid-test proposals |
| Reports | Simple daily and weekly updates with honest coverage and actionable owner decisions |

It does not supply credentials, bypass authentication/CAPTCHA, create unsolicited spam, or authorise spending. It does not run in the background merely because it is installed. Marketplace rules, fees and programme limits are checked in the owner's current account rather than hardcoded globally.

## Install in Codex

Clone or download this repository. Copy `skills/shopee-shop-manager` into your Codex skills directory—normally `~/.codex/skills`, or the `skills` directory under your configured `CODEX_HOME`. Back up an existing same-name skill before replacing it. Start a new agent session if needed for skill discovery.

For the portable package, download `shopee-shop-manager-vX.Y.Z.zip` and `SHA256SUMS.txt` from [GitHub Releases](https://github.com/kylegoh427/shopee-shop-manager-skill/releases/latest). Verify the checksum and extract the single `shopee-shop-manager` folder. You can first run its offline helpers in an isolated directory; installation does not require a live shop. Start with a read-only task before authorising writes in a new seller account.

Invoke:

```text
Use $shopee-shop-manager to audit my listings against my inventory.
Keep our prices, use only free Bumps, and draft customer replies until I approve sending.
```

Other agents that support the SKILL.md convention may adapt the instructions, but tool names, authentication, confirmation rules and scheduler integration must follow that environment. Only Codex metadata is included here; other hosts are not claimed as tested.

## Guided first use

Start with:

```text
Use $shopee-shop-manager to help manage my Shopee shop.
```

When you have not specified a task, the coordinator asks what you want to do and guides you to the right workflow. If you already gave a task, it starts that work instead of repeating the menu. It collects only the context needed for the next step and reuses your saved preferences and permissions.

The agent establishes your marketplace, shop, timezone, inventory source, working hours and permissions as needed. Your shop operating file, exports, customers, costs, images and execution records stay **outside the public repository**. See [guided onboarding](skills/shopee-shop-manager/references/guided-onboarding.md) and [setup](skills/shopee-shop-manager/references/setup-and-permissions.md).

## Coordinator and specialist agents

| Agent | Responsibility | Example request |
|---|---|---|
| [Posting](skills/shopee-shop-manager/references/agents/posting.md) | Product facts, copy, attributes, shipping, draft/live checks | “Prepare these listings; save drafts only.” |
| [Design](skills/shopee-shop-manager/references/agents/design.md) | Store-theme galleries, exact pack references, generation and QA | “Make four images per product using my template.” |
| [Inventory](skills/shopee-shop-manager/references/agents/inventory.md) | Full catalogue audit, shared stock, packet/carton variants | “Find what is missing and reconcile our available stock.” |
| [Customer service](skills/shopee-shop-manager/references/agents/customer-service.md) | Orders, leads, FAQ/away replies, multilingual reviews | “Check new orders and reply to positive reviews in their language.” |
| [Bump](skills/shopee-shop-manager/references/agents/bump.md) | Free eligibility, selection, cooldowns, verified execution | “Use eligible free Bumps in our approved hours and track results.” |
| [Report](skills/shopee-shop-manager/references/agents/report.md) | Daily/weekly/monthly sales, funnels, contribution and experiments | “Show which products deserve more focus this week and why.” |
| [Growth and ads](skills/shopee-shop-manager/references/agents/growth-ads.md) | Demand research, organic proposals, bounded paid tests | “Prepare a small ad test; don't launch or fund it yet.” |

One coordinator owns the plan, permissions, handoffs and final report. These are specialised playbooks, not seven automatically running workers. A compatible host can delegate independent research or analysis; a single agent can use the same roles sequentially. Live account writes are coordinated to avoid duplicate replies, conflicting edits and double stock allocation. See [team coordination](skills/shopee-shop-manager/references/team-coordination.md).

Examples of useful requests:

```text
Check orders, chats and unanswered reviews. Reply to positive reviews in their original language.

Prepare these products using my approved image template. Publish only units with confirmed stock and packaging.

Use eligible free Bumps during my approved hours. Record actual results and report meaningful failures.

Give me a simple Monday report: paid sales, approved COD, products sold, shipping work and one promotion priority.

Propose an ad test, but do not publish it, top up or create vouchers.
```

## Offline tools

Node 22+; no npm dependencies or network calls. All bundled example records are synthetic.

```sh
npm test
node skills/shopee-shop-manager/scripts/reconcile-catalog.mjs --inventory examples/inventory.csv --listings examples/listings.csv --out audit.json
node skills/shopee-shop-manager/scripts/contribution.mjs examples/order-costs.json
node skills/shopee-shop-manager/scripts/compare-performance.mjs examples/performance-checkpoints.json
```

Read [the CSV input contract](skills/shopee-shop-manager/references/catalogue-and-inventory.md) before mapping real exports. One row means a selling unit/offer, not necessarily a product family. Output never overwrites an input; existing reports require a new filename or explicit `--overwrite`.

The audit catches duplicate live offers, packet/carton mismatches, unknown/default stock, conflicting export rows, existing drafts and price/stock differences. Explicit owner-verified stock pools can expose over-allocation across loose items and cartons. It never modifies Shopee or proves publication readiness. The contribution helper refuses to assume missing costs are zero and avoids deducting payout fees twice.

The performance helper compares compatible cumulative checkpoints or matched periods. It preserves missing pageviews, flags incompatible scope and counter revisions, rejects duplicate aggregate rows, and labels cumulative unique-visitor changes correctly. It does not infer causal lift, genuine new-order cohorts or profit. See the [input contract and analysis methods](skills/shopee-shop-manager/references/period-analysis.md).

## Reports that lead to useful decisions

- **Morning:** previous complete day plus a separately labelled overnight queue; sales/payment state, fulfilment, customer work and one priority.
- **Weekly:** previous complete local week, product/pack performance, comparable funnel metrics, contribution coverage and the next test.
- **Monthly:** complete calendar month with day-count, stock and promotion context.
- **Experiments:** pre-action baseline, actual execution times, compatible checkpoints, pre-existing order exclusions, confounds and continue/retest/pause criteria.

Impressions, clicks, unique visitors and pageviews stay distinct. Approved COD is separate from collected cash; old orders completing today are separate from new sales. A few clicks or a single order do not prove a winner. See [period analysis](skills/shopee-shop-manager/references/period-analysis.md), [report templates](skills/shopee-shop-manager/references/private-templates.md) and [scheduler prompt examples](skills/shopee-shop-manager/references/recurring-job-prompts.md). Scheduling requires an actual host scheduler and your chosen cadence; installation alone does not start monitoring.

## Validation and limitations

### Scenario tests and agent scorecard

The portable skill includes **24 synthetic scenarios: three for each of eight roles**. They cover onboarding, draft/publication boundaries, exact product imagery, shared stock and concurrent edits, multilingual reviews and duplicates, cooldown deadlines, traffic/order cohorts and paid-budget/fee constraints.

```sh
npm run eval:check
npm run eval:list
node skills/shopee-shop-manager/scripts/agent-scorecard.mjs prompt CASE_ID
node skills/shopee-shop-manager/scripts/agent-scorecard.mjs template
node skills/shopee-shop-manager/scripts/agent-scorecard.mjs score private-run.json
```

The prompt command withholds grader rubrics and expected roles from a fresh responder. A separate evaluator grades the exact response for accuracy, evidence, authority, completion, clarity, efficiency and applicable deduplication/handoffs. Each judgment needs a rationale and literal evidence; missing assessments stay incomplete. Critical decision failures override a high average. Templates/examples/self-reviews cannot pass the independent release gate.

The scoring CLI validates and aggregates those judgments; **it does not automatically judge the meaning of a response or run a language model**. The Node test suite tests the tools. The independent scenario run tests a sample of agent decisions. Neither certifies live account performance or guarantees sales. Read [the evaluation method and input contract](skills/shopee-shop-manager/references/evaluation-and-improvement.md) before reporting a score.

Keep each run's source revision, suite fingerprint, environment and original responses. Compare only compatible runs and inspect individual regressions. A fresh suite establishes a baseline; it is not evidence of improvement over an earlier version without a matched run. Turn demonstrated issues into synthetic regression cases, make the smallest useful fix, test independently, review, merge and publish a versioned release.

Automated tests exercise unit mismatches, duplicate allocation, CSV corruption, default/unknown stock, aliases, output safety, contribution calculations and period-comparison errors. An independent dry run also exercises onboarding, role handoffs, stock ambiguity, cooldown deadlines, paid-budget gaps and order-cohort interpretation. See the [validation record](VALIDATION.md). These are offline tests, not certification of every marketplace UI or policy. Platform UI changes, seller permissions, jurisdiction, language nuances and missing source records still require agent judgement and verified evidence.

Real-world bug reports are welcome. Use synthetic/redacted examples; never post buyer details, order IDs, credentials, signed URLs or private business exports in issues. Explain the marketplace, task, expected/observed behaviour and relevant tool limitation. Contributions should keep owner authority, privacy and verified execution intact.

## Related work

Shopee-related skills already exist, including [Nexscope's public product-detail skill](https://github.com/nexscope-ai/nexscope-ecommerce-skills/tree/main/ecommerce-shopee-product-detail). This project focuses on owner-authorised seller operations rather than public listing lookup. No code from that project is included.

## Licence

[MIT](LICENSE). Independent community project; not affiliated with or endorsed by Shopee.
