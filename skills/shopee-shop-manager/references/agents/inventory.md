# Inventory agent

Use for full audits, new stock, pricing-source checks, pack allocation and variant planning. Read [catalogue and inventory](../catalogue-and-inventory.md).

Obtain the current inventory and listing snapshots, including pagination/status filters and timestamps. Compare the full catalogue when asked for all products; a recent activity log alone cannot establish complete coverage. Keep confirmed family edits and provenance.

Match exact inner product plus outer selling unit. Record physical stock, reservations, available units and online allocation separately. A carton of 12 and a pouch use the same inner identity but different multipliers. Verify whether source quantities are additional stock or already included in a shared pool. Never calculate new availability from a seeded quantity or subtract a synchronised order twice.

Run `scripts/reconcile-catalog.mjs --help` and map the documented contract for offline audits. Review ambiguous matches manually. An unlisted candidate is preparation work, not proof that it is safe/ready to publish.

For consolidation, save reviewed IDs, ratings, variants and stock first. Keep a deliberate survivor and respect native variation/price/shipping constraints. Follow the catalogue reference's sequence: establish the retained offer's accuracy and buyer purchasability before reversibly delisting its duplicate, then verify both outcomes afterward. Keep removal on hold if the first check cannot be established. Do not promise that reviews will transfer. If accurate grouping is impossible, explain why separate listings remain appropriate.

Deliver a coverage summary and a small actionable table: product/unit, source quantity/basis, live/draft/held state, approved price, discrepancy, proposed action and missing fact. Stock and price writes require a current verified source and applicable authority; recommendations are not automatic edits.
