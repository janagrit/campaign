# Campaign Integrity — SDET Portfolio Project

**TypeScript · Playwright · Node.js · Express · API testing · UI testing · CI**

I built this project to demonstrate risk-based quality engineering for advertising platforms: testing campaign lifecycle rules, impression processing, budget enforcement, billing integrity, reporting, and the user-facing Campaign Manager.

The repository contains two distinct testing targets:

1. **Disney Campaign Manager** — public-page checks and authenticated, read-only UI regression tests based on my exploratory audit.
2. **Campaign integrity API simulation** — a local Express service used to test advertising business rules independently of Disney's systems.

The local simulation is not connected to Disney. The Disney audit is based on direct browser observations. Observations are not described as confirmed product defects unless the evidence supports that conclusion.

## Project structure

```text
.
├── .github/workflows/ci.yml
├── docs/
│   ├── DISNEY-AUDIT-FINDINGS.md
│   ├── BUG-REPORTS.md
│   ├── ENGINEERING-NOTES.md
│   └── TEST-STRATEGY.md
├── reporters/
│   └── report-summary.ts
├── scripts/
│   └── save-auth-state.ts
├── src/
│   ├── contracts/
│   ├── api-client.ts
│   ├── domain.ts
│   ├── server.ts
│   ├── service.ts
│   └── store.ts
├── tests/
│   ├── api/
│   ├── auth/
│   ├── no-auth/
│   ├── fixtures/
│   └── auth.setup.ts
├── .env.example
├── package.json
├── playwright.config.ts
└── playwright.api.config.ts
```

## Disney Campaign Manager tests

The main Playwright configuration targets Disney:

- `no-auth` — public pages, no saved session.
- `auth-setup` — verifies that a local authenticated browser state exists.
- `auth-chromium` — authenticated Campaign Manager tests using `.auth/dcm-state.json`.

Authentication is performed manually. The helper opens a browser, lets me sign in and complete MFA, then saves the browser storage state locally. Passwords and MFA codes are not stored in the project.

```bash
cp .env.example .env
npm install
npx playwright install chromium

# Sign in manually and save the browser session
npm run auth:setup

# Public pages, without authentication
npm run test:no-auth

# Authenticated Disney UI regression tests
npm run test:auth
```

The authenticated test suite is read-only. It does not create campaigns or reports, upload creatives, accept terms, submit support forms, or change account settings.

## Campaign integrity API simulation

The local Express service is a separate test target. Its API suite covers:

| Area | Coverage |
|---|---|
| Campaign lifecycle | Pause, stop, cancellation, resume, invalid transitions |
| Impression processing | In-flight events and post-stop rejection |
| Billing integrity | Duplicate charge prevention, retry handling, budget cap |
| Concurrency | Parallel HTTP request processing against the local service |
| Reporting | Reconciliation of delivered events, spend, and ledger totals |
| Validation | Invalid values and unknown resources |

Run the local API tests independently:

```bash
npm run test:api
```

The API Playwright configuration starts the local service on `127.0.0.1:4173`. This local address is not the Disney website and is not used by the Disney UI tests.

## Reports

Every Playwright run produces:

- Playwright's test list in the terminal.
- A custom result table from `reporters/report-summary.ts`.
- An HTML report.

```bash
npm run report
npm run report:api
```

The summary reporter distinguishes passed, failed, expected known-bug failures (`test.fail()`), flaky, and skipped tests. Known-bug classification is used only when a test is explicitly marked with `test.fail()`.

## CI

GitHub Actions runs public UI checks and the local API suite. Authenticated Disney tests are run locally because they require a manually authenticated browser session. No Disney cookies or storage-state files are stored in GitHub Actions.

## RAG

RAG (retrieval-augmented generation) is not part of this test framework. The project tests a web application and an API simulation; it does not retrieve documents to generate AI answers. Adding RAG would introduce an unrelated component rather than improve the current test coverage.

## Scope and limitations

- The local service uses in-memory, single-process state; it does not provide database persistence.
- It does not implement a real ad auction, targeting engine, identity system, or external measurement integration.
- Concurrency tests exercise simultaneous requests against this local implementation; they do not establish distributed transaction guarantees.
- Disney UI locators are based on the recorded audit observations and require validation against the current DOM.
- The authenticated UI tests have not yet been executed against the live Disney application. The project does not claim they pass.
