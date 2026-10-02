import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Catalog' };

export default async function AdminCatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const opportunities = await db.opportunity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      university: { select: { nameI18n: true, country: true } },
      programDetail: { select: { degreeLevel: true } },
      scholarshipDetail: { select: { coverageScope: true } },
    },
  });

  const STATUS_CLS: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-800',
    DRAFT:     'bg-slate-100 text-slate-600',
    ARCHIVED:  'bg-amber-100 text-amber-700',
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Catalog Management</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/catalog/new" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
            + New opportunity
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Type', 'University', 'Country', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{opp.nameI18n}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                      {opp.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{opp.university?.nameI18n ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{opp.university?.country ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[opp.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/opportunities/${opp.id}`} className="text-xs text-brand-700 hover:underline">View</Link>
                      <Link href={`/admin/catalog/${opp.id}/edit`} className="text-xs text-slate-500 hover:underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No opportunities yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
