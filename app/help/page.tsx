import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import HelpClient from './help-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Help & Support' };

export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const student = await db.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!student) redirect('/profile');

  const requests = await db.helpRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="mt-1 text-sm text-slate-500">Submit a request and an advisor will get back to you.</p>
      </div>
      <HelpClient initialRequests={requests.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
      }))} />
    </main>
  );
}
