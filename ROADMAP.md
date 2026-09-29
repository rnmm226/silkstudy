# ROADMAP.md — Study Abroad Platform

**Role:** Product & Engineering Delivery Roadmap  
**Status:** Proposed — MVP v0.1  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `SEARCH.md`, `MATCHING.md`, `API.md`  
**Goal:** Build a useful, trustworthy MVP before adding advanced AI/ML features.

---

# 1. Product Goal

The platform should help a student move through:

```text
Discover
   ↓
Understand
   ↓
Verify
   ↓
Compare
   ↓
Decide
   ↓
Prepare
   ↓
Apply
   ↓
Track
   ↓
Get human help
```

The MVP must prove that students can find relevant opportunities more easily than using scattered websites, spreadsheets, social media, and agencies alone.

The product is **not** an AI chatbot with a university database attached.

The core product is:

```text
Trusted catalog
+
Powerful search
+
Explainable matching
+
Application tracking
+
Deadline management
+
Human help
```

---

# 2. MVP Definition

The MVP is considered complete when a student can:

1. Create a profile.
2. Define study preferences.
3. Define an explicit budget.
4. Define funding requirements.
5. Search universities/programs/scholarships.
6. Filter opportunities.
7. See verified source information.
8. See whether they are eligible.
9. See why an opportunity matches them.
10. Compare opportunities.
11. Save opportunities.
12. Create an application for a specific admission cycle.
13. Track application status.
14. Track required documents.
15. See deadlines.
16. Receive basic deadline notifications.
17. Request human help.

---

# 3. What the MVP Is NOT

Do not put these into the first MVP:

- autonomous AI agents
- general-purpose chatbot
- RAG assistant
- learning-to-rank ML
- admission probability prediction
- dedicated vector database
- microservices
- Kubernetes
- recommendation models requiring large datasets
- complex partner automation
- automatic university application submission
- full agency CRM
- advanced analytics platform
- mobile application

These can be future phases.

---

# 4. Product Strategy

The first version should focus on one difficult problem:

> "I know I want to study abroad, but I don't know which opportunities actually fit my profile, budget, funding needs, and deadlines."

The MVP should answer:

```text
What can I apply to?
Why?
How much will it cost?
What funding is available?
When is the deadline?
What documents do I need?
Where does this information come from?
What should I do next?
```

---

# 5. Phase 0 — Product Validation

**Duration:** ~1–2 weeks

Before serious development, validate the problem.

## Tasks

Interview students who are actively searching for study-abroad opportunities.

Target:

```text
10–20 students
```

Questions:

- Where do they search?
- What information is hardest to find?
- Which websites do they use?
- Do they use agencies?
- Why do they use agencies?
- What makes them distrust online information?
- How do they track deadlines?
- How do they find scholarships?
- What does "fully funded" mean to them?
- What documents cause confusion?
- Would they trust an automated matching score?
- What would make them return to the platform?

## Deliverable

```text
docs/PRODUCT_VALIDATION.md
```

Do not build large features based only on assumptions.

---

# 6. Phase 1 — Data Foundation

**Duration:** ~2–3 weeks

Build the catalog before building sophisticated recommendations.

## Scope

Implement:

```text
universities
programs
scholarships
opportunities
application cycles
deadlines
sources
eligibility rule versions
scholarship details
```

Populate an intentionally small but high-quality catalog.

Initial target:

```text
50–200 opportunities
```

Do not attempt to scrape every university in Europe.

Quality matters more than quantity.

---

# 7. Source Strategy

Every important catalog fact should have provenance.

Prioritize:

1. Official university pages.
2. Official scholarship organizations.
3. Government sources.
4. Official admissions portals.
5. Official program PDFs.

Secondary sources may help discovery but should not silently become the authority for important facts.

The product should show:

```text
Source
Last verified
Verification status
```

---

# 8. Phase 2 — Student Profile

**Duration:** ~1 week

Implement:

```text
account
profile
academic history
languages
study preferences
countries
fields
degree level
budget
funding preferences
```

Profile completion should be progressive.

Do not force students to enter every possible field before searching.

---

# 9. Phase 3 — Search

**Duration:** ~1–2 weeks

Implement the search architecture defined in `SEARCH.md`.

Order:

```text
Structured filters
        ↓
PostgreSQL full-text search
        ↓
pg_trgm where useful
```

MVP does NOT require:

```text
embeddings
pgvector
semantic search
```

unless real testing shows keyword search is insufficient.

---

# 10. Search UX

A student should be able to search:

```text
AI
```

and refine using:

```text
Country
Degree
Language
Budget
Funding
Scholarship
Deadline
Study mode
```

