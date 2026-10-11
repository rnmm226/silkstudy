import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import { db } from '@/src/infrastructure/database';
import { writeAuditLog } from '@/src/shared/audit';
import { z } from 'zod';

const createUniversitySchema = z.object({
  nameI18n:        z.string().min(1).max(300).trim(),
  country:         z.string().min(1).max(100).trim(),
  city:            z.string().max(100).optional().nullable(),
  websiteUrl:      z.string().url().optional().nullable(),
  descriptionI18n: z.string().max(2000).optional().nullable(),
  status:          z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const GET = handler(async () => {
  await requireAdmin();
  const universities = await db.university.findMany({ orderBy: { nameI18n: 'asc' } });
  return NextResponse.json({ data: universities });
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const input = await parseBody(req, createUniversitySchema);

  const university = await db.university.create({
    data: {
      nameI18n:        input.nameI18n,
      country:         input.country,
      city:            input.city ?? null,
      websiteUrl:      input.websiteUrl ?? null,
      descriptionI18n: input.descriptionI18n ?? null,
      status:          input.status,
    },
  });

  await writeAuditLog({
    actorUserId: session.user.id,
    action: 'UNIVERSITY_CREATED',
    entityType: 'university',
    entityId: university.id,
    metadata: { name: university.nameI18n },
  });

  return NextResponse.json({ data: university }, { status: 201 });
});
