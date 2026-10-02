import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import { z } from 'zod';

// ─── Validation ───────────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  applicationId:   z.string().uuid().optional().nullable(),
  documentType:    z.enum(['TRANSCRIPT', 'CV', 'MOTIVATION_LETTER', 'RECOMMENDATION', 'PASSPORT', 'LANGUAGE_CERT', 'OTHER']),
  storageKey:      z.string().min(1).max(500),
  originalFileName: z.string().min(1).max(255),
  mimeType:        z.string().min(1).max(100),
  sizeBytes:       z.number().int().positive().max(50 * 1024 * 1024), // 50 MB max
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export async function listDocuments(studentId: string, applicationId?: string) {
  return db.document.findMany({
    where: {
      studentId,
      deletedAt: null,
      ...(applicationId ? { applicationId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDocument(studentId: string, data: CreateDocumentInput) {
  return db.document.create({
    data: {
      studentId,
      applicationId:   data.applicationId ?? null,
      documentType:    data.documentType,
      storageKey:      data.storageKey,
      originalFileName: data.originalFileName,
      mimeType:        data.mimeType,
      sizeBytes:       data.sizeBytes,
      scanStatus:      'PENDING',
    },
  });
}

export async function softDeleteDocument(studentId: string, documentId: string) {
  const doc = await db.document.findFirst({
    where: { id: documentId, studentId, deletedAt: null },
    select: { id: true },
  });
  if (!doc) throw new NotFoundError('Document');

  await db.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });
}