A particularly important use case:

```text
100% tuition + living expenses
```

The UI must distinguish:

```text
Full tuition
Living expenses
Accommodation
Transport
Insurance
Visa
Application fee
Monthly stipend
One-time funding
Partial coverage
Full coverage
```

Do not use a single vague:

```text
"Fully funded"
```

field as the only representation.

---

# 11. Phase 4 — Matching Engine

**Duration:** ~2–3 weeks

Implement `MATCHING.md`.

Pipeline:

```text
Student Profile
      ↓
Eligibility
      ↓
Fit Score
      ↓
Ranking
      ↓
Explanation
```

## Eligibility

Deterministic.

Examples:

```text
degree level
academic requirement
language requirement
nationality
age
field
application cycle
```

No LLM decision-making.

---

# 12. Fit Score

Use transparent weighted scoring.

Example signals:

```text
Field match
Budget match
Funding match
Language match
Country preference
Degree match
Deadline suitability
```

Each result should explain:

```text
+ Strong field match
+ Meets budget
+ Full tuition coverage
- Living coverage is unknown
```

Do not show an unexplained:

```text
92%
```

without reasons.

---

# 13. Unknown Data

A critical product rule:

```text
UNKNOWN ≠ NO
```

If the database does not know whether a scholarship covers accommodation:

```text
Accommodation coverage: Unknown
```

Do not treat it as:

```text
Not covered
```

unless an authoritative source explicitly says so.

This is important for trust.

---

# 14. Phase 5 — Discovery UX

**Duration:** ~1–2 weeks

Build:

```text
Opportunity list
Opportunity detail
Scholarship detail
University detail
Program detail
Comparison
Save
```

Opportunity detail should answer:

```text
What is it?
Who can apply?
How much does it cost?
What funding exists?
When can I apply?
What documents are needed?
Where did this information come from?
```

---

# 15. Phase 6 — Application Tracker

**Duration:** ~1–2 weeks

Implement:

```text
application
application cycle
deadline
application status
required documents
notes
```

Example workflow:

```text
Saved
 ↓
Planning
 ↓
Preparing
 ↓
Submitted
 ↓
Under Review
 ↓
Accepted / Rejected
```

The exact state machine requires product approval before implementation.

---

# 16. Phase 7 — Document Management

**Duration:** ~1–2 weeks

Implement secure document metadata and private object storage.

Flow:

```text
Request upload URL
       ↓
Direct upload
       ↓
Scan
       ↓
Validate
       ↓
Attach to application
```

Documents must be:

```text
private
encrypted
auditable
deletable
```

Do not build an unnecessarily complex personal document vault.

Store documents because an application needs them.

---

# 17. Phase 8 — Deadlines & Notifications

**Duration:** ~1 week

Implement:

```text
deadline tracking
upcoming deadline list
basic email notifications
notification preferences
```

Example:

```text
30 days before
14 days before
7 days before
2 days before
```

Exact notification schedule requires product approval.

Deadlines must come from:

```text
deadlines
```

not duplicated fields.

---

# 18. Phase 9 — Human Help

**Duration:** ~1 week

Implement a lightweight workflow:

```text
Student
   ↓
Help request
   ↓
Advisor assignment
   ↓
Conversation
   ↓
Resolution
```

Do not build a complete agency CRM.

The purpose is to test:

> Can the platform combine automation with trusted human assistance?

---

# 19. Phase 10 — Admin Dashboard

**Duration:** ~1–2 weeks

Admin needs:

```text
Opportunity management
University management
Program management
Scholarship management
Source management
Verification
Eligibility rules
Deadlines
Catalog updates
Audit logs
```

The admin interface is extremely important because catalog quality is a core product advantage.

---

# 20. Data Quality System

The platform should have a visible internal concept of:

```text
Verified
Partially verified
Needs review
Outdated
```

Important facts should have:

```text
source
verification date
verification status
```

Potential future metric:

```text
Catalog freshness
```

---

# 21. MVP Quality Gate

Do not launch just because all pages exist.

Before launch test:

## Search

Can students find expected opportunities?

## Matching

Are eligibility decisions correct?

## Funding

Can the system distinguish:

```text
100% tuition + living
```

from:

```text
100% tuition only
```

?

## Provenance

Can every important claim be traced?

## Deadlines

Are deadlines tied to the correct cycle?

## Documents

Can unauthorized users access another student's documents?

## Explainability

Can a student understand why an opportunity was recommended?

---

# 22. MVP Testing

Testing layers:

```text
Unit tests
Integration tests
API tests
Database tests
Matching tests
Search tests
Security tests
End-to-end tests
```

