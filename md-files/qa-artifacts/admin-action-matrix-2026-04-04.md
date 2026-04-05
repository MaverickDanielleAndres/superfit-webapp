# Admin Action Matrix + Realtime SLA Verification

Date: 2026-04-04
Environment: Supabase project szfviybgscpaxdqmsfxz
SLA target: <= 2000 ms event delivery
Probe script: scripts/qa/verify-admin-realtime-sla.mjs
Raw artifact: md-files/qa-artifacts/admin-realtime-sla-latest.json

## Results

| Admin Action | Mutation Table | Subscribed Surface Signal | Observed Latency (ms) | SLA Pass |
| --- | --- | --- | ---: | --- |
| User premium toggle | profiles | Admin users/coaches and user premium state propagation | 202 | PASS |
| Platform settings save | platform_settings | Admin settings refresh propagation | 188 | PASS |
| Coach application decision | admin_coach_applications | Admin applications/coaches propagation | 421 | PASS |
| Payout approval flow | payment_transactions | Admin payments propagation | 454 | PASS |
| Moderation status transition | admin_moderation_reports | Admin content moderation propagation | 433 | PASS |

Summary: 5/5 probes passed, p95 latency 433 ms.

## Verification Notes

- Realtime publication was missing for admin/coach subscription tables initially; fixed via migration.
- Admin applications realtime listener table name was corrected from coach_applications to admin_coach_applications.
- Admin profile read/update policies were added so admin flows and profile-based realtime visibility work under RLS.
- Validation method used an authenticated admin listener and a separate writer client to simulate real portal visibility plus backend mutations.

## Limits

- This verifies API + database + realtime fanout with measurable latency.
- Browser click-level validation was not executed in this run; run a Playwright/Cypress suite for full UI interaction coverage if needed.
