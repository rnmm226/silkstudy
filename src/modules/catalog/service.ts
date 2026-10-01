import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import type { OpportunityStatus, OpportunityType } from '@prisma/client';

// ─── List opportunities ────────────────────────────────────────────────────────

export interface ListOpportunitiesOptions {
  page?: number;
  pageSize?: number;
  status?: OpportunityStatus;
  type?: OpportunityType;
}

export async function listOpportunities(opts: ListOpportunitiesOptions = {}) {
  const { page = 1, pageSize = 20, status = 'PUBLISHED', type } = opts;
  const skip = (page - 1) * pageSize;
  const where = { ...(status && { status }), ...(type && { type }) };

  const [total, items] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true, type: true, nameI18n: true, descriptionI18n: true,
        status: true, universityId: true, createdAt: true, updatedAt: true,
        university: { select: { id: true, nameI18n: true, country: true, city: true } },
        programDetail: { select: { degreeLevel: true, fieldOfStudy: true, languagesOfInstruction: true, studyMode: true } },
        scholarshipDetail: { select: { tuitionCoverageType: true, livingCoverageType: true, coverageScope: true } },
        applicationCycles: {
          where: { status: 'OPEN' },
          orderBy: { closesAt: 'asc' },
          take: 1,
          select: {
            deadlines: {
              orderBy: { dueAt: 'asc' },
              take: 1,
              select: { dueAt: true, timezone: true, verificationStatus: true },
            },
          },
        },
      },
    }),
  ]);

  const results = items.map(({ applicationCycles, ...opp }) => ({
    ...opp,
    nextDeadline: applicationCycles[0]?.deadlines[0] ?? null,
  }));

  return {
    data: results,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ─── Get single opportunity ───────────────────────────────────────────────────

export async function getOpportunityById(id: string) {
  const opp = await db.opportunity.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: {
      university: true,
      programDetail: true,
      scholarshipDetail: true,
      applicationCycles: {
        orderBy: { opensAt: 'asc' },
        include: {
          deadlines: { orderBy: { dueAt: 'asc' }, include: { source: true } },
        },
      },
    },
  });
  if (!opp) throw new NotFoundError('Opportunity');
  return opp;
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

export async function getOpportunityCycles(opportunityId: string) {
  const exists = await db.opportunity.findFirst({
    where: { id: opportunityId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError('Opportunity');

  return db.applicationCycle.findMany({
    where: { opportunityId },
    orderBy: { opensAt: 'asc' },
    include: { deadlines: { orderBy: { dueAt: 'asc' } } },
  });
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export async function getOpportunityDeadlines(opportunityId: string) {
  const exists = await db.opportunity.findFirst({
    where: { id: opportunityId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError('Opportunity');

  const cycles = await db.applicationCycle.findMany({
    where: { opportunityId },
    select: { id: true, name: true, academicYear: true },
  });

  if (!cycles.length) return [];

  const cycleMap = new Map(cycles.map((c) => [c.id, c]));
  const deadlines = await db.deadline.findMany({
    where: { applicationCycleId: { in: cycles.map((c) => c.id) } },
    orderBy: { dueAt: 'asc' },
  });

  return deadlines.map((d) => ({ ...d, applicationCycle: cycleMap.get(d.applicationCycleId) }));
}

// ─── Provenance ───────────────────────────────────────────────────────────────

export async function getFactSources(entityType: string, entityId: string) {
  return db.factSource.findMany({
    where: { entityType, entityId },
    include: { source: true },
  });
}
