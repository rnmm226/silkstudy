/**
 * Matching regression tests.
 *
 * These tests use fixed student + opportunity fixtures to verify that
 * eligibility + fit scoring produce expected results across the key cases
 * defined in the seed dataset (FULL+FULL, FULL only, PARTIAL, UNKNOWN).
 *
 * No database connection required — the engine and scorer are pure functions.
 */

import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '@/src/modules/eligibility/engine';
import { computeFitScore } from '@/src/modules/matching/scoring';
import type { RuleConditions, StudentSnapshot } from '@/src/modules/eligibility/types';
import type { ScoringInputStudent, ScoringInputOpportunity } from '@/src/modules/matching/scoring';

// ─── Fixtures matching the seed data ─────────────────────────────────────────

const completeStudent: StudentSnapshot = {
  nationality:    'TUNISIAN',
  currentCountry: 'Tunisia',
  gpa:            3.8,
  gradeScale:     4.0,
  degreeLevel:    'Bachelor',
  fieldOfStudy:   'Computer Science',
  languages:      ['English', 'French'],
  age:            24,
};

const missingStudent: StudentSnapshot = {
  nationality:    'TUNISIAN',
  currentCountry: 'Tunisia',
  gpa:            null,
  gradeScale:     null,
  degreeLevel:    'Bachelor',
  fieldOfStudy:   'Data Science',
  languages:      ['English'],
  age:            null,
};

const seedRule: RuleConditions = {
  schema_version: '1',
  operator: 'AND',
  conditions: [
    { type: 'LEAF', field: 'student.nationality', operator: 'IN',  value: ['TUNISIAN', 'FRENCH'] },
    { type: 'LEAF', field: 'student.degreeLevel', operator: 'EQ',  value: 'Bachelor' },
    { type: 'LEAF', field: 'student.gpa',         operator: 'GTE', value: 3.0 },
  ],
};

const completeStudentInput: ScoringInputStudent = {
  budgetAmount:       6000,
  budgetCurrency:     'EUR',
  budgetPeriod:       'YEARLY',
  preferredCountries: ['France', 'Italy'],
  preferredLanguages: ['English', 'French'],
  fieldsOfInterest:   ['Computer Science', 'Artificial Intelligence'],
  targetDegreeLevel:  'Master',
};

// ─── Eligibility regression ───────────────────────────────────────────────────

describe('Regression: eligibility cases from seed', () => {
  it('CASE 1: complete student with GPA 3.8 → ELIGIBLE', () => {
    const r = evaluateEligibility(completeStudent, seedRule, 'seed-v1');
    expect(r.result).toBe('ELIGIBLE');
  });

  it('CASE 2: missing GPA student → UNKNOWN (not INELIGIBLE)', () => {
    const r = evaluateEligibility(missingStudent, seedRule, 'seed-v1');
    expect(r.result).toBe('UNKNOWN');
    // GPA reason must be UNKNOWN
    const gpaReason = r.reasons.find((re) => re.field === 'student.gpa');
    expect(gpaReason?.result).toBe('UNKNOWN');
    expect(r.result).not.toBe('INELIGIBLE');
  });

  it('CASE 3: student with GPA 2.5 → INELIGIBLE', () => {
    const lowGpa: StudentSnapshot = { ...completeStudent, gpa: 2.5 };
    const r = evaluateEligibility(lowGpa, seedRule, 'seed-v1');
    expect(r.result).toBe('INELIGIBLE');
  });

  it('CASE 4: wrong nationality → INELIGIBLE', () => {
    const wrongNat: StudentSnapshot = { ...completeStudent, nationality: 'GERMAN' };
    const r = evaluateEligibility(wrongNat, seedRule, 'seed-v1');
    expect(r.result).toBe('INELIGIBLE');
  });

  it('CASE 5: wrong degree → INELIGIBLE', () => {
    const master: StudentSnapshot = { ...completeStudent, degreeLevel: 'Master' };
    const r = evaluateEligibility(master, seedRule, 'seed-v1');
    expect(r.result).toBe('INELIGIBLE');
  });
});

// ─── Coverage scoring regression ─────────────────────────────────────────────

