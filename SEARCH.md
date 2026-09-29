# SEARCH.md — Study Abroad Platform

**Role:** Search & Discovery Specification  
**Status:** Proposed — v0.1  
**Scope:** Opportunity discovery, structured filters, keyword search, semantic search, candidate retrieval, search UX, provenance-aware results  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`, `MATCHING.md`  
**Non-scope:** Eligibility decision logic, final recommendation ranking, RAG, ML ranking, agent workflows

---

## 1. Goal

The search system answers:

> **"What opportunities exist that match what I am looking for?"**

Search and matching are related but different.

### Search

Finds a useful **candidate set**.

### Matching

Determines which candidates are the best fit for a specific student.

The pipeline is:

```text
User Query
    |
    v
Query Understanding
    |
    v
Structured Filters
    |
    v
Keyword Search
    |
    v
Optional Semantic Search
    |
    v
Candidate Set
    |
    v
Matching Engine
    |
    v
Personalized Ranking
```

The search engine must never claim that a search result is eligible merely because it matched the query.

---

# 2. Core Principles

## 2.1 Structured data first

The system should prefer exact structured filtering whenever the user's request contains explicit constraints.

Examples:

```text
France
Master
Computer Science
English
Tuition <= €5,000/year
Scholarship
```

These should become database filters instead of being sent directly to an LLM.

---

## 2.2 Search must be deterministic where possible

The same query, catalog state, and filters should produce the same candidate set.

Randomness should not be introduced into basic search.

---

## 2.3 Search is not recommendation

A search result means:

> "This opportunity matches your search criteria."

It does not mean:

> "This is the best opportunity for you."

The latter belongs to `MATCHING.md`.

---

## 2.4 Source quality matters

Search results should expose:

- source
- verification status
- last verified date
- relevant deadline
- whether important financial information is confirmed

The system must not hide uncertainty.

---

# 3. Search Layers

The search architecture has three layers.

## Layer 1 — Structured filtering

Use PostgreSQL columns and relational queries.

Examples:

```text
country = France
degree_level = Master
study_mode = On-campus
language = English
field = Computer Science
```

This is the primary search mechanism.

---

## Layer 2 — Keyword search

Use PostgreSQL full-text search and fuzzy matching.

Useful for:

```text
"artificial intelligence"
"computer vision"
"software engineering"
"data science"
```

Initial technologies:

```text
PostgreSQL tsvector
PostgreSQL tsquery
pg_trgm
```

No external search engine is required for MVP.

---

## Layer 3 — Semantic/vector search

Semantic search is **LATER**, not an MVP requirement.

It may be introduced when real search logs show that:

```text
structured filters + keyword search
```

cannot understand common natural-language queries.

Potential technology:

```text
pgvector
```

within the existing PostgreSQL instance.

No dedicated vector database is required.

---

# 4. Search Query Types

The system should recognize several query types.

### Type A — Simple keyword

```text
Artificial Intelligence
```

### Type B — Structured natural language

```text
Master in AI in France
```

### Type C — Financial

```text
Fully funded AI scholarships in Europe
```

### Type D — Constraint-heavy

```text
English-taught Master in Computer Science
in Italy with tuition below €5,000
```

### Type E — Preference-oriented

```text
Affordable AI programs in Europe
```

The system should extract explicit constraints without pretending that vague terms have exact meanings.

---

# 5. Query Understanding

For MVP, query understanding should primarily use deterministic parsing and controlled vocabularies.

Example:

```text
"Master AI in France under €5000/year"
```

becomes:

```json
{
  "degree_level": "MASTER",
  "field": ["ARTIFICIAL_INTELLIGENCE"],
  "countries": ["FR"],
  "budget": {
    "amount": 5000,
    "currency": "EUR",
    "period": "YEAR",
    "scope": "TUITION"
  }
}
```

The original query should also be preserved.

---

# 6. Query Ambiguity

The system must not silently invent meanings.

Example:

```text
"cheap universities"
```

does not define:

```text
€3,000/year
```

Instead, the UI can ask:

> "What is your maximum tuition budget?"

or apply a clearly disclosed default only if product policy approves one.

---

# 7. Budget Query Semantics

Budget filters must contain:

```text
amount
currency
period
scope
```

Possible periods:

```text
MONTH
YEAR
PROGRAM
TOTAL
ONE_TIME
```

Possible scopes:

```text
TUITION
LIVING
TOTAL_COST
APPLICATION_FEE
OTHER
```

Example:

```text
maximum tuition:
€5,000 / YEAR
```

must not be compared directly against:

```text
€5,000 / PROGRAM
```

without normalization.

---

# 8. Funding Search

Funding must be represented by coverage dimensions rather than one generic "scholarship" flag.

Searchable dimensions include:

```text
tuition coverage
living expense coverage
accommodation
transport
insurance
visa
application fee
monthly stipend
one-time funding
overall coverage
```

Example user query:

```text
"100% tuition and living expenses"
```

should map conceptually to:

```text
tuition coverage = FULL
AND
living coverage = FULL
```

A scholarship with:

```text
tuition = FULL
living = UNKNOWN
```

must not match a strict fully-funded filter.

It may match a less strict:

```text
tuition fully covered
```

filter.

---

# 9. Search Filters

Initial filters:

### Academic

- degree level
- field
- study mode
- program duration

### Location

- country
- region
- city

### Language

- teaching language
- minimum required language level

### Financial

- tuition range
- living-cost range where available
- scholarship availability
- tuition coverage
- living coverage
- stipend

### Application

- open/closed
- deadline range
- intake/cycle

### Opportunity type

```text
UNIVERSITY_PROGRAM
SCHOLARSHIP
ALTERNANCE
PRIVATE_INSTITUTION
OTHER
```

### Data quality

- verified
- recently verified
- needs verification

---

# 10. Filter Semantics

Filters should be explicit.

### Example

```text
Country = France
Degree = Master
Language = English
```

means:

```text
country IN ["France"]
AND
degree_level = "Master"
AND
teaching_language contains "English"
```

Multiple values inside the same category can usually use OR.

Example:

```text
France OR Italy OR Switzerland
```

while categories use AND:

```text
(country = France OR Italy OR Switzerland)
AND
degree = Master
AND
field = AI
```

---

# 11. Opportunity Types

The shared `opportunities` entity is the search abstraction.

Search should not require separate implementations for:

```text
universities
scholarships
alternance
private institutions
```

Instead:

```text
opportunities
    |
    +-- opportunity_type
    |
    +-- university/program details
    |
    +-- scholarship details
    |
    +-- alternance details
