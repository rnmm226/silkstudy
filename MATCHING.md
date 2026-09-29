# MATCHING.md — Study Abroad Platform

**Role:** Matching & Recommendation Specification  
**Status:** Proposed — v0.1  
**Scope:** Eligibility, fit scoring, ranking, explanations, missing data, reproducibility, evaluation, future ML  
**Depends on:** `ARCHITECTURE.md`, `DATABASE.md`  
**Non-scope:** Search implementation, RAG implementation, ML model implementation, API implementation

---

## 1. Goal

The matching system answers:

> **"Which opportunities are realistically available to this student, which fit them best, and why?"**

The system must not behave like a black-box recommendation engine.

For every recommended opportunity, the platform should be able to explain:

1. Why the student is or is not eligible.
2. Which preferences and constraints were satisfied.
3. Which factors increased or decreased the fit score.
4. What information is missing or uncertain.
5. Which rule version and scoring configuration produced the result.
6. What the student can do next to improve the match.

The matching pipeline is:

```text
Student Profile
      |
      v
Data Validation
      |
      v
Eligibility
      |
   +--+--+
   |     |
 FAIL   PASS
   |     |
   v     v
Explain  Fit Scoring
            |
            v
         Ranking
            |
            v
     Match Explanation
            |
            v
       Recommendation
```

Eligibility is a **hard gate**.

Fit and ranking operate only on opportunities that pass eligibility, unless the product explicitly chooses to show "almost eligible" opportunities as a separate educational category.

---

# 2. Core Principles

## 2.1 Eligibility is not a prediction

Eligibility must be determined from structured requirements.

Examples:

- minimum GPA
- required degree
- nationality restriction
- language requirement
- age limit
- required academic background
- application-cycle availability

The system must not use ML or an LLM to decide whether a student is eligible.

---

## 2.2 Fit is not eligibility

A student can be eligible but still be a poor fit.

Example:

```text
Eligible:
  GPA requirement satisfied
  English requirement satisfied
  Nationality accepted

Poor fit:
  Tuition far above budget
  Country not preferred
  Program only partially aligned with field
```

Eligibility answers:

> "Can the student apply based on known requirements?"

Fit answers:

> "How well does this opportunity match the student's stated goals and constraints?"

---

## 2.3 Ranking is not a separate source of truth

Ranking orders already evaluated opportunities.

The system must preserve the underlying:

- eligibility result
- fit components
- weights
- scoring configuration
- ranking rules
- explanations

so that a result can be reproduced later.

---

## 2.4 Missing information must never silently become a positive match

Unknown is not the same as yes.

For example:

```text
Student language level: B2
Program language requirement: unknown

Result:
    NOT "language matched"
    NOT "language failed"
    => UNKNOWN
```

The system should distinguish:

```text
PASS
FAIL
UNKNOWN
NOT_APPLICABLE
```

---

# 3. Matching Pipeline

## Stage 0 — Data preparation

Build a normalized matching context from:

- academic profile
- academic history
- degree
- field of study
- languages
- nationality/residency where relevant
- budget
- funding requirements
- preferred countries
- preferred study modes
- preferred degree level
- career/study goals
- application constraints
- opportunity requirements
- opportunity financial information
- opportunity location/language information
- application cycle and deadlines

Do not send the complete student profile to an LLM for matching.

---

## Stage 1 — Eligibility

Evaluate structured eligibility rules.

```text
Opportunity
    |
    v
Eligibility Rule Version
    |
    v
Eligibility Evaluation
    |
    +---- FAIL
    |
    +---- PASS
    |
    +---- UNKNOWN
```

### MVP policy

- `PASS` → eligible for fit/ranking.
- `FAIL` → excluded from normal recommendations.
- `UNKNOWN` → excluded from "eligible" recommendations but may appear in a separate "needs verification" section.
- `NOT_APPLICABLE` → rule does not apply.

This prevents missing data from being interpreted as eligibility.

---

