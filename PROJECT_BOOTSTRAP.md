# PROJECT_BOOTSTRAP.md — Study Abroad Platform

**Status:** APPROVED — Implementation Entry Point  
**Purpose:** Start the real application from the frozen product architecture without architectural drift.

---

# 1. Mission

Create the initial working Study Abroad Platform repository from the approved documentation.

The objective is **not** to build the whole product in one pass.

The objective of this phase is to establish a clean, reproducible foundation and implement the first vertical slice:

```text
Project
  ↓
Database
  ↓
Seed catalog
  ↓
Student profile
  ↓
Search
  ↓
Eligibility
  ↓
Basic matching
```

The project must remain a modular monolith.

---

# 2. Mandatory Context

Before changing anything, read:

```text
ARCHITECTURE.md
DATABASE.md
SEARCH.md
MATCHING.md
API.md
ROADMAP.md
IMPLEMENTATION_PLAN.md
DOCUMENTATION_FREEZE.md
```

`DATABASE.md` is the authoritative database contract.

`DOCUMENTATION_FREEZE.md` is the architectural guardrail.

Do not create a new architecture.

---

# 3. First Action — Repository Inspection

Before installing, deleting, replacing or generating files, inspect the repository.

Determine:

```text
- framework
- package manager
- Node.js version
- existing Next.js configuration
- existing TypeScript configuration
- existing Prisma configuration
- existing database configuration
- existing authentication
- existing UI/component system
- existing API routes
- existing environment variables
- existing tests
- existing Docker configuration
- existing CI/CD
- existing deployment configuration
```

If something already works, preserve it.

Do not rewrite an existing implementation merely to match personal preferences.

Create:

```text
docs/BASELINE.md
```

with:

```text
CURRENT STACK
CURRENT STRUCTURE
EXISTING FEATURES
EXISTING DATABASE
EXISTING API
EXISTING AUTH
EXISTING TESTS
EXISTING DEPLOYMENT
KNOWN PROBLEMS
RECOMMENDED NEXT STEP
```

---

# 4. Target Stack

Unless the repository already contains a compatible working choice:

```text
Next.js
TypeScript
PostgreSQL
Prisma
Zod
Tailwind CSS
Docker
GitHub Actions
```

Authentication:

```text
managed authentication
```

Do not implement password authentication manually.

Object storage:

```text
S3-compatible private object storage
```

Do not introduce a second database.

Do not introduce microservices.

---

# 5. Forbidden Changes

The bootstrap phase MUST NOT introduce:

```text
microservices
Kubernetes
Kafka
RabbitMQ
Redis
dedicated vector database
ML infrastructure
ML tables
RAG infrastructure
RAG tables
agent infrastructure
agent tables
autonomous agents
```

Do not add AI simply because this is an AI-related product.

---

# 6. Repository Structure

Prefer a structure similar to:

```text
/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
│       └── v1/
│
├── components/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── validation/
│   └── services/
│
├── modules/
│   ├── students/
│   ├── catalog/
│   ├── search/
│   ├── eligibility/
│   └── matching/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── tests/
│
├── docs/
│   └── BASELINE.md
│
├── public/
│
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

This is a guideline, not permission to restructure an existing project unnecessarily.

---

# 7. Phase 0 — Development Foundation

Implement only what is required to make the project reproducible.

Required:

```text
TypeScript
lint
formatting
environment validation
test runner
production build
development commands
.env.example
```

Recommended environment categories:

```text
DATABASE_URL
AUTH_*
STORAGE_*
EMAIL_*
APP_URL
```

Never commit secrets.

---

# 8. Phase 1 — Database Foundation

Implement `DATABASE.md` exactly.

Core groups:

### Users

```text
users
students
```

### Academic/Profile

```text
academic_records
student_preferences
student_budgets
```

### Catalog

```text
universities
opportunities
program_details
scholarship_details
application_cycles
deadlines
sources
fact_sources
```

### Eligibility / Matching

```text
eligibility_rules
eligibility_rule_versions
eligibility_evaluations
fit_scores
match_results
match_explanations
```

### Application

```text
applications
documents
```

### Operations

```text
notifications
help_requests
audit_log
```

Do not add undocumented domain tables.

---

# 9. Critical Database Rules

The following are non-negotiable.

## Opportunity

```text
opportunities
```

is the shared entity.

## Deadlines

There is no:

```text
opportunities.application_deadline
```

Canonical relationship:

```text
Opportunity
    ↓
