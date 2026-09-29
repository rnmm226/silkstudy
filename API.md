# API.md — Study Abroad Platform

**Role:** API Contract & Application Boundary Specification  
**Status:** Proposed — v0.1  
**Scope:** REST API, request/response contracts, authentication, authorization, validation, errors, pagination, idempotency, matching/search boundaries, admin operations  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `MATCHING.md`, `SEARCH.md`  
**Non-scope:** SQL, UI implementation, infrastructure implementation, RAG implementation, ML implementation, agent workflows

---

# 1. Goal

The API is the application boundary between the frontend and the platform's domain logic.

It must expose:

- student profile management
- catalog discovery
- search
- opportunity details
- eligibility/matching results
- saved opportunities
- comparisons
- application tracking
- deadlines
- notifications/preferences
- documents metadata and secure file operations
- advisor/human-help workflows
- administrative catalog management

The API must keep business rules inside domain/application services rather than inside frontend code.

---

# 2. Architectural Boundary

MVP architecture:

```text
Next.js Web App
      |
      v
Route Handlers / Server Actions
      |
      v
Application Services
      |
      +----------------+
      |                |
      v                v
 PostgreSQL       Object Storage
```

The same domain services should be reusable later by:

```text
Mobile App
Partner Integrations
Public API
```

Do not create a separate API microservice for MVP.

---

# 3. API Style

Use:

```text
REST-ish JSON API
```

Base path:

```text
/api/v1
```

Examples:

```text
GET  /api/v1/opportunities
GET  /api/v1/opportunities/:id
POST /api/v1/search
GET  /api/v1/matches
```

Use standard HTTP semantics where practical.

---

# 4. Authentication

Authentication is handled by the selected managed authentication system.

The API receives an authenticated identity:

```text
user_id
```

The application resolves that identity to a platform user/student/advisor/admin.

Do not implement password authentication manually inside the API.

---

# 5. Authorization

Initial roles:

```text
STUDENT
ADVISOR
ADMIN
```

Authorization must be enforced server-side.

## Student

Can:

- manage own profile
- view public catalog data
- run searches
- view own matches
- save opportunities
- compare opportunities
- manage own applications
- manage own documents
- request human help

## Advisor

Can:

- access explicitly delegated student information
- assist with applications
- view relevant documents when authorized
- communicate with assigned students

## Admin

Can:

- manage catalog
- manage sources
- manage eligibility rules
- verify opportunity facts
- manage users/roles
- inspect audit logs
- manage system configuration

Never rely on UI visibility for authorization.

---

# 6. Request Validation

Every external request must be validated at the API boundary.

Recommended:

```text
Zod
```

Validation must cover:

- type
- required fields
- allowed enum values
- string lengths
- numeric ranges
- dates
- currency codes
- IDs
- pagination limits
- filter combinations

Invalid input returns a structured validation error.

---

# 7. Response Contract

Successful responses should be predictable.

Single resource:

```json
{
  "data": {
    "id": "...",
    "name": "..."
  }
}
```

Collection:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 120
  }
}
```

The exact response can evolve, but all endpoints should follow one consistent convention.

---

# 8. Error Contract

Use a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": [
      {
        "field": "budget.amount",
        "reason": "Must be greater than 0"
      }
    ],
    "request_id": "..."
  }
}
```