describe('Regression: funding coverage cases from seed', () => {
  const baseOpp = (tuition: string, living: string): ScoringInputOpportunity => ({
    universityCountry:          'France',
    programDegreeLevel:         'Master',
    programFieldOfStudy:        'Artificial Intelligence',
    programLanguages:           ['English'],
    scholarshipTuitionCoverage: tuition as never,
    scholarshipLivingCoverage:  living  as never,
    monthlyStipendAmount:       tuition === 'FULL' && living === 'FULL' ? 1200 : null,
  });

  it('CASE A: FULL tuition + FULL living → highest score', () => {
    const fullFull = computeFitScore(completeStudentInput, baseOpp('FULL', 'FULL'));
    const fullOnly = computeFitScore(completeStudentInput, baseOpp('FULL', 'NONE'));
    expect(fullFull.totalScore).toBeGreaterThan(fullOnly.totalScore);
  });

  it('CASE B: FULL tuition only (NONE living) → lower than FULL+FULL', () => {
    const fullFull = computeFitScore(completeStudentInput, baseOpp('FULL', 'FULL'));
    const fullOnly = computeFitScore(completeStudentInput, baseOpp('FULL', 'NONE'));
    expect(fullOnly.totalScore).toBeLessThan(fullFull.totalScore);
    // But should still be positive
    expect(fullOnly.totalScore).toBeGreaterThan(0);
  });

  it('CASE C: PARTIAL tuition → scores between FULL and NONE', () => {
    const full    = computeFitScore(completeStudentInput, baseOpp('FULL', 'NONE'));
    const partial = computeFitScore(completeStudentInput, baseOpp('PARTIAL', 'NONE'));
    const none    = computeFitScore(completeStudentInput, baseOpp('NONE', 'NONE'));
    expect(full.totalScore).toBeGreaterThan(partial.totalScore);
    expect(partial.totalScore).toBeGreaterThan(none.totalScore);
  });

  it('CASE D: UNKNOWN coverage → does not count as FULL (no positive contribution)', () => {
    const unknown = computeFitScore(completeStudentInput, baseOpp('UNKNOWN', 'UNKNOWN'));
    const full    = computeFitScore(completeStudentInput, baseOpp('FULL', 'FULL'));
    expect(unknown.totalScore).toBeLessThan(full.totalScore);
    // Tuition component must be UNKNOWN, not PASS
    const tuitionComp = unknown.components.find((c) => c.dimension === 'tuition_coverage');
    expect(tuitionComp?.result).toBe('UNKNOWN');
    expect(tuitionComp?.score).toBe(0);
  });

  it('CASE E: living only (NONE tuition + FULL living) → different from FULL+FULL', () => {
    const living = computeFitScore(completeStudentInput, baseOpp('NONE', 'FULL'));
    const full   = computeFitScore(completeStudentInput, baseOpp('FULL', 'FULL'));
    expect(living.totalScore).not.toBe(full.totalScore);
  });
});

// ─── Country + field regression ───────────────────────────────────────────────

describe('Regression: country and field matching', () => {
  it('preferred country France matches France university', () => {
    const opp: ScoringInputOpportunity = {
      universityCountry: 'France',
      programDegreeLevel: 'Master',
      programFieldOfStudy: 'Computer Science',
      programLanguages: ['English'],
      scholarshipTuitionCoverage: 'FULL',
      scholarshipLivingCoverage: 'FULL',
      monthlyStipendAmount: 1200,
    };
    const r = computeFitScore(completeStudentInput, opp);
    const countryComp = r.components.find((c) => c.dimension === 'country');
    expect(countryComp?.result).toBe('PASS');
  });

  it('non-preferred country Germany does not match France preference', () => {
    const opp: ScoringInputOpportunity = {
      universityCountry: 'Germany',
      programDegreeLevel: 'Master',
      programFieldOfStudy: 'Computer Science',
      programLanguages: ['English'],
      scholarshipTuitionCoverage: 'FULL',
      scholarshipLivingCoverage: 'FULL',
      monthlyStipendAmount: null,
    };
    const r = computeFitScore(completeStudentInput, opp);
    const countryComp = r.components.find((c) => c.dimension === 'country');
    expect(countryComp?.result).toBe('FAIL');
  });

  it('AI field matches Computer Science interest (substring)', () => {
    const opp: ScoringInputOpportunity = {
      universityCountry: 'France',
      programDegreeLevel: 'Master',
      programFieldOfStudy: 'Artificial Intelligence',
      programLanguages: ['English'],
      scholarshipTuitionCoverage: 'FULL',
      scholarshipLivingCoverage: 'FULL',
      monthlyStipendAmount: null,
    };
    const r = computeFitScore(completeStudentInput, opp);
    const fieldComp = r.components.find((c) => c.dimension === 'field');
    expect(fieldComp?.result).toBe('PASS');
  });
});

// ─── Determinism regression ───────────────────────────────────────────────────

describe('Regression: determinism guarantee', () => {
  it('same student + same rule + same opportunity always produces the same score', () => {
    const opp: ScoringInputOpportunity = {
      universityCountry: 'France',
      programDegreeLevel: 'Master',
      programFieldOfStudy: 'Computer Science',
      programLanguages: ['English'],
      scholarshipTuitionCoverage: 'FULL',
      scholarshipLivingCoverage: 'FULL',
      monthlyStipendAmount: 1200,
    };
    const r1 = computeFitScore(completeStudentInput, opp);
    const r2 = computeFitScore(completeStudentInput, opp);
    const r3 = computeFitScore(completeStudentInput, opp);
    expect(r1.totalScore).toBe(r2.totalScore);
    expect(r2.totalScore).toBe(r3.totalScore);
    expect(JSON.stringify(r1.components)).toBe(JSON.stringify(r2.components));
  });

  it('eligibility result is deterministic', () => {
    const r1 = evaluateEligibility(completeStudent, seedRule, 'v1');
    const r2 = evaluateEligibility(completeStudent, seedRule, 'v1');
    expect(r1.result).toBe(r2.result);
    expect(JSON.stringify(r1.reasons)).toBe(JSON.stringify(r2.reasons));
  });
});
