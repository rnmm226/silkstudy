# ARCHITECTURE.md — Study Abroad Platform

**Role:** Principal Software Architect
**Status:** Proposed (v0.1 — greenfield, no prior decisions to reconcile)
**Scope:** Stack, database, storage, deployment, security, API, search, RAG, ML roadmap, AI providers, costs
**Non-scope:** No code in this document.

---

## 1. Goal

Design the smallest, most boring architecture capable of taking a student from **discover → understand → verify → compare → decide → prepare → apply → track → get human help**, without over-building AI/ML infrastructure the product doesn't yet need.

The architecture must optimize for:
1. **Trust** — every fact the platform shows is traceable to a source and a verification date.
2. **Explainability** — every match/recommendation has a visible reason.
3. **Cheap to run pre-revenue**, cheap to operate at moderate scale (thousands, not millions, of students in year one).
4. **Swappable AI layer** — no hard lock-in to one model provider.
5. **Low operational surface** — one team, no dedicated SRE/infra function yet.

## 2. Requirements (derived from the product brief)

**Functional**
- Student profile (academic record, goals, budget, languages, constraints).
- Opportunity catalog (universities, programs, scholarships, alternance, Tunisian private ed).
- Eligibility checking, fit scoring, ranking — each independently explainable.
- Comparison of opportunities side by side.
- Document management (transcripts, ID, motivation letters) with strict privacy.
- Application tracking with deadlines/notifications.
- Conversational assistant for Q&A over official requirements (RAG), not a general chatbot.
- Escalation path to a human advisor.

**Non-functional**
- Multilingual (French/Arabic/English) content and assistant responses.
- Data provenance on every "fact" (source, URL, verification status, last verified date).
- Auditable: who saw what recommendation and why, for support and for our own QA.
- Must survive with a small team: minimal moving infrastructure parts.

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Language/runtime | TypeScript everywhere (Next.js frontend + Node.js backend) | One language across the stack lowers hiring/context-switching cost for a small team; strong typing helps with a data-heavy domain (eligibility rules, matching). |
| Framework | Next.js (App Router) for web app; a plain Node.js (NestJS or Fastify) service for the core API if/when the API needs to be consumed by more than the web app | Start with Next.js API routes / server actions for MVP. Split out a dedicated API service only when a second client (mobile, partner integration) is real, not hypothetical. |
| Database | PostgreSQL (single instance, managed) | See §4. |
| ORM | Prisma (already in your toolchain) | Type-safe schema, migrations, works cleanly with Postgres + pgvector via raw SQL extensions where needed. |
| Background jobs | Postgres-backed queue (e.g. pg-boss) or a lightweight worker process, not a separate message broker | Deadline reminders, notification sends, document scans, embedding generation are the workloads. None require Kafka/RabbitMQ-scale throughput. Avoid adding Redis/SQS until job volume actually demands it. |
| Cache (optional, later) | Redis, added only when a measured bottleneck justifies it | Do not provision on day one. |
| File storage | S3-compatible object storage (AWS S3 or a cheaper compatible provider — see §5) | Private buckets, signed URLs. |
| Search | Postgres full-text search (tsvector) first; pgvector added when semantic search is justified | See §9. |
| Hosting | Single modular monolith deployed as containers (Docker), on a managed platform (Railway/Render/Fly.io) initially, migratable to AWS/GCP/Azure when scale or compliance demands it | See §7. |
| Auth | Managed auth (e.g. Auth.js/NextAuth, or a hosted provider like Clerk/Supabase Auth) rather than hand-rolled auth | Session/password/OAuth handling is a solved, security-sensitive problem; don't reinvent it. |
| CI/CD | GitHub Actions | Matches GitHub-hosted repo, no new tooling. |
| Observability | Managed logging/error tracking (e.g. Sentry) + platform-native metrics | Don't stand up a custom observability stack pre-scale. |

