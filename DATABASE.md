# DATABASE.md — Study Abroad Platform

**Status:** APPROVED — MVP v0.2

## 0. Global rules
- PostgreSQL is the single primary database.
- Prisma is the ORM/migration tool.
- UUID primary keys are generated server-side.
- Mutable entities have `created_at` and `updated_at`.
- `UNKNOWN` is different from `NO`.
- Important student-facing facts require provenance.
- `opportunities` is the shared addressable entity for programs, scholarships and future opportunity types.
- No ML, agent, or RAG tables are part of the MVP.

## 1. Users & Students
### `users`
`id`, `email`, `role` (`STUDENT|ADVISOR|ADMIN`), `created_at`, `updated_at`.

### `students`
`id`, `user_id`, `first_name`, `last_name`, `date_of_birth` nullable, `nationality`, `current_country`, `phone` nullable, `created_at`, `updated_at`, `deleted_at` nullable.

## 2. Academic Data
### `academic_records`
`id`, `student_id`, `institution_name`, `degree_level`, `field_of_study`, `grade_value`, `grade_scale`, `start_date`, `end_date`, timestamps.

### `student_preferences`
`id`, `student_id`, `target_degree_level`, `fields_of_interest`, `preferred_countries`, `preferred_languages`, `study_modes`, timestamps.

## 3. Explicit Budget
### `student_budgets`
`id`, `student_id`, `amount`, `currency`, `period` (`MONTHLY|YEARLY|TOTAL`), `scope` (`TUITION_ONLY|LIVING_ONLY|TOTAL_COST|OTHER`), timestamps.

A budget is never stored as an ambiguous number.

## 4. Universities
### `universities`
`id`, `name_i18n`, `country`, `city`, `website_url`, `description_i18n`, `status`, timestamps.

## 5. Shared Opportunities
### `opportunities`
Shared addressable entity for `PROGRAM|SCHOLARSHIP|OTHER`.

`id`, `type`, `university_id` nullable, `name_i18n`, `description_i18n`, `status` (`DRAFT|PUBLISHED|ARCHIVED`), timestamps.

**There is NO `application_deadline` column.**

## 6. Program Details
### `program_details`
`opportunity_id`, `degree_level`, `field_of_study`, `languages_of_instruction`, `duration_months` nullable, `study_mode` nullable, timestamps.

## 7. Scholarship Details
### `scholarship_details`
Funding is decomposed so the platform can answer **100% tuition AND living expenses**.

Fields:
- `opportunity_id`
- `tuition_coverage_type`
- `living_coverage_type`
- `accommodation_coverage_type`
- `transport_coverage_type`
- `insurance_coverage_type`
- `visa_coverage_type`
- `application_fee_coverage_type`
- `monthly_stipend_amount` / `monthly_stipend_currency` nullable
- `one_time_funding_amount` / `one_time_funding_currency` nullable
- `coverage_scope` (`FULL|PARTIAL|UNKNOWN`)
- `funding_body` nullable
- `renewable` nullable
- timestamps

Each coverage type is `FULL|PARTIAL|NONE|UNKNOWN`.

A scholarship satisfies `FULL tuition AND FULL living` only when both fields are explicitly `FULL`.

A generic "fully funded" label is never sufficient.

## 8. Application / Intake Cycles
### `application_cycles`
`id`, `opportunity_id`, `name`, `academic_year` nullable, `term` nullable, `opens_at` nullable, `closes_at` nullable, `status`, timestamps.

An opportunity may have multiple cycles.

## 9. Deadlines — Single Source of Truth
### `deadlines`
`id`, `application_cycle_id`, `type`, `due_at`, `timezone`, `source_id` nullable, `verification_status`, `verified_at` nullable, timestamps.

Possible types: `APPLICATION|SCHOLARSHIP|DOCUMENT|INTERVIEW|OTHER`.

Canonical relationship:

`Opportunity → Application Cycle → Deadline`

No duplicate deadline fields exist on opportunities, applications, program details, or scholarship details.

## 10. Sources & Provenance
### `sources`
`id`, `url`, `title`, `publisher`, `source_type`, `verification_status`, `verified_at`, timestamps.

### `fact_sources`
Lightweight provenance junction:
`id`, `source_id`, `entity_type`, `entity_id`, `fact_key`, `created_at`.

A fact may reference multiple sources without redesigning the catalog.

## 11. Eligibility Rules
### `eligibility_rules`
`id`, `opportunity_id`, `active_version_id` nullable, timestamps. One rule set per opportunity.

### `eligibility_rule_versions`
Immutable snapshots:
`id`, `eligibility_rule_id`, `version_number`, `schema_version`, `conditions`, `source_id` nullable, `created_at`, `published_at`.

After publication, conditions, schema version, version number and source are immutable. Rule changes create a new version.