# 4. Eligibility Evaluation

## 4.1 Rule categories

Initial supported rule categories:

| Category | Examples |
|---|---|
| Academic | GPA, degree, field of study, credits |
| Language | English B2, French B1 |
| Nationality | eligible nationality/citizenship |
| Residency | residence restriction |
| Age | minimum/maximum age |
| Experience | work/internship requirement |
| Financial | income/funding restrictions |
| Application | required application component |
| Program-specific | prerequisite course or background |

The system should start with a controlled vocabulary.

New rule types require a documented schema change rather than arbitrary fields.

---

# 5. Eligibility Rule Contract

`eligibility_rule_versions.conditions` must follow a versioned JSON contract.

Example:

```json
{
  "schema_version": 1,
  "all": [
    {
      "field": "academic.gpa",
      "operator": "gte",
      "value": 12
    },
    {
      "field": "languages.english.level",
      "operator": "gte",
      "value": "B2"
    }
  ]
}
```

OR example:

```json
{
  "schema_version": 1,
  "any": [
    {
      "field": "languages.english.level",
      "operator": "gte",
      "value": "B2"
    },
    {
      "field": "languages.french.level",
      "operator": "gte",
      "value": "B2"
    }
  ]
}
```

Nested `all` and `any` groups are allowed.

A condition must contain:

```text
field
operator
value
```

unless the operator explicitly requires no value.

---

# 6. Allowed Rule Fields

Initial controlled vocabulary:

```text
academic.gpa
academic.degree_level
academic.field
academic.graduation_year
academic.credits
academic.institution_country

languages.<language>.level

student.nationality
student.residency_country
student.age

experience.years
experience.required

financial.household_income
financial.funding_available

preferences.degree_level
preferences.study_mode
preferences.countries
preferences.fields
```

Opportunity-side values are resolved from structured catalog data.

Do not allow arbitrary database column references inside rules.

---

# 7. Allowed Operators

Initial operators:

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

Future operators may include:

```text
between
one_of
all_of
```

but they should only be introduced when a real requirement exists.

---

# 8. Rule Value Types

Supported value types:

```text
string
number
boolean
array
null
```

Domain-specific values such as:

```text
B1
B2
C1
Bachelor
Master
PhD
```

must have deterministic ordering/normalization.

Example:

```text
A1 < A2 < B1 < B2 < C1 < C2
```

The application must not compare language levels lexicographically.

---

# 9. Missing Data Behavior

Missing student information is explicitly represented as:

```text
UNKNOWN
```

not as:

```text
false
```

Example:

```text
Requirement:
English >= B2

Student:
English level missing

Evaluation:
UNKNOWN
```

For MVP:

### `all`

If one condition is `FAIL`:

```text
FAIL
```

If no condition fails but at least one is `UNKNOWN`:

```text
UNKNOWN
```

Otherwise:

```text
PASS
```

### `any`

If one condition passes:

```text
PASS
```

If none pass but at least one is unknown:

```text
UNKNOWN
```

Otherwise:

```text
FAIL
```

This gives deterministic behavior without using probabilistic inference.

---

# 10. Eligibility Explanation

Every evaluation should generate structured explanations.

Example:

```json
{
  "status": "FAIL",
  "reasons": [
    {
      "field": "academic.gpa",
      "student_value": 11.4,
      "required_value": 12,
      "result": "FAIL",
      "message": "Your GPA is below the minimum requirement."
    }
  ]
}
```

For a passing evaluation:

```json
{
  "status": "PASS",
  "reasons": [
    {
      "field": "academic.gpa",
      "student_value": 14.03,
      "required_value": 12,
      "result": "PASS"
    }
  ]
}
```

The explanation must be generated from structured evaluation data.

The LLM must not invent the reason.

---

# 11. Fit Scoring

Only eligible opportunities enter normal fit scoring.

Fit is a weighted combination of transparent dimensions.

Initial MVP dimensions:

