# SECURITY.md - Study Abroad Platform

**Role:** Security, privacy, and abuse-prevention specification  
**Status:** Proposed - MVP v0.1  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ROADMAP.md`, `IMPLEMENTATION_PLAN.md`  
**Scope:** Authentication, authorization, student data privacy, document security, API security, audit logging, secrets, rate limits, backups, testing, AI-agent implementation rules  
**Non-scope:** Full legal compliance program, penetration-test report, vendor-specific security configuration, enterprise compliance certifications

---

## 1. Goal

The platform stores sensitive student data:

```text
identity information
academic history
language records
budget and funding constraints
applications
deadlines
private documents
advisor conversations
match explanations
```

Security must protect students from:

- unauthorized access to their profile
- unauthorized access to their documents
- accidental exposure through logs, URLs, analytics, or AI prompts
- incorrect advisor/admin access
- account abuse
- catalog manipulation
- misleading eligibility or matching claims

The MVP security goal is:

> A student can trust the platform with study-abroad planning data and application documents without those records leaking to other users, advisors, logs, public URLs, or unapproved AI systems.

---

## 2. Critical Pre-Implementation Check

Before implementing security-sensitive code, verify the documentation set.

`DATABASE.md` must contain the actual database schema specification.

If `DATABASE.md` contains matching content, or the approved schema is missing, agents must stop and report:

```text
BLOCKED: database security model cannot be verified without DATABASE.md
```

Do not implement authorization, audit logging, document ownership, or data retention rules against an guessed schema.

---

## 3. Security Principles

The platform must follow these rules:

1. Use managed authentication; do not hand-roll password auth.
2. Enforce authorization on the server, never only in the UI.
3. Resolve identity from authenticated session, not from request body.
4. Treat every student-owned resource as private by default.
5. Store file bytes in private object storage, not in Postgres.
6. Use short-lived signed URLs for document upload and access.
7. Audit sensitive access and admin actions.
8. Validate every external request at the API boundary.
9. Do not log secrets, tokens, signed URLs, document contents, or sensitive profile values.
10. Do not send student documents or sensitive records to an LLM in MVP.
11. Do not use an LLM for eligibility, ranking, authorization, fraud detection, or document access decisions.
12. Prefer simple, testable controls over complex infrastructure.

---

## 4. Trust Boundaries

### Trusted Server Boundary

Trusted code runs in:

```text
Next.js route handlers
server actions
application services
domain services
background workers
database migrations
```

### Untrusted Inputs

Always treat these as untrusted:

```text
browser requests
request bodies
query parameters
headers except trusted auth/session headers
uploaded filenames
uploaded MIME types
document metadata
admin form inputs
advisor messages
student messages
search queries
webhook payloads
```

### External Systems

External systems must be wrapped by adapters:

```text
managed auth provider
object storage
email provider
payment provider later
LLM provider later
analytics provider later
```

Application code must not scatter provider-specific logic across domain modules.

---

## 5. Data Classification

### Public Data

Public or broadly visible:

```text
published opportunity catalog
university names
program names
scholarship names
verified public source URLs
public deadlines
public eligibility requirements
```

Even public data must preserve provenance and verification state.

### Private Student Data

Private to the student and authorized platform roles:

```text
student profile
academic records
languages
budget
funding preferences
saved opportunities
comparisons
applications
application notes
deadline preferences
notifications
help requests
advisor messages
match results tied to a student
```

### Highly Sensitive Data

Requires stricter access controls and audit logging:

```text
identity documents
passports
national ID cards
transcripts
diplomas
bank or funding proof
recommendation letters
private application documents
signed URLs
document storage keys
profile exports
admin role changes
advisor delegation changes
```

Highly sensitive data must never be exposed in logs or analytics.

---

## 6. Authentication

Use a managed authentication provider.

Acceptable MVP options:

```text
Auth.js / NextAuth
Clerk
Supabase Auth
other approved managed auth
```

Do not implement:

```text
password hashing
password reset tokens
MFA flows
OAuth token storage
session security
```

manually unless the chosen auth framework requires a narrowly scoped adapter.

Authentication must provide:

- stable authenticated user ID
- session validation on server routes
- logout
- account lifecycle hooks if needed
- secure cookie/session handling

Open decision before implementation:

```text
Exact auth provider
```

---

## 7. Roles And Authorization

Initial roles:

```text
STUDENT
ADVISOR
ADMIN
```

Authorization must be enforced in application services or route handlers before data access.

### Student

Can:

- manage own profile
- manage own academic records
- manage own language records
- manage own budget and preferences
- view public catalog
- run searches
- view own matches
- save opportunities
- manage own comparisons
- manage own applications
- manage own documents
- manage own notifications
- create help requests

Cannot:

- access another student's profile
- access another student's applications
- access another student's documents
- assign advisors
- modify catalog verification
- modify eligibility rule versions
- inspect audit logs

### Advisor

Can only access student data through explicit assignment or delegation.

Advisor access must be scoped by:

```text
student
application or help request where possible
allowed data category
assignment status
time window where applicable
```

Advisor access must be auditable.

Open decision before implementation:

```text
Exact advisor delegation model
```

### Admin

Can:

- manage catalog
- manage sources
- manage verification status
- manage eligibility rule versions
- inspect audit logs
- support users where approved
- manage roles where approved

Admin access must not bypass audit logging.

Admins should not casually browse student documents. Document access by admin requires a logged reason.

---

## 8. Ownership Rules

Never trust these fields from a client:

```text
user_id
student_id
advisor_id
admin_id
role
document_owner_id
application_owner_id
```

The server must derive ownership from:

```text
authenticated session
platform user record
student/advisor/admin record
resource ownership in database
approved advisor assignment
approved admin permission
```

Every private endpoint must answer:

```text
Who is the actor?
What resource are they accessing?
What action are they taking?
Why are they allowed?
Should this be audited?
```

---

## 9. API Security

Every `/api/v1` endpoint must have:

- authentication where required
- authorization checks
- Zod or equivalent request validation
- controlled response envelope
- consistent error format
- no stack traces in responses
- request ID for support/debugging
- safe pagination limits on collections
- whitelisted sort fields
- idempotency keys for retryable side effects

High-risk endpoints:

```text
POST /api/v1/me/documents/upload-url
POST /api/v1/me/documents/:id/access-url
GET /api/v1/me/documents/:id
GET/PATCH /api/v1/me/profile
GET/PATCH /api/v1/me/applications/:id
POST /api/v1/me/help-requests
POST /api/v1/me/matches/recompute
admin endpoints
auth endpoints
```

These require explicit security tests.

---

## 10. Input Validation

Validate at the boundary.

Validation must cover:

```text
IDs
enum values
dates
currency codes
amounts
budget period
budget scope
language levels
pagination limits
sort fields
file MIME types
file sizes
URL fields for sources
eligibility rule JSON
notification preferences
application status transitions
```

Do not allow arbitrary database columns in:

```text
sort
filter
eligibility rules
search ranking
admin edits
```

Validation failure should return:

```text
400 or 422
VALIDATION_ERROR
field-level details
request_id
```

---

## 11. Document Security

Documents are the highest-risk MVP area.

### Storage

Rules:

- Store file bytes in private object storage.
- Store metadata only in Postgres.
- Never make buckets public.
- Never expose permanent public URLs.
- Use short-lived signed URLs.
- Store object keys as internal secrets, not user-facing IDs.

### Upload Flow

Approved flow:

```text
1. Student requests upload URL.
2. API authenticates student.
3. API validates document metadata.
4. API creates document row with pending status.
5. API returns short-lived signed upload URL.
6. Client uploads directly to private object storage.
7. Background job scans/validates file.
8. Document becomes usable only after passing validation.
```

### Download Flow

Approved flow:

```text
1. Actor requests document access URL.
2. API authenticates actor.
3. API checks ownership or advisor/admin authorization.
4. API writes audit event.
5. API returns short-lived signed download URL.
```

### Document Statuses

Initial statuses:

```text
PENDING_UPLOAD
UPLOADED
SCANNING
CLEAN
REJECTED
DELETED
```

Exact names may follow `DATABASE.md`.

### Validation

Validate:

```text
allowed MIME type
extension consistency
maximum file size
document category
application association
student ownership
malware scan status
```

Never rely only on client-provided MIME type.

---

## 12. Audit Logging

Audit logs must record sensitive actions.

Minimum events:

```text
document_upload_url_created
document_access_url_created
document_deleted
profile_viewed_by_advisor
profile_exported
application_viewed_by_advisor
advisor_assigned
advisor_removed
admin_catalog_change
admin_source_change
eligibility_rule_published
role_changed
verification_status_changed
login_security_event where available
```

Audit event fields:

```text
event_type
actor_user_id
actor_role
target_type
target_id
student_id where applicable
request_id
timestamp
ip_hash or coarse IP metadata where approved
user_agent_hash where approved
reason where required
metadata without sensitive values
```

Do not store:

```text
document contents
signed URLs
access tokens
passwords
raw secrets
full private messages unless the message itself is the audited object
unnecessary sensitive profile values
```

Audit logs should be append-only at the application level.

---

## 13. Logging And Observability

Logs should support debugging without leaking private data.

Allowed log fields:

```text
request_id
endpoint
method
status
latency
actor type
resource type
error code
job type
```

Forbidden log fields:

```text
passwords
tokens
session cookies
signed URLs
object storage keys
raw document contents
document text
private profile details
academic record values
student budget values unless explicitly redacted/aggregated
advisor messages
LLM prompts containing private data
```

Use structured logs where possible.

Errors sent to monitoring must be scrubbed.

---

## 14. Secrets Management

Secrets must live in environment variables or a managed secrets system.

Never commit:

```text
DATABASE_URL
auth secrets
OAuth client secrets
object storage access keys
email provider API keys
LLM provider API keys
webhook signing secrets
encryption keys
```

The repository may include:

```text
.env.example
```

with variable names only.

Required secret categories:

```text
database
auth
object storage
email provider
monitoring
deployment
LLM provider later
```

Rotate secrets after:

- suspected exposure
- employee/contractor offboarding where relevant
- provider compromise
- accidental commit
- production incident

---

## 15. Rate Limiting And Abuse Protection

Rate-limit at least:

```text
auth endpoints
search
match recomputation
document upload URL creation
document access URL creation
help request creation
advisor messaging
admin endpoints
notification preference updates
```

MVP rate limits can be conservative and adjusted later.

Example policy shape:

```text
actor
endpoint group
window
limit
burst allowance
response code 429
```

Do not add Redis solely for rate limiting in MVP unless the deployed platform requires it. Prefer a simple database-backed or provider-supported mechanism first.

---

## 16. CSRF, Cookies, And Browser Security

If the app uses cookie-based sessions:

- protect unsafe methods against CSRF
- use `HttpOnly` cookies
- use `Secure` cookies in production
- use `SameSite=Lax` or stricter where compatible
- set proper session expiration

Security headers should include:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors or X-Frame-Options
```

