# DATA_INGESTION.md - Study Abroad Platform

**Role:** Catalog data ingestion, verification, and quality specification  
**Status:** Proposed - MVP v0.1  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `SEARCH.md`, `MATCHING.md`, `API.md`, `ROADMAP.md`, `IMPLEMENTATION_PLAN.md`, `SECURITY.md`, `TESTING.md`  
**Scope:** Source discovery, manual entry, CSV/import workflows, verification, provenance, data quality, freshness, deduplication, controlled vocabularies, regression datasets, future scraping/RAG ingestion boundaries  
**Non-scope:** Large-scale web scraping system, autonomous data agents, RAG document chunking/embedding, partner bulk API integrations, ML data pipelines

---

## 1. Goal

The platform wins by having trustworthy data, not by having the largest possible catalog.

Data ingestion must answer:

```text
Where did this opportunity come from?
Who verified it?
When was it verified?
Which facts are confirmed?
Which facts are unknown?
Which facts are stale?
Can search, eligibility, and matching safely use this record?
```

The MVP target is a small, high-quality catalog:

```text
50-200 verified opportunities
1-3 countries
3-5 study domains
clear source/provenance
structured funding and deadline data
```

Do not attempt to ingest every university in the world before proving the core product.

---

## 2. Critical Pre-Implementation Check

Before implementing importers, validation scripts, admin ingest flows, or catalog seed data, verify that `DATABASE.md` contains the approved database schema.

If `DATABASE.md` contains matching content, or the approved schema is missing, agents must stop and report:

```text
BLOCKED: data ingestion cannot map fields without valid DATABASE.md
```

Do not invent catalog tables, provenance structures, eligibility-rule fields, or scholarship coverage fields from memory.

---

## 3. Ingestion Principles

1. Official sources first.
2. Small verified catalog before large unverified catalog.
3. Structured fields before prose.
4. Unknown is not no.
5. Missing source means not verified.
6. Critical facts require provenance.
7. Imports should create reviewable drafts before publishing.
8. Admin edits should be auditable.
9. Do not silently overwrite verified facts.
10. Do not use LLMs as authority for catalog facts in MVP.
11. Do not scrape aggressively or violate source terms.
12. Prefer repeatable import workflows over one-off manual hacks.

---

## 4. Source Priority

Use this priority order:

```text
1. Official university pages
2. Official program pages
3. Official scholarship provider pages
4. Government or public institution pages
5. Official admissions portals
6. Official PDFs from institutions/providers
7. Recognized partner-provided data
8. Secondary directories or articles
```

Secondary sources may help discover opportunities, but important facts should be verified against official sources before being displayed as verified.

Important facts include:

```text
tuition
scholarship amount
scholarship coverage
living stipend
deadline
intake/cycle
eligibility requirement
language requirement
required documents
application link
program duration
teaching language
```

---

## 5. MVP Ingestion Modes

### Mode A - Manual Admin Entry

Best for early MVP.

Use when:

```text
catalog is small
source pages differ a lot
verification quality matters
schema is still stabilizing
```

Flow:

```text
admin finds official source
admin creates draft opportunity
admin enters structured fields
admin attaches source URLs
admin marks unknown values explicitly
admin submits for verification
admin or reviewer verifies
opportunity becomes publishable
```

### Mode B - CSV Import

Use for controlled bulk entry prepared by humans.

Flow:

```text
prepare CSV from reviewed source list
validate headers
validate controlled values
preview import
show row-level errors
create draft records
require verification before publishing
```

CSV import should not publish verified opportunities directly unless the data source and review process are explicitly approved.

### Mode C - Scripted Import From Known Structured Sources

Use only when a source is stable and permitted.

Examples:

```text
official open data file
partner-provided spreadsheet
institution-provided export
government scholarship list
```

Flow:

```text
download or receive file
validate checksum/version where possible
parse into staging rows
normalize controlled fields
detect duplicates
create or update drafts
flag changes for review
```

### Mode D - Web Scraping

Not MVP default.

Allowed only after approval for a specific source.

Requires:

