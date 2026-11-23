# KPI trend indicators: audit checklist

Comparison: today (5 Oct 2026, the dashboard reference date) vs one month earlier (5 Sep 2026).
The earlier value is not stored anywhere, so it is rebuilt from dated records (`src/utils/candidateTrends.ts`)
and passed through the same KPI logic the card uses today. No percentage is hardcoded.

Reading the badge: green = good for the business, red = bad.
- `+400%` exact change.
- `+5 new` nothing existed a month ago, so a percentage is undefined; the real change is shown.
- `≥+233%` the earlier value is only known as a range; this is the smallest change that is true across it.

## Showing a trend (each verified in the rendered UI)

| Page | Card | Shown | Basis |
|---|---|---|---|
| Dashboard | Total Candidates | +400% | registrationDate |
| Dashboard | Joined | +5 new | dateOfJoining |
| Dashboard | KYC Verified | +450% | last update of the candidate's KYC records |
| Dashboard | Pending Offers | ≥+233% (red) | registration, letter issue and acceptance dates; undated drop-outs give a 2-3 range |
| Dashboard | Operational Blockers | ≥+125% (red) | capped by candidates still in onboarding then |
| Dashboard | Upcoming Joining | +600% | joining-date window evaluated as of the earlier date |
| Candidate Directory | Total Candidates, Joined & Active | +400%, +5 new | as above |
| Candidate Directory | Yet to Join | ≥+150% | capped by candidates not yet joined then |
| Candidate Directory | KYC Action Required | ≥+100% (red) | capped by all candidates then |
| KYC & Bank | Total Candidates, 100% Verified | +400%, +450% | follows the client filter |
| Offer Letters | Signed | +400% | letterAcceptanceDate |
| Offer Letters | Not Sent | +5 new (red) | generated and not yet sent by then |
| Offer Letters | Sent, Sent But Not Signed | +2 new, +4 new (red) | both are inside "sent and not yet signed", which was 0 a month ago |

| KYC & Bank | Manual Review | ≥+400% (red) | per-record `lastUpdated`: records unchanged since 5 Sep have a known state then; only 2 records changed after it, so the earlier count was 0 to 2 |
| KYC & Bank | Failed Checks, Bank / ₹1 Pending | ≥+100% (red) each | same bound (0 to 2) |

## Excluded, with the missing data

| Page | Cards | Reason |
|---|---|---|
| Bulk Import | Categories, Import Workflows | configuration counts, not events |
| Bulk Import | Recent Batches (148), Engine Accuracy (98.4%) | typed-in constants, not derived from the import logs; the logs hold text times such as "Today, 04:30 PM" |
| Bulk Import | validation tiles (Total Scanned, Valid, Errors, Warnings) | per-upload results, no history |
| Attendance | all KPI rows | one muster day (25 Aug) and four overtime records only; the displayed figures are typed into the UI |
| Holiday Masters | all cards | data covers 2026 only, so there is no previous period |
| User Settings, Candidate 360 | no metric cards / current-state tiles | n/a |
| Dashboard drawers, Super Admin Overview | KPI tiles | static values and strings (the "+4.2% MoM" text is typed in, not computed) |
| Dashboard | pipeline stages, client and recruiter tables, pending-action counts | table and list rows, not KPI cards; status buckets without history |

## Assumptions to confirm

- A KYC record's `lastUpdated` is treated as the moment it reached its current status.
- Offer Dropped / Deferred candidates have no drop date, so affected cards use bounds.
