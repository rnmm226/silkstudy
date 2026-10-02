import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '@/src/modules/eligibility/engine';
import type { RuleConditions, StudentSnapshot } from '@/src/modules/eligibility/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseStudent: StudentSnapshot = {
  nationality:    'TUNISIAN',
  currentCountry: 'Tunisia',
  gpa:            3.8,
  gradeScale:     4.0,
  degreeLevel:    'Bachelor',
  fieldOfStudy:   'Computer Science',
  languages:      ['English', 'French'],
  age:            22,
};

const baseRule: RuleConditions = {
  schema_version: '1',
  operator: 'AND',
  conditions: [
    { type: 'LEAF', field: 'student.nationality', operator: 'IN', value: ['TUNISIAN', 'MOROCCAN'] },
    { type: 'LEAF', field: 'student.gpa',         operator: 'GTE', value: 3.0 },
    { type: 'LEAF', field: 'student.degreeLevel', operator: 'EQ',  value: 'Bachelor' },
  ],
};

// ─── Basic PASS / FAIL ────────────────────────────────────────────────────────

describe('evaluateEligibility — basic', () => {
  it('returns ELIGIBLE when all conditions pass', () => {
    const result = evaluateEligibility(baseStudent, baseRule, 'v1');
    expect(result.result).toBe('ELIGIBLE');
    expect(result.reasons.every((r) => r.result === 'PASS')).toBe(true);
  });

  it('returns INELIGIBLE when nationality is excluded', () => {
    const student: StudentSnapshot = { ...baseStudent, nationality: 'FRENCH' };
    const result = evaluateEligibility(student, baseRule, 'v1');
    expect(result.result).toBe('INELIGIBLE');
    const failReason = result.reasons.find((r) => r.field === 'student.nationality');
    expect(failReason?.result).toBe('FAIL');
  });

  it('returns INELIGIBLE when GPA is below threshold', () => {
    const student: StudentSnapshot = { ...baseStudent, gpa: 2.5 };
    const result = evaluateEligibility(student, baseRule, 'v1');
    expect(result.result).toBe('INELIGIBLE');
    const gpaReason = result.reasons.find((r) => r.field === 'student.gpa');
    expect(gpaReason?.result).toBe('FAIL');
  });
});

// ─── UNKNOWN semantics ───────────────────────────────────────────────────────

describe('evaluateEligibility — UNKNOWN (missing data never silently FAILs)', () => {
  it('returns UNKNOWN when GPA is null', () => {
    const student: StudentSnapshot = { ...baseStudent, gpa: null };
    const result = evaluateEligibility(student, baseRule, 'v1');
    expect(result.result).toBe('UNKNOWN');
    const gpaReason = result.reasons.find((r) => r.field === 'student.gpa');
    expect(gpaReason?.result).toBe('UNKNOWN');
    expect(gpaReason?.message).toContain('UNKNOWN');
  });

  it('returns UNKNOWN when degreeLevel is null', () => {
    const student: StudentSnapshot = { ...baseStudent, degreeLevel: null };
    const result = evaluateEligibility(student, baseRule, 'v1');
    expect(result.result).toBe('UNKNOWN');
  });

  it('UNKNOWN is not the same as INELIGIBLE', () => {
    const student: StudentSnapshot = { ...baseStudent, gpa: null };
    const result = evaluateEligibility(student, baseRule, 'v1');
    expect(result.result).not.toBe('INELIGIBLE');
  });
});

// ─── Operators ────────────────────────────────────────────────────────────────

