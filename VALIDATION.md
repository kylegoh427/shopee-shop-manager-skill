# v0.3.1 security validation

28 November 2026. Maintainer and independent read-only source reviews found no current hidden collection/credential-exfiltration mechanism. Bounded synthetic probes identified and fixed local report-output link/permission weaknesses and initial import-scan syntax gaps. See the [security audit record](security/audit-2026-11-28.md).

- 70 local automated tests passed, including 11 security/output regressions added to the existing 59.
- Offline manifest/import/pattern gate passed for 39 reviewed files; no npm dependencies or lifecycle hooks were introduced.
- CI runs the direct gate before tests, with read-only contents permission and no persisted checkout credentials.
- Four independent offline privacy scenarios exercised authorised redaction/upload boundaries, injected credential requests, synthetic public bug reports and untrusted CSV content.
- The v0.3.0 behavioural evaluation history remains unchanged. This patch does not claim a fresh 24-case language-model benchmark or security certification.

The gate, code review, checksums and tests do not guarantee absence of all backdoors. Host providers/tools/permissions, remote account security, malicious maintainers and future updates remain separate trust boundaries.

## v0.3.0 baseline

Validation date: 27 November 2026. The portable skill now includes 24 synthetic scenarios across eight roles, 96 decision checks, an evidence-linked scorecard, run templates and a repeatable improvement/release workflow.

- Three complete independent-response runs were graded: 22/24, 23/24 and 24/24 passed. All original responses and assessments remain in [the evaluation report and records](skills/shopee-shop-manager/evals/results/v0.3.0-report.md).
- Final guidance candidate `47e56e497538f8415237b09d240ce2af6695b597`: 24/24 passed, zero critical failures, 100/100 evaluator score on this synthetic suite. This is not a probability of live success or marketplace certification.
- Demonstrated gaps fixed: preserving last-success/unresolved state after access failure; delivering an actual constrained design prompt when generation is unavailable; verifying retained-offer buyer purchasability before duplicate removal; and preserving exact complaint facts.
- Independent scorer review and regression probes fixed lost-coverage average inflation, malformed baseline summaries and accidental whitespace identity matching. Scoring judgments remain evaluator-owned; identity labels are metadata, not authentication.
- Local automated result: 59/59 tests passed on Node 26.11.1, including faithful recomputation of all recorded assessments and final release-gate checks. GitHub CI runs Node 22 and 24.
- Official skill validator, local resource links, whitespace checks, public-package privacy review and isolated published-ZIP validation are part of the release checks.
- Responders were fresh and did not receive grader criteria or prior answers. The same separate evaluator assessed successive runs and knew prior findings; the comparison is observational and subjective, not a blinded statistical experiment.

No live seller account, messaging, image generation, ads or scheduling was used in these evaluations. CI validates deterministic helpers and recorded assessment integrity; it does not independently rerun a language model. Actual UI, packaging fidelity, permissions and policy eligibility require live verification within owner authority.

## v0.2.0 baseline

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
