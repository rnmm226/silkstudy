import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import { db } from '@/src/infrastructure/database';
import { writeAuditLog } from '@/src/shared/audit';
import { z } from 'zod';
import type { CoverageType, CoverageScope } from '@prisma/client';

type Ctx = { params: { id: string } };

const COVERAGE = z.enum(['FULL', 'PARTIAL', 'NONE', 'UNKNOWN'] as const);
const SCOPE    = z.enum(['FULL', 'PARTIAL', 'UNKNOWN'] as const);

const scholarshipDetailSchema = z.object({
  tuitionCoverageType:        COVERAGE,
  livingCoverageType:         COVERAGE,
  accommodationCoverageType:  COVERAGE,
  transportCoverageType:      COVERAGE,
  insuranceCoverageType:      COVERAGE,
  visaCoverageType:           COVERAGE,
  applicationFeeCoverageType: COVERAGE,
  coverageScope:              SCOPE,
  fundingBody:                z.string().max(200).optional().nullable(),
  monthlyStipendAmount:       z.number().positive().optional().nullable(),
  monthlyStipendCurrency:     z.string().length(3).toUpperCase().optional().nullable(),
  oneTimeFundingAmount:       z.number().positive().optional().nullable(),
  oneTimeFundingCurrency:     z.string().length(3).toUpperCase().optional().nullable(),
  renewable:                  z.boolean().optional().nullable(),
});

export const POST = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, scholarshipDetailSchema);

  const detail = await db.scholarshipDetail.upsert({
    where:  { opportunityId: id },
    create: { opportunityId: id, ...input as Record<string, unknown> } as never,
    update: input as Record<string, unknown> as never,
  });

  await writeAuditLog({ actorUserId: session.user.id, action: 'SCHOLARSHIP_DETAIL_UPSERTED', entityType: 'scholarship_detail', entityId: detail.id });
  return NextResponse.json({ data: detail }, { status: 201 });
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, scholarshipDetailSchema.partial());

  const existing = await db.scholarshipDetail.findUnique({ where: { opportunityId: id }, select: { id: true } });

  const defaults = {
    tuitionCoverageType:        'UNKNOWN' as CoverageType,
    livingCoverageType:         'UNKNOWN' as CoverageType,
    accommodationCoverageType:  'UNKNOWN' as CoverageType,
    transportCoverageType:      'UNKNOWN' as CoverageType,
    insuranceCoverageType:      'UNKNOWN' as CoverageType,
    visaCoverageType:           'UNKNOWN' as CoverageType,
    applicationFeeCoverageType: 'UNKNOWN' as CoverageType,
    coverageScope:              'UNKNOWN' as CoverageScope,
  };

  const detail = existing
    ? await db.scholarshipDetail.update({ where: { opportunityId: id }, data: input as never })
    : await db.scholarshipDetail.create({ data: { opportunityId: id, ...defaults, ...input } as never });

  await writeAuditLog({ actorUserId: session.user.id, action: 'SCHOLARSHIP_DETAIL_UPDATED', entityType: 'scholarship_detail', entityId: detail.id });
  return NextResponse.json({ data: detail });
});