**Architectural style: modular monolith.** One deployable Next.js/Node application, internally organized into clear modules (`profiles`, `catalog`, `matching`, `documents`, `applications`, `assistant`, `notifications`, `admin`). Modules communicate through well-defined internal service interfaces, not HTTP calls to themselves — this preserves the option to extract a module into its own service later *if* a real scaling or team-ownership reason appears, without paying the distributed-systems tax today.

## 4. Database

**PostgreSQL, single managed instance**, with logical separation via schemas rather than separate databases.

Core domains (as schemas or well-namespaced tables, not microservice-per-table):
- `students` — profile, academic history, constraints, preferences.
- `catalog` — universities, programs, scholarships, alternance opportunities, each with `source_url`, `verified_at`, `verification_status`.
- `eligibility_rules` — structured, versioned rules per opportunity (not embedded in prose) so eligibility can be computed deterministically.
- `matches` — computed eligibility/fit/rank results per student, each row carrying the *reasons* (structured, not just a score) that produced it — this is what makes recommendations explainable.
- `documents` — metadata only (see §5 for actual file storage).
- `applications` — tracked applications, statuses, deadlines.
- `conversations` — assistant sessions, for RAG grounding and audit, retained under a data-minimization policy.
- `audit_log` — who/what/when for sensitive actions (document access, profile export, admin actions).

**Why one Postgres instance, not polyglot persistence:**
- The workload (structured records + moderate full-text/vector search) fits Postgres natively via `pg_trgm`, `tsvector`, and `pgvector`.
- Cross-domain queries (e.g., "students whose profile matches these eligibility rules") are simpler and more consistent inside one relational engine than joined across services.
- Operational simplicity: one backup policy, one migration tool (Prisma), one connection pool to manage.
- If a specific workload later proves Postgres insufficient (e.g., vector search at very large catalog scale), that becomes a targeted, justified exception — not a starting assumption.

**Migrations:** Prisma migrations, reviewed like code, applied via CI/CD — never manual production schema edits.

**Data provenance is structural, not incidental:** every table that stores a "fact" a student relies on (program requirements, scholarship amounts, deadlines) carries `source_url`, `verified_by`, `verified_at`. The application layer refuses to display a fact without provenance rather than silently falling back to an unverified value.

## 5. Storage (files/documents)

Object storage (S3-compatible), never the database, for actual file bytes.

- **Private by default.** No bucket or object is public. All access via short-lived **signed URLs**, generated per-request, scoped to the authenticated student who owns the document (or an authorized advisor/admin with a logged reason).
- **Encryption at rest** (provider-managed, e.g. SSE-S3/SSE-KMS) and in transit (TLS only).
- **File validation** on upload: strict MIME/type allowlist, size limits, filename sanitization, re-encoding of images where feasible to strip embedded payloads.
- **Malware scanning** on upload before a file is marked usable (ClamAV as a background job, or a managed scanning API) — an uploaded file is quarantined until scanned clean.
- **Metadata in Postgres, bytes in object storage** — the `documents` table never stores raw file content.
- **Retention & deletion:** documents tied to a clear retention policy (e.g., deleted N months after account closure or on explicit student request), with deletion cascading from object storage, not just the DB row.
- **Versioning:** enabled at the bucket level for accidental-overwrite protection; not exposed as a product feature unless there's a real need (e.g. resubmission history).
- **Minimize collection:** don't store a document type unless a specific tracked application actually requires it. Do not build a general-purpose "vault."

## 6. Security