Matching deserves a dedicated test dataset.

Example:

```text
Student A
Expected:
Eligible = true
Fit = high

Student B
Expected:
Eligible = false
Reason = language requirement
```

---

# 23. Seed Dataset

Create a controlled test dataset containing cases such as:

```text
Full tuition + full living
Full tuition only
Partial tuition + stipend
Living only
Unknown coverage
Expired scholarship
Multiple admission cycles
Different deadlines per cycle
Nationality restriction
Language restriction
GPA restriction
```

This dataset becomes the regression test for search and matching.

---

# 24. MVP Metrics

Do not optimize for vanity metrics.

Measure:

## Discovery

```text
Searches per student
Search → opportunity click
```

## Matching

```text
Match → save
Match → application
```

## Application

```text
Save → application
Application completion rate
```

## Trust

```text
Source views
Correction reports
Outdated-data reports
```

## Retention

```text
7-day return
30-day return
```

---

# 25. First Launch Scope

Recommended first launch:

```text
1–3 countries
3–5 study domains
50–200 high-quality opportunities
```

Do not launch with:

```text
200 countries
100,000 universities
```

if the data is unreliable.

A smaller trustworthy catalog is a stronger product.

---

# 26. Recommended First Vertical

Instead of building every study-abroad path simultaneously, choose one initial vertical.

Possible example:

```text
Tunisian students
        ↓
Master's studies
        ↓
France + Italy
        ↓
Computer Science / AI / Software Engineering
```

This should be validated with actual student interviews before being locked.

---

# 27. Timeline

With one developer using AI-assisted development/vibecoding:

```text
Validation                 1–2 weeks
Architecture/data          1–2 weeks
Catalog/admin              2–3 weeks
Profile                    1 week
Search                     1–2 weeks
Matching                   2–3 weeks
Discovery UI               1–2 weeks
Applications               1–2 weeks
Documents                  1–2 weeks
Notifications              1 week
Human help                 1 week
Testing/polish             2–3 weeks
--------------------------------------
Realistic MVP              ~12–18 weeks
```

AI-assisted coding can reduce implementation time, but it does not remove:

```text
data collection
data verification
testing
product decisions
security
UX iteration
```

Those are likely to be the biggest time constraints.

---

# 28. What Can Be Built in Parallel

After the database foundation:

```text
Track A — Catalog/Admin
Track B — Student/Profile
Track C — Search
Track D — Application tracking
```

Matching should begin once the schema and sample catalog are stable.

Document storage and notifications can proceed in parallel with application tracking.

---

# 29. Suggested Repository Structure

Conceptual:

```text
study-abroad-platform/
│
├── apps/
│   └── web/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── students/
│   │   ├── catalog/
│   │   ├── search/
│   │   ├── matching/
│   │   ├── applications/
│   │   ├── documents/
│   │   ├── notifications/
│   │   ├── advisors/
│   │   └── admin/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── storage/
│   │   ├── email/
│   │   └── jobs/
│   │
│   └── shared/
│
├── prisma/
├── docs/
├── tests/
└── docker/
```

The exact repository layout remains an implementation decision.

---

# 30. Technology Implementation Order

Recommended:

```text
Next.js
TypeScript
PostgreSQL
Prisma
Zod
Managed Auth
S3-compatible Storage
Postgres-backed Jobs
Email provider
GitHub Actions
Sentry
```

Add later only if justified:

```text
pgvector
Redis
Dedicated API service
Dedicated vector DB
```

---

# 31. AI Development Strategy

AI coding agents should be used as implementation assistants, not architects making independent decisions.

Before asking an agent to code:

```text
Read ARCHITECTURE.md
Read DATABASE.md
Read SEARCH.md
Read MATCHING.md
Read API.md
Read ROADMAP.md
```

Then give it one bounded task.

Example:

```text
Implement only the student profile module.
Do not modify the database architecture.
Do not introduce new dependencies without approval.
Do not implement RAG or ML.
```

---

# 32. AI/RAG Roadmap

RAG comes after the core product proves useful.

Future:

```text
Official documents
       ↓
Document ingestion
       ↓
Chunking
       ↓
Embeddings
       ↓
pgvector
       ↓
Retrieval
       ↓
Grounded assistant
```

The assistant should answer questions using official sources.

It should not become the eligibility engine.

---

# 33. ML Roadmap

ML is intentionally deferred.

Potential future:

```text
Search logs
Saved opportunities
Dismissed opportunities
Applications
Application outcomes
       ↓
Feature engineering
       ↓
Learning-to-rank
       ↓
Ranking improvement
```

