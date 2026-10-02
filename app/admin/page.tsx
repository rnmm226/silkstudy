import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Dashboard' };

async function getAdminStats() {
  const [users, students, opportunities, applications, helpRequests, auditLogs] =
    await Promise.all([
      db.user.count(),
      db.student.count({ where: { deletedAt: null } }),
      db.opportunity.count(),
      db.application.count(),
      db.helpRequest.count({ where: { status: 'OPEN' } }),
      db.auditLog.count(),
    ]);
  return { users, students, opportunities, applications, helpRequests, auditLogs };
}

async function getRecentAuditLogs() {
  return db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, action: true, entityType: true, entityId: true,
      actorUserId: true, reason: true, createdAt: true,
    },
  });
}

async function getOpportunitiesByStatus() {
  return db.opportunity.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const [stats, logs, oppByStatus] = await Promise.all([
    getAdminStats(),
    getRecentAuditLogs(),
    getOpportunitiesByStatus(),
  ]);

  const statCards = [
    { label: 'Total users',          value: stats.users,        icon: '👥', href: '/admin/users' },
    { label: 'Students',             value: stats.students,     icon: '🎓', href: '/admin/users' },
    { label: 'Opportunities',        value: stats.opportunities,icon: '🏛', href: '/admin/catalog' },
    { label: 'Applications',         value: stats.applications, icon: '📝', href: null },
    { label: 'Open help requests',   value: stats.helpRequests, icon: '🤝', href: '/admin/help' },
    { label: 'Audit log entries',    value: stats.auditLogs,    icon: '📋', href: null },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform overview and management.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-card text-center ${s.href ? 'hover:border-brand-300 hover:shadow-card-md transition-all' : ''}`}>
            {s.href ? (
              <Link href={s.href} className="block">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-extrabold text-brand-700">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </Link>
            ) : (
              <>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-extrabold text-brand-700">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Opportunity status breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Opportunities by status</h2>
            <Link href="/admin/catalog" className="text-xs font-medium text-brand-700 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {oppByStatus.map((g) => (
              <div key={g.status} className="flex items-center gap-3">
                <span className={`w-24 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-center ${
                  g.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                  g.status === 'DRAFT'     ? 'bg-slate-100 text-slate-600' :
                                             'bg-amber-100 text-amber-700'}`}>
                  {g.status}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min((g._count._all / stats.opportunities) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{g._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit log */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Recent activity</h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-xs">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-500 shrink-0">{log.action}</span>
                <span className="text-slate-600 truncate">{log.entityType}/{log.entityId.slice(0, 8)}…</span>
                <span className="text-slate-400 shrink-0 ml-auto">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-xs text-slate-400">No activity yet.</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { href: '/admin/catalog',  icon: '🏛', label: 'Manage catalog',   desc: 'Add and edit opportunities, universities, sources.' },
          { href: '/admin/users',    icon: '👥', label: 'Manage users',     desc: 'View students, advisors and roles.' },
          { href: '/admin/help',     icon: '🤝', label: 'Help requests',    desc: `${stats.helpRequests} open request${stats.helpRequests !== 1 ? 's' : ''} awaiting review.` },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-200 hover:shadow-card-md transition-all">
            <p className="text-2xl mb-2">{a.icon}</p>
            <p className="text-sm font-semibold text-slate-900">{a.label}</p>
            <p className="text-xs text-slate-500 mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