CSP must be compatible with Next.js and any approved auth/storage providers.

---

## 17. Data Privacy And Minimization

Collect only what the MVP needs.

Do not collect:

```text
health data
religion
political views
unnecessary family data
unnecessary financial documents
```

unless a specific application workflow requires it and the product approves it.

Student profile fields should be justified by:

```text
search
eligibility
matching
application tracking
advisor help
```

Private documents should exist because an application needs them, not because the platform is a generic document vault.

---

## 18. Data Retention And Deletion

MVP must support at least:

```text
student document deletion
student account deletion request workflow
application data deletion or retention policy
profile export later
audit log retention policy
```

Deleting a document must delete or render inaccessible:

```text
document metadata where appropriate
object storage file
application-document association
future access URLs
```

Audit logs may retain deletion events without retaining document contents.

Open decisions:

```text
exact account deletion retention period
exact audit log retention period
exact application record retention period
```

---

## 19. Backups And Recovery

Backups are part of security.

MVP requirements:

- automated encrypted Postgres backups
- backup restore test before launch
- documented recovery steps
- object storage versioning or deletion protection where feasible
- separation between staging and production data
- no production data copied to local/dev without approval and sanitization

Untested backups do not count as a launch-ready backup strategy.

---

## 20. Admin Security

Admin features are high risk.

