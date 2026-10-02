import type { CoverageType } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DimensionResult = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';

export interface ScoringComponent {
  dimension:   string;
  result:      DimensionResult;
  score:       number;       // 0–maxScore
  maxScore:    number;
  weight:      number;       // 0–1
  contribution: number;      // score * weight, rounded
  details:     string;
}

export interface FitScoreOutput {
  totalScore:  number;       // 0–100
  confidence:  number;       // 0–1 (lower when many UNKNOWN dimensions)
  components:  ScoringComponent[];
  explanation: {
    positive: string[];
    negative: string[];
    unknown:  string[];
  };
}

// ─── Scoring configuration (v1 — deterministic, versioned inline) ─────────────

const WEIGHTS = {
  budget:        0.25,
  tuitionCoverage: 0.20,
  livingCoverage:  0.15,
  country:       0.15,
  field:         0.10,
  language:      0.10,
  degreeLevel:   0.05,
} as const;

// ─── Coverage helper ──────────────────────────────────────────────────────────

function scoreCoverage(coverage: CoverageType | string | null): { score: number; result: DimensionResult } {
  switch (coverage) {
    case 'FULL':    return { score: 10, result: 'PASS' };
    case 'PARTIAL': return { score: 5,  result: 'PASS' };
    case 'NONE':    return { score: 0,  result: 'FAIL' };
    case 'UNKNOWN':
    default:        return { score: 0,  result: 'UNKNOWN' };
  }
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface ScoringInputStudent {
  budgetAmount:    number | null;
  budgetCurrency:  string | null;
  budgetPeriod:    string | null;   // MONTHLY | YEARLY | TOTAL
  preferredCountries: string[];
  preferredLanguages: string[];
  fieldsOfInterest:   string[];
  targetDegreeLevel:  string | null;
}

export interface ScoringInputOpportunity {
  universityCountry:      string | null;
  programDegreeLevel:     string | null;
  programFieldOfStudy:    string | null;
  programLanguages:       string[];
  scholarshipTuitionCoverage: CoverageType | null;
  scholarshipLivingCoverage:  CoverageType | null;
  monthlyStipendAmount:   number | null;
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function computeFitScore(
  student: ScoringInputStudent,
  opportunity: ScoringInputOpportunity,
): FitScoreOutput {
  const components: ScoringComponent[] = [];

  // 1. Budget dimension ─────────────────────────────────────────────────────
  // Convert student budget to yearly EUR-equivalent (simplified: no FX)
  let budgetScore = 0;
  let budgetResult: DimensionResult = 'UNKNOWN';
  let budgetDetails = 'Budget not set.';

  if (student.budgetAmount !== null && opportunity.monthlyStipendAmount !== null) {
    // If scholarship provides a stipend, it reduces effective cost
    const stipendYearly = opportunity.monthlyStipendAmount * 12;
    const studentYearly =
      student.budgetPeriod === 'MONTHLY'  ? student.budgetAmount * 12 :
      student.budgetPeriod === 'TOTAL'    ? student.budgetAmount / 4 :  // assume 4-year program
      student.budgetAmount;                                               // YEARLY

    if (stipendYearly >= studentYearly) {
      budgetScore = 10; budgetResult = 'PASS';
      budgetDetails = `Stipend (${stipendYearly}/yr) covers student budget (${studentYearly}/yr).`;
    } else {
      budgetScore = Math.round((stipendYearly / studentYearly) * 10);
      budgetResult = budgetScore >= 5 ? 'PASS' : 'FAIL';
      budgetDetails = `Stipend covers ${Math.round((stipendYearly / studentYearly) * 100)}% of budget.`;
    }
  } else if (student.budgetAmount !== null) {
    budgetScore = 5; budgetResult = 'UNKNOWN';
    budgetDetails = 'No stipend info — budget fit is unknown.';
  }

  components.push({
    dimension: 'budget', result: budgetResult,
    score: budgetScore, maxScore: 10, weight: WEIGHTS.budget,
    contribution: Math.round(budgetScore * WEIGHTS.budget * 10),
    details: budgetDetails,
  });

  // 2. Tuition coverage ─────────────────────────────────────────────────────
  const tc = scoreCoverage(opportunity.scholarshipTuitionCoverage);
  components.push({
    dimension: 'tuition_coverage', result: tc.result,
    score: tc.score, maxScore: 10, weight: WEIGHTS.tuitionCoverage,
    contribution: Math.round(tc.score * WEIGHTS.tuitionCoverage * 10),
    details: `Tuition coverage: ${opportunity.scholarshipTuitionCoverage ?? 'UNKNOWN'}.`,
  });

  // 3. Living coverage ──────────────────────────────────────────────────────
  const lc = scoreCoverage(opportunity.scholarshipLivingCoverage);
  components.push({
    dimension: 'living_coverage', result: lc.result,
    score: lc.score, maxScore: 10, weight: WEIGHTS.livingCoverage,
    contribution: Math.round(lc.score * WEIGHTS.livingCoverage * 10),
    details: `Living coverage: ${opportunity.scholarshipLivingCoverage ?? 'UNKNOWN'}.`,
  });

  // 4. Country preference ───────────────────────────────────────────────────
  let countryScore = 0; let countryResult: DimensionResult = 'UNKNOWN';
  let countryDetails = 'No country preference set.';

  if (student.preferredCountries.length > 0 && opportunity.universityCountry) {
    const match = student.preferredCountries
      .map((c) => c.toLowerCase())
      .includes(opportunity.universityCountry.toLowerCase());
    countryScore  = match ? 10 : 0;
    countryResult = match ? 'PASS' : 'FAIL';
    countryDetails = match
      ? `Country "${opportunity.universityCountry}" matches preferences.`
      : `Country "${opportunity.universityCountry}" not in preferred list.`;
  } else if (opportunity.universityCountry) {
    countryScore = 5; countryResult = 'UNKNOWN';
    countryDetails = 'No preferred countries — cannot determine fit.';
  }

  components.push({
    dimension: 'country', result: countryResult,
    score: countryScore, maxScore: 10, weight: WEIGHTS.country,
    contribution: Math.round(countryScore * WEIGHTS.country * 10),
    details: countryDetails,
  });

  // 5. Field of study ───────────────────────────────────────────────────────
  let fieldScore = 0; let fieldResult: DimensionResult = 'UNKNOWN';
  let fieldDetails = 'No field preference set.';

  if (student.fieldsOfInterest.length > 0 && opportunity.programFieldOfStudy) {
    const match = student.fieldsOfInterest.some((f) =>
      opportunity.programFieldOfStudy!.toLowerCase().includes(f.toLowerCase()) ||
      f.toLowerCase().includes(opportunity.programFieldOfStudy!.toLowerCase())
    );
    fieldScore  = match ? 10 : 3;
    fieldResult = match ? 'PASS' : 'FAIL';
    fieldDetails = match
      ? `Field "${opportunity.programFieldOfStudy}" aligns with interests.`
      : `Field "${opportunity.programFieldOfStudy}" doesn't match interests.`;
  }

  components.push({
    dimension: 'field', result: fieldResult,
    score: fieldScore, maxScore: 10, weight: WEIGHTS.field,
    contribution: Math.round(fieldScore * WEIGHTS.field * 10),
    details: fieldDetails,
  });

  // 6. Language ─────────────────────────────────────────────────────────────
  let langScore = 0; let langResult: DimensionResult = 'UNKNOWN';
  let langDetails = 'No language info.';

  if (student.preferredLanguages.length > 0 && opportunity.programLanguages.length > 0) {
    const match = opportunity.programLanguages.some((l) =>
      student.preferredLanguages.map((s) => s.toLowerCase()).includes(l.toLowerCase())
    );
    langScore  = match ? 10 : 0;
    langResult = match ? 'PASS' : 'FAIL';
    langDetails = match
      ? 'Student speaks at least one instruction language.'
      : 'No language overlap found.';
  } else if (opportunity.programLanguages.length > 0) {
    langDetails = 'Student languages not set — language fit is UNKNOWN.';
  }

  components.push({
    dimension: 'language', result: langResult,
    score: langScore, maxScore: 10, weight: WEIGHTS.language,
    contribution: Math.round(langScore * WEIGHTS.language * 10),
    details: langDetails,
  });

  // 7. Degree level ─────────────────────────────────────────────────────────
  let degreeScore = 0; let degreeResult: DimensionResult = 'UNKNOWN';
  let degreeDetails = 'No target degree preference.';

  if (student.targetDegreeLevel && opportunity.programDegreeLevel) {
    const match = student.targetDegreeLevel.toLowerCase() === opportunity.programDegreeLevel.toLowerCase();
    degreeScore  = match ? 10 : 0;
    degreeResult = match ? 'PASS' : 'FAIL';
    degreeDetails = match
      ? `Degree level "${opportunity.programDegreeLevel}" matches target.`
      : `Target is "${student.targetDegreeLevel}", opportunity offers "${opportunity.programDegreeLevel}".`;
  }

  components.push({
    dimension: 'degree_level', result: degreeResult,
    score: degreeScore, maxScore: 10, weight: WEIGHTS.degreeLevel,
    contribution: Math.round(degreeScore * WEIGHTS.degreeLevel * 10),
    details: degreeDetails,
  });

  // ── Aggregate ─────────────────────────────────────────────────────────────

  const totalContribution = components.reduce((s, c) => s + c.contribution, 0);
  const maxContribution   = components.reduce((s, c) => s + Math.round(c.maxScore * c.weight * 10), 0);
  const totalScore = maxContribution > 0
    ? Math.round((totalContribution / maxContribution) * 100)
    : 0;

  // Confidence: decreases with each UNKNOWN dimension (weighted)
  const unknownWeight = components
    .filter((c) => c.result === 'UNKNOWN')
    .reduce((s, c) => s + c.weight, 0);
  const confidence = Math.round((1 - unknownWeight) * 100) / 100;

  // Explanation
  const positive = components.filter((c) => c.result === 'PASS').map((c) => c.details);
  const negative = components.filter((c) => c.result === 'FAIL').map((c) => c.details);
  const unknown  = components.filter((c) => c.result === 'UNKNOWN').map((c) => c.details);

  return { totalScore, confidence, components, explanation: { positive, negative, unknown } };
}