Initial error codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
IDEMPOTENCY_CONFLICT
SOURCE_UNAVAILABLE
STALE_DATA
INTERNAL_ERROR
```

Do not expose stack traces or internal database details.

---

# 9. HTTP Status Conventions

Use:

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

Do not use `200` for failed operations merely to simplify frontend handling.

---

# 10. Pagination

Collection endpoints use pagination.

MVP can use:

```text
page
page_size
```

with safe limits.

Example:

```text
?page=1&page_size=20
```

Maximum page size should be enforced server-side.

Cursor pagination may be introduced later for very large or frequently changing collections.

---

# 11. Sorting

Supported sort fields must be explicitly whitelisted.

Never accept arbitrary database column names from users.

Example:

```text
?sort=deadline
?sort=updated_at
```

with controlled direction:

```text
?order=asc
?order=desc
```

---

# 12. Idempotency

Endpoints that trigger side effects should support idempotency keys where retrying could duplicate an operation.

Examples:

```text
POST application
POST document metadata
POST notification request
POST human-help request
```

Header:

```text
Idempotency-Key: <unique-client-generated-key>
```

The server stores the result for the defined retention period and returns the same logical result for a repeated request.

---

# 13. Student Profile API

## Get profile

```text
GET /api/v1/me/profile
```

Returns:

- identity-safe profile information
- academic profile
- languages
- preferences
- budget
- funding requirements
- profile completeness

---

## Update profile

```text
PATCH /api/v1/me/profile
```

Partial updates are preferred.

Example:

```json
{
  "preferred_countries": ["FR", "IT"],
  "preferred_fields": ["ARTIFICIAL_INTELLIGENCE"]
}
```

Server validates each field.

---

# 14. Academic History API

```text
GET    /api/v1/me/academic-record
POST   /api/v1/me/academic-record
PATCH  /api/v1/me/academic-record/:id
DELETE /api/v1/me/academic-record/:id
```

Academic records should support:

- institution
- degree
- field
- GPA/grade
- grading scale where needed
- start/end dates
- completion status

Do not infer missing GPA values.

---

# 15. Language API

```text
GET   /api/v1/me/languages
POST  /api/v1/me/languages
PATCH /api/v1/me/languages/:id
DELETE /api/v1/me/languages/:id
```

Language levels use controlled values:

```text
A1
A2
B1
B2
C1
C2
NATIVE
UNKNOWN
```

---

# 16. Budget & Funding Preferences

```text
GET   /api/v1/me/budget
PUT   /api/v1/me/budget
GET   /api/v1/me/funding-preferences
PUT   /api/v1/me/funding-preferences
```

Budget requires:

```text
amount
currency
period
scope
```

Example:

```json
{
  "amount": 5000,
  "currency": "EUR",
  "period": "YEAR",
  "scope": "TUITION"
}
```

Funding preferences can express requirements such as:

```text
requires_full_tuition_coverage
requires_full_living_coverage
requires_accommodation
requires_stipend
```

The exact business semantics must remain aligned with `DATABASE.md` and `MATCHING.md`.

---

# 17. Opportunities

## List

```text
GET /api/v1/opportunities
```

Supported filters include:

```text
q
country
degree_level
field
language
study_mode
opportunity_type
tuition_min
tuition_max
tuition_currency
scholarship
tuition_coverage
living_coverage
application_status
deadline_from
deadline_to
intake
verified
```

The endpoint performs discovery/search.

It does not automatically claim personalized eligibility.

---

## Detail

```text
GET /api/v1/opportunities/:id
```

Returns:

- opportunity
- institution
- location
- program information
- scholarship information
- application cycles
- deadlines
- requirements
- source/provenance
- verification information

---

# 18. Search API

The search endpoint may be:

```text
GET /api/v1/search
```

or:

```text
POST /api/v1/search
```

For MVP, `GET` is preferable for simple filters.

Example:

```text
GET /api/v1/search?q=AI&country=FR&degree_level=MASTER
```

Complex saved searches may later use `POST`.

Response:

```json
{
  "data": {
    "query": "AI Master France",
    "filters_applied": {
      "country": ["FR"],
      "degree_level": ["MASTER"]
    },
    "results": [],
    "total": 0,
    "suggestions": []
  }
}
```

Search follows the behavior defined in `SEARCH.md`.

---

# 19. Search Relaxation

The API must never silently relax explicit user constraints.

If no exact results exist:

```json
{
  "data": {
    "results": [],
    "relaxation_options": [
      {
        "type": "FUNDING",
        "description": "Allow opportunities where living coverage is unknown."
      },
      {
        "type": "COUNTRY",
        "description": "Include nearby European countries."
      }
    ]
  }
}
```

The frontend only applies a relaxation after explicit user action.

---

# 20. Eligibility API

Eligibility is part of the matching domain.

Potential internal/application endpoint:

```text
POST /api/v1/matches/evaluate
```

Request:

```json
{
  "opportunity_id": "...",
  "student_id": "current-user"
}
```

For normal students, `student_id` should not be freely selectable; the server derives the authenticated student.

Response:

```json
{
  "data": {
    "status": "PASS",
    "reasons": [],
    "rule_version": "..."
  }
}
```

The API exposes the result of the deterministic engine.

It does not ask an LLM to decide eligibility.

---

# 21. Matches API

## List personalized matches

```text
GET /api/v1/me/matches
```

Optional filters:

```text
status
country
degree
field
min_score
funding
```

Response includes:

```text
opportunity
eligibility status
fit score
confidence
positive reasons
negative reasons
unknown factors
rule version
scoring configuration version
```

---

## Match detail

```text
GET /api/v1/me/matches/:id
```

Returns the complete explainable match.

---

# 22. Match Recalculation

```text
POST /api/v1/me/matches/recompute
```

This may trigger a background computation if the catalog is large.

Response can be:

```text
202 Accepted
```

with:

```json
{
  "data": {
    "job_id": "..."
  }
}
```

For MVP-scale catalogs, synchronous computation may be acceptable.

The implementation should choose based on measured execution time.

---

# 23. Saved Opportunities

```text
GET    /api/v1/me/saved-opportunities
POST   /api/v1/me/saved-opportunities
DELETE /api/v1/me/saved-opportunities/:opportunity_id
```

Create:

```json
{
  "opportunity_id": "..."
}
```

Duplicate saves should return a deterministic conflict or idempotent success according to product choice.

---

# 24. Comparisons

```text
GET    /api/v1/me/comparisons
POST   /api/v1/me/comparisons
GET    /api/v1/me/comparisons/:id
DELETE /api/v1/me/comparisons/:id
```

A comparison contains a controlled list of opportunities.

The server should enforce a reasonable maximum number of opportunities per comparison.

Comparison fields can include:

```text
tuition
funding
living coverage
language
deadline
location
program
eligibility
fit score
sources
```

---

# 25. Application Cycles

```text
GET /api/v1/opportunities/:id/cycles
GET /api/v1/opportunities/:id/cycles/:cycle_id
```

A cycle represents an intake/admission period.

Example:

```text
2027 Fall
2028 Fall
```

The same opportunity can have multiple cycles.

---

# 26. Deadlines

```text
GET /api/v1/opportunities/:id/deadlines
GET /api/v1/me/deadlines
```

Deadlines are the single source of truth for application timing.

The API must not expose or maintain a duplicate:

```text
opportunities.application_deadline
```

---

# 27. Applications

## List

```text
GET /api/v1/me/applications
```

## Create

```text
POST /api/v1/me/applications
```

Request:

```json
{
  "opportunity_id": "...",
  "application_cycle_id": "..."
}
```

## Detail

```text
GET /api/v1/me/applications/:id
```

## Update status

```text
PATCH /api/v1/me/applications/:id
```

Possible statuses:

```text
PLANNED
PREPARING
SUBMITTED
UNDER_REVIEW
ACCEPTED
REJECTED
WITHDRAWN
CLOSED
```

The exact state machine should be defined before implementation.

---

# 28. Application Documents

Applications reference documents but do not contain raw file bytes.

Example:

```text
Application
    |
    +-- required document
    |
    +-- student document
