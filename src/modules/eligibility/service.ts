import { db } from '@/src/infrastructure/database';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { evaluateEligibility } from './engine';
import type { RuleConditions, StudentSnapshot } from './types';

// ─── Build student snapshot from DB ──────────────────────────────────────────

async function buildStudentSnapshot(studentId: string): Promise<StudentSnapshot> {
  const student = await db.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: {
      nationality: true,
      currentCountry: true,
      dateOfBirth: true,
      academicRecords: {
        orderBy: { endDate: 'desc' },
        take: 1,
        select: { degreeLevel: true, fieldOfStudy: true, gradeValue: true, gradeScale: true },
      },
      preferences: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { preferredLanguages: true },
      },
    },
  });

  if (!student) throw new NotFoundError('Student');

  const latestRecord = student.academicRecords[0];
  const prefs        = student.preferences[0];

  // Compute age if dateOfBirth present
  let age: number | null = null;
  if (student.dateOfBirth) {
    const now = new Date();
    age = now.getFullYear() - student.dateOfBirth.getFullYear();
    const m = now.getMonth() - student.dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < student.dateOfBirth.getDate())) age--;
  }

  return {
    nationality:    student.nationality,
    currentCountry: student.currentCountry,
    gpa:            latestRecord?.gradeValue ?? null,
    gradeScale:     latestRecord?.gradeScale ?? null,
    degreeLevel:    latestRecord?.degreeLevel ?? null,
    fieldOfStudy:   latestRecord?.fieldOfStudy ?? null,
    languages:      prefs?.preferredLanguages ?? [],
    age,
  };
}

// ─── Evaluate and persist ─────────────────────────────────────────────────────

export async function evaluateStudentEligibility(
  studentId: string,
  opportunityId: string,
) {
  // 1. Find active rule version for this opportunity
  const rule = await db.eligibilityRule.findFirst({
    where: { opportunityId },
    select: { id: true, activeVersionId: true },
  });

  if (!rule || !rule.activeVersionId) {
    throw new ValidationError(
      'No active eligibility rule found for this opportunity.',
    );
  }

  const ruleVersion = await db.eligibilityRuleVersion.findUnique({
    where: { id: rule.activeVersionId },
    select: { id: true, conditions: true, schemaVersion: true },
  });

  if (!ruleVersion) throw new NotFoundError('EligibilityRuleVersion');

  // 2. Build snapshot
  const snapshot = await buildStudentSnapshot(studentId);

  // 3. Evaluate (deterministic, no side effects)
  const output = evaluateEligibility(
    snapshot,
    ruleVersion.conditions as unknown as RuleConditions,
    ruleVersion.id,
  );

  // 4. Persist evaluation
  const evaluation = await db.eligibilityEvaluation.create({
    data: {
      studentId,
      eligibilityRuleVersionId: ruleVersion.id,
      result:                   output.result,
      reasons:                  output.reasons as object[],
      profileSnapshotHash:      hashSnapshot(snapshot),
    },
  });

  return { evaluation, output };
}

/** Simple deterministic hash of the snapshot for reproducibility tracking */
function hashSnapshot(snapshot: StudentSnapshot): string {
  return Buffer.from(JSON.stringify(snapshot)).toString('base64').slice(0, 32);
}

// ─── Get evaluations ──────────────────────────────────────────────────────────

export async function getStudentEvaluations(studentId: string) {
  return db.eligibilityEvaluation.findMany({
    where: { studentId },
    orderBy: { evaluatedAt: 'desc' },
    take: 50,
    include: {
      eligibilityRuleVersion: {
        select: { versionNumber: true, schemaVersion: true, eligibilityRuleId: true },
      },
    },
  });
}
