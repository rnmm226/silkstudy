# TESTING.md - Study Abroad Platform

**Role:** MVP testing strategy and quality gate specification  
**Status:** Proposed - MVP v0.1  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `SEARCH.md`, `MATCHING.md`, `API.md`, `ROADMAP.md`, `IMPLEMENTATION_PLAN.md`, `SECURITY.md`  
**Scope:** Unit tests, integration tests, database tests, API tests, search tests, eligibility tests, matching tests, security tests, E2E tests, seed/regression dataset, CI quality gates, AI-agent testing rules  
**Non-scope:** Full QA organization design, external penetration-test execution, formal compliance certification, load testing for large-scale traffic beyond MVP assumptions

---

## 1. Goal

Testing must prove that the MVP is not just functional, but trustworthy.

The platform helps students make decisions about study-abroad opportunities, funding, deadlines, documents, and applications. A superficial test suite that only checks whether pages render is not enough.

The MVP test strategy must prove:

- student data stays private
- catalog facts remain source-aware
- search respects explicit filters
- eligibility is deterministic
- matching is explainable and reproducible
- funding coverage is not misrepresented
- deadlines belong to the correct application cycle
- documents are private and auditable
- advisors and admins cannot overreach
- the complete student journey works end to end

---

## 2. Critical Pre-Implementation Check

Before writing database, integration, search, eligibility, or matching tests, verify that `DATABASE.md` contains the approved database schema.

If `DATABASE.md` contains matching content, or the approved schema is missing, agents must stop and report:

```text
BLOCKED: database-backed tests require valid DATABASE.md
```

Agents may still write high-level testing strategy documentation, but must not invent database models, Prisma schemas, migrations, or DB fixtures from memory.

---

## 3. Testing Principles

1. Test the domain rules, not only the UI.
2. Prefer deterministic tests over snapshot-heavy tests.
3. Test unknown data explicitly.
4. Test negative authorization paths for every private resource.
5. Test the regression dataset before changing search, eligibility, or matching.
6. Keep tests close to the module they protect.
7. Every production bug should become a regression test where practical.
8. Do not remove or weaken tests to make CI pass.
9. Do not mock away the core behavior being tested.
10. Keep MVP tests focused on the MVP; do not build RAG/ML/agent test suites before those features exist.

---

## 4. Test Pyramid

Recommended MVP layers:

```text
Static checks
  -> Unit tests
  -> Domain/service tests
  -> Database/integration tests
  -> API contract tests
  -> Security tests
  -> End-to-end tests
  -> Manual QA checklist
```

### Static Checks

Purpose:

```text
catch type, lint, formatting, and dependency problems early
```

Required:

```text
typecheck
lint
format check where configured
dependency audit where practical
```

### Unit Tests

Purpose:

```text
validate small deterministic functions
```

Best targets:

```text
budget normalization
language-level ordering
eligibility operators
fit score components
date/deadline helpers
validation schemas
authorization predicates
```

### Domain/Service Tests

Purpose:

```text
validate business behavior without browser complexity
```

Best targets:

```text
SearchService
EligibilityService
MatchingService
CatalogService
ApplicationService
DocumentService
NotificationService
```

### Integration Tests

Purpose:

```text
validate real database relationships, constraints, migrations, and repositories
```

Use a test database or isolated schema.

### API Tests

Purpose:

```text
validate request validation, auth, authorization, response shape, errors, and status codes
```

### E2E Tests

Purpose:

```text
validate complete user journeys
```

Keep E2E tests few but high-value.

---

## 5. Recommended Tools

Exact tooling can follow the project baseline, but the default recommendation is:

```text
TypeScript typecheck
ESLint
Prettier or equivalent formatter
Vitest or Jest for unit/domain tests
Testing Library for component tests
Playwright for E2E tests
Prisma test database for integration tests
GitHub Actions for CI
```

Do not add a new test framework if the repository already has a coherent one.

Do not add heavy infrastructure solely for testing unless it protects a real MVP risk.

---

## 6. Test Data Strategy

The MVP needs controlled test data.

Create a seed/regression dataset with:

```text
Full tuition + living coverage
Full tuition only
Partial tuition
Living stipend only
Unknown tuition coverage
Unknown living coverage
Expired scholarship
Open application cycle
Closed application cycle
Multiple cycles for one opportunity
Different deadlines per cycle
English language requirement
French language requirement
GPA restriction
Nationality restriction
Budget mismatch
Eligible student
Ineligible student
Student with missing language data
Student with missing GPA
Student requiring full tuition + living
Student with tuition-only budget
```

This dataset protects the product from the most dangerous regressions:

```text
wrong eligibility
wrong funding interpretation
wrong deadline
wrong source/provenance display
wrong personalized recommendation
```

Seed data must be:

- deterministic
- safe to run repeatedly in test environments
- free of real personal data
- documented enough that expected outcomes are clear

---

## 7. Test Environment Rules

Use separate environments:

```text
local
test
staging
production
```

Testing rules:

- Never run destructive tests against production.
- Never copy production student documents into local/dev.
- Do not use production secrets in test.
- Test object storage must use a separate bucket or local-safe adapter.
- Test email must use a fake provider, sandbox, or capture mechanism.
- Test auth must use safe test identities.
- Test data should be resettable.

---

## 8. Database Tests

Database tests validate the schema and migration behavior.

Blocked until valid `DATABASE.md` exists.

Required database tests:

```text
migration runs from empty database
Prisma client can connect
required foreign keys work
required unique constraints work
important indexes exist
opportunity-cycle-deadline relationships work
student-owned resources reference the correct student
document metadata does not store file bytes
eligibility rule versions are immutable by policy
audit events can be appended
```

Important relationship tests:

```text
one opportunity can have multiple application cycles
one cycle can have multiple deadlines
same student can apply to same opportunity in different cycles if approved
document belongs to one student
application document association respects student ownership
match result references student, opportunity, rule version, and scoring version
```

Do not skip DB tests because Prisma types compile. Types do not prove relational behavior.

---

## 9. API Contract Tests

API tests must cover:

```text
authentication
authorization
validation
status code
response envelope
error envelope
pagination
sorting
idempotency where required
```

Required endpoint groups:

```text
/api/v1/me/profile
/api/v1/me/academic-record
/api/v1/me/languages
/api/v1/me/budget
/api/v1/me/funding-preferences
/api/v1/search
/api/v1/opportunities
/api/v1/me/matches
/api/v1/me/saved-opportunities
/api/v1/me/comparisons
/api/v1/me/applications
/api/v1/me/documents
/api/v1/me/deadlines
/api/v1/me/notifications
/api/v1/me/help-requests
/api/v1/admin/*
```

Every private `/me` endpoint must include:

```text
unauthenticated rejected
wrong student rejected
valid owner accepted
invalid input rejected
safe error shape returned
```

Every admin endpoint must include:

```text
unauthenticated rejected
student rejected
advisor rejected unless explicitly allowed
admin accepted
audit event created where required
```

---

## 10. Student Profile Tests

Required tests:

```text
student can create profile
student can update profile partially
student cannot read another student's profile
student cannot update another student's profile
budget requires amount
budget requires currency
budget requires period
budget requires scope
invalid currency rejected
invalid language level rejected
missing GPA remains unknown
profile completeness updates predictably
```

Important regression:

```text
€5,000/year tuition-only must not be treated as €5,000 total living+tuition.
```

---

## 11. Catalog And Provenance Tests

Required tests:

```text
admin can create opportunity
admin can attach source
important fact without provenance is rejected or marked unverified
verification status changes are audited
public user can read verified catalog data
public user cannot mutate catalog data
deadline belongs to cycle
opportunity does not duplicate deadline as generic field
unknown coverage remains unknown
```

Critical provenance cases:

```text
tuition has source
scholarship amount has source
deadline has source
eligibility requirement has source
required document list has source or explicit unknown status
```

---

## 12. Search Tests

Search tests must prove that search respects explicit constraints.

Required tests:

```text
country filter
degree filter
field filter
language filter
study mode filter
tuition budget filter
funding filter
tuition coverage filter
living coverage filter
deadline filter
verification status filter
keyword search
pagination
sorting
no-results response
query relaxation is suggested but not silently applied
```