```

API:

```text
GET  /api/v1/me/applications/:id/documents
POST /api/v1/me/applications/:id/documents
DELETE /api/v1/me/applications/:id/documents/:document_id
```

Authorization is checked for every operation.

---

# 29. Document Upload

Recommended flow:

```text
1. Request upload authorization
2. API validates document metadata
3. API returns short-lived signed upload URL
4. Client uploads directly to object storage
5. Background scanner validates file
6. Document becomes usable
```

Endpoint:

```text
POST /api/v1/me/documents/upload-url
```

Response:

```json
{
  "data": {
    "document_id": "...",
    "upload_url": "...",
    "expires_at": "..."
  }
}
```

Do not pass raw document content through normal JSON API requests.

---

# 30. Document Access

```text
GET /api/v1/me/documents
GET /api/v1/me/documents/:id
POST /api/v1/me/documents/:id/access-url
DELETE /api/v1/me/documents/:id
```

The API generates short-lived signed URLs only after authorization.

Document access must be auditable.

Do not expose permanent public URLs.

---

# 31. Human Help / Advisor

Initial workflow:

```text
POST /api/v1/me/help-requests
GET  /api/v1/me/help-requests
GET  /api/v1/me/help-requests/:id
POST /api/v1/me/help-requests/:id/messages
```

A request can contain:

```text
topic
opportunity
application
question
priority
```

Advisor access requires explicit assignment/delegation.

---

# 32. Notifications

```text
GET /api/v1/me/notifications
PATCH /api/v1/me/notifications/:id
GET /api/v1/me/notification-preferences
PUT /api/v1/me/notification-preferences
```

Possible events:

```text
deadline approaching
saved opportunity updated
application status changed
document verification completed
new relevant opportunity
```

Notification sending belongs to background jobs.

---

# 33. Sources & Provenance

Public users should receive provenance information but not unrestricted administrative source controls.

Example:

```text
GET /api/v1/opportunities/:id/sources
```

Admin:

```text
GET    /api/v1/admin/sources
POST   /api/v1/admin/sources
PATCH  /api/v1/admin/sources/:id
```

Important catalog facts should be traceable to one or more sources as supported by `DATABASE.md`.

---

# 34. Admin Opportunity API

```text
GET   /api/v1/admin/opportunities
POST  /api/v1/admin/opportunities
GET   /api/v1/admin/opportunities/:id
PATCH /api/v1/admin/opportunities/:id
```

Admin operations must preserve provenance.

An administrator editing a verified fact should create/update the appropriate provenance and audit information rather than silently overwriting history.

---

# 35. Eligibility Rule Administration

```text
GET  /api/v1/admin/opportunities/:id/eligibility-rules
POST /api/v1/admin/opportunities/:id/eligibility-rules
GET  /api/v1/admin/eligibility-rules/:id
```

Rule versions are immutable once active/published.

Creating a changed rule creates a new version.

The API must never mutate a historical rule version in place.

---

# 36. Verification API

Admin users may verify catalog information.

Conceptually:

```text
POST /api/v1/admin/opportunities/:id/verify
```

Verification should record:

```text
actor
timestamp
source
verification status
```

The exact provenance workflow is a product decision.

---

# 37. Audit Log

Audit logs are not ordinary user-facing resources.

Administrative/internal endpoints may expose selected audit information:

```text
GET /api/v1/admin/audit-log
```

Audit events include:

```text
document_access
profile_export
admin_change
source_verification
rule_publication
role_change
```

Do not include document contents or sensitive values unnecessarily.

---

# 38. API Security

Required controls:

- managed authentication
- server-side authorization
- Zod validation
- rate limiting
- request size limits
- secure headers
- TLS
- CSRF protection where applicable
- signed URLs for files
- audit logging
- safe error messages

Never trust:

```text
user_id
role
student_id
document_owner_id
```

provided by an untrusted client.

Resolve ownership from authenticated context.

---

# 39. Rate Limits

At minimum, rate-limit:

```text
authentication-related endpoints
search
match recomputation
document upload authorization
help requests
admin endpoints
```

Exact limits should be configured after measuring expected usage.

Assistant/RAG rate limits are not required for MVP because RAG is explicitly outside the initial MVP.

---

# 40. API and Background Jobs

Long-running operations should become jobs.

Potential jobs:

```text
match_recompute
deadline_notification
document_scan
catalog_refresh
embedding_generation (LATER)
```

MVP can use the Postgres-backed queue defined in `ARCHITECTURE.md`.

Do not introduce Kafka/RabbitMQ merely because jobs exist.

---

# 41. API and Search Boundary

The API should call a search service/module:

```text
SearchService
```

not implement search SQL directly inside route handlers.

Conceptual:

```text
HTTP Request
     ↓
