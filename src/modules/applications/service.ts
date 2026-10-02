import { db } from '@/src/infrastructure/database';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { z } from 'zod';

// ─── Validation ───────────────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  opportunityId:      z.string().uuid(),
  applicationCycleId: z.string().uuid(),
  notes:              z.string().max(2000).optional().nullable(),
});

export const patchApplicationSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED']).optional(),
  notes:  z.string().max(2000).optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type PatchApplicationInput  = z.infer<typeof patchApplicationSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export async function listApplications(studentId: string) {
  return db.application.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: {
        select: {
          id: true, type: true, nameI18n: true,
          university: { select: { nameI18n: true, country: true } },
        },
      },
      applicationCycle: { select: { name: true, academicYear: true, closesAt: true } },
    },
  });
}

export async function createApplication(
  studentId: string,
  data: CreateApplicationInput,
) {
  // Verify opportunity exists and is published
  const opp = await db.opportunity.findFirst({
    where: { id: data.opportunityId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!opp) throw new ValidationError('Opportunity not found or not published.');

  // Verify cycle belongs to that opportunity
  const cycle = await db.applicationCycle.findFirst({
    where: { id: data.applicationCycleId, opportunityId: data.opportunityId },
    select: { id: true },
  });
  if (!cycle) throw new ValidationError('Application cycle not found for this opportunity.');

  // Unique per (student, opportunity, cycle)
  const existing = await db.application.findFirst({
    where: { studentId, opportunityId: data.opportunityId, applicationCycleId: data.applicationCycleId },
    select: { id: true },
  });
  if (existing) throw new ValidationError('You have already applied for this cycle.');

  return db.application.create({
    data: {
      studentId,
      opportunityId:      data.opportunityId,
      applicationCycleId: data.applicationCycleId,
      notes:              data.notes ?? null,
      status:             'DRAFT',
    },
    include: {
      opportunity: { select: { nameI18n: true } },
      applicationCycle: { select: { name: true } },
    },
  });
}

export async function patchApplication(
  studentId: string,
  applicationId: string,
  data: PatchApplicationInput,
) {
  const existing = await db.application.findFirst({
    where: { id: applicationId, studentId },
    select: { id: true, status: true },
  });
  if (!existing) throw new NotFoundError('Application');

  return db.application.update({
    where: { id: applicationId },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes  !== undefined && { notes:  data.notes }),
    },
  });
}

export async function deleteApplication(studentId: string, applicationId: string) {
  const existing = await db.application.findFirst({
    where: { id: applicationId, studentId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Application');
  await db.application.delete({ where: { id: applicationId } });
}