Critical funding tests:

```text
full tuition + full living matches only full tuition + full living
full tuition only does not match full tuition + full living
living unknown does not match strict full living filter
unknown is not displayed as none
partial coverage is not displayed as full
```

Critical search principle:

```text
Search result means "matches search criteria", not "student is eligible".
```

Tests must verify that search does not claim personalized eligibility unless matching/eligibility data is explicitly included.

---

## 13. Eligibility Tests

Eligibility tests are high-priority domain tests.

Required operator tests:

```text
eq
neq
gt
gte
lt
lte
in
not_in
contains
not_contains
exists
not_exists
```

Required logic tests:

```text
all passes when all conditions pass
all fails when one condition fails
all returns unknown when no failure but one unknown
any passes when one condition passes
any fails when all conditions fail
any returns unknown when no pass but one unknown
nested all/any works
```

Required domain tests:

```text
GPA requirement pass
GPA requirement fail
missing GPA unknown
language level ordering works
missing language unknown
nationality restriction pass
nationality restriction fail
degree level requirement
field requirement
age requirement where implemented
```

Reproducibility test:

```text
same student + same opportunity + same rule version = same result and reasons
```

Forbidden behavior tests:

```text
LLM is not called for eligibility
missing data is not treated as false unless contract says so
unknown is not treated as pass
published rule version is not mutated
```

---

## 14. Matching Tests

Matching tests must prove explainable, reproducible ranking.

Required tests:

```text
eligible opportunities enter fit scoring
ineligible opportunities do not enter normal recommendations
unknown eligibility enters needs-verification category if implemented
budget fit handles amount/currency/period/scope
funding fit is separate from budget fit
field fit calculated predictably
language fit calculated predictably
country fit calculated predictably
deadline fit calculated predictably
unknown dimensions are excluded from denominator or handled per MATCHING.md
confidence reflects missing/weak data
explanations include positive factors
explanations include negative factors
explanations include unknown factors
```

Ranking tests:

```text
higher fit score ranks first
higher confidence breaks equal score where specified
deadline relevance breaks ties where specified
stable opportunity ID breaks final ties
same inputs produce same ranking
```

Regression dataset tests:

```text
known eligible student receives expected strong matches
known ineligible student fails for expected reason
student requiring full living coverage does not receive living-unknown opportunity as full match
budget mismatch lowers fit or filters according to hard/soft rule
```

Forbidden behavior tests:

```text
LLM is not called for matching score
unknown funding is not treated as covered
score is not returned without explanation
historical match can reference scoring config version
```

---

## 15. Application Tests

Required tests:

```text
student can create application for opportunity cycle
student cannot create application for another student
application references selected cycle
application shows cycle-specific deadlines
status update validates allowed statuses
invalid status transition rejected if state machine is approved
same opportunity different cycles behavior follows approved policy
application notes are private
```

Open decision before strict transition tests:

```text
Exact application status state machine
```

---

## 16. Document Tests

Document tests are security-critical.

Required tests:

```text
student can request upload URL for own document
unauthenticated upload URL request rejected
student cannot request upload URL for another student
document metadata created without file bytes
signed upload URL expires
signed access URL requires authorization
student cannot access another student's document metadata
student cannot access another student's signed URL
advisor access requires assignment/delegation
admin access requires role and reason where approved
document access creates audit event
MIME allowlist enforced
file size limit enforced
document in rejected/scanning state cannot be used
deleted document cannot be accessed
```

Logging tests:

```text
signed URL not logged
object storage key not logged
document contents not logged
```

---

## 17. Deadline And Notification Tests

Deadline tests:

```text
cycle-specific deadlines are returned
saved opportunity deadlines are returned
active application deadlines are returned
closed/expired deadlines are handled correctly
deadline sorting works
timezone/date boundary behavior is tested
```

Notification tests:

```text
student can update notification preferences
reminder job selects correct upcoming deadlines
notification job respects preferences
duplicate reminder is not sent on retry
failed send is recorded
email content does not expose sensitive document details
```

Open decision before final tests:

```text
Exact reminder schedule
Exact notification channels
```