```text
robots/terms review
rate limits
source-specific parser
change detection
human verification
no bypassing access controls
no scraping private or authenticated student data
```

Scraped data must enter draft/review state.

---

## 6. Data Lifecycle

Recommended lifecycle:

```text
DISCOVERED
  -> DRAFT
  -> NEEDS_REVIEW
  -> VERIFIED
  -> PUBLISHED
  -> STALE
  -> OUTDATED
  -> ARCHIVED
```

Meaning:

```text
DISCOVERED     found but not structured
DRAFT          structured but not reviewed
NEEDS_REVIEW   ready for verification
VERIFIED       checked against source
PUBLISHED      visible to students
STALE          verification is too old
OUTDATED       known to be wrong or superseded
ARCHIVED       no longer active or intentionally hidden
```

Exact enum names should follow `DATABASE.md`.

Do not show unreviewed draft records as trusted student-facing opportunities.

---

## 7. Provenance Model

Every important fact should be traceable.

Conceptual provenance fields:

```text
source_url
source_title
source_type
source_authority_level
source_accessed_at
verified_at
verified_by
verification_status
source_excerpt_or_note where legally safe
```

Source types:

```text
OFFICIAL_UNIVERSITY
OFFICIAL_PROGRAM
OFFICIAL_SCHOLARSHIP
GOVERNMENT
ADMISSIONS_PORTAL
OFFICIAL_PDF
PARTNER
SECONDARY
UNKNOWN
```

Authority levels:

```text
PRIMARY
SECONDARY
UNVERIFIED
```

Do not store long copyrighted source text unless legally approved. Store URLs, metadata, short notes, and structured facts.

---

## 8. Fact-Level Verification

Opportunity-level verification is not enough.

Different facts can have different states:

```text
tuition: VERIFIED
living coverage: UNKNOWN
deadline: VERIFIED
language requirement: NEEDS_REVIEW
required documents: OUTDATED
```

The UI and search must not collapse all of this into a vague:

```text
verified opportunity
```

Critical filters depend on fact-level quality:

```text
full tuition coverage
living coverage
deadline
language requirement
GPA requirement
nationality restriction
```

If the fact is unknown, the platform should say unknown.

---

## 9. Required Structured Fields

Exact fields must follow `DATABASE.md`, but ingestion must capture these concepts.

### Institution

```text
name
country
city/region where available
website
type
source/provenance
verification status
```

### Program

```text
title
degree level
field
study mode
teaching language
duration
tuition amount
tuition currency
tuition period
application link
source/provenance
verification status
```

### Scholarship

```text
name
provider
coverage categories
coverage level per category
amount where available
currency
period
eligibility summary
source/provenance
verification status
```

### Opportunity

```text
opportunity type
title
linked institution/program/scholarship
country
degree level
field
application cycles
deadlines
eligibility rule version
source/provenance
publication status
```

### Application Cycle

```text
cycle label
intake
academic year
open date where available
close date where available
status
source/provenance
```

### Deadline

```text
deadline type
date
timezone or local date semantics
application cycle
source/provenance
verification status
```

---

## 10. Controlled Vocabularies

Use controlled values for data that affects search or matching.

Required controlled vocabularies:

```text
country codes
currency codes
degree levels
fields of study
study modes
teaching languages
language levels
opportunity types
coverage categories
coverage levels
deadline types
verification statuses
source types
application cycle statuses
eligibility rule fields/operators
```

Do not allow free text to become a search-critical field unless it is mapped to controlled values.

Example:

```text
"AI", "Artificial Intelligence", "Intelligence Artificielle"
```

should map to an approved field/category rather than becoming three unrelated categories.

---

## 11. Funding And Coverage Semantics

Funding must be structured by category.

Coverage categories:

```text
tuition
living_expenses
accommodation
transport
insurance
visa
application_fee
monthly_stipend
one_time_grant
other
```

Coverage levels:

```text
FULL
PARTIAL
NONE
UNKNOWN
NOT_APPLICABLE
```

Rules:

- `FULL tuition` does not imply `FULL living`.
- `UNKNOWN living` does not imply `NONE living`.
- `PARTIAL` must not be displayed as `FULL`.
- A vague source saying "fully funded" should be decomposed into explicit categories where possible.
- If categories cannot be verified, mark them unknown.

Search and matching depend on this distinction.

---

## 12. Budget And Cost Normalization

Any cost or funding amount must include:

```text
amount
currency
period
scope
```

Periods:

```text
MONTH
YEAR
PROGRAM
TOTAL
ONE_TIME
```

Scopes:

```text
TUITION
LIVING
TOTAL_COST
APPLICATION_FEE
ACCOMMODATION
TRANSPORT
INSURANCE
OTHER
```

Do not ingest ambiguous values like:

```text
5000 EUR
```

without clarifying whether it means:

```text
EUR 5,000 / year / tuition
EUR 5,000 / program / tuition
EUR 5,000 / total / total cost
```

Ambiguous values should be marked as needs review.

---

## 13. Eligibility Rule Ingestion

Eligibility rules must be structured and versioned.

Ingestion can create:

```text
eligibility summary text
draft structured rule
source reference
review status
```

Publishing a rule version requires human review.

Do not let import scripts or LLMs publish eligibility decisions automatically.

Rule examples:

```text
minimum GPA
required degree level
required field/background
language level
nationality
residency
age range
application-cycle availability
```

If a requirement is found in prose but cannot be confidently structured, mark it:

```text
NEEDS_REVIEW
```

---

## 14. Deadlines And Dates

Deadlines must belong to application cycles.

Do not ingest a generic:

```text
opportunity.application_deadline
```

unless the approved schema explicitly defines a different semantic field.

Deadline data should capture:

```text
date
deadline type
cycle
source
verified_at
verification_status
date precision
timezone/local-date semantics
```

Date precision examples:

```text
exact date
month only
season only
to be announced
rolling admissions
unknown
```

If a source says:

```text
Applications usually close in March
```

do not turn it into an exact date without verification.

---

## 15. Deduplication Rules

Duplicates are likely.

Potential duplicate signals:

```text
same official URL
same institution + program title + degree level
same scholarship provider + scholarship name
same application portal link
same source PDF
same normalized title and country
```

Deduplication should produce review suggestions, not automatic destructive merges.

Merge rules:

- Preserve all sources.
- Preserve audit history.
- Preserve verified facts unless a newer source explicitly supersedes them.
- Never drop unknown/needs-review notes silently.
- Prefer primary sources over secondary sources.

---

## 16. Change Detection

Catalog data changes over time.

Track changes to:

```text
tuition
funding coverage
scholarship amount
deadline
application cycle
eligibility requirement
required documents
application URL
source URL
```

When an import detects a change:

```text
create change record
mark affected fact as NEEDS_REVIEW
notify admin/reviewer if needed
do not silently overwrite verified published facts
```

For MVP, change detection can be manual or CSV-based. Automated monitoring is later.

---

## 17. Freshness Policy

Every verified fact should have a freshness threshold.

Suggested initial thresholds:

```text
deadlines: review every 30-60 days during active application seasons
tuition/funding: review every 3-6 months
eligibility requirements: review every 3-6 months
program descriptions: review every 6-12 months
institution metadata: review every 12 months
```

Exact thresholds are product decisions.

If a fact exceeds its freshness threshold:

```text
verification_status = STALE or equivalent
UI shows verification needed
search can expose needs-review status
matching confidence may be reduced where applicable
```

Do not silently treat stale data as current.

---

## 18. Review Workflow

Minimum reviewer workflow:

```text
draft created
reviewer opens source
reviewer checks structured fields
reviewer verifies critical facts
reviewer marks unknown values explicitly
reviewer publishes or requests changes
audit event recorded
```

Reviewer should check:

```text
official source URL
degree level
field
country
teaching language
tuition
scholarship coverage
application cycle
deadline
eligibility requirements
required documents
application link
```

Review should prioritize correctness over speed.

---

## 19. Admin Import UI Requirements

Admin/import screens should support:

```text
create draft opportunity
attach sources
mark fact verification status
mark unknown values
CSV upload preview
row-level import errors
duplicate warnings
change warnings
publish/unpublish
audit trail
filter by needs review/stale/outdated
```