Admin endpoints must require:

```text
authenticated admin role
server-side authorization
request validation
audit logging
rate limiting or monitoring
safe error responses
```

Admin actions requiring audit:

```text
catalog create/update
source create/update
verification status change
eligibility rule publication
deadline change
role change
student support access
document access
advisor assignment
```

Admin UI must not make dangerous bulk changes without confirmation and audit.

---

## 21. Advisor Security

Advisor access is not the same as admin access.

An advisor can only see:

```text
assigned students
assigned help requests
assigned applications
documents explicitly needed for that assistance
messages in assigned threads
```

Advisor must not see:

```text
all students
all documents
all applications
admin tools
audit logs
role management
```

Every advisor access to sensitive student data should be attributable.

---

## 22. Matching And Eligibility Security

Eligibility and matching affect student decisions, so integrity matters.

Rules:

- Eligibility must be deterministic.
- Historical eligibility rule versions must not be mutated.
- Match results must reference rule/scoring versions.
- LLMs must not decide eligibility.
- Missing data must not become a positive match.
- Unknown funding must not be treated as full coverage.
- Admin changes to eligibility rules must be audited.

Security risk:

```text
catalog or rule manipulation can mislead students
```

Therefore, eligibility rule publication must require admin authorization and audit logging.

---

## 23. Catalog Integrity And Provenance