Application Cycle
    ↓
Deadline
```

## Applications

Unique identity:

```text
student
+
opportunity
+
application_cycle
```

A student may apply to the same opportunity in different cycles.

## Scholarship coverage

Support:

```text
tuition
living
accommodation
transport
insurance
visa
application fees
monthly stipend
one-time funding
```

Coverage:

```text
FULL
PARTIAL
NONE
UNKNOWN
```

The database must support the exact query:

```text
FULL tuition
AND
FULL living
```

## Budget

Every student budget contains:

```text
amount
currency
period
scope
```

No ambiguous budget values.

## Provenance

Primary entity:

```text
sources
```

Multiple sources per fact:

```text
fact_sources
```

## Eligibility

Rule versions are immutable.

Same:

```text
student
+
rule version
```

must produce reproducible evaluation results.

---

# 10. Seed Dataset

Create a controlled development dataset.

It must contain at least:

```text
1 university
2+ programs
3+ scholarships
```

And the scholarships must include:

```text
FULL tuition + FULL living
FULL tuition only
PARTIAL tuition
living stipend only
UNKNOWN coverage
```

Also include:

```text
multiple application cycles
different deadlines
GPA restriction
language restriction
nationality restriction
eligible student
ineligible student
unknown/missing student data
budget mismatch
```

Every important catalog fact in the seed must have provenance.

Use clearly fictional/demo data unless a real source is explicitly provided.

Do not invent real scholarship deadlines or requirements and present them as factual.

---

# 11. Student Profile Vertical Slice

Implement the minimum profile required for matching:

```text
basic identity
academic record
target degree
field
preferred countries
preferred languages
budget
funding preferences
```

Budget must support:

```text
amount
currency
period
scope
```

Funding preferences must support at least:

```text
requires_full_tuition_coverage
requires_full_living_coverage
```

Do not add complex preference systems unless required by `MATCHING.md`.

---

# 12. Search Vertical Slice

Implement the MVP search order:

```text
structured filters
        ↓
PostgreSQL full-text search
        ↓
fuzzy matching only where justified
```

Initial filters:

```text
country
degree
field
language
opportunity type
budget
tuition coverage
living coverage
deadline
```

Critical behavior:

If the user requires:

```text
FULL tuition
+
FULL living
```

do not return an opportunity that only has:

```text
FULL tuition
```

Do not silently relax explicit constraints.

---

# 13. Eligibility Vertical Slice

Implement deterministic eligibility.

Allowed:

```text
rule fields
operators
AND
OR
UNKNOWN
```

Forbidden:

```text
LLM eligibility decision
ML eligibility decision
semantic similarity as eligibility
```

Eligibility must reference an immutable:

```text
eligibility_rule_version
```

Store reproducible evaluation results.

---

# 14. Matching Vertical Slice

Pipeline:

```text
Eligibility
    ↓
Fit
    ↓
Ranking
    ↓