Do not create ML tables in the MVP.

Do not train a model just because the platform contains the word "AI."

---

# 34. Agent Roadmap

Agents are future workflow automation.

Possible future example:

```text
Student asks:
"Find scholarships for my profile."

Agent:
1. searches catalog
2. checks official sources
3. compares requirements
4. creates shortlist
5. explains results
```

But this should only be introduced after deterministic workflows and RAG are reliable.

---

# 35. Mobile App Strategy

Do not build native mobile first.

Build responsive web first.

Reason:

```text
One codebase
Faster validation
Lower development cost
Easier iteration
```

If mobile demand is proven:

```text
React Native / Expo
        ↓
same API/domain
```

The architecture already allows this.

---

# 36. University / Agency Partnerships

Do not depend on partnerships to launch the MVP.

First prove:

```text
students use it
students find value
students return
students apply
```

Then approach agencies/universities with measurable evidence.

Possible future partner features:

```text
verified agency profiles
agency success metrics
student referrals
advisor assignment
partner-managed opportunities
institution pages
```

Partner claims must be evidence-based.

Avoid simply displaying:

> "Best agency for France"

without transparent criteria.

---

# 37. Monetization — LATER

Potential models:

```text
Free student search
Premium application tracking
Premium advisor assistance
Agency lead generation
University partnerships
Sponsored opportunities
```

Do not let monetization distort ranking.

A paid partner should not automatically outrank a better opportunity unless the product explicitly labels sponsored placement.

---

# 38. Critical Product Differentiator

The platform should not try to win by having:

```text
more AI
```

It should win through:

```text
better data
+
better matching
+
better explanations
+
better deadline tracking
+
better trust
+
accessible human help
```

AI becomes an accelerator rather than the product itself.

---

# 39. Definition of Done — MVP

The MVP is ready when:

```text
[ ] Student can create profile
[ ] Student can define budget correctly
[ ] Student can define funding requirements
[ ] Catalog contains verified opportunities
[ ] Search works with structured filters
[ ] Search supports important scholarship coverage distinctions
[ ] Eligibility is deterministic
[ ] Matching is explainable
[ ] Ranking is deterministic
[ ] Sources are visible
[ ] Multiple admission cycles work
[ ] Deadlines are cycle-specific
[ ] Opportunities can be saved
[ ] Opportunities can be compared
[ ] Applications can be tracked
[ ] Documents are securely stored
[ ] Notifications work
[ ] Human-help request works
[ ] Admin can maintain catalog
[ ] Audit logging works
[ ] Security tests pass
[ ] Matching regression tests pass
[ ] End-to-end happy path passes
```

---

# 40. The First Complete User Journey

The first journey to optimize is:

```text
Student arrives
      ↓
"I want to study abroad"
      ↓
Creates basic profile
      ↓
Chooses:
  AI / Computer Science
  Master's
  France / Italy
      ↓
Sets budget
      ↓
Sets:
  100% tuition
  AND living expenses
      ↓
Search
      ↓
Receives opportunities
      ↓
Filters
      ↓
Opens opportunity
      ↓
Sees sources
      ↓
Sees eligibility
      ↓
Sees match explanation
      ↓
Saves
      ↓
Compares
      ↓
Chooses an admission cycle
      ↓
Creates application
      ↓
Sees required documents
      ↓
Tracks deadline
      ↓
Receives reminder
      ↓
Requests help if needed
```

If this journey works extremely well, the platform has a meaningful MVP.

---

# 41. Final Engineering Rule

When deciding whether to add a technology:

Ask:

```text
What user problem does it solve?
```

Then:

```text
Can PostgreSQL / Next.js / existing infrastructure solve it?
```

If yes:

```text
Do not add another system.
```

Only introduce a new technology when:

```text
measured limitation
OR
clear product requirement
```

not because the technology is popular.

---

# 42. Final Roadmap

```text
PHASE 0
Problem validation
        ↓
PHASE 1
Catalog + data quality
        ↓
PHASE 2
Student profile
        ↓
PHASE 3
Search
        ↓
PHASE 4
Deterministic matching
        ↓
PHASE 5
Discovery + comparison
        ↓
PHASE 6
Application tracking
        ↓
PHASE 7
Documents
        ↓
PHASE 8
Deadlines + notifications
        ↓
PHASE 9
Human help
        ↓
PHASE 10
Admin + QA
        ↓
MVP LAUNCH
        ↓
REAL USER DATA
        ↓
Evaluate:
  pgvector?
  RAG?
  ML?
  agents?
  mobile?
  partnerships?
```

The most important rule is:

> **Do not build the future before the MVP proves the present.**