| Dimension | Meaning |
|---|---|
| Academic fit | Alignment with student's academic background |
| Field fit | Alignment with desired field |
| Budget fit | Compatibility with student's financial constraints |
| Funding fit | Compatibility with required scholarship/funding coverage |
| Language fit | Match between student's language abilities and opportunity |
| Country fit | Alignment with preferred countries |
| Degree fit | Desired degree level |
| Study-mode fit | Online/on-campus/hybrid preference |
| Deadline fit | Practicality of the current application window |

Not every dimension applies to every opportunity.

---

# 12. Default Fit Weights

Initial weights:

```text
Academic fit       15%
Field fit          20%
Budget fit         20%
Funding fit        15%
Language fit       10%
Country fit         7%
Degree fit          5%
Study-mode fit      3%
Deadline fit        5%
-----------------------
Total              100%
```

These are **initial product defaults**, not permanent truths.

They must be stored/versioned as a scoring configuration so future experiments do not invalidate historical results.

---

# 13. Why Budget and Funding Are Separate

Budget answers:

> "Can the student realistically afford this?"

Funding answers:

> "Does the opportunity provide the type/amount of financial support the student needs?"

Example:

```text
Student:
Maximum tuition budget = €4,000/year
Needs living-cost coverage = yes

Opportunity:
Tuition = €3,000/year
Scholarship = €3,000 tuition only
Living expenses = not covered

Result:
Budget fit = high
Funding fit = low
```

This distinction is essential for students searching for fully funded opportunities.

---

# 14. Financial Matching

The financial system must use normalized periods and scopes.

Examples:

```text
€4,000 / year / tuition
€900 / month / living
€10,800 / year / living
€0 / year / tuition after scholarship
```

The matching engine should normalize comparable values before calculating fit.

Never compare:

```text
€5,000 total
```

directly with:

```text
€5,000/year
```

without knowing the scope and period.

---

# 15. Scholarship Coverage Matching

The platform should support queries such as:

> "Show me opportunities where tuition is fully covered and living expenses are fully covered."

Conceptually:

```text
tuition_coverage = FULL
AND
living_expenses_coverage = FULL
```

A scholarship marked:

```text
tuition = FULL
living = UNKNOWN
```

must NOT be presented as fully funded.

It may appear as:

> "Tuition fully covered — living coverage needs verification."

This distinction is central to product trust.

---

# 16. Fit Component Calculation

Each dimension produces:

```text
0.0 → 1.0
```

Example:

```text
budget_fit = 0.90
field_fit = 1.00
language_fit = 0.75
```

Weighted contribution:

```text
contribution = component_score × component_weight
```

Final fit:

```text
fit_score =
Σ(component_score × component_weight)
```

The final score is normalized to:

```text
0 → 100
```

Example:

```text
Field fit       1.00 × 20 = 20
Budget fit      0.90 × 20 = 18
Academic fit    0.90 × 15 = 13.5
Funding fit     0.70 × 15 = 10.5
...
```

The exact implementation belongs to the application layer, not this document.

---

# 17. Unknown Fit Values

Unknown data must not automatically receive `1.0`.

For MVP:

```text
known dimension → scored normally
unknown dimension → excluded from denominator
```

Example:

```text
Academic = 1.0
Field = 1.0
Budget = 0.8
Funding = UNKNOWN
Language = 1.0
```

The normalized score uses only known dimensions, while the match records:

```text
confidence = REDUCED
unknown_dimensions = ["funding"]
```

This prevents missing catalog data from artificially improving recommendations.

---

# 18. Fit Confidence

Fit score and confidence are separate.

Example:

```text
Fit score: 87/100
Confidence: Medium
```

Confidence reflects how complete and reliable the underlying matching data is.

Initial levels:

```text
HIGH
MEDIUM
LOW
```

Possible signals:

- percentage of applicable dimensions known
- source verification status
- freshness of opportunity data
- missing student data
- missing financial information

Confidence must never secretly alter the fit score.

---

# 19. Ranking

