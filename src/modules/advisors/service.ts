import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import { z } from 'zod';

export const createHelpRequestSchema = z.object({
  category: z.enum(['ELIGIBILITY', 'APPLICATION', 'DOCUMENTS', 'FUNDING', 'VISA', 'OTHER']),
  subject:  z.string().min(1).max(300).trim(),
});

export type CreateHelpRequestInput = z.infer<typeof createHelpRequestSchema>;

export async function listHelpRequests(studentId: string) {
  return db.helpRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createHelpRequest(studentId: string, data: CreateHelpRequestInput) {
  return db.helpRequest.create({
    data: { studentId, category: data.category, subject: data.subject, status: 'OPEN' },
  });
}

export async function closeHelpRequest(studentId: string, requestId: string) {
  const req = await db.helpRequest.findFirst({
    where: { id: requestId, studentId },
    select: { id: true },
  });
  if (!req) throw new NotFoundError('HelpRequest');
  return db.helpRequest.update({
    where: { id: requestId },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  });
}
