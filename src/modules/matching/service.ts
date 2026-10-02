import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import { computeFitScore, type ScoringInputStudent, type ScoringInputOpportunity } from './scoring';
import { evaluateStudentEligibility } from '../eligibility/service';

// ─── Build scoring inputs ─────────────────────────────────────────────────────

async function buildStudentScoringInput(studentId: string): Promise<ScoringInputStudent> {
  const student = await db.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: {
      preferences: { orderBy: { createdAt: 'desc' }, take: 1 },
      budgets:      { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!student) throw new NotFoundError('Student');

  const prefs  = student.preferences[0];
  const budget = student.budgets[0];

  return {
    budgetAmount:       budget ? Number(budget.amount) : null,
    budgetCurrency:     budget?.currency ?? null,
    budgetPeriod:       budget?.period   ?? null,
    preferredCountries: prefs?.preferredCountries ?? [],
    preferredLanguages: prefs?.preferredLanguages ?? [],
    fieldsOfInterest:   prefs?.fieldsOfInterest   ?? [],
    targetDegreeLevel:  prefs?.targetDegreeLevel  ?? null,
  };
}

async function buildOpportunityScoringInput(opportunityId: string): Promise<ScoringInputOpportunity> {
  const opp = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      university:       { select: { country: true } },
      programDetail:    true,
      scholarshipDetail: true,
    },
  });
  if (!opp) throw new NotFoundError('Opportunity');

  return {
    universityCountry:          opp.university?.country ?? null,
    programDegreeLevel:         opp.programDetail?.degreeLevel ?? null,
    programFieldOfStudy:        opp.programDetail?.fieldOfStudy ?? null,
    programLanguages:           opp.programDetail?.languagesOfInstruction ?? [],
    scholarshipTuitionCoverage: opp.scholarshipDetail?.tuitionCoverageType ?? null,
    scholarshipLivingCoverage:  opp.scholarshipDetail?.livingCoverageType  ?? null,
    monthlyStipendAmount: opp.scholarshipDetail?.monthlyStipendAmount
      ? Number(opp.scholarshipDetail.monthlyStipendAmount)
      : null,
  };
}

// ─── Compute + persist a single match ────────────────────────────────────────

export async function computeAndPersistMatch(studentId: string, opportunityId: string) {
  // 1. Eligibility gate
  const { evaluation, output: eligOutput } = await evaluateStudentEligibility(studentId, opportunityId);

  if (eligOutput.result === 'INELIGIBLE') {
    return {
      eligibilityResult: 'INELIGIBLE' as const,
      evaluation,
      fitScore: null,
      matchResult: null,
    };
  }

  // 2. Build scoring inputs
  const [studentInput, oppInput] = await Promise.all([
    buildStudentScoringInput(studentId),
    buildOpportunityScoringInput(opportunityId),
  ]);

  // 3. Compute fit score
  const scoreOutput = computeFitScore(studentInput, oppInput);

  // 4. Persist fit score
  const fitScore = await db.fitScore.create({
    data: {
      studentId,
      opportunityId,
      eligibilityEvaluationId: evaluation.id,
      totalScore:  scoreOutput.totalScore,
      components:  scoreOutput.components as object[],
    },
  });

  // 5. Persist match result + explanations
  const matchResult = await db.matchResult.create({
    data: {
      studentId,
      opportunityId,
      eligibilityEvaluationId: evaluation.id,
      fitScoreId: fitScore.id,
      rank: 0, // will be updated during recompute
      reasons: scoreOutput.explanation as object,
    },
  });

  // 6. Persist explanations
  const explanations = scoreOutput.components.map((c, i) => ({
    matchResultId: matchResult.id,
    factor:        c.dimension,
    result:        c.result,
    contribution:  c.contribution,
    sortOrder:     i,
  }));
  await db.matchExplanation.createMany({ data: explanations });

  return {
    eligibilityResult: eligOutput.result,
    evaluation,
    fitScore,
    matchResult: { ...matchResult, explanations, scoreOutput },
  };
}

// ─── Recompute all matches for a student ─────────────────────────────────────

export async function recomputeStudentMatches(studentId: string) {
  const opportunities = await db.opportunity.findMany({
    where: {
      status: 'PUBLISHED',
      eligibilityRules: { some: { activeVersionId: { not: null } } },
    },
    select: { id: true },
  });

  const results = [];
  for (const opp of opportunities) {
    try {
      const r = await computeAndPersistMatch(studentId, opp.id);
      results.push({ opportunityId: opp.id, result: r.eligibilityResult });
    } catch {
      results.push({ opportunityId: opp.id, result: 'ERROR' });
    }
  }

  // Re-rank: order eligible matches by fit score descending
  const eligible = await db.matchResult.findMany({
    where: { studentId },
    orderBy: [
      { fitScore: { totalScore: 'desc' } },
      { generatedAt: 'desc' },
    ],
    select: { id: true },
  });

  for (let i = 0; i < eligible.length; i++) {
    await db.matchResult.update({ where: { id: eligible[i].id }, data: { rank: i + 1 } });
  }

  return { processed: results.length, results };
}

// ─── Get matches ──────────────────────────────────────────────────────────────

export interface GetMatchesOptions {
  page?: number;
  pageSize?: number;
  minScore?: number;
}

export async function getStudentMatches(studentId: string, opts: GetMatchesOptions = {}) {
  const { page = 1, pageSize = 20, minScore } = opts;

  const where = {
    studentId,
    ...(minScore !== undefined && {
      fitScore: { totalScore: { gte: minScore } },
    }),
  };

  const [total, items] = await Promise.all([
    db.matchResult.count({ where }),
    db.matchResult.findMany({
      where,
      orderBy: [{ rank: 'asc' }, { generatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        opportunity: {
          select: {
            id: true, type: true, nameI18n: true,
            university: { select: { nameI18n: true, country: true } },
            scholarshipDetail: { select: { tuitionCoverageType: true, livingCoverageType: true, coverageScope: true } },
          },
        },
        fitScore: { select: { totalScore: true, components: true } },
        eligibilityEvaluation: { select: { result: true } },
      },
    }),
  ]);

  return {
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getMatchDetail(studentId: string, matchResultId: string) {
  const match = await db.matchResult.findFirst({
    where: { id: matchResultId, studentId },
    include: {
      opportunity: { include: { university: true, programDetail: true, scholarshipDetail: true } },
      fitScore: true,
      eligibilityEvaluation: true,
      explanations: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!match) throw new NotFoundError('MatchResult');
  return match;
}
