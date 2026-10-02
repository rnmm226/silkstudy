import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Applications' };

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  WITHDRAWN: 'bg-orange-100 text-orange-700',
  ACCEPTED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-700',
};

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
          scholarshipDetail: { select: { tuitionCoverageType: true, coverageScope: true } },
        },
      },
      applicationCycle: { select: { name: true, academicYear: true, closesAt: true } },
    },
  });

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shrink-0"
        >
          + Find opportunities
        </Link>
      </div>

      {/* Status summary */}
      {applications.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status} className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-600'}`}>
              {count} {status.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="text-4xl mb-4">📝</div>
          <p className="font-semibold text-slate-900">No applications yet</p>
          <p className="mt-2 text-sm text-slate-500">Search for opportunities and start applying.</p>
          <Link href="/search" className="mt-6 inline-block rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
            Browse opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const deadline = app.applicationCycle.closesAt;
            const daysLeft = deadline
              ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
              : null;

            return (
              <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[app.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {app.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${app.opportunity.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                        {app.opportunity.type}
                      </span>
                      {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                          {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900 truncate">{app.opportunity.nameI18n}</h2>
                    {app.opportunity.university && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {app.opportunity.university.nameI18n} · {app.opportunity.university.country}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {app.applicationCycle.name}
                      {app.applicationCycle.academicYear ? ` · ${app.applicationCycle.academicYear}` : ''}
                      {deadline ? ` · closes ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                    {app.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic line-clamp-1">{app.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <Link href={`/opportunities/${app.opportunity.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
