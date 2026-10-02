import type {
  Condition, LeafCondition, GroupCondition,
  ConditionResult, ConditionOperator,
  EvaluationReason, EvaluationOutput,
  RuleConditions, StudentSnapshot,
} from './types';

// ─── Field resolver ───────────────────────────────────────────────────────────

/**
 * Resolve a dotted field path against the student snapshot.
 * Returns `undefined` when the field is missing (→ UNKNOWN).
 */
function resolveField(snapshot: StudentSnapshot, field: string): unknown {
  const map: Record<string, unknown> = {
    'student.nationality':    snapshot.nationality,
    'student.currentCountry': snapshot.currentCountry,
    'student.gpa':            snapshot.gpa,
    'student.gradeScale':     snapshot.gradeScale,
    'student.degreeLevel':    snapshot.degreeLevel,
    'student.fieldOfStudy':   snapshot.fieldOfStudy,
    'student.languages':      snapshot.languages ?? [],
    'student.age':            snapshot.age,
  };
  return map[field]; // undefined = missing / unknown
}

// ─── Leaf evaluator ───────────────────────────────────────────────────────────

function evaluateLeaf(
  leaf: LeafCondition,
  snapshot: StudentSnapshot,
): EvaluationReason {
  const actual  = resolveField(snapshot, leaf.field);
  const { field, operator, value } = leaf;

  // Missing data → UNKNOWN (never FAIL)
  if (actual === undefined || actual === null) {
    return {
      field, operator, expected: value, actual: null,
      result: 'UNKNOWN',
      message: `Field "${field}" is missing — result is UNKNOWN.`,
    };
  }

  let result: ConditionResult = 'FAIL';
  let message = '';

  switch (operator as ConditionOperator) {
    case 'EQ':
      result = String(actual).toLowerCase() === String(value).toLowerCase() ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} matches "${value}".`
        : `${field} is "${actual}", expected "${value}".`;
      break;

    case 'NEQ':
      result = String(actual).toLowerCase() !== String(value).toLowerCase() ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} is not "${value}".`
        : `${field} must not be "${value}".`;
      break;

    case 'GT':
      result = Number(actual) > Number(value) ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} (${actual}) > ${value}.`
        : `${field} (${actual}) is not > ${value}.`;
      break;

    case 'GTE':
      result = Number(actual) >= Number(value) ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} (${actual}) >= ${value}.`
        : `${field} (${actual}) is not >= ${value}.`;
      break;

    case 'LT':
      result = Number(actual) < Number(value) ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} (${actual}) < ${value}.`
        : `${field} (${actual}) is not < ${value}.`;
      break;

    case 'LTE':
      result = Number(actual) <= Number(value) ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} (${actual}) <= ${value}.`
        : `${field} (${actual}) is not <= ${value}.`;
      break;

    case 'IN': {
      const list = Array.isArray(value) ? (value as unknown[]) : [value];
      result = list.map((v) => String(v).toLowerCase()).includes(String(actual).toLowerCase())
        ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} ("${actual}") is in allowed list.`
        : `${field} ("${actual}") is not in allowed list [${list.join(', ')}].`;
      break;
    }

    case 'NOT_IN': {
      const list = Array.isArray(value) ? (value as unknown[]) : [value];
      result = !list.map((v) => String(v).toLowerCase()).includes(String(actual).toLowerCase())
        ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} ("${actual}") is not in excluded list.`
        : `${field} ("${actual}") is in excluded list.`;
      break;
    }

    case 'CONTAINS': {
      const arr = Array.isArray(actual) ? actual : [];
      result = arr.map((v) => String(v).toLowerCase()).includes(String(value).toLowerCase())
        ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} contains "${value}".`
        : `${field} does not contain "${value}".`;
      break;
    }

    case 'NOT_CONTAINS': {
      const arr = Array.isArray(actual) ? actual : [];
      result = !arr.map((v) => String(v).toLowerCase()).includes(String(value).toLowerCase())
        ? 'PASS' : 'FAIL';
      message = result === 'PASS'
        ? `${field} does not contain "${value}".`
        : `${field} contains excluded value "${value}".`;
      break;
    }

    default:
      result = 'UNKNOWN';
      message = `Unknown operator "${operator}".`;
  }

  return { field, operator, expected: value, actual, result, message };
}

// ─── Group evaluator ──────────────────────────────────────────────────────────

function evaluateGroup(
  group: GroupCondition,
  snapshot: StudentSnapshot,
): { result: ConditionResult; reasons: EvaluationReason[] } {
  const childReasons: EvaluationReason[] = [];

  for (const child of group.conditions) {
    const r = evaluateCondition(child, snapshot);
    childReasons.push(...r.reasons);
  }

  const results = childReasons.map((r) => r.result);

  let result: ConditionResult;
  if (group.operator === 'AND') {
    if (results.includes('FAIL'))    result = 'FAIL';
    else if (results.includes('UNKNOWN')) result = 'UNKNOWN';
    else result = 'PASS';
  } else {
    // OR
    if (results.includes('PASS'))    result = 'PASS';
    else if (results.includes('UNKNOWN')) result = 'UNKNOWN';
    else result = 'FAIL';
  }

  return { result, reasons: childReasons };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function evaluateCondition(
  condition: Condition,
  snapshot: StudentSnapshot,
): { result: ConditionResult; reasons: EvaluationReason[] } {
  if (condition.type === 'LEAF') {
    const reason = evaluateLeaf(condition, snapshot);
    return { result: reason.result, reasons: [reason] };
  }
  return evaluateGroup(condition, snapshot);
}

// ─── Public engine entry point ────────────────────────────────────────────────

/**
 * Evaluate a student snapshot against a rule version's conditions.
 *
 * Properties:
 * - Deterministic: same snapshot + same conditions → same result.
 * - Missing data → UNKNOWN (never silently FAIL).
 * - Returns structured reasons for every condition checked.
 */
export function evaluateEligibility(
  snapshot: StudentSnapshot,
  ruleConditions: RuleConditions,
  ruleVersionId: string,
): EvaluationOutput {
  const root: GroupCondition = {
    type: 'GROUP',
    operator: ruleConditions.operator,
    conditions: ruleConditions.conditions,
  };

  const { result: groupResult, reasons } = evaluateGroup(root, snapshot);

  const result: EvaluationOutput['result'] =
    groupResult === 'PASS'
      ? 'ELIGIBLE'
      : groupResult === 'UNKNOWN'
        ? 'UNKNOWN'
        : 'INELIGIBLE';

  return {
    result,
    reasons,
    ruleVersionId,
    schemaVersion: ruleConditions.schema_version,
    evaluatedAt: new Date(),
  };
}