- **AuthN/AuthZ:** managed auth provider; role-based access (student / advisor / admin) enforced at the API layer, not just in the UI. Every document/profile access checks ownership or an explicit, logged delegation (advisor assisting a student).
- **Secrets:** environment-based, injected by the deployment platform or a secrets manager (never committed, never hardcoded — per the coding rules already in force).
- **Transport:** TLS everywhere, HSTS, no mixed content.
- **Input validation:** schema validation (e.g. Zod) at every API boundary, especially on anything feeding eligibility rules or the assistant's context window (prompt-injection surface — see §8).
- **PII minimization:** collect the minimum profile data required for matching; keep sensitive documents (national ID, transcripts) in the restricted `documents` flow, never inlined into logs, analytics events, or LLM prompts unless strictly necessary for that turn.
- **Audit logging:** all document access, profile exports, and admin overrides logged with actor, timestamp, reason.
- **Rate limiting & abuse protection** on public endpoints (signup, assistant) to control both cost and abuse.
- **Backups:** automated encrypted Postgres backups, periodically tested restores (untested backups are not backups).
- **Compliance posture:** design for GDPR-equivalent principles (right to access/export/delete) from day one even though the initial user base is Tunisian — Tunisian students studying abroad implies EU-adjacent data handling expectations, and it's cheap to build in now versus retrofit later.

## 7. Deployment

**MVP:** containerized (Docker) modular monolith on a managed PaaS (Railway, Render, or Fly.io) — managed Postgres add-on from the same or a dedicated provider (e.g. Neon/Supabase for Postgres+pgvector out of the box), object storage from a low-cost S3-compatible provider (Cloudflare R2 or Backblaze B2 to avoid AWS egress costs).

- **Environments:** local → staging → production, same container image promoted through environments (build once, deploy everywhere).
- **CI/CD:** GitHub Actions runs tests + typecheck + build on every PR; deploy to staging on merge to main; production deploy is a manual promote (or gated on a tag), not automatic, until the team has confidence in the pipeline.
- **Background jobs** run as a second process/service from the same codebase (same container image, different entrypoint), not a separate infrastructure stack.
- **Migration path to hyperscale (AWS/GCP/Azure):** deferred until a concrete trigger — compliance requirement from a partner institution, cost crossover point, or scale the PaaS can't handle. The modular-monolith + Postgres design does not block this migration; it just avoids paying for it prematurely.

**Why not Kubernetes / microservices from day one:** the team is small, the traffic is modest, and the product principle ("simplest architecture capable of solving the problem") explicitly rules this out absent a demonstrated need.

## 8. API

- **Style:** REST-ish JSON API (internal, consumed first by the Next.js frontend via server actions/route handlers; exposed as a documented API only when an external consumer — partner university, mobile app — actually exists).
- **Versioning:** path-based (`/api/v1/...`) from the start, even with one consumer, so breaking changes don't require a big-bang migration later.
- **Contracts:** request/response schemas validated with Zod (or similar), generated OpenAPI spec kept in `docs/API.md` as the source of truth for anything external.
- **Errors:** consistent error shape (code, message, field-level validation errors) — this matters more than it sounds once the assistant and frontend both need to interpret failures.
- **Idempotency:** write endpoints that trigger side effects (document upload, application submission) accept idempotency keys to survive retries safely.

## 9. Search

Layered, per the product's own AI/ML principle — **do not skip stages**:

1. **Structured filters first.** Country, degree level, language, budget range, field of study — these are exact-match/range queries on indexed Postgres columns. This alone answers most "find me programs" queries and requires no AI at all.
2. **Keyword search second.** Postgres full-text search (`tsvector`/`tsquery`, `pg_trgm` for fuzzy matching on program/university names) for free-text queries ("computer science Germany English taught"). This is sufficient for a catalog of a few thousand to tens of thousands of opportunities.
3. **Vector/semantic search — only when justified.** Add `pgvector` on top of the same Postgres instance when keyword search demonstrably fails on real user queries (e.g., "programs like X but cheaper" or matching a free-text student essay against program descriptions). Store embeddings as a column alongside the structured row, not in a separate vector database — pgvector is sufficient at this data scale (tens of thousands, not tens of millions, of rows) and avoids a second system to operate and keep in sync.
4. **A dedicated vector database (Pinecone/Weaviate/Qdrant)** is deferred indefinitely unless the catalog grows by orders of magnitude or query latency/throughput on pgvector is measured (not assumed) to be insufficient.

