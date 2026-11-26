# Shopee Shop Manager — an AI agent skill

A community skill for running **authorised Shopee seller workflows**: catalogue and stock audits, product uploads, customer enquiries, multilingual reviews, free Bumps, scheduling and performance reports.

Built from practical seller-operation lessons and released as an adaptable playbook. This is an early **v0.1** release, not an official Shopee integration. Account access, browser/connector tools and persistent scheduling must be supplied by the host agent and shop owner.

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

Invoke:

```text
Use $shopee-shop-manager to audit my listings against my inventory.
Keep our prices, use only free Bumps, and draft customer replies until I approve sending.
```

Other agents that support the SKILL.md convention may adapt the instructions, but tool names, authentication, confirmation rules and scheduler integration must follow that environment. Only Codex metadata is included here; other hosts are not claimed as tested.

## First use

The agent establishes your marketplace, shop, timezone, inventory source, working hours and permissions. Your shop operating file, exports, customers, costs, images and execution records stay **outside the public repository**. See [the setup reference](skills/shopee-shop-manager/references/setup-and-permissions.md).

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
```

Read [the CSV input contract](skills/shopee-shop-manager/references/catalogue-and-inventory.md) before mapping real exports. One row means a selling unit/offer, not necessarily a product family. Output never overwrites an input; existing reports require a new filename or explicit `--overwrite`.

The audit catches duplicate live offers, packet/carton mismatches, unknown/default stock, conflicting export rows, existing drafts and price/stock differences. Explicit owner-verified stock pools can expose over-allocation across loose items and cartons. It never modifies Shopee or proves publication readiness. The contribution helper refuses to assume missing costs are zero and avoids deducting payout fees twice.

## Validation and limitations

Automated tests exercise unit mismatches, duplicate allocation, CSV corruption, default/unknown stock, aliases, output safety and contribution calculations. See the [validation record](VALIDATION.md). These are offline tests, not certification of every marketplace UI or policy. Platform UI changes, seller permissions, jurisdiction, language nuances and missing source records still require agent judgement and verified evidence.

Real-world bug reports are welcome. Use synthetic/redacted examples; never post buyer details, order IDs, credentials, signed URLs or private business exports in issues. Explain the marketplace, task, expected/observed behaviour and relevant tool limitation. Contributions should keep owner authority, privacy and verified execution intact.

## Related work

Shopee-related skills already exist, including [Nexscope's public product-detail skill](https://github.com/nexscope-ai/nexscope-ecommerce-skills/tree/main/ecommerce-shopee-product-detail). This project focuses on owner-authorised seller operations rather than public listing lookup. No code from that project is included.

## Licence

[MIT](LICENSE). Independent community project; not affiliated with or endorsed by Shopee.