Validation
     ↓
SearchService
     ↓
Candidate IDs
     ↓
Opportunity Repository
     ↓
Response DTO
```

This keeps domain logic testable.

---

# 42. API and Matching Boundary

Similarly:

```text
MatchingService
```

owns:

```text
eligibility
fit
confidence
ranking
explanations
```

Route handlers only orchestrate:

```text
authentication
validation
service call
response
```

Do not duplicate matching formulas in frontend code.

---

# 43. API and RAG Boundary — LATER

RAG is not an MVP dependency.

Future API may expose:

```text
POST /api/v1/assistant/conversations
POST /api/v1/assistant/conversations/:id/messages
```

But these endpoints should not be implemented until the RAG architecture is approved.

No RAG tables are required for the MVP.

---

# 44. API and ML Boundary — LATER

ML does not create a new API surface in MVP.

Future learning-to-rank can remain behind:

```text
MatchingService
```

so the external API remains stable:

```text
GET /api/v1/me/matches
```

regardless of whether ranking is:

```text
deterministic
```

or later:

```text
deterministic + ML
```

---

# 45. Caching

Do not introduce Redis on day one.

Cache only after measuring a real bottleneck.

Potential future cache targets:

```text
public catalog pages
frequently used search queries
static reference data
```

Never cache private student data without an explicit security design.

---

# 46. Observability

Every API request should have a request ID.

Logs should include:

```text
request_id
endpoint
status
latency
authenticated actor type
```

Do not log:

```text
passwords
tokens
signed URLs
raw document contents
sensitive profile data
LLM prompts containing private documents
```

The last item is especially important if RAG is added later.

---

# 47. API Versioning

Public API path:

```text
/api/v1
```

Breaking changes require:

```text
/api/v2
```

Internal refactoring does not require a version change if the external contract remains compatible.

---

# 48. OpenAPI

The API should eventually generate an OpenAPI specification.

Source of truth:

```text
docs/openapi.yaml
```

or generated from typed endpoint definitions.

Do not manually maintain two conflicting API contracts.

---

# 49. MVP Endpoint Summary

## Student

```text
GET/PATCH /me/profile
GET/POST/PATCH/DELETE /me/academic-record
GET/POST/PATCH/DELETE /me/languages
GET/PUT /me/budget
GET/PUT /me/funding-preferences
```

## Discovery

```text
GET /opportunities
GET /opportunities/:id
GET /search
GET /opportunities/:id/cycles
GET /opportunities/:id/deadlines
```

## Matching

```text
GET /me/matches
GET /me/matches/:id
POST /me/matches/recompute
```

## Personal organization

```text
GET/POST/DELETE /me/saved-opportunities
GET/POST/GET/DELETE /me/comparisons
```

## Applications

```text
GET/POST /me/applications
GET/PATCH /me/applications/:id
GET/POST/DELETE /me/applications/:id/documents
```

## Documents

```text
GET /me/documents
POST /me/documents/upload-url
GET /me/documents/:id
POST /me/documents/:id/access-url
DELETE /me/documents/:id
```

## Human help

```text
GET/POST /me/help-requests
GET /me/help-requests/:id
POST /me/help-requests/:id/messages
```

## Notifications

```text
GET /me/notifications
PATCH /me/notifications/:id
GET/PUT /me/notification-preferences
```

---

# 50. Future Endpoint Summary

Possible future additions:

```text
POST /assistant/conversations
POST /assistant/conversations/:id/messages