Search and the recommendation/ranking system (§10) share the same underlying signals but serve different purposes: search answers "what's out there," ranking answers "what's best for *this* student."

## 10. Recommendation & Ranking (Eligibility → Fit → Rank)

Kept strictly separate, per product principle, and computed deterministically for MVP:

- **Eligibility** — hard boolean/rule-based gate (GPA threshold, language certificate, nationality restriction), evaluated against `eligibility_rules`. A student either can or cannot apply; this must never be an ML guess.
- **Fit** — a transparent weighted score (budget match, language match, field match, location preference) with each weight and contribution visible to the student ("this scored high on budget fit, medium on language fit").
- **Ranking** — ordering compatible opportunities by fit score, with ties broken by deterministic, disclosed rules (e.g., deadline proximity).

**ML is explicitly deferred** until there is enough interaction data (applications, outcomes, saved/dismissed opportunities) to train a learning-to-rank model that outperforms the deterministic baseline — and even then, it augments ranking, not eligibility. This is a §10 "LATER" item, not MVP scope.

## 11. RAG (Retrieval-Augmented Generation)

Used narrowly, per the product's own constraint:

**In scope for RAG:**
- Answering "what does this program actually require / how do I apply" grounded in official program/scholarship documents.
- Summarizing/explaining a specific document the student uploaded (their own transcript against a program's stated requirements) or an official source (retrieved program PDF).
- Assistant answers always cite the specific source and its `verified_at` date; if retrieval finds nothing grounded, the assistant says so rather than generating an unsupported answer.

**Explicitly out of scope for RAG:**
- Eligibility and ranking decisions — those stay deterministic and structured (§10). RAG explains a decision; it does not make one.
- General open-domain chatbot behavior.

**Design:** retrieval over the same Postgres/pgvector store used for search (no separate RAG-specific infrastructure). Chunking and embedding happen as a background job whenever a catalog document is added or updated, with `verified_at` propagated into the chunk metadata so the assistant can express "as of [date]" alongside every grounded answer.

**Agents:** not used in MVP. If a future workflow genuinely needs multi-step autonomous tool use (e.g., "check three scholarship sites and compile a report"), that gets proposed and justified individually under the architectural-change rule — it is not a default capability of the assistant.

## 12. ML Roadmap

| Stage | Trigger to enter this stage | What it adds |
|---|---|---|
| 0 — Structured + rules (MVP) | Launch | Filters, deterministic eligibility, weighted fit scoring |
| 1 — Keyword search | Launch | Postgres full-text search |
| 2 — Semantic search | Keyword search measurably fails on real queries | pgvector embeddings on catalog content |
| 3 — RAG assistant | Students need grounded Q&A beyond browsing/filtering | Retrieval + LLM, scoped as in §11 |
| 4 — Learning-to-rank | Sufficient logged outcomes (applications submitted, accepted, dismissed) exist — realistically 6–12+ months of real usage | ML-adjusted ranking on top of, not replacing, the deterministic fit score |
| 5 — Predictive features (e.g., admission-likelihood modeling) | Only if validated demand and enough labeled outcome data exists; requires its own accuracy/fairness review | Not committed to in this roadmap — a candidate, not a plan |
| 6 — Agents | A specific, narrow, justified multi-step workflow is identified and can't be solved by RAG + deterministic logic | Proposed individually, never by default |

Each stage requires the previous stage's data/signal to already exist — this roadmap is intentionally sequential, matching the layered principle in the brief.

## 13. AI Providers

Design for **interchangeability**, not lock-in: an internal `AIProvider` interface (prompt in, structured response out) abstracts the actual vendor, so switching providers is a configuration change, not a rewrite.

| Provider | Strengths for this product | Watch-outs |
|---|---|---|
| Anthropic (Claude) | Strong instruction-following and grounded/citation-style answers, good fit for the "explain, don't hallucinate" RAG use case | Cost at scale; evaluate smaller models for high-volume, low-complexity tasks |
| OpenAI | Broad ecosystem, strong multilingual performance, competitive embeddings | Same cost consideration; data-handling terms should be reviewed against student-data sensitivity |
| Google (Gemini) | Competitive pricing tiers, strong multilingual (relevant for French/Arabic) | Newer in some enterprise-trust workflows; evaluate case by case |
| Open-weight/local models (e.g., via a self-hosted or hosted-open-weight endpoint) | Lower marginal cost at scale, more control over data residency | Higher operational burden; only worth it once volume justifies the ops cost, or if a specific privacy/compliance need requires it |

**Evaluation axes for any provider/model choice:** answer quality on real (French/Arabic/English) student queries, cost per query at projected volume, latency, data-handling/privacy terms, and availability/rate limits — never "it's currently free." Free tiers and pricing are call-time decisions revisited quarterly, not architectural commitments; the abstraction layer exists specifically so this choice can change without touching the rest of the system.

**Embeddings:** can come from a different provider than the chat/completion model — optimize each independently (embeddings are commodity-ish and cheap; pick for multilingual quality and price).

## 14. Costs (directional, MVP-scale)

Order-of-magnitude only — real numbers depend on final provider choices and actual usage, and should be revisited before committing spend.

| Category | MVP approach | Cost driver to watch |
|---|---|---|
| Compute/hosting (PaaS) | Small container(s) on Railway/Render/Fly | Scales with traffic; cheap at low usage (tens of dollars/month range) |
| Database | Managed Postgres (with pgvector) — Neon/Supabase/RDS | Storage + connection count; catalog + student data is small relative to typical SaaS |
| Object storage | Cloudflare R2 or Backblaze B2 over AWS S3 | R2/B2 avoid egress fees, which matter once signed-URL document downloads scale |
| Auth | Managed auth provider, free/low tier at MVP user counts | Per-active-user pricing kicks in at scale — monitor |
| LLM/embeddings | Pay-per-token across RAG assistant + embedding generation | Dominant *variable* cost once the assistant ships; needs per-query budget caps and caching of repeated/common queries |
| Malware scanning | Background job using an open-source scanner or low-cost API | Scales with document upload volume |
| Observability | Free/low tier of a managed tool (e.g. Sentry) | Fine until log/event volume is significant |

**The single biggest controllable cost risk is uncapped LLM usage** (RAG assistant + embeddings), not infrastructure. Mitigations designed in from the start: cache embeddings (compute once per catalog document, not per query), cap assistant context size, rate-limit assistant usage per student, and prefer retrieval-plus-small-model for routine Q&A over always calling the most capable/expensive model.

## 15. Explicitly Rejected (for now)

To make the "no AI hype" principle concrete:

- **Dedicated vector database** — rejected; pgvector is sufficient at current/foreseeable scale (§9).
- **Microservices** — rejected; modular monolith is sufficient for one team, one product surface (§3).
- **Message broker (Kafka/RabbitMQ)** — rejected; Postgres-backed background jobs handle the actual workload (§3).
- **Agentic multi-step AI workflows** — rejected for MVP; RAG + deterministic rules cover the identified use cases (§11).
- **Predictive admission-likelihood ML** — rejected for now; no labeled outcome data exists yet to train or validate it responsibly (§12).
- **Kubernetes** — rejected; a managed PaaS is sufficient until a specific, demonstrated scaling need appears (§7).

---

## 16. Next Recommended Task

Write `docs/DATABASE.md` with the concrete Postgres schema (tables, keys, indexes) implementing §4 and §10, since eligibility/fit/rank explainability depends on getting the `matches` table's structure right before any API or UI work begins.