---

## 18. Human Help Tests

Required tests:

```text
student can create help request
help request can reference opportunity
help request can reference application
student can view own help request
student cannot view another student's help request
advisor can view assigned help request
advisor cannot view unassigned help request
message visible only to participants
advisor assignment is audited
```

Do not test full agency CRM behavior in MVP.

---

## 19. Security Tests

Security tests must follow `SECURITY.md`.

Required groups:

```text
auth tests
authorization tests
IDOR tests
admin boundary tests
advisor delegation tests
document access tests
input validation tests
safe logging tests
rate-limit tests where implemented
CSRF tests if cookie sessions are used
```

Minimum negative authorization matrix:

```text
student A -> student B profile = forbidden
student A -> student B application = forbidden
student A -> student B document = forbidden
student A -> student B saved opportunities = forbidden
student A -> student B comparison = forbidden
advisor unassigned -> student profile = forbidden
student -> admin endpoint = forbidden
advisor -> admin endpoint = forbidden
unauthenticated -> private endpoint = unauthorized
```

---

## 20. E2E Tests

The MVP needs a small number of complete E2E tests.

### E2E 1 - Core Student Journey

```text
sign in
create profile
add academic record
add language
set budget with period and scope
set funding preferences
search for AI master's opportunities
apply full tuition + living filter
open opportunity
view sources
view eligibility result
view match explanation
save opportunity
compare opportunities
select application cycle
create application
see cycle-specific deadline
request document upload URL
set notification preference
create help request
```

### E2E 2 - No Results And Relaxation

```text
search with strict filters
receive zero exact matches
see explicit applied constraints
see relaxation options
confirm no silent relaxation occurred
```

### E2E 3 - Negative Authorization

```text
student A creates profile/application/document
student B attempts direct URL/API access
access is rejected
audit/log behavior remains safe
```

E2E tests should focus on product confidence, not every visual detail.

---

## 21. Manual QA Checklist

Before launch, manually verify:

```text
[ ] Student can complete first journey without developer help
[ ] Budget UI cannot create ambiguous budget
[ ] Search filters are understandable
[ ] Full tuition and living coverage are visually distinct
[ ] Unknown data is shown as unknown
[ ] Opportunity detail shows source and verified date
[ ] Eligibility explanation is understandable
[ ] Match explanation is understandable
[ ] Application cycle selection is clear
[ ] Deadlines look correct
[ ] Document upload flow feels safe
[ ] Advisor help request is easy to find
[ ] Admin catalog workflow does not encourage unverified facts
[ ] Error messages are useful but not leaky
[ ] Mobile responsive layout is usable
```

Manual QA does not replace automated tests.

---

## 22. CI Quality Gates

Every pull request should run:

```text
install
lint
typecheck
unit tests
domain/service tests
API tests where feasible
database tests where test DB is available
security regression tests
build
```

Before merge to main:

```text
all required checks pass
no skipped critical tests without explanation
no failing test hidden by config
no snapshot update without review
no schema change without migration test
```

Before staging deploy:

```text
seed/regression dataset runs
E2E core journey passes
migrations apply cleanly
```

Before production launch:

```text
security tests pass
E2E tests pass
backup restore tested
manual QA checklist completed
known risks documented
```

---

## 23. Test Naming And Organization

Recommended structure:

```text
tests/unit
tests/integration
tests/api
tests/e2e
tests/security
tests/fixtures
```

or colocated tests:

```text
src/modules/search/SearchService.test.ts
src/modules/eligibility/EligibilityService.test.ts
src/modules/matching/MatchingService.test.ts
```

Either is acceptable if consistent.

Test names should describe behavior:

```text
returns UNKNOWN when student language level is missing
rejects access to another student's document
does not match full-tuition-only scholarship for full-living filter
```

Avoid vague names:

```text
works
handles data
test search
```

---

## 24. Mocking Rules

Mock external systems:

```text
auth provider
object storage
email provider
monitoring provider
LLM provider later
```

Do not mock the core behavior in the test that is supposed to protect it:

```text
do not mock eligibility evaluator in eligibility tests
do not mock SearchService in search service tests
do not mock MatchingService in matching tests
do not mock authorization checks in private API tests
```