describe('evaluateEligibility — operators', () => {
  function singleLeaf(field: string, operator: string, value: unknown, snapshot = baseStudent) {
    const rule: RuleConditions = {
      schema_version: '1',
      operator: 'AND',
      conditions: [{ type: 'LEAF', field, operator: operator as never, value }],
    };
    return evaluateEligibility(snapshot, rule, 'v1');
  }

  it('EQ: matches exact value case-insensitive', () => {
    expect(singleLeaf('student.degreeLevel', 'EQ', 'bachelor').result).toBe('ELIGIBLE');
  });

  it('NEQ: passes when value differs', () => {
    expect(singleLeaf('student.degreeLevel', 'NEQ', 'Master').result).toBe('ELIGIBLE');
    expect(singleLeaf('student.degreeLevel', 'NEQ', 'Bachelor').result).toBe('INELIGIBLE');
  });

  it('GTE / GT / LTE / LT: numeric comparisons', () => {
    expect(singleLeaf('student.gpa', 'GTE', 3.8).result).toBe('ELIGIBLE');
    expect(singleLeaf('student.gpa', 'GTE', 4.0).result).toBe('INELIGIBLE');
    expect(singleLeaf('student.gpa', 'GT',  3.7).result).toBe('ELIGIBLE');
    expect(singleLeaf('student.gpa', 'LTE', 4.0).result).toBe('ELIGIBLE');
    expect(singleLeaf('student.gpa', 'LT',  3.8).result).toBe('INELIGIBLE');
  });

  it('IN: value in list', () => {
    expect(singleLeaf('student.nationality', 'IN', ['TUNISIAN', 'FRENCH']).result).toBe('ELIGIBLE');
    expect(singleLeaf('student.nationality', 'IN', ['FRENCH', 'GERMAN']).result).toBe('INELIGIBLE');
  });

  it('NOT_IN: value not in excluded list', () => {
    expect(singleLeaf('student.nationality', 'NOT_IN', ['FRENCH']).result).toBe('ELIGIBLE');
    expect(singleLeaf('student.nationality', 'NOT_IN', ['TUNISIAN']).result).toBe('INELIGIBLE');
  });

  it('CONTAINS: array field contains value', () => {
    expect(singleLeaf('student.languages', 'CONTAINS', 'English').result).toBe('ELIGIBLE');
    expect(singleLeaf('student.languages', 'CONTAINS', 'German').result).toBe('INELIGIBLE');
  });

  it('NOT_CONTAINS: array field does not contain value', () => {
    expect(singleLeaf('student.languages', 'NOT_CONTAINS', 'German').result).toBe('ELIGIBLE');
    expect(singleLeaf('student.languages', 'NOT_CONTAINS', 'English').result).toBe('INELIGIBLE');
  });
});

// ─── AND / OR groups ──────────────────────────────────────────────────────────

describe('evaluateEligibility — group logic (AND / OR)', () => {
  it('AND: all must pass', () => {
    const rule: RuleConditions = {
      schema_version: '1', operator: 'AND',
      conditions: [
        { type: 'LEAF', field: 'student.nationality', operator: 'EQ', value: 'TUNISIAN' },
        { type: 'LEAF', field: 'student.gpa',         operator: 'GTE', value: 5.0 }, // will fail
      ],
    };
    expect(evaluateEligibility(baseStudent, rule, 'v1').result).toBe('INELIGIBLE');
  });

  it('OR: at least one must pass', () => {
    const rule: RuleConditions = {
      schema_version: '1', operator: 'OR',
      conditions: [
        { type: 'LEAF', field: 'student.nationality', operator: 'EQ', value: 'FRENCH' },    // fail
        { type: 'LEAF', field: 'student.degreeLevel', operator: 'EQ', value: 'Bachelor' },  // pass
      ],
    };
    expect(evaluateEligibility(baseStudent, rule, 'v1').result).toBe('ELIGIBLE');
  });

  it('nested groups work correctly', () => {
    const rule: RuleConditions = {
      schema_version: '1', operator: 'AND',
      conditions: [
        { type: 'LEAF', field: 'student.gpa', operator: 'GTE', value: 3.0 },
        {
          type: 'GROUP', operator: 'OR',
          conditions: [
            { type: 'LEAF', field: 'student.nationality', operator: 'EQ', value: 'FRENCH' },
            { type: 'LEAF', field: 'student.nationality', operator: 'EQ', value: 'TUNISIAN' },
          ],
        },
      ],
    };
    expect(evaluateEligibility(baseStudent, rule, 'v1').result).toBe('ELIGIBLE');
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('evaluateEligibility — determinism', () => {
  it('produces identical results for the same inputs', () => {
    const r1 = evaluateEligibility(baseStudent, baseRule, 'v1');
    const r2 = evaluateEligibility(baseStudent, baseRule, 'v1');
    expect(r1.result).toBe(r2.result);
    expect(JSON.stringify(r1.reasons)).toBe(JSON.stringify(r2.reasons));
  });
});

// ─── Reasons structure ────────────────────────────────────────────────────────

describe('evaluateEligibility — reasons', () => {
  it('provides structured reasons for every condition', () => {
    const result = evaluateEligibility(baseStudent, baseRule, 'v1');
    expect(result.reasons.length).toBeGreaterThan(0);
    for (const reason of result.reasons) {
      expect(reason).toHaveProperty('field');
      expect(reason).toHaveProperty('result');
      expect(reason).toHaveProperty('message');
      expect(['PASS', 'FAIL', 'UNKNOWN', 'NOT_APPLICABLE']).toContain(reason.result);
    }
  });
});
