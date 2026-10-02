import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import RecomputeButton from './recompute-button';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

async function getStudentSummary(userId: string) {
  const student = await db.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!student) return null;

  const [budget, preferences, academicCount, matchCount, appCount] = await Promise.all([
    db.studentBudget.findFirst({ where: { studentId: student.id }, select: { amount: true, currency: true, period: true, scope: true } }),
    db.studentPreference.findFirst({ where: { studentId: student.id }, select: { fieldsOfInterest: true, preferredCountries: true } }),
    db.academicRecord.count({ where: { studentId: student.id } }),
    db.matchResult.count({ where: { studentId: student.id } }),
    db.application.count({ where: { studentId: student.id } }),
  ]);

  return { student, budget, preferences, academicCount, matchCount, appCount };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const summary = await getStudentSummary(session.user.id);

  let completeness = 0;
  if (summary) {
    if (summary.student.firstName)                    completeness += 25;
    if (summary.academicCount > 0)                    completeness += 25;
    if (summary.budget)                               completeness += 25;
    if (summary.preferences?.fieldsOfInterest?.length) completeness += 25;
  }

  const name = summary?.student.firstName ?? session.user.email.split('@')[0];

  const quickLinks = [
    { href: '/profile',      label: 'Complete your profile', icon: '👤', desc: 'Add academic records, budget and preferences.' },
    { href: '/search',       label: 'Search opportunities',  icon: '🔍', desc: 'Browse verified programs and scholarships.' },
    { href: '/matches',      label: 'My matches',            icon: '📊', desc: `${summary?.matchCount ?? 0} ranked opportunities waiting for you.` },
    { href: '/applications', label: 'My applications',       icon: '📝', desc: `${summary?.appCount ?? 0} application${(summary?.appCount ?? 0) !== 1 ? 's' : ''} tracked.` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {name} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s where you stand — keep building your profile to unlock better matches.
          </p>
        </div>
        {/* Recompute button — client component so it can POST */}
        <RecomputeButton />
      </div>

      {/* Profile completeness */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Profile completeness</span>
          <span className="text-sm font-bold text-brand-700">{completeness}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-700"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="mt-3 text-xs text-slate-400">
            Complete your profile to get personalised opportunity matches.{' '}
            <Link href="/profile" className="text-brand-700 font-medium hover:underline">Update now →</Link>
          </p>
        )}
      </div>

      {/* Stats row */}
      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Academic records', value: summary.academicCount },
            { label: 'Fields of interest', value: summary.preferences?.fieldsOfInterest?.length ?? 0 },
            { label: 'Target countries', value: summary.preferences?.preferredCountries?.length ?? 0 },
            {
              label: 'Budget set',
              value: summary.budget
                ? `${Number(summary.budget.amount).toLocaleString()} ${summary.budget.currency}`
                : '—',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card text-center">
              <p className="text-xl font-bold text-brand-700 truncate">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick actions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-300 hover:shadow-card-md transition-all"
          >
            <span className="text-2xl mt-0.5">{l.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{l.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