```

This keeps discovery consistent.

---

# 12. Search Result Contract

Every search result should contain enough information for the user to understand why it appeared.

Conceptually:

```json
{
  "opportunity_id": "...",
  "title": "...",
  "institution": "...",
  "country": "...",
  "opportunity_type": "UNIVERSITY_PROGRAM",
  "match_reason": [
    "Master",
    "Artificial Intelligence",
    "France",
    "English taught"
  ],
  "verification_status": "VERIFIED",
  "verified_at": "...",
  "source": {
    "name": "...",
    "url": "..."
  }
}
```

The exact API schema belongs in `API.md`.

---

# 13. Keyword Search

PostgreSQL full-text search should index relevant textual fields.

Potential fields:

```text
opportunity title
program title
institution name
field
description
keywords
country/city names
```

The implementation should create a normalized search document rather than independently searching every column.

---

# 14. Fuzzy Search

`pg_trgm` can support spelling variations and approximate matching.

Examples:

```text
"Artificial Inteligence"
```

→

```text
Artificial Intelligence
```

or:

```text
"Sorbonne"
```

against institution names.

Fuzzy matching should be used carefully.

It must not transform a semantically different program into a false positive merely because names are similar.

---

# 15. Search Ranking

MVP search ranking should remain simple.

Suggested order:

1. Exact structured-filter match
2. Text relevance
3. Opportunity data quality
4. Freshness
5. Stable deterministic ID

Search ranking is **not** the personalized ranking described in `MATCHING.md`.

A student may see:

```text
Search result #1
```

without it being:

```text
Best match for the student
```

---

# 16. Search + Matching

After search retrieves candidates:

```text
Search
  ↓
Candidate set
  ↓
Eligibility
  ↓
Fit scoring
  ↓
Personalized ranking
```

The candidate set should be large enough to avoid prematurely excluding potentially useful opportunities.

However, expensive matching should not run against the entire catalog when simple filters can reduce the candidate set.

---

# 17. Candidate Retrieval Strategy

Example:

```text
Catalog: 20,000 opportunities

Query:
Master + AI + France + English

Structured filtering:
20,000 → 1,500

Keyword:
1,500 → 350

