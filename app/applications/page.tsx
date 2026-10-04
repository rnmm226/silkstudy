import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import ApplicationsClient from './applications-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Applications' };

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const student = await db.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!student) redirect('/profile');

  const applications = await db.application.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: {
        select: {
          id: true, type: true, nameI18n: true,
          university: { select: { nameI18n: true, country: true } },
        },
      },
      applicationCycle: { select: { name: true, academicYear: true, closesAt: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link href="/search" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shrink-0">
          + Find opportunities
        </Link>
      </div>
      <ApplicationsClient initialApplications={applications.map((a) => ({
        ...a,
        applicationCycle: {
          ...a.applicationCycle,
          closesAt: a.applicationCycle.closesAt?.toISOString() ?? null,
        },
      }))} />
    </main>
  );
}
