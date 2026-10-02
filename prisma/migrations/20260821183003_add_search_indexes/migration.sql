-- Full-text search index on opportunities
-- Uses a generated tsvector column for fast GIN index queries
ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("name_i18n", '') || ' ' ||
      coalesce("description_i18n", '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS "opportunities_search_vector_idx"
  ON "opportunities" USING GIN ("search_vector");

-- Index on common filter columns
CREATE INDEX IF NOT EXISTS "opportunities_status_idx" ON "opportunities" ("status");
CREATE INDEX IF NOT EXISTS "opportunities_type_idx"   ON "opportunities" ("type");
CREATE INDEX IF NOT EXISTS "program_details_degree_idx" ON "program_details" ("degree_level");
CREATE INDEX IF NOT EXISTS "program_details_field_idx"  ON "program_details" ("field_of_study");
CREATE INDEX IF NOT EXISTS "universities_country_idx"  ON "universities" ("country");
CREATE INDEX IF NOT EXISTS "deadlines_due_at_idx"      ON "deadlines" ("due_at");
