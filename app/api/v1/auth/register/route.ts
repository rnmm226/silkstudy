import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/src/infrastructure/database';

const registerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName:  z.string().min(1).max(100).trim(),
  email:     z.string().email().toLowerCase().trim(),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: 'BAD_REQUEST', message: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_root';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Validation failed.', fieldErrors },
      { status: 422 },
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  // Check duplicate
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { code: 'CONFLICT', message: 'An account with this email already exists.' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create User + Student atomically
  const { user } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, role: 'STUDENT', passwordHash },
    });
    await tx.student.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        nationality: '',
        currentCountry: '',
      },
    });
    return { user };
  });

  return NextResponse.json(
    { data: { id: user.id, email: user.email, role: user.role } },
    { status: 201 },
  );
}
