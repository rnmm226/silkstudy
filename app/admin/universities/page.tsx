import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import UniversitiesClient from './universities-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Universities' };

export default async function AdminUniversitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const universities = await db.university.findMany({
    orderBy: { nameI18n: 'asc' },
    select: {
      id: true, nameI18n: true, country: true, city: true,
      websiteUrl: true, status: true, createdAt: true,
      _count: { select: { opportunities: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Universities</h1>
          <p className="text-sm text-slate-500 mt-0.5">{universities.length} universities</p>
        </div>
      </div>
      <UniversitiesClient
        initialUniversities={universities.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          opportunityCount: u._count.opportunities,
        }))}
      />
    </main>
  );
}
