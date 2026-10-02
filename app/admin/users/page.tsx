import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Users' };

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, email: true, role: true, createdAt: true,
      students: {
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
        take: 1,
      },
    },
  });

  const ROLE_CLS: Record<string, string> = {
    STUDENT: 'bg-blue-100 text-blue-800',
    ADVISOR: 'bg-violet-100 text-violet-800',
    ADMIN:   'bg-red-100 text-red-700',
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Admin</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} users registered</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Email', 'Name', 'Role', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const student = u.students[0];
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {student ? `${student.firstName} ${student.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_CLS[u.role] ?? 'bg-slate-100'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {student && (
                      <Link href={`/admin/users/${u.id}`} className="text-xs text-brand-700 hover:underline">View</Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
