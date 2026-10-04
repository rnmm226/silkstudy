import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Opportunities' };

const COVERAGE_CLS: Record<string, string> = {
  FULL:    'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  NONE:    'bg-red-100 text-red-700',
  UNKNOWN: 'bg-slate-100 text-slate-500',
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string; country?: string };
}) {
  const page     = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const pageSize = 24;
  const type     = searchParams.type as 'PROGRAM' | 'SCHOLARSHIP' | undefined;
  const country  = searchParams.country;

  const where = {
    status: 'PUBLISHED' as const,
    ...(type    && { type }),
    ...(country && { university: { country: { equals: country, mode: 'insensitive' as const } } }),
  };

  const [total, opportunities] = await Promise.all([
    db.opportunity.count({ where }),
    db.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, type: true, nameI18n: true, descriptionI18n: true,
        university: { select: { nameI18n: true, country: true, city: true } },
        programDetail: { select: { degreeLevel: true, fieldOfStudy: true } },
        scholarshipDetail: { select: { tuitionCoverageType: true, livingCoverageType: true, coverageScope: true } },
        applicationCycles: {
          where: { status: 'OPEN' },
          orderBy: { closesAt: 'asc' },
          take: 1,
          select: {
            deadlines: {
              where: { dueAt: { gte: new Date() } },
              orderBy: { dueAt: 'asc' },
              take: 1,
              select: { dueAt: true, verificationStatus: true },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Build country list for filter
  const countries = await db.university.findMany({
    where: { status: 'PUBLISHED' },
    select: { country: true },
    distinct: ['country'],
    orderBy: { country: 'asc' },
  });

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { page: String(page), type, country, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/opportunities?${p.toString()}`;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
        <p className="mt-1 text-sm text-slate-500">{total} verified programs and scholarships</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Type */}
        <div className="flex gap-1.5">
          {[
            { label: 'All', value: undefined },
            { label: 'Scholarships', value: 'SCHOLARSHIP' },
            { label: 'Programs', value: 'PROGRAM' },
          ].map((t) => (
            <Link
              key={t.label}
              href={buildUrl({ type: t.value, page: '1' })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                type === t.value
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Country */}
        <form method="GET" action="/opportunities" className="flex gap-2">
          {type && <input type="hidden" name="type" value={type} />}
          <select
            name="country"
            defaultValue={country ?? ''}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>{c.country}</option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
            Filter
          </button>
          {(country || type) && (
            <Link href="/opportunities" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 transition-colors">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Grid */}
      {opportunities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <p className="text-slate-400 text-sm">No opportunities found for these filters.</p>
          <Link href="/opportunities" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">Clear filters</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const deadline = opp.applicationCycles[0]?.deadlines[0];
            const daysLeft = deadline
              ? Math.ceil((new Date(deadline.dueAt).getTime() - Date.now()) / 86_400_000)
              : null;

            return (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-300 hover:shadow-card-md transition-all"
              >
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                    {opp.type === 'SCHOLARSHIP' ? 'Scholarship' : 'Program'}
                  </span>
                  {opp.scholarshipDetail && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COVERAGE_CLS[opp.scholarshipDetail.tuitionCoverageType]}`}>
                      Tuition: {opp.scholarshipDetail.tuitionCoverageType.toLowerCase()}
                    </span>
                  )}
                  {daysLeft !== null && daysLeft >= 0 && daysLeft <= 60 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                      {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors leading-snug mb-1">
                  {opp.nameI18n}
                </h2>

                {/* University */}
                {opp.university && (
                  <p className="text-xs text-slate-500">
                    {opp.university.nameI18n} · {opp.university.country}
                    {opp.university.city ? `, ${opp.university.city}` : ''}
                  </p>
                )}

                {/* Program tags */}
                {opp.programDetail && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{opp.programDetail.degreeLevel}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{opp.programDetail.fieldOfStudy}</span>
                  </div>
                )}

                {/* Description snippet */}
                {opp.descriptionI18n && (
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2 flex-1">{opp.descriptionI18n}</p>
                )}

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-brand-700 group-hover:underline">View details →</span>
                  {deadline?.verificationStatus === 'VERIFIED' && (
                    <span className="text-xs text-green-600">✓ Verified</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              ← Prev
            </Link>
          )}
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
