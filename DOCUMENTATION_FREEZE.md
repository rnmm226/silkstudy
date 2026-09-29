# DOCUMENTATION_FREEZE.md — Study Abroad Platform

**Status:** APPROVED BASELINE — MVP v0.2

## 1. Authoritative documents
`ARCHITECTURE.md`, `DATABASE.md`, `SEARCH.md`, `MATCHING.md`, `API.md`, `ROADMAP.md`, `IMPLEMENTATION_PLAN.md`.

`DATABASE.md` is the authoritative MVP database contract.

## 2. Conflict resolution
1. Product-approved decisions.
2. `ARCHITECTURE.md` for system architecture.
3. `DATABASE.md` for MVP data model.
4. `SEARCH.md` for discovery.
5. `MATCHING.md` for eligibility/fit/ranking.
6. `API.md` for API contracts.
7. `ROADMAP.md` for delivery order.
8. `IMPLEMENTATION_PLAN.md` for implementation tasks.

If unresolved: mark **OPEN DECISION** and stop; never invent architecture.

## 3. Locked MVP decisions
- Modular monolith.
- Next.js + TypeScript + PostgreSQL + Prisma.
- S3-compatible private object storage.
- Managed authentication.
- Postgres-backed jobs.
- No microservices/Kubernetes/Kafka/RabbitMQ/dedicated vector DB.
- Search: structured filters → PostgreSQL FTS → justified fuzzy search.
- Eligibility → Fit → Ranking → Explanation.
- Eligibility is deterministic.
- ML, RAG and autonomous agents are LATER.

## 4. Locked data decisions
- `opportunities` is the shared entity.
- No `opportunities.application_deadline`.
- Deadline source of truth: `deadlines`.
- Deadline relationship: `Opportunity → Application Cycle → Deadline`.
- Applications are unique per `(student, opportunity, cycle)`.
- Scholarship coverage distinguishes tuition, living, accommodation, transport, insurance, visa, application fees, monthly stipend and one-time funding.
- Coverage uses `FULL|PARTIAL|NONE|UNKNOWN`.
- Budget always has amount, currency, period and scope.
- `sources` is the main provenance entity.
- `fact_sources` supports multiple sources per fact.
- `eligibility_rule_versions` are immutable.
- Eligibility conditions have an explicit schema contract.
- `UNKNOWN ≠ NO`.

## 5. MVP vs future
Build now: profile, catalog, search, eligibility, matching, discovery, applications, documents, deadlines, notifications, human help, admin, audit.

Later: semantic/vector search, RAG, ML ranking/prediction, agents, mobile, advanced partner automation, dedicated vector DB, microservices.

## 6. Agent rule
Every coding agent must read the frozen documents before changing code. Each task must specify TASK, CURRENT STATE, GOAL, ALLOWED CHANGES, FORBIDDEN CHANGES, ACCEPTANCE CRITERIA and TESTS.

If a task requires an undocumented architectural decision: **STOP → report OPEN DECISION → do not invent a solution.**

## 7. First implementation target
Database + seed catalog + student profile + search + eligibility + basic matching.

## 8. Core user journey
Student → Profile → Budget/funding preferences → Search → Filter → Opportunity → Eligibility → Explainable match → Save → Compare → Application cycle → Application → Documents → Deadline → Notification → Human help.