Ranking is applied after eligibility and fit calculation.

Primary ordering:

```text
fit_score DESC
```

Secondary ordering:

```text
confidence DESC
```

Then:

```text
deadline relevance
```

Then:

```text
stable deterministic opportunity identifier
```

The final deterministic tie-breaker ensures stable results.

---

# 20. Ranking Example

```text
Opportunity A
Eligibility: PASS
Fit: 91
Confidence: HIGH

Opportunity B
Eligibility: PASS
Fit: 91
Confidence: MEDIUM

Opportunity C
Eligibility: PASS
Fit: 88
Confidence: HIGH
```

Ranking:

```text
1. A
2. B
3. C
```

Do not randomly reorder equal scores.

---

# 21. "Almost Eligible" Opportunities

A student may be very close to meeting a requirement.

Example:

```text
Required GPA: 12
Student GPA: 11.8
```

This opportunity should not be shown as eligible.

However, the product may later provide:

> "Almost eligible — you are missing one requirement."

This is a **separate recommendation category**, not a manipulation of eligibility.

Potential future categories:

```text
MATCHED
ALMOST_MATCHED
NEEDS_VERIFICATION
NOT_ELIGIBLE
```

For MVP, only `MATCHED` and `NEEDS_VERIFICATION` are required in the main recommendation flow.

---

# 22. Match Explanation

Every `match_result` should have structured explanations.

Example:

```text
Why this is a strong match:

+ Strong field alignment
+ Tuition fits your budget
+ English requirement satisfied
+ Preferred country
+ Scholarship covers tuition

Things to verify:

! Living expenses coverage is not confirmed
! Application deadline is approaching
```

The UI should never expose only:

```text
Match score: 87
```

without explaining the score.

---

# 23. Negative Factors

The system should explain both positive and negative factors.

Example:

```text
Positive:
+ Field match: 100%
+ Budget match: 90%
+ Language match: 100%

Negative:
- Country preference: low
- Living costs above preferred budget
```

This helps students make their own decisions rather than blindly following a ranking.

---

# 24. Student Control

Students should be able to change important priorities.

Example:

```text
Priority:
Funding       VERY_HIGH
Country       HIGH
Field         VERY_HIGH
Budget        VERY_HIGH
Deadline      MEDIUM
```

However, the product should distinguish:

### Hard constraints

Example:

```text
"I cannot pay more than €4,000/year."
```

These belong in eligibility or hard filtering.

### Soft preferences

Example:

```text
"I prefer France."
```

These influence fit.

This distinction is critical.

---

# 25. Hard Constraints vs Preferences

Example:

```text
Student:
Maximum tuition = €4,000/year
Preferred country = France
Desired field = AI
```

If:

```text
Program tuition = €8,000/year
```

and the budget is a hard constraint:

```text
FAIL / FILTERED
```

If:

```text
Program = Germany
```

while France is only a preference:

```text
Country fit decreases
```

but the opportunity remains eligible.

---

# 26. Profile Completeness

Matching quality depends on profile completeness.

The system should calculate a separate profile completeness indicator:

```text
PROFILE_COMPLETENESS
```

Example:

```text
Academic profile     complete
Languages             complete
Budget                complete
Country preferences   complete
Funding needs         missing

Profile completeness: 80%
```

This is not a recommendation score.

It should instead trigger useful actions:

> "Add your funding needs to improve your recommendations."

---

# 27. Data Freshness

Opportunity information can become outdated.

Matching should consider:

```text
source verification status
verified_at
```

A stale opportunity should not silently receive the same trust level as recently verified information.

The system may expose:

```text
Verified recently
Verification due
Needs verification
```

but freshness should not arbitrarily change eligibility unless a product rule explicitly requires it.

---

# 28. Reproducibility

Every persisted match must be reproducible.

A match should reference:

```text
student
opportunity
eligibility_rule_version
fit/scoring configuration version
evaluation timestamp
```

The system should preserve:

