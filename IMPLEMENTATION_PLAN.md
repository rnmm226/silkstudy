# IMPLEMENTATION_PLAN.md - Study Abroad Platform

**Role:** Agent-ready implementation plan  
**Status:** Proposed - MVP v0.1  
**Primary sources:** `ARCHITECTURE.md`, `DATABASE.md`, `SEARCH.md`, `MATCHING.md`, `API.md`, `ROADMAP.md`  
**Purpose:** Convert the roadmap into bounded coding tasks that can be assigned one at a time to Claude, Codex, Gemini, or another AI coding agent.

---

## 0. Critical Pre-Implementation Check

Before writing product code, verify the documentation set.

Current expected documents:

```text
ARCHITECTURE.md
DATABASE.md
SEARCH.md
MATCHING.md
API.md
ROADMAP.md
IMPLEMENTATION_PLAN.md
```

Implementation must not start until:

- `DATABASE.md` contains the database schema specification.
- `MATCHING.md` exists as its own file or the matching specification location is explicitly approved.
- Any duplicated or misplaced document content is fixed.

If a coding agent discovers that `DATABASE.md` contains matching content, or that `MATCHING.md` is missing, it must stop and report:

```text
BLOCKED: documentation source-of-truth mismatch
```

Do not invent a Prisma schema from memory when the database source document is missing or corrupted.

---

## 1. Implementation Principles

The MVP must be built as a modular monolith.

Use:

```text
Next.js
TypeScript
PostgreSQL
Prisma
Zod
Managed Auth
S3-compatible object storage
Postgres-backed background jobs
```

Do not introduce for MVP:

```text
microservices
Kubernetes
Redis
Kafka
RabbitMQ
dedicated vector database
RAG assistant
autonomous agents
ML ranking
LLM-based eligibility decisions
```

Every task must preserve:

- deterministic eligibility
- explainable matching
- source/provenance for important catalog facts
- explicit budget period and scope
- strict separation between MVP and LATER
- server-side authorization

---

## 2. Source-of-Truth Order

When documents conflict:

```text
Product-approved decisions
  > ARCHITECTURE.md
  > DATABASE.md
  > MATCHING.md
  > SEARCH.md
  > API.md
  > ROADMAP.md
  > IMPLEMENTATION_PLAN.md
```

If the answer is not specified, mark it:

```text
OPEN DECISION
```

Do not silently choose a business rule that affects eligibility, funding, ranking, privacy, or API contracts.

---

## 3. Standard Repository Shape

Agents should adapt to the actual repository, but the expected shape is:

```text
apps/web
src/modules/auth
src/modules/students
src/modules/catalog
src/modules/search
src/modules/eligibility
src/modules/matching
src/modules/applications
src/modules/documents
src/modules/notifications
src/modules/advisors
src/modules/admin
src/infrastructure/database
src/infrastructure/storage
src/infrastructure/email
src/infrastructure/jobs
src/shared
prisma
tests
docs
```

If the existing repository uses a different but coherent structure, preserve it.

---

## 4. Agent Operating Rules

Every agent task must include:

- objective
- files/modules allowed
- files/modules forbidden
- dependency list
- API endpoints affected
- DB tables/models affected
- acceptance criteria
- tests required
- output summary

Agents must:

- inspect existing code before editing
- make the smallest coherent change
- keep domain logic out of UI components
- validate request inputs at API boundaries
- run relevant tests
- report files changed
- report tests run
- report unresolved decisions

Agents must never:

- rewrite unrelated modules
- change architecture without explicit approval
- mutate historical eligibility rule versions
- treat unknown funding as not covered
- treat unknown data as positive match
- add AI/RAG/ML features during MVP tasks
- expose private documents through public URLs
- trust `student_id`, `user_id`, or `role` from the client

---

## 5. Sprint Map

```text
Sprint 0  - Project setup and baseline
Sprint 1  - Database and Prisma
Sprint 2  - Auth and roles
Sprint 3  - Student profile
Sprint 4  - Catalog and admin foundation
Sprint 5  - Search
Sprint 6  - Eligibility
Sprint 7  - Matching and ranking
Sprint 8  - Opportunity pages, save, compare
Sprint 9  - Applications and cycles
Sprint 10 - Documents
Sprint 11 - Deadlines and notifications
Sprint 12 - Human help
Sprint 13 - Security and testing
Sprint 14 - MVP polish and deployment
```

The first usable product milestone is:

```text
Database + seed catalog + student profile + search + eligibility + basic matching
```

Do not start with a decorative homepage.

---