Catalog integrity is a security and trust issue.

Important facts need provenance:

```text
tuition
scholarship amount
coverage
deadline
eligibility requirement
required documents
program language
application cycle
source URL
verified_at
verification_status
```

Admin edits to verified facts must not silently overwrite history.

If the source is stale or missing, the UI should show uncertainty instead of a false claim.

---

## 24. Background Jobs Security

Background jobs may process sensitive data.

Job types:

```text
deadline notifications
document scanning
match recomputation
catalog maintenance
email sending
```

Rules:

- Jobs must run with least necessary access.
- Job logs must not include private data.
- Failed jobs should record safe failure metadata.
- Retried jobs must be idempotent where possible.
- Document scanning must not mark files usable until validation passes.

Do not introduce Kafka, RabbitMQ, or Redis for MVP jobs unless a measured requirement appears and architecture is updated.

---

## 25. Email And Notifications

Email may expose private information.

Notification content should be minimal.

Safe example:

```text
You have an upcoming application deadline.
```

Risky example:

```text
Your passport and bank statement for [specific program] are missing.
```

Email must not include:

```text
document links without authentication
signed document URLs
sensitive academic details
private advisor messages
unnecessary application details
```

Emails should link the user back to the authenticated app.

---

## 26. AI, RAG, And LLM Security - Later

RAG and AI assistants are not MVP implementation tasks.

When added later, they require a separate security review covering:

```text
prompt injection
source grounding
retrieval permissions
student document handling
LLM provider data policy
PII redaction
token cost abuse
conversation retention
citation accuracy
assistant refusal behavior
```

Until that review exists:

- do not send student documents to LLMs
- do not send private profile data to LLMs
- do not use LLMs for eligibility
- do not use LLMs for authorization
- do not use LLMs for ranking
- do not implement autonomous agents

---

## 27. Security Test Plan

Security tests must be part of the MVP, not a final afterthought.

### Auth Tests

```text
unauthenticated user cannot access /me endpoints
expired session is rejected
role is loaded server-side
client-provided role is ignored
```

### Authorization Tests

```text
student cannot access another student's profile
student cannot access another student's application
student cannot access another student's saved opportunities
student cannot access another student's comparison
advisor cannot access unassigned student
non-admin cannot access admin endpoint
```

### Document Tests