```text
eligibility result
fit components
weights
reasons
confidence
```

Historical results must not change simply because the current scoring configuration changes.

---

# 29. Match Result Lifecycle

A match can be:

```text
GENERATED
VIEWED
SAVED
DISMISSED
APPLIED
EXPIRED
RECOMPUTED
```

User actions such as:

```text
VIEWED
SAVED
DISMISSED
APPLIED
```

are valuable future signals for ranking evaluation and ML.

They must not immediately train an ML model.

---

# 30. Feedback Signals

Collect structured interaction signals:

```text
opportunity_viewed
opportunity_saved
opportunity_dismissed
comparison_created
application_started
application_submitted
application_accepted
application_rejected
```

These signals support future learning-to-rank.

Important:

> User behavior is a signal, not ground truth.

For example, a student dismissing a university does not necessarily mean the recommendation was objectively bad.

---

# 31. Future Supervised Learning

ML is explicitly deferred.

When sufficient data exists, a future learning-to-rank system may learn from:

```text
student profile
opportunity features
match features
user interactions
application outcomes
```

Potential model:

```text
Candidate opportunities
        ↓
Deterministic eligibility
        ↓
Deterministic feature generation
        ↓
ML ranking adjustment
        ↓
Final ranking
```

ML must never replace hard eligibility rules.

---

# 32. Future kNN / Vector Signals

Vector similarity may later be used for:

- semantic similarity between student's goals and program descriptions
- similar opportunities
- finding programs "like this one"
- matching free-text preferences to opportunities

It should initially be a ranking/search signal rather than an eligibility mechanism.

Example:

```text
Structured filters
      +
Keyword search
      +
Semantic similarity
      ↓
Candidate ranking
```

This remains compatible with the architecture's PostgreSQL + pgvector strategy.

---

# 33. No LLM Decision Making

The LLM must not decide:

```text
eligible / not eligible
```

or silently alter:

```text
fit score
ranking
financial coverage
deadline
```

The LLM may later:

- explain structured results
- summarize official requirements
- answer questions from verified sources

The structured matching engine remains authoritative.

---

# 34. Match Quality Evaluation

Before introducing ML, evaluate the deterministic system.

Track:

### Eligibility accuracy

Percentage of evaluated eligibility decisions confirmed by human review.

### Recommendation usefulness

Student actions:

- saves
- comparisons
- applications

### Explanation quality

Human review of whether the explanation accurately reflects the underlying calculation.

### Data quality

Percentage of important opportunity facts with:

- source
- verification status
- recent verification

### Coverage

Percentage of catalog opportunities that can be evaluated using structured rules.

---

# 35. Offline Evaluation Dataset

Before ML, maintain a small manually reviewed evaluation set.

Example:

```text
student_001 → opportunity_001 → expected eligible
student_001 → opportunity_002 → expected not eligible
student_002 → opportunity_003 → expected strong fit
```

This dataset can be used for regression tests when matching rules change.

It must contain no unnecessary personal data.

---

# 36. Fairness and Safety

Matching must not infer sensitive personal characteristics.

Do not create recommendation signals from:

- race
- religion
- political affiliation
- sexual orientation
- health conditions

unless a legitimate legal/product requirement is explicitly established and reviewed.

Do not use protected or sensitive attributes as hidden ranking signals.

Where nationality is a legitimate eligibility requirement imposed by an opportunity, it should be used only for that explicit eligibility rule.

---

# 37. MVP Scope

### MUST HAVE

- Structured student profile
- Structured opportunity data
- Eligibility rules
- Versioned rule evaluation
- Hard constraints
- Fit scoring
- Explainable scoring
- Deterministic ranking
- Budget matching
- Scholarship coverage matching
- Missing-data handling
- Confidence indicator
- Match persistence
- User feedback signals
- Reproducibility

### SHOULD HAVE

- Profile completeness
- "Needs verification" recommendations
- "Almost eligible" educational suggestions
- Comparison integration