## 6. Sprint 0 - Project Setup And Baseline

### Task 0.1 - Repository Baseline

**Objective:** Document the current technical state before implementation.

**Files/modules concerned:**

```text
docs/BASELINE.md
package.json
lockfile
framework config files
existing src/app or app files
existing prisma files
existing test files
```

**Dependencies:** none.

**API concerned:** none.

**DB concerned:** inspect only.

**Acceptance criteria:**

- `docs/BASELINE.md` records framework, package manager, database setup, auth setup, test setup, scripts, environment variables, and existing routes.
- Existing working code is not overwritten.
- Documentation mismatch around `DATABASE.md` / `MATCHING.md` is explicitly reported if present.

**Tests necessary:** none, but existing test command should be identified.

**Agent may modify:**

```text
docs/BASELINE.md
```

**Agent must not modify:**

```text
source code
Prisma schema
API routes
package dependencies
```

### Task 0.2 - Tooling And Environment

**Objective:** Make local development repeatable.

**Files/modules concerned:**

```text
package.json
tsconfig.json
eslint config
prettier config
.env.example
README.md or docs/DEVELOPMENT.md
CI config
```

**Dependencies:** Task 0.1.

**API concerned:** none.

**DB concerned:** environment variables only.

**Acceptance criteria:**

- install command documented
- dev command documented
- lint command works
- typecheck command works
- test command exists
- build command works or known blocker is documented
- `.env.example` contains required variable names without secrets

**Tests necessary:**

```text
lint
typecheck
test smoke command
build
```

**Agent may modify:** project tooling files and developer docs.

**Agent must not modify:** product domain behavior, database schema, auth model.

---

## 7. Sprint 1 - Database And Prisma

### Task 1.1 - Prisma Foundation

**Objective:** Configure PostgreSQL and Prisma using the approved database specification.

**Files/modules concerned:**

```text
prisma/schema.prisma
prisma/migrations
src/infrastructure/database
.env.example
```

**Dependencies:** Sprint 0, valid `DATABASE.md`.

**API concerned:** none.

**DB concerned:**

```text
users
students
student_profiles
academic_records
student_languages
student_preferences
student_budgets
universities
programs
scholarships
opportunities
application_cycles
deadlines
sources
eligibility_rule_versions
match_results
saved_opportunities
applications
documents
notifications
help_requests
audit_logs
```

Exact names must follow `DATABASE.md`.

**Acceptance criteria:**

- Prisma schema matches `DATABASE.md`.
- Initial migration runs from an empty database.
- Referential integrity is enforced.
- Important uniqueness constraints exist.
- Important indexes from `DATABASE.md` exist.
- Historical rule versions are immutable by model design or service policy.

**Tests necessary:**

```text
migration test
schema validation smoke test
relationship test
unique constraint test
foreign key test
```

**Agent may modify:**

```text
prisma/**
src/infrastructure/database/**
.env.example
database test files
```

**Agent must not modify:**

```text
matching formulas
search behavior
UI flows
auth provider choice
```

### Task 1.2 - Seed And Regression Dataset

**Objective:** Create controlled seed data for search, eligibility, and matching regression tests.

**Files/modules concerned:**

```text
prisma/seed.*
tests/fixtures
src/infrastructure/database/seed
```

**Dependencies:** Task 1.1.

**API concerned:** none.

**DB concerned:** catalog, student profile, eligibility, cycles, deadlines, scholarship coverage.

**Acceptance criteria:**

Seed data includes:

```text
full tuition + living
full tuition only
partial tuition
living stipend only
unknown coverage
multiple application cycles
different deadlines per cycle
language restriction
GPA restriction
nationality restriction
budget mismatch
eligible student
ineligible student
```

**Tests necessary:**

```text
seed runs repeatedly in test environment
known opportunity count assertions
known student fixture assertions
```

**Agent may modify:** seed files and fixtures.

**Agent must not modify:** production data, migrations except when schema gaps are approved.

---

## 8. Sprint 2 - Auth And Roles

### Task 2.1 - Managed Auth Integration

**Objective:** Connect managed authentication and platform user records.

**Files/modules concerned:**

```text
src/modules/auth
src/app/api/auth or route handlers
middleware
src/shared/auth
```

**Dependencies:** Sprint 1.

**API concerned:**

```text
authenticated request context
GET /api/v1/me/profile later dependency
```

**DB concerned:**

```text
users
roles
students
advisors
admins
```

**Acceptance criteria:**

- Authenticated identity resolves to a platform user.
- User role is loaded server-side.
- Unauthenticated users cannot access private endpoints.
- Client-provided role is ignored.

