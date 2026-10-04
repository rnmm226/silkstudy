import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import { db } from '@/src/infrastructure/database';
import { writeAuditLog } from '@/src/shared/audit';
import { z } from 'zod';

type Ctx = { params: { id: string } };

const programDetailSchema = z.object({
  degreeLevel:            z.string().min(1).max(100).trim(),
  fieldOfStudy:           z.string().min(1).max(200).trim(),
  languagesOfInstruction: z.array(z.string().min(1).max(100)).min(1),
  durationMonths:         z.number().int().positive().optional().nullable(),
  studyMode:              z.string().max(50).optional().nullable(),
});

export const POST = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, programDetailSchema);

  const detail = await db.programDetail.upsert({
    where:  { opportunityId: id },
    create: { opportunityId: id, ...input },
    update: input,
  });

  await writeAuditLog({ actorUserId: session.user.id, action: 'PROGRAM_DETAIL_UPSERTED', entityType: 'program_detail', entityId: detail.id });
  return NextResponse.json({ data: detail }, { status: 201 });
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, programDetailSchema.partial());

  const detail = await db.programDetail.upsert({
    where:  { opportunityId: id },
    create: {
      opportunityId: id,
      degreeLevel: input.degreeLevel ?? '',
      fieldOfStudy: input.fieldOfStudy ?? '',
      languagesOfInstruction: input.languagesOfInstruction ?? [],
      ...input,
    },
    update: input,
  });

  await writeAuditLog({ actorUserId: session.user.id, action: 'PROGRAM_DETAIL_UPDATED', entityType: 'program_detail', entityId: detail.id });
  return NextResponse.json({ data: detail });
});