## 12. Eligibility Conditions Contract
Top-level structure:
```json
{
  "schema_version": "1",
  "operator": "AND",
  "conditions": []
}
```

Groups use `AND|OR`. Leaf conditions use:
```json
{"field":"...","operator":"...","value":"..."}
```

Allowed fields:
`student.nationality`, `student.current_country`, `student.degree_level`, `student.field_of_study`, `student.gpa`, `student.gpa_scale`, `student.age`, `student.languages`, `student.language_certificates`, `student.budget.amount`, `student.budget.currency`, `student.budget.period`, `student.budget.scope`.

Allowed operators:
`EQ|NEQ|IN|NOT_IN|GT|GTE|LT|LTE|BETWEEN|CONTAINS|CONTAINS_ANY|CONTAINS_ALL|EXISTS|NOT_EXISTS`.

Allowed value types:
`string|number|boolean|date|string[]|number[]|null`.

Missing data produces an explicit `UNKNOWN` condition result. The database does not silently define the overall UNKNOWN policy.

## 13. Eligibility Evaluations
### `eligibility_evaluations`
`id`, `student_id`, `eligibility_rule_version_id`, `result` (`ELIGIBLE|INELIGIBLE|UNKNOWN`), `reasons`, `profile_snapshot_hash`, `evaluated_at`.

Every evaluation points to one immutable rule version.

## 14. Fit Scores
### `fit_scores`
`id`, `student_id`, `opportunity_id`, `eligibility_evaluation_id`, `total_score`, `components`, `computed_at`.

MVP scoring is deterministic; no ML.

## 15. Match Results
### `match_results`
`id`, `student_id`, `opportunity_id`, `eligibility_evaluation_id`, `fit_score_id`, `rank`, `reasons`, `generated_at`.

Ranking is deterministic with approved tie-breaking.

## 16. Match Explanations
### `match_explanations`
`id`, `match_result_id`, `factor`, `result`, `contribution`, `sort_order`.

## 17. Applications
### `applications`
`id`, `student_id`, `opportunity_id`, `application_cycle_id`, `status`, `notes`, timestamps.

Unique: `(student_id, opportunity_id, application_cycle_id)`.

## 18. Documents
### `documents`
`id`, `student_id`, `application_id`, `document_type`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`, `scan_status`, timestamps, `deleted_at`.

Bytes live in private S3-compatible object storage.

## 19. Notifications
### `notifications`
`id`, `user_id`, `type`, `related_deadline_id` nullable, `related_application_id` nullable, `channel`, `status`, `scheduled_for`, `sent_at` nullable, `created_at`.

## 20. Human Help
### `help_requests`
`id`, `student_id`, `advisor_id` nullable, `category`, `status`, `subject`, `created_at`, `updated_at`, `resolved_at` nullable.

## 21. Audit Log
### `audit_log`
`id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `reason` nullable, `metadata` nullable, `created_at`.

## 22. Relationship Diagram
```text
USERS → STUDENTS
STUDENTS → ACADEMIC_RECORDS / STUDENT_PREFERENCES / STUDENT_BUDGETS / APPLICATIONS / DOCUMENTS / ELIGIBILITY_EVALUATIONS / FIT_SCORES / MATCH_RESULTS / HELP_REQUESTS
UNIVERSITIES → OPPORTUNITIES
OPPORTUNITIES → PROGRAM_DETAILS / SCHOLARSHIP_DETAILS / APPLICATION_CYCLES / ELIGIBILITY_RULES / APPLICATIONS
APPLICATION_CYCLES → DEADLINES
SOURCES → FACT_SOURCES
ELIGIBILITY_RULES → ELIGIBILITY_RULE_VERSIONS → ELIGIBILITY_EVALUATIONS → FIT_SCORES → MATCH_RESULTS → MATCH_EXPLANATIONS
APPLICATIONS → DOCUMENTS
DEADLINES → NOTIFICATIONS
```

## 23. MVP Schema
Profiles: `users`, `students`, `academic_records`, `student_preferences`, `student_budgets`.
Catalog: `universities`, `opportunities`, `program_details`, `scholarship_details`, `application_cycles`, `deadlines`, `sources`, `fact_sources`.
Matching: `eligibility_rules`, `eligibility_rule_versions`, `eligibility_evaluations`, `fit_scores`, `match_results`, `match_explanations`.
Applications: `applications`, `documents`.
Operations: `notifications`, `help_requests`, `audit_log`.

## 24. Future Schema
LATER only: RAG tables, embeddings, ML tables, training data, agent tables/memory, dedicated vector DB infrastructure.

## 25. Open Decisions
- Currency normalization strategy.
- Application status transition matrix.
- Notification schedule.
- Exact fit-score weights.
- Overall UNKNOWN eligibility policy.
- Auth provider.
- Object-storage provider.
- Email provider.