**Tests necessary:**

```text
auth context unit tests
unauthenticated API test
role resolution test
```

**Agent may modify:** auth module, middleware, auth tests.

**Agent must not modify:** catalog, matching, Prisma models unless auth schema mismatch is approved.

### Task 2.2 - Authorization Guards

**Objective:** Create reusable server-side authorization helpers.

**Files/modules concerned:**

```text
src/modules/auth/authorization
src/shared/errors
tests/auth
```

**Dependencies:** Task 2.1.

**API concerned:** all private `/api/v1/me/*` and `/api/v1/admin/*` endpoints.

**DB concerned:** users, roles, ownership references.

**Acceptance criteria:**

- Student ownership checks are reusable.
- Advisor delegation checks are stubbed or implemented per approved model.
- Admin checks are reusable.
- Authorization failures return consistent API errors.

**Tests necessary:**

```text
student cannot access another student's resource
non-admin cannot access admin route
advisor access requires assignment/delegation
```

**Agent may modify:** auth helpers and tests.

**Agent must not modify:** UI visibility only as a substitute for server checks.

---

## 9. Sprint 3 - Student Profile

### Task 3.1 - Profile API

**Objective:** Implement the minimum profile required for search and matching.

**Files/modules concerned:**

```text
src/modules/students
src/app/api/v1/me/profile
src/app/api/v1/me/academic-record
src/app/api/v1/me/languages
src/app/api/v1/me/budget
src/app/api/v1/me/funding-preferences
```

**Dependencies:** Sprint 2.

**API concerned:**

```text
GET/PATCH /api/v1/me/profile
GET/POST/PATCH/DELETE /api/v1/me/academic-record
GET/POST/PATCH/DELETE /api/v1/me/languages
GET/PUT /api/v1/me/budget
GET/PUT /api/v1/me/funding-preferences
```

**DB concerned:**

```text
student_profiles
academic_records
student_languages
student_preferences
student_budgets
funding_preferences
```

**Acceptance criteria:**

- Student can create and update own profile.
- Budget requires `amount`, `currency`, `period`, and `scope`.
- Language levels use deterministic controlled values.
- Missing GPA/language data stays unknown, not false.
- Other students cannot read or edit the profile.

**Tests necessary:**

```text
API validation tests
ownership tests
budget period/scope validation tests
language enum tests
partial update tests
```

**Agent may modify:** student module, profile API, validation schemas, profile tests.

**Agent must not modify:** matching formulas, catalog schema, admin flows.

### Task 3.2 - Profile UI

**Objective:** Build ergonomic student profile screens.

**Files/modules concerned:**

```text
src/app/profile
src/modules/students/components
src/modules/students/forms
```

**Dependencies:** Task 3.1.

**API concerned:** profile APIs from Task 3.1.

**DB concerned:** no direct DB access from UI.

**Acceptance criteria:**

- Student can enter academic, language, budget, country, field, and funding preferences.
- Budget UI makes period and scope explicit.
- Profile can be saved progressively.
- Validation errors are understandable.

**Tests necessary:**

```text
component tests where available
E2E profile creation test
accessibility smoke test
```

**Agent may modify:** profile UI and client-side validation.

**Agent must not modify:** server authorization, database schema, unrelated layout systems.

---

## 10. Sprint 4 - Catalog And Admin Foundation

### Task 4.1 - Catalog Services

**Objective:** Implement domain services for universities, programs, scholarships, opportunities, cycles, deadlines, sources, and verification.

**Files/modules concerned:**

```text
src/modules/catalog
src/modules/admin/catalog
src/shared/provenance
```

**Dependencies:** Sprint 1, Sprint 2.

**API concerned:**

```text
GET /api/v1/opportunities
GET /api/v1/opportunities/:id
GET /api/v1/opportunities/:id/cycles
GET /api/v1/opportunities/:id/deadlines
admin catalog endpoints later
```

**DB concerned:**

```text
universities
programs
scholarships
opportunities
application_cycles
deadlines
sources
provenance/fact sources
verification statuses
```

**Acceptance criteria:**

- Opportunity is the shared discovery abstraction.
- Cycles and deadlines are separate entities.
- Important facts can reference sources.
- Verification status supports `VERIFIED`, `NEEDS_REVIEW`, `OUTDATED`, and `UNKNOWN` or approved equivalents.
- Deadline is not duplicated as a loose opportunity field.

**Tests necessary:**

```text
catalog service tests
provenance required tests
cycle/deadline relationship tests
verification status tests
```