GET /semantic-search
GET /similar-opportunities

GET /me/saved-searches
POST /me/saved-searches

GET /partner/opportunities
POST /partner/applications

GET /admin/analytics
GET /admin/matching-evaluation
```

These are not MVP commitments.

---

# 51. End-to-End Example

User searches:

```text
"Master AI in France with full tuition and living funding"
```

Request:

```text
GET /api/v1/search
```

Search service:

```text
parse explicit filters
      ↓
structured filtering
      ↓
keyword search
      ↓
candidate set
```

User clicks an opportunity:

```text
GET /api/v1/opportunities/:id
```

Then personalized matching:

```text
GET /api/v1/me/matches/:id
```

The matching service evaluates:

```text
eligibility
fit
confidence
ranking
reasons
```

Student saves:

```text
POST /api/v1/me/saved-opportunities
```

Student creates application:

```text
POST /api/v1/me/applications
```

with:

```json
{
  "opportunity_id": "...",
  "application_cycle_id": "..."
}
```

Student uploads transcript:

```text
POST /api/v1/me/documents/upload-url
```

The file is uploaded directly to private object storage.

The application then references the document.

---

# 52. API Design Principle

The API should be:

**thin at the HTTP layer, strict at boundaries, domain-driven internally, secure by default, and stable externally.**

The frontend should not know:

- how eligibility is calculated
- how fit weights are applied
- how search SQL works
- how files are stored
- how ranking is implemented

It should consume stable contracts.

---

# 53. Decisions Required Before Implementation

1. Exact authentication provider.
2. Exact endpoint naming conventions.
3. Pagination strategy for MVP.
4. Exact application status state machine.
5. Exact advisor delegation model.
6. Exact notification channels.
7. Exact API response envelope.
8. Whether search uses GET only or GET + POST for complex queries.
9. OpenAPI generation strategy.
10. Exact rate limits.

These decisions should be approved before implementation where they affect frontend/backend contracts.

---

## Final Principle

The API should expose the platform's capabilities without exposing its internal complexity.

```text
Frontend
   ↓
Stable API
   ↓
Domain Services
   ↓
PostgreSQL / Object Storage / Jobs
```

Future:

```text
Web
Mobile
Partners
   ↓
Same domain/API contracts
```

The MVP remains a modular monolith. No microservices, RAG service, ML service, agent service, or dedicated API infrastructure is required.
