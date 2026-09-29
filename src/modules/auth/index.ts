export { authOptions } from './auth.config';
export {
  getSession,
  requireSession,
  requireRole,
  requireStudent,
  requireAdvisor,
  requireAdmin,
} from './session';
export {
  resolveStudentFromSession,
  assertStudentOwnership,
  assertStudentExists,
} from './authorization';
export type {} from './types'; // side-effect: augments next-auth types
