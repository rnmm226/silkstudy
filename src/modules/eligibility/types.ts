/**
 * Eligibility condition schema v1.
 *
 * Conditions are stored as JSON in eligibility_rule_versions.conditions.
 * This module owns the type contract and the evaluation logic.
 */

export type ConditionResult = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';

export type ConditionOperator =
  | 'EQ'   // equal
  | 'NEQ'  // not equal
  | 'GT'   // greater than
  | 'GTE'  // greater than or equal
  | 'LT'   // less than
  | 'LTE'  // less than or equal
  | 'IN'   // value in list
  | 'NOT_IN'
  | 'CONTAINS'      // array contains value
  | 'NOT_CONTAINS';

export interface LeafCondition {
  type:     'LEAF';
  field:    string;   // e.g. "student.nationality", "student.gpa"
  operator: ConditionOperator;
  value:    unknown;  // expected value(s)
}

export interface GroupCondition {
  type:       'GROUP';
  operator:   'AND' | 'OR';
  conditions: Condition[];
}

export type Condition = LeafCondition | GroupCondition;

/** Top-level rule conditions document */
export interface RuleConditions {
  schema_version: string;
  operator:       'AND' | 'OR';
  conditions:     Condition[];
}

/** Per-condition evaluation reason */
export interface EvaluationReason {
  field:    string;
  operator: string;
  expected: unknown;
  actual:   unknown;
  result:   ConditionResult;
  message:  string;
}

/** Full evaluation output */
export interface EvaluationOutput {
  result:         'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
  reasons:        EvaluationReason[];
  ruleVersionId:  string;
  schemaVersion:  string;
  evaluatedAt:    Date;
}

/** Student profile snapshot used during evaluation */
export interface StudentSnapshot {
  nationality:    string;
  currentCountry: string;
  gpa?:           number | null;
  gradeScale?:    number | null;
  degreeLevel?:   string | null;
  fieldOfStudy?:  string | null;
  languages?:     string[];
  age?:           number | null;
}
