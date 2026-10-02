import { db } from '@/src/infrastructure/database';
import type { CoverageType, Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?:         string;         // full-text keyword
  country?:       string;
  degreeLevel?:   string;
  field?:         string;
  language?:      string;
  studyMode?:     string;
  type?:          'PROGRAM' | 'SCHOLARSHIP' | 'OTHER';
  // Funding coverage filters — strict, never silently relaxed
  tuitionCoverage?:  CoverageType;
  livingCoverage?:   CoverageType;
  // Deadline: only show opportunities with upcoming deadlines
  hasUpcomingDeadline?: boolean;
  verifiedOnly?:  boolean;
  page?:          number;
  pageSize?:      number;
}

export interface SearchResult {
  data: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filtersApplied: Omit<SearchFilters, 'page' | 'pageSize'>;
}

export interface SearchResultItem {
  id: string;
  type: string;
  nameI18n: string;
  descriptionI18n: string | null;
  status: string;
  university: { nameI18n: string; country: string; city: string | null } | null;
  programDetail: { degreeLevel: string; fieldOfStudy: string; languagesOfInstruction: string[]; studyMode: string | null } | null;
  scholarshipDetail: { tuitionCoverageType: string; livingCoverageType: string; coverageScope: string; fundingBody: string | null } | null;
  nextDeadline: { dueAt: Date; timezone: string; verificationStatus: string } | null;
}

// ─── Search service ───────────────────────────────────────────────────────────

export async function searchOpportunities(filters: SearchFilters): Promise<SearchResult> {
  const {
    query, country, degreeLevel, field, language, studyMode, type,
    tuitionCoverage, livingCoverage, hasUpcomingDeadline, verifiedOnly,
    page = 1, pageSize = 20,
  } = filters;

  const skip = (page - 1) * Math.min(pageSize, 100);
  const take = Math.min(pageSize, 100);

  // ── Build WHERE clause ────────────────────────────────────────────────────

  const where: Prisma.OpportunityWhereInput = {
    status: 'PUBLISHED',
    ...(type && { type }),

    // University country filter
    ...(country && {
      university: { country: { equals: country, mode: 'insensitive' } },
    }),

    // Program filters — only when applicable
    ...((degreeLevel || field || language || studyMode) && {
      programDetail: {
        ...(degreeLevel && { degreeLevel: { equals: degreeLevel, mode: 'insensitive' } }),
        ...(field && { fieldOfStudy: { contains: field, mode: 'insensitive' } }),
        ...(language && { languagesOfInstruction: { has: language } }),
        ...(studyMode && { studyMode: { equals: studyMode, mode: 'insensitive' } }),
      },
    }),

    // Scholarship funding filters — STRICT: never relax
    // FULL tuition + FULL living does NOT match FULL tuition only
    ...((tuitionCoverage || livingCoverage) && {
      scholarshipDetail: {
        ...(tuitionCoverage && { tuitionCoverageType: tuitionCoverage }),
        ...(livingCoverage  && { livingCoverageType:  livingCoverage }),
      },
    }),

    // Upcoming deadline filter
    ...(hasUpcomingDeadline && {
      applicationCycles: {
        some: {
          deadlines: {
            some: { dueAt: { gte: new Date() } },
          },
        },
      },
    }),
  };

  // ── Full-text search (PostgreSQL FTS via raw) ────────────────────────────
  // When a query string is provided, we use a raw WHERE to leverage the
  // search_vector GIN index. We collect matching IDs first, then apply
  // structured filters on top.

  let ftsIds: string[] | null = null;

  if (query && query.trim().length > 0) {
    const sanitized = query.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
    if (sanitized.length > 0) {
      const tsQuery = sanitized.split(/\s+/).join(' & ');
      const rows = await db.$queryRaw<{ id: string }[]>`
        SELECT id FROM opportunities
        WHERE status = 'PUBLISHED'
          AND search_vector @@ to_tsquery('english', ${tsQuery})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsQuery})) DESC
        LIMIT 500
      `;
      ftsIds = rows.map((r) => r.id);
      if (ftsIds.length === 0) {
        // No FTS matches — return empty immediately
        return {
          data: [], total: 0, page, pageSize, totalPages: 0,
          filtersApplied: buildAppliedFilters(filters),
        };
      }
      where.id = { in: ftsIds };
    }
  }

  // ── Count + fetch ────────────────────────────────────────────────────────

  const [total, items] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true, type: true, nameI18n: true, descriptionI18n: true, status: true,
        university: { select: { nameI18n: true, country: true, city: true } },
        programDetail: {
          select: { degreeLevel: true, fieldOfStudy: true, languagesOfInstruction: true, studyMode: true },
        },
        scholarshipDetail: {
          select: { tuitionCoverageType: true, livingCoverageType: true, coverageScope: true, fundingBody: true },
        },
        applicationCycles: {
          where: { status: 'OPEN' },
          orderBy: { closesAt: 'asc' },
          take: 1,
          select: {
            deadlines: {
              where: { dueAt: { gte: new Date() } },
              orderBy: { dueAt: 'asc' },
              take: 1,
              select: { dueAt: true, timezone: true, verificationStatus: true },
            },
          },
        },
      },
    }),
  ]);

  const data: SearchResultItem[] = items.map(({ applicationCycles, ...opp }) => ({
    ...opp,
    scholarshipDetail: opp.scholarshipDetail
      ? {
          ...opp.scholarshipDetail,
          tuitionCoverageType: String(opp.scholarshipDetail.tuitionCoverageType),
          livingCoverageType:  String(opp.scholarshipDetail.livingCoverageType),
          coverageScope:       String(opp.scholarshipDetail.coverageScope),
        }
      : null,
    nextDeadline: applicationCycles[0]?.deadlines[0] ?? null,
  }));

  // If verified only: filter results where nextDeadline is verified
  const filteredData = verifiedOnly
    ? data.filter((d) => !d.nextDeadline || d.nextDeadline.verificationStatus === 'VERIFIED')
    : data;

  return {
    data: filteredData,
    total: verifiedOnly ? filteredData.length : total,
    page,
    pageSize,
    totalPages: Math.ceil((verifiedOnly ? filteredData.length : total) / pageSize),
    filtersApplied: buildAppliedFilters(filters),
  };
}

function buildAppliedFilters(f: SearchFilters) {
  const { page: _p, pageSize: _ps, ...rest } = f;
  return Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Omit<SearchFilters, 'page' | 'pageSize'>;
}