Use fake adapters for:

```text
storage
email
jobs
clock/time
```

Use a controllable clock for deadline and notification tests.

---

## 25. Regression Policy

When a bug is found:

1. Reproduce it with a failing test.
2. Fix the bug.
3. Keep the test.
4. Add the case to seed/regression data if it affects search, eligibility, matching, funding, or deadlines.

High-priority regression categories:

```text
wrong eligibility result
wrong funding interpretation
wrong deadline/cycle
document authorization failure
advisor/admin overreach
source/provenance missing
ambiguous budget handling
```

---

## 26. Performance Smoke Tests

MVP does not need heavy load testing, but it needs basic performance checks.

Smoke targets:

```text
search returns within acceptable time on seed catalog
match recomputation works for MVP catalog size
opportunity detail loads without excessive queries
deadline dashboard loads for normal student
document signed URL generation is fast
```

Performance tests should catch obvious N+1 query issues.

Do not add Redis or complex caching because a synthetic test is slow. Measure first, then optimize.

---

## 27. Accessibility And UX Tests

Minimum frontend quality checks:

```text
forms are keyboard usable
inputs have labels
validation errors are visible
buttons have clear accessible names
focus states are visible
important status text is not color-only
mobile viewport does not hide critical actions
```

Priority screens:

```text
profile
search
opportunity detail
comparison
application tracking
document upload
help request
admin catalog edit
```

---

## 28. AI, RAG, ML, And Agent Testing - Later

These are not MVP test suites:

```text
RAG grounded-answer evaluation
embedding quality evaluation
semantic search evaluation
LLM prompt-injection testing
agent workflow testing
learning-to-rank offline evaluation
admission prediction fairness testing
```

They become required only when those features are approved for a later phase.

Until then, MVP tests should verify:

```text
LLM is not used for eligibility
LLM is not used for ranking
LLM is not used for authorization
student documents are not sent to LLMs
```

---

## 29. Agent Rules For Test Tasks

AI coding agents must:

- read relevant docs before writing tests
- inspect existing test framework first
- add focused tests for assigned behavior
- run the relevant test command
- report skipped or failing tests
- avoid broad rewrites of the test setup
- keep fixtures deterministic

AI coding agents must not:

```text
delete tests to pass CI
weaken assertions without approval
replace domain tests with snapshots
mock away authorization in security tests
invent database schema from missing DATABASE.md
add unrelated dependencies
write tests for future RAG/ML/agent features during MVP tasks
```

Required agent output:

```text
tests added/changed
behavior protected
fixtures added/changed
commands run
results
remaining gaps
OPEN DECISIONS
```

---

## 30. MVP Testing Definition Of Done

The MVP testing package is complete when:

```text
[ ] lint passes
[ ] typecheck passes
[ ] unit tests pass
[ ] database migration tests pass
[ ] API contract tests pass
[ ] search regression tests pass
[ ] eligibility tests pass
[ ] matching tests pass
[ ] application/cycle tests pass
[ ] document security tests pass
[ ] deadline/notification tests pass
[ ] human-help tests pass
[ ] security authorization matrix passes
[ ] E2E core journey passes
[ ] E2E no-results journey passes
[ ] E2E negative authorization journey passes
[ ] manual QA checklist completed
[ ] CI runs required checks
[ ] known test gaps documented
```

---

## 31. Open Decisions

These decisions affect final tests:

```text
Exact test framework
Exact auth provider test strategy
Exact database test setup
Exact application status state machine
Exact advisor delegation model
Exact reminder schedule
Exact document MIME allowlist
Exact maximum document size
Exact malware scanning mechanism
Exact rate limits
Exact source/provenance enforcement policy
Exact CI provider and required checks
```

---

## 32. Final Principle

The test suite should protect the product promise:

```text
trusted catalog
accurate search
deterministic eligibility
explainable matching
private documents
correct deadlines
secure applications
human help with boundaries
```

Do not measure MVP quality by the number of tests.

Measure it by whether a future agent can change one module without quietly breaking trust, privacy, eligibility, funding semantics, or the first complete student journey.
