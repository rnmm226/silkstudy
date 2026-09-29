-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY', 'YEARLY', 'TOTAL');

-- CreateEnum
CREATE TYPE "BudgetScope" AS ENUM ('TUITION_ONLY', 'LIVING_ONLY', 'TOTAL_COST', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('PROGRAM', 'SCHOLARSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('FULL', 'PARTIAL', 'NONE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CoverageScope" AS ENUM ('FULL', 'PARTIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('APPLICATION', 'SCHOLARSHIP', 'DOCUMENT', 'INTERVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "EligibilityResult" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "nationality" TEXT NOT NULL,
    "current_country" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "degree_level" TEXT NOT NULL,
    "field_of_study" TEXT NOT NULL,
    "grade_value" DOUBLE PRECISION,
    "grade_scale" DOUBLE PRECISION,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_preferences" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "target_degree_level" TEXT,
    "fields_of_interest" TEXT[],
    "preferred_countries" TEXT[],
    "preferred_languages" TEXT[],
    "study_modes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_budgets" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "period" "BudgetPeriod" NOT NULL,
    "scope" "BudgetScope" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name_i18n" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "website_url" TEXT,
    "description_i18n" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "university_id" TEXT,
    "name_i18n" TEXT NOT NULL,
    "description_i18n" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_details" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "degree_level" TEXT NOT NULL,
    "field_of_study" TEXT NOT NULL,
    "languages_of_instruction" TEXT[],
    "duration_months" INTEGER,
    "study_mode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_details" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "tuition_coverage_type" "CoverageType" NOT NULL,
    "living_coverage_type" "CoverageType" NOT NULL,
    "accommodation_coverage_type" "CoverageType" NOT NULL,
    "transport_coverage_type" "CoverageType" NOT NULL,
    "insurance_coverage_type" "CoverageType" NOT NULL,
    "visa_coverage_type" "CoverageType" NOT NULL,
    "application_fee_coverage_type" "CoverageType" NOT NULL,
    "monthly_stipend_amount" DECIMAL(65,30),
    "monthly_stipend_currency" TEXT,
    "one_time_funding_amount" DECIMAL(65,30),
    "one_time_funding_currency" TEXT,
    "coverage_scope" "CoverageScope" NOT NULL,
    "funding_body" TEXT,
    "renewable" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_cycles" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year" TEXT,
    "term" TEXT,
    "opens_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadlines" (
    "id" TEXT NOT NULL,
    "application_cycle_id" TEXT NOT NULL,
    "type" "DeadlineType" NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "source_id" TEXT,
    "verification_status" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "publisher" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_sources" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "fact_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_rules" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "active_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eligibility_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_rule_versions" (
    "id" TEXT NOT NULL,
    "eligibility_rule_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "schema_version" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "eligibility_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_evaluations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "eligibility_rule_version_id" TEXT NOT NULL,
    "result" "EligibilityResult" NOT NULL,
    "reasons" JSONB NOT NULL,
    "profile_snapshot_hash" TEXT,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fit_scores" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "eligibility_evaluation_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "components" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "eligibility_evaluation_id" TEXT NOT NULL,
    "fit_score_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_explanations" (
    "id" TEXT NOT NULL,
    "match_result_id" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "contribution" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "application_cycle_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "application_id" TEXT,
    "document_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "scan_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "related_deadline_id" TEXT,
    "related_application_id" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "program_details_opportunity_id_key" ON "program_details"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_details_opportunity_id_key" ON "scholarship_details"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_student_id_opportunity_id_application_cycle_id_key" ON "applications"("student_id", "opportunity_id", "application_cycle_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