Matching:
350 → ranked recommendations
```

The exact numbers are illustrative.

The principle is:

> Reduce the candidate set progressively using the cheapest reliable mechanism first.

---

# 18. Search Result Categories

The UI may separate results into:

### Direct matches

All explicit search filters satisfied.

### Needs verification

Potentially relevant but important data is unknown.

### Related

Matches the query semantically or by keywords but relaxes one or more constraints.

For MVP, the system should clearly label any relaxed result.

It must never silently relax:

```text
country
degree
budget
funding
```

when the user explicitly specified them as hard requirements.

---

# 19. Query Relaxation

Query relaxation is useful when the result set is empty.

Example:

```text
Exact query:
Master AI
France
English
100% tuition
100% living
```

Result:

```text
0
```

The system should not silently change the query.

Instead:

> "No exact matches found."

Then optionally offer:

```text
Try:
- tuition fully covered, living coverage unknown
- France + nearby countries
- English + French programs
- remove full-living requirement
```

The student remains in control.

---

# 20. "No Results" Experience

An empty search should be useful.

Example:

```text
No exact matches found.

Your current requirements:
✓ Master
✓ AI
✓ France
✓ English
✓ Full tuition
✓ Full living expenses

Closest alternatives:
1. Full tuition + living coverage unknown
2. Full tuition + partial living support
3. Similar programs in Italy
```

Every relaxation must be visible.

---

# 21. Search Suggestions

The platform can provide structured suggestions:

```text
AI Master's
Computer Science Master's
Fully funded scholarships
Study in France
Study in Italy
English-taught programs
Programs under €5,000/year
```

Suggestions should be generated from actual catalog capabilities rather than generic AI suggestions.

---

# 22. Search Facets

The search UI should expose useful counts.

Example:

```text
Country
France       124
Italy         98
Germany      210

Degree
Master       430
Bachelor      85

Language
English      370
French       210

Funding
Full tuition  42
Full living   17
```

Counts must correspond to the currently applied filters.

---

# 23. Provenance in Search

Important facts displayed in search should be traceable.

Examples:

```text
Tuition: €3,500/year
Source: University official page
Verified: 2026-08-12
```

or:

```text
Living coverage: Unknown
```

rather than:

```text
Living coverage: No
```

when the source does not establish the answer.

---

# 24. Source Priority

When multiple sources exist, the product should prioritize authoritative sources.

Conceptual priority:

```text
Official university
        ↓
Official scholarship provider
        ↓
Government / public institution
        ↓
Recognized partner
        ↓
Secondary source
```

The exact source trust policy remains a product decision.

A secondary source can help discovery, but critical facts should ideally be verified against an authoritative source.

---

# 25. Freshness

Search can expose:

```text
Verified recently
Verified X days ago
Verification needed
```

Important catalog facts should have:

```text
source
verification status
verified_at
```

The search engine must not silently assume that old data is current.

---

# 26. Multilingual Search

The platform supports:

```text
French
Arabic
English
```

Search should normalize common terminology.

Example:

```text
informatique
computer science
علوم الحاسوب
```

may refer to related catalog concepts.

However, MVP should use a controlled synonym/translation dictionary rather than relying entirely on an LLM.

Future semantic search can improve multilingual understanding.

---

# 27. Search Indexing Strategy

MVP:

```text
PostgreSQL
   |
   +-- B-tree indexes
   +-- Full-text indexes
   +-- pg_trgm indexes where justified
```

Potential indexed fields:

```text
country
degree_level
opportunity_type
study_mode
deadline status
verification status
```

Text search fields use PostgreSQL full-text mechanisms.

Indexes should be added based on actual query patterns rather than indexing every column.

---

# 28. Semantic Search — LATER

When real search logs demonstrate keyword limitations, introduce embeddings.

Potential architecture:

```text
Opportunity
     |
     v
Text normalization
     |
     v
Embedding
     |
     v
pgvector
     |
     v
kNN similarity
```

The vector should represent relevant opportunity content, not sensitive student information.

Potential semantic use cases:

```text
"programs similar to AI but focused on robotics"
"something like software engineering with less theory"
"programs related to computer vision"
```

Semantic similarity should initially generate or enrich candidates.

It should not decide eligibility.

---

# 29. Hybrid Search — FUTURE

Future search may combine:

```text
Structured score
+
Keyword relevance
+
Vector similarity
```

Example:

```text
Candidate score =
    structured relevance
  + keyword relevance
  + semantic similarity
```

The exact formula must be validated experimentally.

Do not introduce a complicated ranking formula before measuring the individual signals.

---

# 30. Search Analytics

Log non-sensitive search events needed to improve the product.

Examples:

```text
search_submitted
filter_added
filter_removed
result_viewed
result_saved
result_compared
no_results
query_relaxed
```

Useful metrics:

- searches with zero results
- most common filters
- most common queries
- result click-through
- save rate
- comparison rate
- application-start rate

Do not log sensitive document contents or unnecessary personal information.

---

# 31. Search Quality Evaluation

Before semantic search, evaluate keyword search using a small manually reviewed query set.

Example:

```text
Query:
"English AI master in France"

