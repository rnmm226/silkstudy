import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import CatalogForm from '../catalog-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — New Opportunity' };

export default async function NewOpportunityPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const universities = await db.university.findMany({
    select: { id: true, nameI18n: true, country: true },
    orderBy: { nameI18n: 'asc' },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/admin/catalog" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Catalog</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">New Opportunity</h1>
      </div>
      <CatalogForm universities={universities} mode="create" />
    </main>
  );
}
