import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import CatalogForm from '../../catalog-form';
import type { Metadata } from 'next';

type Ctx = { params: { id: string } };

export const metadata: Metadata = { title: 'Admin — Edit Opportunity' };

export default async function EditOpportunityPage({ params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const [opp, universities] = await Promise.all([
    db.opportunity.findUnique({
      where: { id: params.id },
      select: { id: true, type: true, nameI18n: true, descriptionI18n: true, status: true, universityId: true },
    }),
    db.university.findMany({
      select: { id: true, nameI18n: true, country: true },
      orderBy: { nameI18n: 'asc' },
    }),
  ]);

  if (!opp) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/admin/catalog" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">← Catalog</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Edit Opportunity</h1>
        <p className="text-sm text-slate-500 mt-0.5 truncate">{opp.nameI18n}</p>
      </div>
      <CatalogForm
        universities={universities}
        mode="edit"
        defaultValues={{
          id:             opp.id,
          type:           opp.type,
          nameI18n:       opp.nameI18n,
          descriptionI18n: opp.descriptionI18n ?? '',
          status:         opp.status,
          universityId:   opp.universityId ?? '',
        }}
      />
    </main>
  );
}
