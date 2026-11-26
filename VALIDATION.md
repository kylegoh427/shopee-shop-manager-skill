# v0.1.0 validation

Validation date: 26 November 2026. This is an initial release; it is not marketplace certification.

- Skill frontmatter/scaffold validator: passed.
- Local automated tests: 30 passed on Node 24.
- CI configuration: Node 22 and 24; results are visible in GitHub Actions.
- Synthetic CLI examples: executed successfully without account/network access.
- Independent agent dry run: three scenario groups covered publication authority, pack/stock ambiguity, multilingual reviews with complaints, duplicate review requests, delayed Bump retries and missing costs.
- Issues discovered during review were fixed and regression checked: matched default stock, incomplete identity fields, duplicate summary alerts, existing drafts, and ambiguous shared-pool offers.
- Public-package review: no live shop/customer records, credentials, business exports or private machine paths were included. All fixtures are synthetic.

No seller account was used for the automated or independent dry-run tests. Actual marketplace UI, programme eligibility, fee schedules, local product classification and account permissions must still be verified in use. Field consistency in an offline audit is not physical product verification or permission to publish.