Admin UI must not encourage:

```text
publishing without source
bulk overwriting verified facts
using vague "fully funded" as complete coverage
creating generic deadline fields
```

---

## 20. CSV Import Contract

CSV import should use strict headers and validation.

Example conceptual columns:

```text
source_url
source_type
institution_name
country
city
program_title
degree_level
field
teaching_language
tuition_amount
tuition_currency
tuition_period
tuition_scope
scholarship_name
tuition_coverage
living_coverage
stipend_amount
stipend_currency
stipend_period
cycle_label
intake
deadline_type
deadline_date
application_url
verification_status
review_notes
```

Import validation must reject or flag:

```text
unknown country code
unknown currency
invalid degree level
invalid coverage level
amount without currency
amount without period/scope
deadline without cycle
verified fact without source
ambiguous fully funded claim
duplicate source URL
```

CSV import should create drafts by default.

---

## 21. Data Quality Metrics

Track internal quality metrics:

```text
total opportunities
published opportunities
verified opportunities
opportunities needing review
stale opportunities
opportunities with verified tuition
opportunities with verified deadline
opportunities with verified coverage
opportunities with structured eligibility rules
opportunities with unknown living coverage
duplicate candidates
records missing source
```

MVP quality gate:

```text
No published opportunity should lack a source.
No strict funding filter should depend on unknown coverage.
No application deadline should exist without a cycle.
No eligibility rule should be published without review.
```

---

## 22. Search Readiness

An opportunity is search-ready when:

```text
title exists
opportunity type exists
country exists
degree level or type exists where applicable
field exists where applicable
source exists
verification status exists
publication status allows display
```

Funding-search-ready requires:

```text
coverage categories structured
coverage levels set to FULL/PARTIAL/NONE/UNKNOWN
source attached for verified coverage claims
```

Deadline-search-ready requires:

```text
application cycle exists
deadline date or date status exists
deadline source exists when verified
```

---

## 23. Matching Readiness

An opportunity is matching-ready when:

```text
student-relevant fields are structured
eligibility rule version exists or explicit unknown status exists
cost/funding fields are normalized
application cycle is known
verification statuses are available
unknown data is explicit
```

If matching-critical data is missing:

```text
do not invent it
mark matching confidence lower
place opportunity in needs-verification category where applicable
```

---

## 24. Regression Dataset

Maintain a controlled dataset for tests.

Must include:

```text
full tuition + full living
full tuition only
partial tuition
living stipend only
unknown living coverage
unknown tuition coverage
multiple admission cycles
different deadlines per cycle
expired deadline
rolling admissions
language restriction
GPA restriction
nationality restriction
budget mismatch
eligible student
ineligible student
student missing language data
```

This dataset supports:

```text
search tests
eligibility tests
matching tests
deadline tests
security ownership tests where relevant
```

Do not use real student data in fixtures.

---

## 25. Data Security

Catalog ingestion should avoid private data.

Do not ingest:

```text
private student data
student documents
advisor messages
private application records
private emails
non-public partner data without agreement
```

Admin import logs must not include:

```text
secrets
private credentials
signed URLs
student data
large copyrighted source text
```

If partner data is added later, it needs a separate data-sharing and permission review.

---

## 26. Legal And Ethical Scraping Rules

For MVP, scraping is not a default ingestion method.

If scraping is approved later:

```text
review terms of use
respect robots.txt where applicable
use conservative rate limits
identify the crawler if required
store only necessary structured facts
preserve source URLs
avoid copying large copyrighted text
do not bypass access controls
do not scrape private/authenticated areas
```

Scraped facts remain unverified until reviewed.

---

## 27. LLM Use In Data Ingestion

LLMs are not authoritative data sources.

MVP:

```text
do not use LLMs to publish facts
do not use LLMs to decide eligibility
do not use LLMs to infer missing funding coverage
do not use LLMs to invent deadlines
do not use LLMs to bypass manual verification
```

Possible later assistive uses:

