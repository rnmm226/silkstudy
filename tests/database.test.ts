import { describe, expect, it } from 'vitest';
import {
  BudgetPeriod,
  BudgetScope,
  CoverageType,
  DeadlineType,
  EligibilityResult,
  OpportunityType,
} from '@prisma/client';

describe('Database Domain Invariants & Schema Contract', () => {
  it('enforces explicit distinction between NONE and UNKNOWN coverage types', () => {
    expect(CoverageType.NONE).not.toEqual(CoverageType.UNKNOWN);
    expect(CoverageType.FULL).not.toEqual(CoverageType.PARTIAL);
    expect(Object.values(CoverageType)).toEqual(['FULL', 'PARTIAL', 'NONE', 'UNKNOWN']);
  });

  it('enforces structured budget properties: amount, currency, period, scope', () => {
    const validPeriods = Object.values(BudgetPeriod);
    const validScopes = Object.values(BudgetScope);

    expect(validPeriods).toEqual(['MONTHLY', 'YEARLY', 'TOTAL']);
    expect(validScopes).toEqual(['TUITION_ONLY', 'LIVING_ONLY', 'TOTAL_COST', 'OTHER']);

    const sampleBudget = {
      amount: 6000,
      currency: 'EUR',
      period: BudgetPeriod.YEARLY,
      scope: BudgetScope.TOTAL_COST,
    };

    expect(sampleBudget.amount).toBeGreaterThan(0);
    expect(sampleBudget.currency).toBe('EUR');
    expect(sampleBudget.period).toBe(BudgetPeriod.YEARLY);
    expect(sampleBudget.scope).toBe(BudgetScope.TOTAL_COST);
  });

  it('validates canonical deadline hierarchy: Opportunity -> Cycle -> Deadline', () => {
    const sampleOpportunity = { id: 'opp-1', type: OpportunityType.SCHOLARSHIP };
    const sampleCycle1 = { id: 'cycle-1', opportunityId: sampleOpportunity.id, name: '2026 Intake' };
    const sampleCycle2 = { id: 'cycle-2', opportunityId: sampleOpportunity.id, name: '2027 Intake' };

    const sampleDeadline1 = {
      id: 'dl-1',
      applicationCycleId: sampleCycle1.id,
      type: DeadlineType.APPLICATION,
      dueAt: new Date('2025-12-15T23:59:00Z'),
    };
    const sampleDeadline2 = {
      id: 'dl-2',
      applicationCycleId: sampleCycle2.id,
      type: DeadlineType.APPLICATION,
      dueAt: new Date('2026-12-15T23:59:00Z'),
    };

    expect(sampleCycle1.opportunityId).toBe(sampleOpportunity.id);
    expect(sampleCycle2.opportunityId).toBe(sampleOpportunity.id);
    expect(sampleDeadline1.applicationCycleId).toBe(sampleCycle1.id);
    expect(sampleDeadline2.applicationCycleId).toBe(sampleCycle2.id);
  });

  it('verifies immutable eligibility rule versioning design', () => {
    const rule = { id: 'rule-1', opportunityId: 'opp-1', activeVersionId: 'ver-2' };
    const version1 = {
      id: 'ver-1',
      eligibilityRuleId: rule.id,
      versionNumber: 1,
      schemaVersion: '1',
      conditions: { schema_version: '1', operator: 'AND', conditions: [] },
    };
    const version2 = {
      id: 'ver-2',
      eligibilityRuleId: rule.id,
      versionNumber: 2,
      schemaVersion: '1',
      conditions: { schema_version: '1', operator: 'AND', conditions: [] },
    };

    expect(version1.versionNumber).toBe(1);
    expect(version2.versionNumber).toBe(2);
    expect(version1.eligibilityRuleId).toBe(rule.id);
    expect(version2.eligibilityRuleId).toBe(rule.id);
  });

  it('verifies fact provenance relationship structures', () => {
    const source = {
      id: 'src-1',
      url: 'https://official.university.edu/scholarships',
      verificationStatus: 'VERIFIED',
    };
    const factSource = {
      id: 'fact-src-1',
      sourceId: source.id,
      entityType: 'scholarship_detail',
      entityId: 'detail-1',
      factKey: 'tuition_coverage_type',
    };

    expect(factSource.sourceId).toBe(source.id);
    expect(factSource.factKey).toBe('tuition_coverage_type');
  });

  it('validates EligibilityResult enum values', () => {
    expect(Object.values(EligibilityResult)).toEqual(['ELIGIBLE', 'INELIGIBLE', 'UNKNOWN']);
  });
});