**Agent may modify:** catalog services, admin catalog services, catalog tests.

**Agent must not modify:** search ranking, matching scoring, document storage.

### Task 4.2 - Admin Catalog CRUD

**Objective:** Allow admins to maintain trustworthy catalog data.

**Files/modules concerned:**

```text
src/app/admin/catalog
src/app/api/v1/admin/opportunities
src/app/api/v1/admin/sources
src/modules/admin
```

**Dependencies:** Task 4.1, authorization guards.

**API concerned:**

```text
GET/POST/PATCH /api/v1/admin/opportunities
GET/POST/PATCH /api/v1/admin/sources
POST /api/v1/admin/opportunities/:id/verify
```

**DB concerned:** catalog tables, sources, verification records, audit logs.

**Acceptance criteria:**

- Admin can create and update catalog records.
- Non-admin cannot access admin endpoints.
- Verified facts require source/provenance.
- Admin changes create audit events.

**Tests necessary:**

```text
admin authorization tests
CRUD API tests
provenance validation tests
audit log tests
```

**Agent may modify:** admin catalog endpoints/UI, audit integration.

**Agent must not modify:** public ranking logic, student private data, matching formulas.

---

## 11. Sprint 5 - Search

### Task 5.1 - Search Service

**Objective:** Implement structured and keyword opportunity search without AI.

**Files/modules concerned:**

```text
src/modules/search
src/modules/catalog/repositories
prisma indexes or migrations if approved
```

**Dependencies:** Sprint 4.

**API concerned:**

```text
GET /api/v1/search
GET /api/v1/opportunities
```

**DB concerned:**

```text
opportunities
universities
programs
scholarships
application_cycles
deadlines
sources
search indexes
```

**Acceptance criteria:**

- Supports country, degree, field, language, study mode, tuition, funding, coverage, deadline, and verification filters.
- Supports PostgreSQL full-text keyword search.
- Does not silently relax explicit filters.
- Strict full tuition + living filter does not match full tuition only.
- Unknown coverage is clearly handled as unknown.

**Tests necessary:**

```text
filter tests
keyword search tests
funding coverage tests
unknown coverage tests
pagination tests
sorting tests
no-results tests
```

**Agent may modify:** search module, search indexes, search tests.

**Agent must not modify:** matching eligibility decisions, RAG, ML, vector search.

### Task 5.2 - Search API And UI

**Objective:** Expose search to students through API and result screens.

**Files/modules concerned:**

```text
src/app/api/v1/search
src/app/search
src/modules/search/components
```

**Dependencies:** Task 5.1.

**API concerned:**

```text
GET /api/v1/search
```

**DB concerned:** indirect through SearchService only.

**Acceptance criteria:**

- User can search and filter opportunities.
- Results show source/verification status.
- Empty results show explicit constraints and possible relaxations.
- Pagination works.

**Tests necessary:**

```text
API contract tests
E2E search test
no-results E2E test
```

**Agent may modify:** search API, search UI, search tests.

**Agent must not modify:** catalog admin, database schema unless index addition is approved.

---

## 12. Sprint 6 - Eligibility

### Task 6.1 - Eligibility Rule Engine

**Objective:** Implement deterministic rule evaluation.

**Files/modules concerned:**

```text
src/modules/eligibility
src/modules/matching/eligibility-context
tests/eligibility
```

**Dependencies:** Sprint 1, Sprint 3, Sprint 4, valid `MATCHING.md`.

**API concerned:**

```text
POST /api/v1/matches/evaluate or internal service only
GET /api/v1/me/matches later
```

**DB concerned:**

```text
eligibility_rule_versions
students/profile tables
opportunities
application_cycles
```

**Acceptance criteria:**

- Supports approved rule fields and operators.
- Supports nested `all` / `any`.
- Produces `PASS`, `FAIL`, `UNKNOWN`, `NOT_APPLICABLE`.
- Missing data follows approved semantics.
- Same student + same opportunity + same rule version gives same result.
- Reasons are structured.

**Tests necessary:**

```text
operator unit tests
all/any tests
missing data tests
language ordering tests
rule version reproducibility tests
explanation tests
```

**Agent may modify:** eligibility module and tests.

**Agent must not modify:** fit weights, search results, UI claims, database schema unless rule contract requires approved change.

### Task 6.2 - Eligibility API Integration

**Objective:** Make eligibility available to the application layer.

**Files/modules concerned:**

```text
src/app/api/v1/matches/evaluate
src/modules/matching
src/modules/eligibility
```