Expected relevant:
Program A
Program B
Program C
```

Measure:

```text
Precision@K
Recall@K
Zero-result rate
```

The system should only introduce semantic search if it addresses a demonstrated problem.

---

# 32. Search vs RAG

Search and RAG have different responsibilities.

### Search

Finds:

```text
opportunities
programs
scholarships
institutions
```

### RAG — LATER

Answers:

```text
"What documents does this scholarship require?"
"Does this university accept this degree?"
"Explain this official PDF."
```

RAG must not become a replacement for catalog search.

---

# 33. Search vs AI Agent

Agents are not part of the MVP search architecture.

The system should not require an autonomous agent to answer:

```text
Find Master programs in France under €5,000.
```

This should be handled by:

```text
query parsing
+
structured filters
+
keyword search
+
matching
```

Agents may be considered later for specific multi-step workflows.

---

# 34. MVP Scope

### MUST HAVE

- Opportunity search
- Structured filters
- Country
- Degree
- Field
- Language
- Study mode
- Tuition budget
- Funding filters
- Scholarship coverage filters
- Deadline/intake filters
- Keyword search
- PostgreSQL full-text search
- Provenance display
- Verification status
- No-result handling
- Explicit query relaxation
- Search analytics
- Candidate handoff to matching

### SHOULD HAVE

- Fuzzy search with `pg_trgm`
- Search facets
- multilingual synonym dictionary
- related-results section
- profile-aware filter suggestions

### LATER

- pgvector
- semantic search
- kNN
- hybrid search
- learned search ranking
- LLM query understanding for complex natural-language queries

---

# 35. Example End-to-End Query

User enters:

> "Je cherche un master en IA en France ou en Italie, en anglais, avec une bourse qui couvre les frais de scolarité et la vie."

Query interpretation:

```text
degree = MASTER

field = ARTIFICIAL_INTELLIGENCE

countries = [FRANCE, ITALY]

teaching_language = ENGLISH

tuition_coverage = FULL

living_coverage = FULL
```

Search:

```text
Structured filters
        ↓
Candidate opportunities
        ↓
Keyword relevance
        ↓
Candidate set
        ↓
Matching
```

Matching then checks the student's actual:

```text
GPA
language level
budget
academic background
preferences
```

Final output:

```text
Strong matches
    ↓
Why each match
    ↓
Funding details
    ↓
Deadline
    ↓
Source + verification
    ↓
Compare / Save / Apply
```

---

# 36. Product Principle

The search experience should feel like:

> **"I can describe what I want, turn it into precise requirements, see what exists, understand what is uncertain, and then get personalized recommendations."**

Not:

> **"I typed something into an AI chatbot and it gave me a list of universities."**

The difference is the combination of:

```text
structured catalog
+
reliable sources
+
search
+
eligibility
+
matching
+
explanations
```

---

# 37. Final Architecture

```text
                       USER
                        |
                        v
                  SEARCH QUERY
                        |
                        v
               QUERY UNDERSTANDING
                        |
            +-----------+-----------+
            |                       |
            v                       v
     STRUCTURED FILTERS       TEXT SEARCH
            |                 PostgreSQL FTS
            |                       |
            +-----------+-----------+
                        |
                        v
                 CANDIDATE SET
                        |
                        v
                 MATCHING ENGINE
                        |
              +---------+---------+
              |                   |
              v                   v
         ELIGIBILITY          FIT SCORE
              |                   |
              +---------+---------+
                        |
                        v
                     RANKING
                        |
                        v
                 SEARCH RESULTS
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
        SAVE         COMPARE       APPLY
```

Future:

```text
                 SEARCH
                    |
             +------+------+
             |             |
         Keyword        Semantic
             |          pgvector
             +------+------+
                    |
               Hybrid Search
                    |
                 Matching
```

---

# 38. Decisions Required Before Implementation

1. Exact opportunity types for MVP.
2. Exact filter list exposed in the first UI.
3. Which budget scopes are user-selectable.
4. Exact semantics of "fully funded."
5. Source trust hierarchy.
6. Freshness thresholds.
7. Whether search should be profile-aware by default.
8. Whether users can save custom searches.
9. Notification behavior for saved searches and deadlines.
10. Exact multilingual synonym dictionary.

Until these decisions are approved, implementation should not invent business rules.

---

## Final Principle

Search should be:

**structured → transparent → source-aware → deterministic → progressively smarter**

not:

**LLM-first → opaque → hallucination-prone → over-engineered**.

Semantic search, kNN, ML ranking, RAG, and agents are extensions of the foundation, not substitutes for it.