Explanation
```

MVP fit must be deterministic.

Possible factors:

```text
field match
country preference
language
budget
funding
deadline
```

Every match must expose understandable reasons.

Example:

```text
Strong field match
Country preference match
Full tuition coverage
Living coverage unknown
Budget compatible
```

Do not introduce ML ranking.

---

# 15. API Foundation

Use:

```text
/api/v1
```

Keep domain logic outside UI components.

Initial endpoints:

```text
GET /api/v1/opportunities
GET /api/v1/opportunities/:id
GET /api/v1/search
GET /api/v1/me/profile
PATCH /api/v1/me/profile
GET /api/v1/me/matches
POST /api/v1/matches/evaluate
```

Exact contracts must follow `API.md`.

Validate external input with Zod or the already-approved equivalent.

---

# 16. Testing Requirements

Before moving to the next phase, tests must cover:

### Database

```text
migration
relationships
foreign keys
uniqueness
application cycles
deadline ownership
provenance
immutable eligibility versions
```

### Search

```text
full tuition + living
full tuition only
unknown coverage
budget filters
pagination
explicit constraints
```

### Eligibility

```text
EQ
NEQ
IN
NOT_IN
GT
GTE
LT
LTE
BETWEEN
CONTAINS
CONTAINS_ANY
CONTAINS_ALL
EXISTS
NOT_EXISTS
AND
OR
missing values
version reproducibility
```

### Matching

```text
eligibility gate
fit score
ranking
tie-breaking
explanations
UNKNOWN handling
```

---

# 17. Definition of Done — First Vertical Slice

The first implementation phase is complete only when:

```text
[ ] Repository baseline documented
[ ] App starts locally
[ ] Typecheck passes
[ ] Lint passes
[ ] Tests pass
[ ] Production build passes
[ ] PostgreSQL works locally
[ ] Prisma migration works from empty DB
[ ] Seed works
[ ] Student profile can be created
[ ] Budget/funding preferences can be stored
[ ] Catalog opportunities can be queried
[ ] Search works
[ ] Full tuition + living filtering works correctly
[ ] Eligibility evaluation works
[ ] Match score is deterministic
[ ] Match explanation is visible
```

Do not continue to RAG, ML or agents when these are incomplete.

---

# 18. Agent Operating Rules

Every coding agent must:

1. Read the frozen documentation.
2. Inspect the current repository.
3. Make the smallest necessary change.
4. Avoid unrelated refactoring.
5. Run relevant tests.
6. Report exactly what changed.
7. Report tests executed.
8. Report unresolved issues.

Every task must use:

```text
TASK:
CURRENT STATE:
GOAL:
ALLOWED CHANGES:
FORBIDDEN CHANGES:
ACCEPTANCE CRITERIA:
TESTS:
OUTPUT:
```

If an undocumented architectural decision is required:

```text
STOP
→ report OPEN DECISION
→ do not invent a solution
```

---

# 19. First Agent Task

The first coding-agent task should be:

```text
TASK:
Audit the existing repository and establish the implementation baseline.

CONTEXT:
Read:
- ARCHITECTURE.md
- DATABASE.md
- SEARCH.md
- MATCHING.md
- API.md
- ROADMAP.md
- IMPLEMENTATION_PLAN.md
- DOCUMENTATION_FREEZE.md

CURRENT STATE:
Repository state is unknown.

GOAL:
Determine what already exists without overwriting working code.

ALLOWED CHANGES:
- inspect repository
- create docs/BASELINE.md
- make only minimal configuration fixes required to run the existing project

FORBIDDEN CHANGES:
- no database redesign
- no feature implementation
- no microservices
- no Redis
- no vector database
- no ML
- no RAG
- no agents
- no large refactor

ACCEPTANCE CRITERIA:
- existing framework identified
- package manager identified
- database setup identified
- auth identified
- API identified
- tests identified
- deployment identified
- known problems documented
- recommended next implementation task documented

TESTS:
Run only existing project checks necessary to establish the baseline.

OUTPUT:
1. Summary
2. Repository structure
3. Existing technologies
4. Existing features
5. Files changed
6. Tests/checks run
7. Problems found
8. Recommended next task
```

**Do not ask the agent to implement the database yet.**

First establish the baseline.

---

# 20. Second Agent Task — After Baseline

Only after `docs/BASELINE.md` exists:

```text
TASK:
Implement the approved PostgreSQL + Prisma database foundation.

Read:
- ARCHITECTURE.md
- DATABASE.md
- DOCUMENTATION_FREEZE.md
- docs/BASELINE.md
- IMPLEMENTATION_PLAN.md

Goal:
Implement DATABASE.md exactly.

Do not redesign the schema.

Do not add ML/RAG/agent/vector tables.

Acceptance:
- Prisma schema matches DATABASE.md
- migration works from empty PostgreSQL
- seed works
- constraints and relationships are tested
- immutable eligibility rule versions are protected
- opportunity → cycle → deadline is correct
- applications support multiple cycles
- scholarship coverage supports full tuition + full living
- budget has amount/currency/period/scope
- provenance supports multiple sources

Output:
1. Summary
2. Files changed
3. Migration status
4. Seed status
5. Tests run
6. Remaining issues
```

---

# 21. Product Philosophy

The platform's competitive advantage is not:

```text
"we added AI"
```

It is:

```text
Trustworthy data
+
Clear requirements
+
Explainable matching
+
Real scholarship coverage
+
Deadline tracking
+
Human assistance
```

AI/ML can later improve the product.

It must not make the core system less trustworthy.

---

# 22. Final Rule

Do not optimize for the largest architecture.

Optimize for:

```text
A trustworthy student finding a real opportunity
and successfully completing an application.
```