**Dependencies:** Task 6.1, auth guards.

**API concerned:**

```text
POST /api/v1/matches/evaluate
```

**DB concerned:** eligibility rule versions, students, opportunities.

**Acceptance criteria:**

- Authenticated student can evaluate own eligibility.
- Client cannot evaluate arbitrary `student_id`.
- Response includes status, reasons, and rule version.
- Failures use consistent error contract.

**Tests necessary:**

```text
API authorization tests
API validation tests
eligibility response contract tests
```

**Agent may modify:** eligibility API and service wiring.

**Agent must not modify:** scoring/ranking logic.

---

## 13. Sprint 7 - Matching And Ranking

### Task 7.1 - Fit Scoring

**Objective:** Implement explainable fit scoring for eligible opportunities.

**Files/modules concerned:**

```text
src/modules/matching
src/modules/matching/scoring
src/modules/matching/explanations
```

**Dependencies:** Sprint 6.

**API concerned:**

```text
GET /api/v1/me/matches
GET /api/v1/me/matches/:id
POST /api/v1/me/matches/recompute
```

**DB concerned:**

```text
match_results
scoring_configurations
students
opportunities
scholarship coverage
deadlines
```

**Acceptance criteria:**

- Scores are calculated from explicit components.
- Budget and funding are separate dimensions.
- Unknown dimensions do not automatically score as positive.
- Score includes confidence.
- Explanation lists major positive, negative, and unknown factors.
- Scoring configuration is versioned.

**Tests necessary:**

```text
component scoring tests
budget normalization tests
funding coverage tests
unknown dimension tests
confidence tests
explanation tests
```

**Agent may modify:** matching scoring module and tests.

**Agent must not modify:** eligibility pass/fail semantics, search filters, UI wording beyond match explanations.

### Task 7.2 - Ranking And Match Persistence

**Objective:** Rank and persist reproducible match results.

**Files/modules concerned:**

```text
src/modules/matching/ranking
src/modules/matching/repositories
src/app/api/v1/me/matches
```

**Dependencies:** Task 7.1.

**API concerned:**

```text
GET /api/v1/me/matches
GET /api/v1/me/matches/:id
POST /api/v1/me/matches/recompute
```

**DB concerned:**

```text
match_results
match_events
scoring_configurations
eligibility_rule_versions
```

**Acceptance criteria:**

- Ranking order is deterministic.
- Match results reference rule and scoring versions.
- Recompute is idempotent or safely repeatable.
- Match detail returns explanations and unknown factors.

**Tests necessary:**

```text
ranking order tests
tie-breaker tests
persistence tests
recompute tests
API response tests
```

**Agent may modify:** matching API, ranking module, persistence tests.

**Agent must not modify:** admin catalog CRUD or profile schema without approval.

---

## 14. Sprint 8 - Opportunity Pages, Save, Compare

### Task 8.1 - Opportunity Detail

**Objective:** Build trustworthy opportunity detail pages.

**Files/modules concerned:**

```text
src/app/opportunities
src/modules/catalog/components
src/app/api/v1/opportunities
```

**Dependencies:** Sprint 5, Sprint 6.

**API concerned:**

```text
GET /api/v1/opportunities/:id
GET /api/v1/opportunities/:id/cycles
GET /api/v1/opportunities/:id/deadlines
```

**DB concerned:** opportunities, programs, universities, scholarships, cycles, deadlines, sources.

**Acceptance criteria:**

- Detail page shows overview, eligibility, costs, funding, coverage, cycles, deadlines, documents, sources, and verification date.
- Unknown facts are labeled unknown.
- Source/provenance is visible for important claims.

**Tests necessary:**

```text
API detail tests
render tests
source/provenance display test
unknown coverage display test
```

**Agent may modify:** opportunity detail API/UI.

**Agent must not modify:** matching formulas or admin workflows.

### Task 8.2 - Save And Compare

**Objective:** Let students save and compare opportunities.

**Files/modules concerned:**

```text
src/modules/saved-opportunities
src/modules/comparisons
src/app/api/v1/me/saved-opportunities
src/app/api/v1/me/comparisons
```

**Dependencies:** Sprint 5, auth guards.

**API concerned:**

```text
GET/POST/DELETE /api/v1/me/saved-opportunities
GET/POST/GET/DELETE /api/v1/me/comparisons
```

**DB concerned:**

```text
saved_opportunities
comparisons
comparison_items
opportunities
```

**Acceptance criteria:**

- Student can save and remove opportunities.
- Student can compare a bounded number of opportunities.
- Comparison shows funding, costs, deadlines, eligibility, and sources.
- Student cannot access another student's saved list or comparison.

