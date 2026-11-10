# Disney Campaign Manager — Exploratory Findings Register

Source: `docs/DISNEY-AUDIT-FINDINGS.md`, user-provided authenticated exploratory audit dated November 10, 2026.

**Important:** These are reported observations, not independently reproduced by this repository's local mock. Severity is retained exactly as assigned in the source audit. Findings requiring additional evidence are marked accordingly.

| ID | Severity | Finding | Reproduction / evidence | Automation status |
|---|---|---|---|---|
| DCM-001 | High | Targeting categories disabled despite Help guidance | Campaign builder > Targeting; four categories disabled with industry restriction message | Not automated; account eligibility remains unconfirmed |
| DCM-002 | High | Transient error after MFA verification | `/org-switcher`; reload recovered; observed once | Manual / telemetry follow-up; do not assert as deterministic |
| DCM-003 | Medium | Search fields use accessible name "Search Brands" on Campaigns and Users | Accessible name conflicts with visible placeholders | Regression assertion included |
| DCM-004 | Medium | Help Center and Contact Us blank for 10–15 seconds without loading indicator | Browser observation across Help routes | Not automated; timing threshold not yet established |
| DCM-005 | Medium | Account pages show long spinner; Payment Methods shows empty-state text while spinner remains | Profile, Payment Methods, Billing | Regression assertion included |
| DCM-006 | Medium | Green unread dot despite accessible name and panel saying no notifications | Header bell and notifications panel | Regression assertion included; visual dot locator remains unverified |
| DCM-007 | Medium | On-demand report drawer still displays scheduling controls | Reports > Create Report, Delivery = Prepare for download | Regression assertion included |
| DCM-008 | Medium | Creative Studio first-visit modal has no visible dismiss control | Creative Studio Beta welcome modal | Manual follow-up; Terms were not accepted |
| DCM-009 | Low | Empty lists show search, page-size and pagination controls | Payment Methods, Billing, Reports empty states | Regression assertion included |
| DCM-010 | Low | Two Profile edit buttons have identical accessible names | Profile page | Regression assertion included |
| DCM-011 | Low | Contact Us message textarea has no meaningful accessible label | Contact Us form; form not submitted | Regression assertion included |
| DCM-012 | Low | Footer year mismatch; help images use generic alt text | Help/Contact Us footer vs tool footer; 10 image alt attributes | Manual content/accessibility review |
| DCM-013 | Low | Campaigns empty state briefly renders table controls before settling to empty-state card | First dashboard load | Regression assertion included |
| DCM-014 | Low | Account switcher search has placeholder but no accessible label | Org/account switcher | Regression assertion included |
| DCM-015 | Low | Two near-duplicate invoice help links | Contact Us resources | Candidate content/link test |

## Automation coverage and outstanding evidence

1. DCM-003, DCM-006, DCM-010, DCM-014 — UI regression assertions are present in the Playwright suite. DCM-011 remains manual.
2. DCM-005, DCM-007, DCM-009, DCM-013 — loading, conditional controls, and empty-state assertions are present.
3. DCM-004 — timing was observed during the audit; no automated threshold is defined.
4. DCM-001 — account eligibility was not established, so this remains an observed restriction rather than a confirmed product defect.
5. DCM-002 — one transient MFA/login error was observed; repeatability was not established.
6. DCM-008, DCM-012, DCM-015 — retained as manual/content findings.

## Rules for reporting

- Do not call a finding a confirmed production bug solely because a test template exists.
- Record browser, timestamp, account context, route, screenshot/trace, and repeat count.
- Avoid creating campaigns, submitting forms, changing payment methods, accepting terms, or spending money during read-only regression runs.
- Do not store credentials, cookies, or authenticated storage state in Git.
