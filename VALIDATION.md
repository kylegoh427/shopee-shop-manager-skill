# v0.2.0 validation

Validation date: 27 November 2026. This release expands the coordinator, seven specialist playbooks, onboarding, handoffs, period analysis and private reporting templates.

- Offline tests cover the existing catalogue/contribution tools plus cumulative/matched-period comparisons, missing rows/pageviews, scope changes, partial cutoffs, counter revisions, duplicate/parent-variant aggregates, unique-visitor interpretation and invalid timestamps.
- Independent read-only forward test used four synthetic scenario groups: first-use guidance; generated-only draft uploads with over-allocated shared stock; staggered Bump cooldowns with strict cutoffs and a paid-budget gap; cumulative traffic, pre-existing COD, owner tests and overnight completion cohorts.
- The independent evaluator found no material contradiction in the workflows tested. It identified execution risks to watch: silent stock reallocation, scheduled-versus-verified actions, extending deadlines and treating cumulative unique changes/status updates as acquisition.
- All examples are synthetic. No live account was used for the automated or forward tests. The agent guides are portable instructions; only the host can supply tools, delegation, authentication and scheduling.

- Final local result: 45/45 tests passed on Node 26.11.1; official skill validator passed; all local Markdown resource links resolved; `git diff --check` passed.
- GitHub Actions runs the same offline suite on Node 22 and 24; see the v0.2.0 release and linked run for the published result.

These tests do not certify marketplace policy, live UI or business profitability.

## v0.1.0 baseline

Validation date: 26 November 2026. This is an initial release; it is not marketplace certification.

- Skill frontmatter/scaffold validator: passed.
- Local automated tests: 30 passed on Node 24.
- CI configuration: Node 22 and 24; results are visible in GitHub Actions.
- Synthetic CLI examples: executed successfully without account/network access.
- Independent agent dry run: three scenario groups covered publication authority, pack/stock ambiguity, multilingual reviews with complaints, duplicate review requests, delayed Bump retries and missing costs.
- Issues discovered during review were fixed and regression checked: matched default stock, incomplete identity fields, duplicate summary alerts, existing drafts, and ambiguous shared-pool offers.
- Public-package review: no live shop/customer records, credentials, business exports or private machine paths were included. All fixtures are synthetic.

No seller account was used for the automated or independent dry-run tests. Actual marketplace UI, programme eligibility, fee schedules, local product classification and account permissions must still be verified in use. Field consistency in an offline audit is not physical product verification or permission to publish.