**Tests necessary:**

```text
ownership tests
duplicate save test
comparison limit test
comparison API tests
E2E save/compare test
```

**Agent may modify:** save/compare modules, APIs, UI, tests.

**Agent must not modify:** matching engine or catalog verification rules.

---

## 15. Sprint 9 - Applications And Cycles

### Task 9.1 - Application Tracking

**Objective:** Connect discovery to a specific application cycle.

**Files/modules concerned:**

```text
src/modules/applications
src/app/api/v1/me/applications
src/app/applications
```

**Dependencies:** Sprint 8.

**API concerned:**

```text
GET/POST /api/v1/me/applications
GET/PATCH /api/v1/me/applications/:id
```

**DB concerned:**

```text
applications
application_cycles
application_status_history
deadlines
opportunities
```

**Acceptance criteria:**

- Student can create an application for an opportunity and cycle.
- Same student can apply to same opportunity in different cycles if policy allows.
- Application shows cycle-specific deadlines.
- Status transitions follow approved state machine or are marked OPEN DECISION.
- Student cannot access another student's application.

**Tests necessary:**

```text
create application tests
cycle association tests
status transition tests
ownership tests
deadline association tests
```

**Agent may modify:** application module, API, UI, tests.

**Agent must not modify:** deadline source-of-truth model or document storage.

---

## 16. Sprint 10 - Documents

### Task 10.1 - Secure Document Metadata And Upload

**Objective:** Implement private document handling.

**Files/modules concerned:**

```text
src/modules/documents
src/infrastructure/storage
src/app/api/v1/me/documents
src/app/api/v1/me/documents/upload-url
```

**Dependencies:** Sprint 9, auth guards.

**API concerned:**

```text
GET /api/v1/me/documents
POST /api/v1/me/documents/upload-url
GET /api/v1/me/documents/:id
POST /api/v1/me/documents/:id/access-url
DELETE /api/v1/me/documents/:id
GET/POST/DELETE /api/v1/me/applications/:id/documents
```

**DB concerned:**

```text
documents
application_documents
document_scan_results
audit_logs
```

**Acceptance criteria:**

- Raw files are stored in private object storage, not Postgres.
- Upload uses short-lived signed URLs.
- Download/access uses short-lived signed URLs after authorization.
- MIME/type and size are validated.
- Document access is audited.
- Documents do not appear in logs.
- Another student cannot access a document by changing an ID.

**Tests necessary:**

```text
signed URL authorization tests
ownership/IDOR tests
MIME validation tests
size validation tests
audit log tests
application-document association tests
```

**Agent may modify:** document module, storage adapter, document API, tests.

**Agent must not modify:** public catalog, matching engine, direct file serving through app routes.

---

## 17. Sprint 11 - Deadlines And Notifications

### Task 11.1 - Deadline Dashboard

**Objective:** Show actionable upcoming deadlines.

**Files/modules concerned:**

```text
src/modules/deadlines
src/app/api/v1/me/deadlines
src/app/deadlines
```

**Dependencies:** Sprint 9.

**API concerned:**

```text
GET /api/v1/me/deadlines
GET /api/v1/opportunities/:id/deadlines
```

**DB concerned:**

```text
deadlines
application_cycles
applications
saved_opportunities
```

**Acceptance criteria:**

- Deadline list is derived from `deadlines`.
- Deadlines are cycle-specific.
- Saved and active application deadlines are visible.
- No duplicate `application_deadline` field is introduced on opportunities.

**Tests necessary:**

```text
deadline query tests
cycle-specific deadline tests
saved/application deadline tests
```

**Agent may modify:** deadline module, API, UI, tests.

**Agent must not modify:** catalog schema to duplicate deadline fields.

### Task 11.2 - Notifications

**Objective:** Send basic deadline reminders.

**Files/modules concerned:**

```text
src/modules/notifications
src/infrastructure/email
src/infrastructure/jobs
src/app/api/v1/me/notification-preferences
```

**Dependencies:** Task 11.1.

**API concerned:**

```text
GET /api/v1/me/notifications
PATCH /api/v1/me/notifications/:id
GET/PUT /api/v1/me/notification-preferences
```

**DB concerned:**

```text
notifications
notification_preferences
notification_history
jobs
deadlines
```

**Acceptance criteria:**

- Student can set notification preferences.
- Reminder job can select upcoming deadlines.
- Emails are idempotent or safely retryable.
- Notification send failures are recorded.

**Tests necessary:**

