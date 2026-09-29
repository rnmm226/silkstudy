import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import type {
  PatchProfileInput,
  CreateAcademicRecordInput,
  PatchAcademicRecordInput,
  PutPreferencesInput,
  PutBudgetInput,
} from './validation';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getStudentProfile(studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      nationality: true,
      currentCountry: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { email: true, role: true } },
    },
  });
  if (!student) throw new NotFoundError('Student');
  return student;
}

export async function patchStudentProfile(
  studentId: string,
  data: PatchProfileInput,
) {
  const existing = await db.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Student');

  return db.student.update({
    where: { id: studentId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }),
      ...(data.nationality !== undefined && { nationality: data.nationality }),
      ...(data.currentCountry !== undefined && { currentCountry: data.currentCountry }),
      ...(data.phone !== undefined && { phone: data.phone }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      nationality: true,
      currentCountry: true,
      phone: true,
      updatedAt: true,
    },
  });
}

// ─── Academic records ─────────────────────────────────────────────────────────

export async function listAcademicRecords(studentId: string) {
  return db.academicRecord.findMany({
    where: { studentId },
    orderBy: { startDate: 'desc' },
  });
}

export async function createAcademicRecord(
  studentId: string,
  data: CreateAcademicRecordInput,
) {
  return db.academicRecord.create({
    data: {
      studentId,
      institutionName: data.institutionName,
      degreeLevel: data.degreeLevel,
      fieldOfStudy: data.fieldOfStudy,
      gradeValue: data.gradeValue ?? null,
      gradeScale: data.gradeScale ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
}

export async function patchAcademicRecord(
  studentId: string,
  recordId: string,
  data: PatchAcademicRecordInput,
) {
  const existing = await db.academicRecord.findFirst({
    where: { id: recordId, studentId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('AcademicRecord');

  return db.academicRecord.update({
    where: { id: recordId },
    data: {
      ...(data.institutionName !== undefined && { institutionName: data.institutionName }),
      ...(data.degreeLevel !== undefined && { degreeLevel: data.degreeLevel }),
      ...(data.fieldOfStudy !== undefined && { fieldOfStudy: data.fieldOfStudy }),
      ...(data.gradeValue !== undefined && { gradeValue: data.gradeValue }),
      ...(data.gradeScale !== undefined && { gradeScale: data.gradeScale }),
      ...(data.startDate !== undefined && {
        startDate: data.startDate ? new Date(data.startDate) : null,
      }),
      ...(data.endDate !== undefined && {
        endDate: data.endDate ? new Date(data.endDate) : null,
      }),
    },
  });
}

export async function deleteAcademicRecord(
  studentId: string,
  recordId: string,
) {
  const existing = await db.academicRecord.findFirst({
    where: { id: recordId, studentId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('AcademicRecord');

  await db.academicRecord.delete({ where: { id: recordId } });
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getPreferences(studentId: string) {
  return db.studentPreference.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function upsertPreferences(
  studentId: string,
  data: PutPreferencesInput,
) {
  const existing = await db.studentPreference.findFirst({
    where: { studentId },
    select: { id: true },
  });

  if (existing) {
    return db.studentPreference.update({
      where: { id: existing.id },
      data: {
        targetDegreeLevel: data.targetDegreeLevel ?? null,
        fieldsOfInterest: data.fieldsOfInterest,
        preferredCountries: data.preferredCountries,
        preferredLanguages: data.preferredLanguages,
        studyModes: data.studyModes,
      },
    });
  }

  return db.studentPreference.create({
    data: {
      studentId,
      targetDegreeLevel: data.targetDegreeLevel ?? null,
      fieldsOfInterest: data.fieldsOfInterest,
      preferredCountries: data.preferredCountries,
      preferredLanguages: data.preferredLanguages,
      studyModes: data.studyModes,
    },
  });
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function getBudget(studentId: string) {
  return db.studentBudget.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function upsertBudget(
  studentId: string,
  data: PutBudgetInput,
) {
  const existing = await db.studentBudget.findFirst({
    where: { studentId },
    select: { id: true },
  });

  if (existing) {
    return db.studentBudget.update({
      where: { id: existing.id },
      data: {
        amount: data.amount,
        currency: data.currency,
        period: data.period,
        scope: data.scope,
      },
    });
  }

  return db.studentBudget.create({
    data: {
      studentId,
      amount: data.amount,
      currency: data.currency,
      period: data.period,
      scope: data.scope,
    },
  });
}
