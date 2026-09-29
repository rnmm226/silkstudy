import { NextResponse } from 'next/server';
import type { ZodTypeAny, ZodError, output } from 'zod';
import { toApiError, getStatusCode, ValidationError } from './errors';

/**
 * Parse and validate the JSON body of a Next.js Route Handler request.
 * Returns the validated (and defaulted) output or throws a ValidationError.
 *
 * Using `output<S>` ensures callers receive the *output* type (post-defaults,
 * post-transforms) rather than the looser *input* type.
 */
export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError('Request body must be valid JSON.');
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const zodErr = result.error as ZodError;
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of zodErr.issues) {
      const key = issue.path.join('.') || '_root';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    throw new ValidationError('Validation failed.', fieldErrors);
  }

  return result.data;
}

/**
 * Wrap a Route Handler body to catch AppErrors and return a consistent
 * JSON error response.
 *
 * Usage:
 *   export const GET = handler(async (req) => { ... return NextResponse.json({...}) });
 */
export function handler(
  fn: (req: Request, ctx?: { params: Record<string, string> }) => Promise<NextResponse>,
) {
  return async (
    req: Request,
    ctx?: { params: Record<string, string> },
  ): Promise<NextResponse> => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      const status = getStatusCode(error);
      const body = toApiError(error);
      return NextResponse.json(body, { status });
    }
  };
}