```text
extract candidate fields from official text
suggest controlled vocabulary mapping
summarize source page for reviewer
detect possible duplicate records
flag inconsistent imported data
```

Even later, LLM output must enter review, not publication.

---

## 28. RAG Document Ingestion - Later

RAG is not MVP.

Future RAG ingestion would require:

```text
official document storage
document parsing
chunking
embeddings
retrieval metadata
source citations
permission model
prompt-injection review
freshness handling
```

Do not create RAG tables, embedding jobs, vector indexes, or assistant ingestion pipelines in the MVP unless the architecture is explicitly updated.

---

## 29. API And Import Boundaries

Import logic should live behind services.

Conceptual boundary:

```text
Admin Upload / Import Request
  -> validation
  -> ImportService
  -> staging/draft records
  -> review workflow
  -> CatalogService publish
  -> audit log
```

Do not put CSV parsing, deduplication, or provenance rules directly inside UI components.

Admin APIs must follow `API.md` and `SECURITY.md`:

```text
authenticated admin
server-side authorization
request validation
safe errors
audit logging
rate limits where appropriate
```

---

## 30. Testing Requirements

Ingestion tests should cover:

```text
CSV header validation
controlled vocabulary validation
amount/currency/period/scope validation
coverage validation
deadline requires cycle
verified fact requires source
unknown values stay unknown
duplicate detection
draft creation
review/publish flow
audit event creation
admin authorization
safe import errors
```

Regression tests must prove:

```text
full tuition only is not full tuition + living
ambiguous fully funded does not become full coverage automatically
unknown living coverage remains unknown
stale data is marked stale
verified fact is not silently overwritten by import
```

---

## 31. Agent Rules For Data Tasks

AI coding agents must:

- read source documents before changing data model or import rules
- inspect existing schema and services first
- keep imports draft/review based
- preserve provenance
- mark unknown values explicitly
- run relevant validation and tests
- report data assumptions

AI coding agents must not:

```text
invent missing facts
invent database schema from missing DATABASE.md
publish imported records without review
turn "fully funded" into full coverage without source support
treat unknown as none
treat unknown as full
scrape websites without explicit approval
add RAG/embeddings/vector ingestion in MVP
store large copyrighted source text
overwrite verified facts silently
remove provenance to simplify import
```

Agent output for data tasks must include:

```text
sources used
fields imported
fields marked unknown
records created/updated
duplicates detected
verification status
tests run
remaining review items
OPEN DECISIONS
```

---

## 32. MVP Data Ingestion Definition Of Done

MVP data ingestion is ready when:

```text
[ ] approved database schema exists
[ ] admin can create draft opportunity
[ ] admin can attach source
[ ] admin can mark unknown facts
[ ] admin can verify critical facts
[ ] published records require source/provenance
[ ] CSV import can create reviewable drafts if implemented
[ ] duplicate detection exists at least as warning if import exists
[ ] funding coverage is structured
[ ] deadlines are cycle-specific
[ ] eligibility rules are reviewed before publication
[ ] stale/needs-review statuses are visible internally
[ ] seed/regression dataset exists
[ ] search-ready criteria are documented and testable
[ ] matching-ready criteria are documented and testable
[ ] ingestion tests pass
```

---

## 33. Open Decisions

These must be approved before implementation reaches the related area:

```text
Exact database schema
Exact source/provenance model
Exact verification statuses
Exact controlled vocabularies
Exact first launch countries/domains
Exact CSV import format
Exact admin review workflow
Exact freshness thresholds
Exact duplicate merge policy
Exact source trust hierarchy
Whether any specific website scraping is allowed
Whether partner-provided data is in MVP
Whether import drafts can be bulk-published
```

---

## 34. Final Principle

Data ingestion is not a back-office detail. It is the foundation of product trust.

Build:

```text
small catalog
official sources
structured facts
explicit unknowns
fact-level provenance
human verification
regression dataset
```

before building:

```text
large-scale scraping
RAG ingestion
embeddings
autonomous agents
ML pipelines
partner bulk sync
```

The correct first catalog is not the biggest catalog.

It is the catalog students can safely use to decide what to search, compare, prepare, and apply for.
