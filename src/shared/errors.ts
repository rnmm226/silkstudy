/**
 * Shared API error shapes used across all modules.
 * Every API route returns one of these on failure.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super('VALIDATION_ERROR', message, 422, fieldErrors);
  }
}

/** Serialise any thrown error into the standard API JSON shape. */
export function toApiError(error: unknown): {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  console.error('[unhandled error]', error);
  return { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };
}

/** Map an AppError to the correct HTTP status code. */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}
