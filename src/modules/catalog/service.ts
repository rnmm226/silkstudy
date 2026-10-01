import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import type { OpportunityStatus, OpportunityType } from '@prisma/client';

// ─── Shared selects ───────────────────────────────────────────────────────────

const opportunityListSelect = {
  id: true,
  type: true,
  nameI18n: true,
  descriptionI18n: true,
  status: true,
  universityId: true,
  createdAt: true,
  updatedAt: true,
  university: {
    select: { id: true, nameI18n: true, country: true, city: true },
  },
  programDetail: {
    select: {
      degreeLevel: true,
      fieldOfStudy: true,
      languagesOfInstruction: true,
      studyMode: true,
    },
  },
  scholarshipDetail: {
    select: {
      tuitionCoverageType: true,
      livingCoverageType: true,
      coverageScope: true,
    },
  },
  applicationCycles: {
    where: { status: 'OPEN' },
    orderBy: { closesAt: 'asc' as const },
    take: 1,
    select: {
      deadlines: {
        orderBy: { dueAt: 'asc' as const },
        take: 1,
        select: { dueAt: true, timezone: true, verificationStatus: true },
      },
    },
  },
} as const;

const opportunityFullSelect = {
  id: true,
  type: true,
  nameI18n: true,
  descriptionI18n: true,
  status: true,
  universityId: true,
  createdAt: true,
  updatedAt: true,
  university: true,
  programDetail: true,
  scholarshipDetail: true,
  applicationCycles: {
    orderBy: { opensAt: 'asc' as const },
    include: {
      deadlines: {
        orderBy: { dueAt: 'asc' as const },
        include: { source: true } as never,
      },
    },
  },
} as const;

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

  const where = {
    ...(status && { status }),
    ...(type && { type }),
  };

  const [total, items] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: opportunityListSelect,
    }),
  ]);

  // Flatten nextDeadline
  const results = items.map((opp) => {
    const firstDeadline = opp.applicationCycles[0]?.deadlines[0] ?? null;
    const { applicationCycles: _ac, ...rest } = opp;
    return { ...rest, nextDeadline: firstDeadline };
  });

  return {
    data: results,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ─── Get single opportunity ───────────────────────────────────────────────────

export async function getOpportunityById(id: string) {
  const opp = await db.opportunity.findFirst({
    where: { id, status: 'PUBLISHED' },
    select: opportunityFullSelect,
  });
  if (!opp) throw new NotFoundError('Opportunity');
  return opp;
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

export async function getOpportunityCycles(opportunityId: string) {
  // Verify opportunity exists and is published
  const exists = await db.opportunity.findFirst({
    where: { id: opportunityId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError('Opportunity');

  return db.applicationCycle.findMany({
    where: { opportunityId },
    orderBy: { opensAt: 'asc' },
    include: {
      deadlines: { orderBy: { dueAt: 'asc' } },
    },
  });
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export async function getOpportunityDeadlines(opportunityId: string) {
  const exists = await db.opportunity.findFirst({
    where: { id: opportunityId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError('Opportunity');

  return db.deadline.findMany({
    where: {
      applicationCycle: { opportunityId },
    },
    orderBy: { dueAt: 'asc' },
    include: { applicationCycle: { select: { id: true, name: true, academicYear: true } } },
  });
}

// ─── Sources (provenance) ─────────────────────────────────────────────────────

export async function getFactSources(entityType: string, entityId: string) {
  return db.factSource.findMany({
    where: { entityType, entityId },
    include: { source: true },
  });
}
