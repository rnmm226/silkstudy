import { z } from 'zod';
import { BudgetPeriod, BudgetScope } from '@prisma/client';

// ─── Shared primitives ────────────────────────────────────────────────────────

/** ISO 8601 date string → coerced to Date */
const dateString = z.string().datetime({ offset: true }).or(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
);

/** Non-empty trimmed string */
const nonEmptyStr = z.string().min(1).trim();

// ─── Profile ──────────────────────────────────────────────────────────────────

export const patchProfileSchema = z.object({
  firstName: nonEmptyStr.max(100).optional(),
  lastName: nonEmptyStr.max(100).optional(),
  dateOfBirth: dateString.optional().nullable(),
  nationality: nonEmptyStr.max(100).optional(),
  currentCountry: nonEmptyStr.max(100).optional(),
  phone: z.string().max(30).optional().nullable(),
});

export type PatchProfileInput = z.infer<typeof patchProfileSchema>;

// ─── Academic record ──────────────────────────────────────────────────────────

export const createAcademicRecordSchema = z.object({
  institutionName: nonEmptyStr.max(200),
  degreeLevel: nonEmptyStr.max(100),
  fieldOfStudy: nonEmptyStr.max(200),
  gradeValue: z.number().min(0).optional().nullable(),
  gradeScale: z.number().min(0).optional().nullable(),
  startDate: dateString.optional().nullable(),
  endDate: dateString.optional().nullable(),
});

export const patchAcademicRecordSchema = createAcademicRecordSchema.partial();

export type CreateAcademicRecordInput = z.infer<typeof createAcademicRecordSchema>;
export type PatchAcademicRecordInput = z.infer<typeof patchAcademicRecordSchema>;

// ─── Preferences ─────────────────────────────────────────────────────────────

export const putPreferencesSchema = z.object({
  targetDegreeLevel: nonEmptyStr.max(100).optional().nullable(),
  fieldsOfInterest: z.array(nonEmptyStr.max(200)).max(20).default([]),
  preferredCountries: z.array(nonEmptyStr.max(100)).max(30).default([]),
  preferredLanguages: z.array(nonEmptyStr.max(100)).max(20).default([]),
  studyModes: z.array(nonEmptyStr.max(50)).max(10).default([]),
});

export type PutPreferencesInput = z.infer<typeof putPreferencesSchema>;

// ─── Budget ───────────────────────────────────────────────────────────────────

export const putBudgetSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO 4217 code')
    .toUpperCase(),
  period: z.nativeEnum(BudgetPeriod),
  scope: z.nativeEnum(BudgetScope),
});

export type PutBudgetInput = z.infer<typeof putBudgetSchema>;
