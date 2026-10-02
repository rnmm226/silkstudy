import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Help Requests' };

export default async function AdminHelpPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const requests = await db.helpRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      student: { select: { firstName: true, lastName: true, user: { select: { email: true } } } },
    },
  });

  const STATUS_CLS: Record<string, string> = {
    OPEN:     'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED:   'bg-slate-100 text-slate-600',
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Admin</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Help Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {requests.filter((r) => r.status === 'OPEN').length} open · {requests.length} total
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Student', 'Category', 'Subject', 'Status', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{r.student.firstName} {r.student.lastName}</p>
                  <p className="text-xs text-slate-400">{r.student.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{r.category}</span>
                </td>
                <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{r.subject}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[r.status] ?? 'bg-slate-100'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No help requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
