import { db } from '@/src/infrastructure/database';
import { writeAuditLog } from '@/src/shared/audit';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { z } from 'zod';
import type { OpportunityStatus, OpportunityType } from '@prisma/client';

// ─── Validation schemas ───────────────────────────────────────────────────────

export const createOpportunitySchema = z.object({
  type:           z.enum(['PROGRAM', 'SCHOLARSHIP', 'OTHER'] as const),
  universityId:   z.string().uuid().optional().nullable(),
  nameI18n:       z.string().min(1).max(500).trim(),
  descriptionI18n: z.string().max(5000).optional().nullable(),
  status:         z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).default('DRAFT'),
});

export const patchOpportunitySchema = createOpportunitySchema.partial();

export const createSourceSchema = z.object({
  url:               z.string().url(),
  title:             z.string().max(300).optional().nullable(),
  publisher:         z.string().max(200).optional().nullable(),
  sourceType:        z.string().max(100).optional().nullable(),
  verificationStatus: z.enum(['VERIFIED', 'NEEDS_REVIEW', 'OUTDATED', 'UNKNOWN']).default('UNKNOWN'),
});

export const patchSourceSchema = createSourceSchema.partial();

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type PatchOpportunityInput  = z.infer<typeof patchOpportunitySchema>;
export type CreateSourceInput      = z.infer<typeof createSourceSchema>;
export type PatchSourceInput       = z.infer<typeof patchSourceSchema>;

// ─── Opportunities ────────────────────────────────────────────────────────────

export async function adminListOpportunities(opts: {
  page?: number; pageSize?: number;
  status?: OpportunityStatus; type?: OpportunityType;
}) {
  const { page = 1, pageSize = 50, status, type } = opts;
  const where = { ...(status && { status }), ...(type && { type }) };
  const [total, data] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { university: { select: { nameI18n: true, country: true } } },
    }),
  ]);
  return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function adminCreateOpportunity(
  data: CreateOpportunityInput,
  actorUserId: string,
) {
  const opp = await db.opportunity.create({
    data: {
      type:            data.type as OpportunityType,
      universityId:    data.universityId ?? null,
      nameI18n:        data.nameI18n,
      descriptionI18n: data.descriptionI18n ?? null,
      status:          data.status as OpportunityStatus,
    },
  });
  await writeAuditLog({
    actorUserId,
    action: 'OPPORTUNITY_CREATED',
    entityType: 'opportunity',
    entityId: opp.id,
    metadata: { name: opp.nameI18n, type: opp.type },
  });
  return opp;
}

export async function adminPatchOpportunity(
  id: string,
  data: PatchOpportunityInput,
  actorUserId: string,
) {
  const existing = await db.opportunity.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError('Opportunity');

  const updated = await db.opportunity.update({
    where: { id },
    data: {
      ...(data.type            !== undefined && { type: data.type as OpportunityType }),
      ...(data.universityId    !== undefined && { universityId: data.universityId }),
      ...(data.nameI18n        !== undefined && { nameI18n: data.nameI18n }),
      ...(data.descriptionI18n !== undefined && { descriptionI18n: data.descriptionI18n }),
      ...(data.status          !== undefined && { status: data.status as OpportunityStatus }),
    },
  });
  await writeAuditLog({
    actorUserId,
    action: 'OPPORTUNITY_UPDATED',
    entityType: 'opportunity',
    entityId: id,
    metadata: data,
  });
  return updated;
}

export async function adminVerifyOpportunity(
  id: string,
  sourceId: string,
  factKey: string,
  actorUserId: string,
) {
  const existing = await db.opportunity.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError('Opportunity');

  const source = await db.source.findUnique({ where: { id: sourceId }, select: { id: true } });
  if (!source) throw new ValidationError('Source not found.');

  const factSource = await db.factSource.create({
    data: { sourceId, entityType: 'opportunity', entityId: id, factKey },
  });

  await writeAuditLog({
    actorUserId,
    action: 'OPPORTUNITY_VERIFIED',
    entityType: 'opportunity',
    entityId: id,
    metadata: { sourceId, factKey },
  });
  return factSource;
}

// ─── Sources ──────────────────────────────────────────────────────────────────

export async function adminListSources(opts: { page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 50 } = opts;
  const [total, data] = await Promise.all([
    db.source.count(),
    db.source.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function adminCreateSource(data: CreateSourceInput, actorUserId: string) {
  const source = await db.source.create({
    data: {
      url:               data.url,
      title:             data.title ?? null,
      publisher:         data.publisher ?? null,
      sourceType:        data.sourceType ?? null,
      verificationStatus: data.verificationStatus,
    },
  });
  await writeAuditLog({
    actorUserId,
    action: 'SOURCE_CREATED',
    entityType: 'source',
    entityId: source.id,
    metadata: { url: source.url },
  });
  return source;
}

export async function adminPatchSource(
  id: string,
  data: PatchSourceInput,
  actorUserId: string,
) {
  const existing = await db.source.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError('Source');

  const updated = await db.source.update({
    where: { id },
    data: {
      ...(data.url               !== undefined && { url: data.url }),
      ...(data.title             !== undefined && { title: data.title }),
      ...(data.publisher         !== undefined && { publisher: data.publisher }),
      ...(data.sourceType        !== undefined && { sourceType: data.sourceType }),
      ...(data.verificationStatus !== undefined && { verificationStatus: data.verificationStatus }),
    },
  });
  await writeAuditLog({
    actorUserId,
    action: 'SOURCE_UPDATED',
    entityType: 'source',
    entityId: id,
    metadata: data,
  });
  return updated;
}
