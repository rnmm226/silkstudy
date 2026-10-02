import { describe, it, expect } from 'vitest';
import { computeFitScore } from '@/src/modules/matching/scoring';
import type { ScoringInputStudent, ScoringInputOpportunity } from '@/src/modules/matching/scoring';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fullStudent: ScoringInputStudent = {
  budgetAmount:       6000,
  budgetCurrency:     'EUR',
  budgetPeriod:       'YEARLY',
  preferredCountries: ['France', 'Germany'],
  preferredLanguages: ['English', 'French'],
  fieldsOfInterest:   ['Computer Science', 'AI'],
  targetDegreeLevel:  'Master',
};

const fullOpportunity: ScoringInputOpportunity = {
  universityCountry:          'France',
  programDegreeLevel:         'Master',
  programFieldOfStudy:        'Computer Science',
  programLanguages:           ['English'],
  scholarshipTuitionCoverage: 'FULL',
  scholarshipLivingCoverage:  'FULL',
  monthlyStipendAmount:       800,
};

// ─── Total score ──────────────────────────────────────────────────────────────

describe('computeFitScore — totalScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('scores high when everything matches', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    expect(result.totalScore).toBeGreaterThan(60);
  });

  it('scores lower when country does not match', () => {
    const opp = { ...fullOpportunity, universityCountry: 'Japan' };
    const result = computeFitScore(fullStudent, opp);
    const fullResult = computeFitScore(fullStudent, fullOpportunity);
    expect(result.totalScore).toBeLessThan(fullResult.totalScore);
  });

  it('scores lower when living coverage is NONE vs FULL', () => {
    const oppFull = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipLivingCoverage: 'FULL' });
    const oppNone = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipLivingCoverage: 'NONE' });
    expect(oppFull.totalScore).toBeGreaterThan(oppNone.totalScore);
  });
});

// ─── Confidence ───────────────────────────────────────────────────────────────

describe('computeFitScore — confidence', () => {
  it('returns confidence between 0 and 1', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('confidence is lower when student has no preferences set', () => {
    const emptyStudent: ScoringInputStudent = {
      budgetAmount: null, budgetCurrency: null, budgetPeriod: null,
      preferredCountries: [], preferredLanguages: [], fieldsOfInterest: [], targetDegreeLevel: null,
    };
    const full   = computeFitScore(fullStudent,  fullOpportunity);
    const empty  = computeFitScore(emptyStudent, fullOpportunity);
    expect(full.confidence).toBeGreaterThan(empty.confidence);
  });
});

// ─── UNKNOWN dimensions never score positively ────────────────────────────────

describe('computeFitScore — UNKNOWN semantics', () => {
  it('UNKNOWN coverage does not add a positive contribution', () => {
    const oppUnknown = { ...fullOpportunity, scholarshipTuitionCoverage: 'UNKNOWN' as const };
    const result = computeFitScore(fullStudent, oppUnknown);
    const tuitionComp = result.components.find((c) => c.dimension === 'tuition_coverage');
    expect(tuitionComp?.result).toBe('UNKNOWN');
    expect(tuitionComp?.score).toBe(0);
  });

  it('missing language preferences yields UNKNOWN language dimension', () => {
    const student = { ...fullStudent, preferredLanguages: [] };
    const result = computeFitScore(student, fullOpportunity);
    const langComp = result.components.find((c) => c.dimension === 'language');
    expect(langComp?.result).toBe('UNKNOWN');
  });

  it('missing field preferences yields UNKNOWN field dimension', () => {
    const student = { ...fullStudent, fieldsOfInterest: [] };
    const result = computeFitScore(student, fullOpportunity);
    const fieldComp = result.components.find((c) => c.dimension === 'field');
    expect(fieldComp?.result).toBe('UNKNOWN');
  });
});

// ─── Components structure ─────────────────────────────────────────────────────

describe('computeFitScore — components', () => {
  it('returns 7 components', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    expect(result.components).toHaveLength(7);
  });

  it('every component has required fields', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    for (const c of result.components) {
      expect(c).toHaveProperty('dimension');
      expect(c).toHaveProperty('result');
      expect(c).toHaveProperty('score');
      expect(c).toHaveProperty('maxScore');
      expect(c).toHaveProperty('weight');
      expect(c).toHaveProperty('contribution');
      expect(c).toHaveProperty('details');
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(c.maxScore);
      expect(c.weight).toBeGreaterThan(0);
      expect(['PASS', 'FAIL', 'UNKNOWN', 'NOT_APPLICABLE']).toContain(c.result);
    }
  });

  it('all weights sum to 1', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    const totalWeight = result.components.reduce((s, c) => s + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });
});

// ─── Explanation ──────────────────────────────────────────────────────────────

describe('computeFitScore — explanation', () => {
  it('populates positive, negative, and unknown lists', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    expect(Array.isArray(result.explanation.positive)).toBe(true);
    expect(Array.isArray(result.explanation.negative)).toBe(true);
    expect(Array.isArray(result.explanation.unknown)).toBe(true);
  });

  it('PASS dimensions appear in positive list', () => {
    const result = computeFitScore(fullStudent, fullOpportunity);
    const passComponents = result.components.filter((c) => c.result === 'PASS');
    for (const c of passComponents) {
      expect(result.explanation.positive.some((p) => p === c.details)).toBe(true);
    }
  });

  it('FAIL dimensions appear in negative list', () => {
    const opp = { ...fullOpportunity, universityCountry: 'Japan' }; // will fail country
    const result = computeFitScore(fullStudent, opp);
    const failComp = result.components.find((c) => c.dimension === 'country');
    expect(failComp?.result).toBe('FAIL');
    expect(result.explanation.negative.some((n) => n === failComp?.details)).toBe(true);
  });
});

// ─── Funding coverage strict semantics ───────────────────────────────────────

describe('computeFitScore — funding coverage strict', () => {
  it('FULL tuition + FULL living scores higher than FULL tuition + NONE living', () => {
    const full    = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipLivingCoverage: 'FULL' });
    const partial = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipLivingCoverage: 'NONE' });
    expect(full.totalScore).toBeGreaterThan(partial.totalScore);
  });

  it('PARTIAL coverage scores between FULL and NONE', () => {
    const full    = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipTuitionCoverage: 'FULL' });
    const partial = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipTuitionCoverage: 'PARTIAL' });
    const none    = computeFitScore(fullStudent, { ...fullOpportunity, scholarshipTuitionCoverage: 'NONE' });
    expect(full.totalScore).toBeGreaterThan(partial.totalScore);
    expect(partial.totalScore).toBeGreaterThan(none.totalScore);
  });
});