```text
preference API tests
job selection tests
retry/idempotency tests
notification history tests
```

**Agent may modify:** notification module, email adapter, jobs, tests.

**Agent must not modify:** add Kafka/RabbitMQ/Redis without approval.

---

## 18. Sprint 12 - Human Help

### Task 12.1 - Help Requests

**Objective:** Let students request human advisor help.

**Files/modules concerned:**

```text
src/modules/advisors
src/modules/help-requests
src/app/api/v1/me/help-requests
src/app/help
src/app/advisor
```

**Dependencies:** Sprint 9, auth guards.

**API concerned:**

```text
GET/POST /api/v1/me/help-requests
GET /api/v1/me/help-requests/:id
POST /api/v1/me/help-requests/:id/messages
advisor/admin assignment endpoints if approved
```

**DB concerned:**

```text
help_requests
help_request_messages
advisor_assignments
applications
opportunities
audit_logs
```

**Acceptance criteria:**

- Student can open a help request.
- Help request can reference an opportunity or application.
- Advisor access requires assignment/delegation.
- Messages are only visible to authorized participants.

**Tests necessary:**

```text
help request API tests
message authorization tests
advisor assignment tests
student ownership tests
```

**Agent may modify:** help/advisor module, API, UI, tests.

**Agent must not modify:** build a full agency CRM or broad advisor analytics.

---

## 19. Sprint 13 - Security And Testing

### Task 13.1 - Security Hardening

**Objective:** Close high-risk MVP security gaps.

**Files/modules concerned:**

```text
src/modules/auth
src/modules/documents
src/shared/validation
src/shared/errors
middleware
security tests
```

**Dependencies:** Sprints 2-12.

**API concerned:** all private and admin endpoints.

**DB concerned:** audit logs, users, documents, applications, admin changes.

**Acceptance criteria:**

- IDOR tests pass.
- Admin endpoints reject non-admins.
- Student endpoints enforce ownership.
- Request validation exists for external inputs.
- Sensitive values are not logged.
- Signed URLs expire.
- Rate limits are configured for high-risk routes or documented as OPEN DECISION.

**Tests necessary:**

```text
authorization regression tests
IDOR tests
validation tests
document access tests
admin boundary tests
```

**Agent may modify:** security middleware, guards, validation, tests.

**Agent must not modify:** product behavior except to enforce security.

### Task 13.2 - E2E MVP Journey

**Objective:** Verify the full student path.

**Files/modules concerned:**

```text
tests/e2e
test fixtures
seed data
```

**Dependencies:** Sprints 3-12.

**API concerned:** all MVP student APIs.

**DB concerned:** all MVP core tables.

**Acceptance criteria:**

The following flow passes:

```text
register/sign in
create profile
set budget
set funding preferences
search
filter
open opportunity
check eligibility
view explanation
save
compare
select cycle
create application
upload document metadata/upload URL
see deadline
notification preference
request human help
```

**Tests necessary:** E2E happy path and at least one negative authorization path.

**Agent may modify:** E2E tests and fixtures.

**Agent must not modify:** production behavior just to make tests pass unless the behavior is a bug.

---

## 20. Sprint 14 - MVP Polish And Deployment

### Task 14.1 - Deployment Pipeline

**Objective:** Make staging and production deployment repeatable.

**Files/modules concerned:**

```text
Dockerfile
deployment config
CI config
docs/DEPLOYMENT.md
```

**Dependencies:** Sprint 13.

**API concerned:** all.

**DB concerned:** migrations and backups.

**Acceptance criteria:**

- CI runs lint, typecheck, tests, and build.
- Migrations are applied safely.
- Staging deploy is documented.
- Production promotion is documented.
- Required environment variables are documented.
- Backup/restore verification is documented.

**Tests necessary:**

```text
CI workflow run
production build
migration dry run or staging migration
```

**Agent may modify:** deployment files, CI, deployment docs.

**Agent must not modify:** application domain behavior.

### Task 14.2 - MVP Readiness Review

**Objective:** Confirm the MVP is usable, secure, and coherent.

**Files/modules concerned:**

```text
docs/MVP_READINESS.md
```

**Dependencies:** all previous sprints.

**API concerned:** all MVP APIs.

**DB concerned:** all MVP DB areas.

**Acceptance criteria:**

Readiness checklist includes:

```text
catalog quality
search quality
eligibility correctness
matching explainability
source/provenance coverage
deadline correctness
document security
authorization coverage
E2E journey
deployment status
known OPEN DECISIONS
known LATER items
```

