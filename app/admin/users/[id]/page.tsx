import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

type Ctx = { params: { id: string } };

export const metadata: Metadata = { title: 'Admin — User Detail' };

export default async function AdminUserDetailPage({ params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      students: {
        where: { deletedAt: null },
        include: {
          academicRecords:  { orderBy: { startDate: 'desc' } },
          preferences:      { orderBy: { createdAt: 'desc' }, take: 1 },
          budgets:          { orderBy: { createdAt: 'desc' }, take: 1 },
          matchResults: {
            orderBy: { rank: 'asc' },
            take: 5,
            include: {
              opportunity: { select: { nameI18n: true, type: true } },
              fitScore:    { select: { totalScore: true } },
            },
          },
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              opportunity: { select: { nameI18n: true } },
              applicationCycle: { select: { name: true } },
            },
          },
          helpRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      },
    },
  });

  if (!user) notFound();

  const student = user.students[0];
  const prefs   = student?.preferences[0];
  const budget  = student?.budgets[0];

  const ROLE_CLS: Record<string, string> = {
    STUDENT: 'bg-blue-100 text-blue-800',
    ADVISOR: 'bg-violet-100 text-violet-800',
    ADMIN:   'bg-red-100 text-red-700',
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/users" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Users</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{student ? `${student.firstName} ${student.lastName}` : user.email}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_CLS[user.role] ?? 'bg-slate-100'}`}>{user.role}</span>
          <span className="text-xs text-slate-400">{user.email}</span>
          <span className="text-xs text-slate-400">· Joined {new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">

          {/* Profile */}
          {student && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Profile</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Nationality',     student.nationality],
                  ['Current country', student.currentCountry],
                  ['Date of birth',   student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'],
                  ['Phone',           student.phone ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-400">{label}</dt>
                    <dd className="font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Academic records */}
          {student && student.academicRecords.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Academic Records</h2>
              <div className="space-y-2">
                {student.academicRecords.map((r) => (
                  <div key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">{r.institutionName}</p>
                    <p className="text-xs text-slate-500">{r.degreeLevel} · {r.fieldOfStudy}
                      {r.gradeValue && r.gradeScale ? ` · ${r.gradeValue}/${r.gradeScale}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top matches */}
          {student && student.matchResults.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Top Matches</h2>
              <div className="space-y-2">
                {student.matchResults.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.opportunity.nameI18n}</p>
                      <p className="text-xs text-slate-500">Rank #{m.rank}</p>
                    </div>
                    <span className={`text-sm font-bold ${(m.fitScore?.totalScore ?? 0) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                      {m.fitScore ? Math.round(m.fitScore.totalScore) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {student && student.applications.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-100">Applications</h2>
              <div className="space-y-2">
                {student.applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{a.opportunity.nameI18n}</p>
                      <p className="text-xs text-slate-500">{a.applicationCycle.name}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Budget */}
          {budget && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Budget</p>
              <p className="text-xl font-bold text-brand-700">{Number(budget.amount).toLocaleString()} {budget.currency}</p>
              <p className="text-xs text-slate-500 mt-0.5">{budget.period.toLowerCase()} · {budget.scope.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
          )}

          {/* Preferences */}
          {prefs && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Preferences</p>
              {prefs.targetDegreeLevel && <p className="text-xs text-slate-600">Target: <span className="font-medium">{prefs.targetDegreeLevel}</span></p>}
              {prefs.fieldsOfInterest.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {prefs.fieldsOfInterest.map((f) => (
                    <span key={f} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{f}</span>
                  ))}
                </div>
              )}
              {prefs.preferredCountries.length > 0 && (
                <p className="text-xs text-slate-500">{prefs.preferredCountries.join(', ')}</p>
              )}
            </div>
          )}

          {/* Help requests */}
          {student && student.helpRequests.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Help Requests</p>
              {student.helpRequests.map((h) => (
                <div key={h.id} className="mb-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {h.status}
                  </span>
                  <p className="text-xs text-slate-600 mt-1 truncate">{h.subject}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
