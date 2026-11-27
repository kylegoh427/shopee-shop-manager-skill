# Setup and permissions

Save an operating file outside the skill/public repository. Establish these with the owner, reusing existing answers:

```yaml
shop_key: private-local-key
marketplace: OWNER_CONFIRM
shop_identity: OWNER_CONFIRM
timezone: OWNER_CONFIRM
currency: OWNER_CONFIRM
inventory_source: OWNER_CONFIRM
inventory_stock_basis: physical-or-available-or-unknown
owner_report_language: OWNER_CONFIRM
customer_language_policy: match-customer
working_window: OWNER_CONFIRM
test_order_ids: []
permissions:
  inspect: true
  listing_edits: owner-confirm-scope
  publish: owner-confirm-scope
  stock_updates: confirm-source-and-allocation
  pricing: preserve-approved-prices
  free_bumps: owner-confirm-scope
  customer_chat: draft-until-authorised
  public_review_replies: draft-until-authorised
  review_requests: off-until-authorised
  fulfilment_actions: off-until-authorised
  paid_ads: no-approved-budget
  seller_vouchers_and_discounts: no-approval
```

These are starter uncertainties, not permanent approval gates. A prior instruction to apply confirmed inventory prices can authorise those edits; do not ask again for each one. Preserve narrower choices such as draft-only, generated-only photos, no discounts, or a named product hold.

## Access

Verify the authenticated shop before a write, especially after login changes. Prefer supported connectors/official integrations. With UI control, read current tool documentation and act through observed controls. Do not package cookies/tokens, expose credentials, or reverse-engineer private authenticated endpoints to make the skill portable.

The owner handles required authentication/CAPTCHA/manual steps according to host rules. Do not repeatedly create login tabs or report an inaccessible shop as having no orders. Obtain separately required integration permissions rather than evading a UI limitation. A skill is not an authentication provider or scheduler.

On an access-blocked attempt, keep the last successful timestamp, unresolved work and deduplication records intact; save the blocked attempt separately. Do not advance the successful checkpoint or mark missing data as an empty/healthy queue. Reuse the matching job and resume comparison from the preserved checkpoint after access is restored.

| Action | Establish before executing |
|---|---|
| Read shop/public competitor information | Intended account and task |
| Edit metadata, stock or approved prices | Target, source, units and applicable edit authority |
| Publish/delist | Publication or consolidation authority and verified details |
| Send customer/review responses | Send policy, language and escalation scope |
| Arrange fulfilment/refunds or make commitments | Specific authority and host confirmation requirements |
| Free Bump | Product/time scope and native free eligibility |
| Ads, discounts, vouchers, fee programmes, top-ups | Exact change/budget and applicable approval |

Inspect terms before proposing traffic acceleration, quick bidding or free-shipping programmes. Their names do not establish that they are free to the seller. Do not enrol as a side effect of editing a listing.

## Privacy and multi-shop isolation

Use a separate context and ledger per shop. Match account/target to it before every write. Keep exports, screenshots, customer details, financial inputs and stock photos private. Public examples must be synthetic. Review the actual staged file list before publication: `.gitignore` does not sanitise already tracked files.