```text
student cannot access another student's document metadata
student cannot create access URL for another student's document
signed URLs expire
public object URL does not work
file size limits are enforced
MIME allowlist is enforced
document access creates audit event
```

### API Validation Tests

```text
invalid IDs rejected
invalid enums rejected
unsafe sort fields rejected
pagination limit enforced
invalid budget period/scope rejected
invalid eligibility rule JSON rejected
```

### Admin Tests

```text
admin action creates audit event
eligibility rule version cannot be mutated after publication
verified catalog fact cannot be changed without provenance update
role change is audited
```

### Logging Tests

```text
signed URL not logged
document content not logged
token not logged
safe error returned without stack trace
```

---

## 28. Security Acceptance Criteria By MVP Area

### Student Profile

```text
[ ] private by default
[ ] owned by authenticated student
[ ] advisor access requires delegation
[ ] validation at API boundary
[ ] sensitive values not logged
```

### Catalog

```text
[ ] public reads are safe
[ ] admin writes require admin role
[ ] important facts require provenance
[ ] verification changes are audited
```

### Search

```text
[ ] safe pagination limits
[ ] whitelisted filters/sorts
[ ] search does not expose private student data
[ ] search analytics do not store unnecessary PII
```

### Eligibility And Matching

```text
[ ] deterministic engine
[ ] no LLM decisions
[ ] rule versions immutable
[ ] match results tied to authenticated student
[ ] recompute endpoint rate-limited
```

### Applications

```text
[ ] owned by authenticated student
[ ] cycle-specific deadlines
[ ] status changes validated
[ ] notes private
```

### Documents

```text
[ ] private object storage
[ ] signed URLs only
[ ] access authorized and audited
[ ] no document bytes in DB
[ ] no document contents in logs
```

### Human Help

```text
[ ] student owns request
[ ] advisor assignment required
[ ] messages visible only to participants
[ ] sensitive accesses auditable
```

---

## 29. Agent Rules For Security-Sensitive Tasks

AI coding agents must never:

```text
disable auth to make a test pass
skip authorization because route is hidden in UI
trust IDs from request body for ownership
make document buckets public
return permanent file URLs
log tokens or signed URLs
store document bytes in Postgres
send student documents to an LLM
mutate published eligibility rule versions
remove validation to simplify implementation
remove tests to pass CI
```

Security-sensitive task output must include:

```text
files changed
endpoints affected
authorization checks added/changed
validation added/changed
audit events added/changed
tests run
remaining risks
OPEN DECISIONS
```

---

## 30. Security Review Checklist Before Launch

Before MVP launch:

```text
[ ] Auth provider selected and configured
[ ] Private endpoints require authentication
[ ] Student ownership tests pass
[ ] Advisor delegation model approved and tested
[ ] Admin role checks tested
[ ] Document signed URL flow tested
[ ] Object storage bucket is private
[ ] Sensitive logs scrubbed
[ ] Audit logging works for sensitive actions
[ ] Request validation exists on all public/private APIs
[ ] Rate limits configured or explicitly accepted as risk
[ ] Backups configured
[ ] Restore tested
[ ] Secrets not committed
[ ] Production env vars documented
[ ] Security headers configured
[ ] CSRF handled if using cookie sessions
[ ] E2E negative authorization tests pass
```

---

## 31. Open Decisions

These must be approved before implementation reaches the related area:

```text
Exact auth provider
Exact advisor delegation model
Exact admin support-access policy
Exact rate limits
Exact document MIME/type allowlist
Exact maximum document size
Exact malware scanning mechanism
Exact audit log retention period
Exact account deletion retention policy
Exact backup restore objective
Exact production logging/monitoring provider
Exact CSP external domains
```

---

## 32. Final Principle

The security model should be boring, strict, and testable.

Build:

```text
managed auth
server-side authorization
private documents
signed URLs
audit logs
validated APIs
safe logs
tested ownership
```

before adding:

```text
RAG
agents
ML ranking
partner integrations
advanced analytics
```

Trust is a core product feature. If students cannot trust the platform with their profile, documents, deadlines, and applications, the rest of the product does not matter.
