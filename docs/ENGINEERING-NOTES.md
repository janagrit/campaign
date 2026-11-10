# Engineering Notes — Campaign Integrity Test Framework

**Audit type:** Static code and test-design review  
**Scope:** v3 project source, Playwright fixtures, API specs, project configuration and documentation  
**Execution status:** Not executed in this environment. `npm install --no-audit --no-fund` timed out before dependencies were installed, so no typecheck or Playwright pass is claimed.

## Executive assessment

The project is a useful portfolio prototype with a sensible business-risk theme and a clearer fixture structure than the initial version. It is not yet evidence of production-grade concurrency testing. The in-memory mock is intentionally simplified, and several claims must remain scoped to that model.

## Findings

### AUD-001 — Budget concurrency coverage does not exercise a real race condition

- **Severity:** High
- **Location:** `src/service.ts:118-153`; `tests/api/concurrency.spec.ts:1-13`
- **Observation:** `processImpression` performs the budget read, status update and ledger append synchronously in one Node.js event-loop turn. `Promise.all` sends overlapping HTTP requests, but the critical section itself contains no asynchronous yield and uses a single-process in-memory store. Requests therefore do not contend for a shared budget reservation in the way concurrent workers or distributed services would.
- **Impact:** The test proves the current mock stays within budget for a batch of requests. It does not prove atomic budget enforcement under genuine concurrent processing, multiple service instances, or database transactions.
- **Engineering decision:** Keep the test explicitly labelled as single-process request concurrency. For a stronger next iteration, add a persistence/transaction boundary or an asynchronous reservation service and test competing reservations against a shared store. Do not describe the current test as a distributed race-condition test.
- **Status:** Documented limitation; deeper distributed simulation remains open.

### AUD-002 — Millisecond timestamps were not a safe event-ordering boundary

- **Severity:** Medium
- **Location:** `src/service.ts:71-78, 106-112, 124-130`
- **Observation:** The original implementation compared `acceptedAt` and `stoppedAt` using `Date.now()` values. Two operations in the same millisecond could receive equal timestamps, making a newly accepted event appear to have occurred before stop confirmation.
- **Impact:** A post-stop event could be treated as an in-flight event and billed in a same-millisecond edge case.
- **Engineering decision:** Use a monotonic operation sequence for ordering decisions and retain wall-clock timestamps for audit display only.
- **Status:** Fixed in this revision with `acceptedSequence` and `stoppedSequence`; the stop-boundary test now asserts the ordering metadata.

### AUD-003 — Application API client depended on a test-layer type

- **Severity:** Medium
- **Location:** `src/api-client.ts` (previous import); `src/contracts/campaign.ts`
- **Observation:** The application-side API client imported `CampaignInput` from `tests/fixtures/types.ts`, creating a production-to-test dependency direction.
- **Impact:** Shared contracts were owned by the wrong layer and would become awkward to reuse outside tests.
- **Engineering decision:** Keep shared request/response contracts under `src/contracts` and let fixtures import them.
- **Status:** Fixed in this revision.

### AUD-004 — Fixture setup was more elaborate than the specs needed

- **Severity:** Low
- **Location:** `tests/fixtures/test.ts`; `tests/api/*.spec.ts`
- **Observation:** The fixture exposed a `testContext` object that only carried default data, while tests also destructured several unused fixture values. This made the fixture API look broader than its practical purpose.
- **Impact:** Adds noise and makes it harder to see which fixtures each test actually relies on.
- **Engineering decision:** Keep automatic reset as an internal fixture concern; expose only the API client and factories required by scenarios.
- **Status:** Partially simplified. The automatic reset fixture remains internal; some spec callback destructuring can still be trimmed as a cleanup task.

### AUD-005 — Validation data existed but was not consistently used

- **Severity:** Low
- **Location:** `tests/fixtures/data.ts`; `tests/api/validation.spec.ts`
- **Observation:** Named invalid data profiles were defined, but validation tests initially duplicated literals instead of consuming them.
- **Impact:** Data centralisation was incomplete and changes could drift between fixture data and specs.
- **Engineering decision:** Reuse named invalid profiles where they improve clarity; keep one-off boundary values inline when the value itself explains the test.
- **Status:** Partially fixed; core invalid budget and unit-cost cases now use shared data. Additional table-driven validation cleanup is optional.

## Remaining engineering gaps

1. Add an actual asynchronous queue/reservation layer before claiming race-condition coverage.
2. Add contract/schema validation for API responses, not only status and selected JSON fields.
3. Add a controllable clock at the service boundary and tests for delayed/replayed events.
4. Add tests for duplicate event IDs across separate campaigns and malformed path parameters.
5. Add linting/formatting and enforce it in CI.
6. Run `npm ci` (after generating and committing a lockfile), `npm run typecheck`, and the complete Playwright suite in a network-enabled environment.

## Verification record

| Check | Result |
|---|---|
| Static source review | Completed |
| Test scenario count | 29 |
| `npm install` | Timed out in this environment |
| TypeScript typecheck | Not run — dependencies unavailable |
| Playwright suite | Not run — dependencies unavailable |
| CI workflow review | Static review only |

## Project status

**Suitable for:** a clearly labelled independent QA prototype after local verification.  
**Not yet suitable for:** claiming production-grade distributed concurrency guarantees or presenting the suite as executed/passing until CI or local test results are available.