**Tests necessary:** test report summary from CI and manual QA notes.

**Agent may modify:** readiness doc only unless explicit bugs are assigned separately.

**Agent must not modify:** code during readiness review without a separate task.

---

## 21. Parallel Work Rules

After Sprint 1 is stable, some tracks can proceed in parallel:

```text
Auth
Student profile
Catalog/admin foundation
UI foundation
```

Search can start after catalog service and seed data are stable.

Eligibility can start after student profile, catalog, and rule versions are stable.

Matching can start only after eligibility is tested.

Applications, documents, and notifications can overlap after cycles/deadlines exist.

Security work runs throughout, but final security hardening happens after the main flows exist.

---

## 22. Dependency Graph

```text
Documentation integrity
        |
        v
Project setup
        |
        v
Database + seed data
        |
        +-------------------+
        |                   |
        v                   v
Auth + roles          Catalog/admin
        |                   |
        v                   v
Student profile        Search
        |                   |
        +---------+---------+
                  |
                  v
             Eligibility
                  |
                  v
              Matching
                  |
                  v
       Opportunity detail/save/compare
                  |
                  v
             Applications
                  |
          +-------+-------+
          |               |
          v               v
      Documents     Deadlines/notifications
          |               |
          +-------+-------+
                  |
                  v
              Human help
                  |
                  v
          Security + E2E testing
                  |
                  v
              Deployment
```

---

## 23. Standard Agent Task Prompt

Use this template for every coding task:

```text
TASK:
[one specific implementation task]

READ FIRST:
- ARCHITECTURE.md
- DATABASE.md
- SEARCH.md / MATCHING.md / API.md as relevant
- ROADMAP.md
- IMPLEMENTATION_PLAN.md

CURRENT STATE:
[what exists now]

OBJECTIVE:
[expected result]

DEPENDENCIES:
[completed prerequisites]

ALLOWED CHANGES:
[exact files/modules]

FORBIDDEN CHANGES:
[exact files/modules and architectural rules]

API AFFECTED:
[endpoints]

DB AFFECTED:
[tables/models]

ACCEPTANCE CRITERIA:
[checklist]

TESTS REQUIRED:
[commands or test cases]

OUTPUT REQUIRED:
1. Summary
2. Files changed
3. Tests run
4. Remaining issues / OPEN DECISIONS
```

---

## 24. Anti-Drift Rules

If an agent wants to do any of the following, it must stop and ask for approval:

```text
add a new infrastructure service
change auth provider
change schema beyond assigned task
change eligibility semantics
change fit weights
change ranking tie-breakers
change source/provenance requirements
replace REST-ish API style
add RAG/LLM/agent behavior
add semantic/vector search
store documents in the database
make public document URLs
remove tests to make CI pass
```

---

## 25. MVP vs Later

### MVP

```text
trusted catalog
student profile
structured search
keyword search
deterministic eligibility
explainable matching
opportunity detail
save and compare
application tracking
secure documents
deadline notifications
human help
admin catalog maintenance
security tests
E2E happy path
deployment
```

### Later

```text
RAG assistant
semantic search
pgvector
ML learning-to-rank
admission probability prediction
autonomous agents
native mobile app
partner API
advanced agency CRM
advanced analytics
```

---

## 26. MVP Definition Of Done

The MVP is ready only when:

```text
[ ] Documentation source-of-truth is clean
[ ] Student can create profile
[ ] Budget period and scope are explicit
[ ] Catalog has verified seed opportunities
[ ] Search supports key filters
[ ] Fully funded filters distinguish tuition and living coverage
[ ] Eligibility is deterministic and tested
[ ] Matching is explainable and reproducible
[ ] Sources are visible
[ ] Multiple application cycles work
[ ] Deadlines are cycle-specific
[ ] Save and compare work
[ ] Applications can be tracked
[ ] Documents are private and authorized
[ ] Notifications work
[ ] Human-help request works
[ ] Admin can maintain catalog
[ ] Audit logging covers sensitive actions
[ ] Security tests pass
[ ] Matching regression tests pass
[ ] E2E happy path passes
[ ] Deployment path is documented and tested
```

---

## 27. Final Implementation Rule

Build the platform in this order:

```text
Reliable data
  -> useful search
  -> correct eligibility
  -> explainable matching
  -> actionable application tracking
  -> trust and security
  -> real users
  -> real data
  -> then AI/RAG/ML/agents
```

The goal is not to make the most impressive technical system.

The goal is to make the smallest trustworthy product that proves students can find, understand, compare, and apply to real study-abroad opportunities.