### LATER

- Semantic ranking
- kNN
- Learning-to-rank
- Personalized ML
- Predictive features
- Agentic workflows

---

# 38. Example End-to-End Match

Student:

```text
Degree: Bachelor's
Field: Computer Science
GPA: 14.03
English: B2
Preferred field: AI/ML
Preferred countries: France, Italy, Switzerland
Maximum tuition: €4,000/year
Needs full tuition funding: Yes
Needs living-cost funding: Yes
```

Opportunity:

```text
Master in Artificial Intelligence
Country: France
Tuition: €3,500/year
Scholarship:
    Tuition: FULL
    Living: FULL
Language: B2
GPA requirement: 12
```

Eligibility:

```text
PASS
```

Fit:

```text
Academic fit: 0.95
Field fit: 1.00
Budget fit: 1.00
Funding fit: 1.00
Language fit: 1.00
Country fit: 1.00
Degree fit: 1.00
Study-mode fit: 1.00
Deadline fit: 0.80
```

The final score is generated from the configured weights.

Explanation:

```text
Strong match because:

+ Your academic background matches the program.
+ AI/ML matches your desired field.
+ Tuition is within your stated budget.
+ Tuition funding is fully covered.
+ Living expenses are fully covered.
+ Your English level meets the requirement.
+ France is one of your preferred countries.

Verify:

! Deadline is approaching.
```

The recommendation is then persisted with the rule/scoring versions used.

---

# 39. Product UX

The matching system should not present the student with an unexplained leaderboard.

Recommended opportunity card:

```text
┌──────────────────────────────────────┐
│ Master in Artificial Intelligence    │
│ France                               │
│                                      │
│ ⭐ Strong match — 91/100             │
│                                      │
│ ✓ Eligible                           │
│ ✓ Tuition fully covered              │
│ ✓ Living expenses covered            │
│ ✓ Field matches your goal            │
│ ✓ English requirement satisfied      │
│                                      │
│ ⚠ Deadline: 18 days                  │
│                                      │
│ [Why this match?] [Compare] [Save]  │
└──────────────────────────────────────┘
```

The score should be secondary to the reasons.

---

# 40. Important Product Decision

The platform must avoid claiming:

> "This is the best university for you."

Instead say:

> "Based on the information you provided, this opportunity is a strong match."

This preserves user agency and acknowledges that matching is decision support, not an oracle.

---

# 41. Architecture Summary

```text
                    STUDENT
                       |
                       v
              PROFILE NORMALIZATION
                       |
                       v
              HARD CONSTRAINTS
                       |
                       v
                ELIGIBILITY
                       |
              +--------+--------+
              |                 |
             FAIL             PASS
              |                 |
              v                 v
         EXPLANATION        FIT SCORING
                                |
                                v
                           CONFIDENCE
                                |
                                v
                            RANKING
                                |
                                v
                       MATCH EXPLANATION
                                |
                                v
                         RECOMMENDATIONS
                                |
               +----------------+----------------+
               |                |                |
             VIEW             SAVE            APPLY
               |                |                |
               +----------------+----------------+
                                |
                                v
                         FUTURE ML DATA
```

---

# 42. Decisions Required Before Implementation

The following should be explicitly approved before implementing the matching engine:

1. Final MVP fit weights.
2. Exact list of hard student constraints.
3. Exact list of soft preferences.
4. Financial normalization rules.
5. Scholarship coverage semantics.
6. Treatment of partially known opportunity data.
7. Profile completeness calculation.
8. Match confidence calculation.
9. Exact ranking tie-breakers.
10. UI wording for eligibility, confidence, and recommendations.

Until these are approved, implementation should not invent business rules.

---

## Final Principle

The matching engine is the product's decision-support core.

It should be:

**deterministic → explainable → reproducible → source-aware → user-controlled**

before it becomes:

**semantic → ML-powered → predictive → agentic**.

The system earns the right to use ML by first proving that the deterministic baseline works.
