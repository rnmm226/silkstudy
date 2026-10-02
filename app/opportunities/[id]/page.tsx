import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { notFound } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

type Ctx = { params: { id: string } };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const opp = await db.opportunity.findFirst({
    where: { id: params.id, status: 'PUBLISHED' },
    select: { nameI18n: true },
  });
  return { title: opp?.nameI18n ?? 'Opportunity' };
}

function CoverageBar({ label, value }: { label: string; value: string }) {
  const cls =
    value === 'FULL'    ? 'bg-green-500' :
    value === 'PARTIAL' ? 'bg-amber-400' :
    value === 'NONE'    ? 'bg-red-400'   : 'bg-slate-200';
  const text =
    value === 'FULL'    ? 'text-green-700' :
    value === 'PARTIAL' ? 'text-amber-700' :
    value === 'NONE'    ? 'text-red-700'   : 'text-slate-500';
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${cls} ${value === 'FULL' ? 'w-full' : value === 'PARTIAL' ? 'w-1/2' : value === 'NONE' ? 'w-0' : 'w-1/4'}`} />
      </div>
      <span className={`text-xs font-medium w-16 ${text}`}>{value.toLowerCase()}</span>
    </div>
  );
}

export default async function OpportunityDetailPage({ params }: Ctx) {
  const session = await getServerSession(authOptions);

  const opp = await db.opportunity.findFirst({
    where: { id: params.id, status: 'PUBLISHED' },
    include: {
      university: true,
      programDetail: true,
      scholarshipDetail: true,
    },
  });
  if (!opp) notFound();

  const cycles = await db.applicationCycle.findMany({
    where: { opportunityId: opp.id },
    orderBy: { opensAt: 'asc' },
  });
  const cycleIds = cycles.map((c) => c.id);
  const deadlines = cycleIds.length
    ? await db.deadline.findMany({
        where: { applicationCycleId: { in: cycleIds } },
        orderBy: { dueAt: 'asc' },
      })
    : [];

  const factSources = await db.factSource.findMany({
    where: { entityType: 'opportunity', entityId: opp.id },
    include: { source: true },
  });

  const student = session
    ? await db.student.findFirst({
        where: { userId: session.user.id, deletedAt: null },
        select: { id: true },
      })
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/search" className="text-sm text-slate-500 hover:text-brand-700 transition-colors">← Search</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 truncate">{opp.nameI18n}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                {opp.type}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">Published</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{opp.nameI18n}</h1>
            {opp.university && (
              <p className="mt-2 text-slate-600">
                {opp.university.nameI18n}
                {opp.university.city ? ` · ${opp.university.city}` : ''}
                {` · ${opp.university.country}`}
              </p>
            )}
            {opp.descriptionI18n && (
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">{opp.descriptionI18n}</p>
            )}
          </div>

          {/* Program details */}
          {opp.programDetail && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Program Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Degree level',  value: opp.programDetail.degreeLevel },
                  { label: 'Field of study', value: opp.programDetail.fieldOfStudy },
                  { label: 'Study mode',    value: opp.programDetail.studyMode ?? 'Not specified' },
                  { label: 'Duration',      value: opp.programDetail.durationMonths ? `${opp.programDetail.durationMonths} months` : 'Not specified' },
                ].map((d) => (
                  <div key={d.label}>
                    <dt className="text-xs text-slate-400 mb-0.5">{d.label}</dt>
                    <dd className="text-sm font-medium text-slate-800">{d.value}</dd>
                  </div>
                ))}
              </dl>
              {opp.programDetail.languagesOfInstruction.length > 0 && (
                <div className="mt-4">
                  <dt className="text-xs text-slate-400 mb-1.5">Languages of instruction</dt>
                  <div className="flex flex-wrap gap-2">
                    {opp.programDetail.languagesOfInstruction.map((l) => (
                      <span key={l} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scholarship / funding */}
          {opp.scholarshipDetail && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Funding Coverage</h2>
              <div className="space-y-2.5">
                {[
                  ['Tuition',         opp.scholarshipDetail.tuitionCoverageType],
                  ['Living',          opp.scholarshipDetail.livingCoverageType],
                  ['Accommodation',   opp.scholarshipDetail.accommodationCoverageType],
                  ['Transport',       opp.scholarshipDetail.transportCoverageType],
                  ['Insurance',       opp.scholarshipDetail.insuranceCoverageType],
                  ['Visa',            opp.scholarshipDetail.visaCoverageType],
                  ['Application fee', opp.scholarshipDetail.applicationFeeCoverageType],
                ].map(([label, value]) => (
                  <CoverageBar key={label} label={label} value={String(value)} />
                ))}
              </div>
              {(opp.scholarshipDetail.monthlyStipendAmount || opp.scholarshipDetail.oneTimeFundingAmount) && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  {opp.scholarshipDetail.monthlyStipendAmount && (
                    <div>
                      <p className="text-xs text-slate-400">Monthly stipend</p>
                      <p className="text-base font-bold text-brand-700 mt-0.5">
                        {Number(opp.scholarshipDetail.monthlyStipendAmount).toLocaleString()} {opp.scholarshipDetail.monthlyStipendCurrency ?? ''}
                      </p>
                    </div>
                  )}
                  {opp.scholarshipDetail.oneTimeFundingAmount && (
                    <div>
                      <p className="text-xs text-slate-400">One-time funding</p>
                      <p className="text-base font-bold text-brand-700 mt-0.5">
                        {Number(opp.scholarshipDetail.oneTimeFundingAmount).toLocaleString()} {opp.scholarshipDetail.oneTimeFundingCurrency ?? ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {opp.scholarshipDetail.fundingBody && (
                <p className="mt-3 text-xs text-slate-500">Funded by: <span className="font-medium text-slate-700">{opp.scholarshipDetail.fundingBody}</span></p>
              )}
              {opp.scholarshipDetail.renewable !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  Renewable: <span className="font-medium">{opp.scholarshipDetail.renewable ? 'Yes' : 'No'}</span>
                </p>
              )}
            </div>
          )}

          {/* Application cycles + deadlines */}
          {cycles.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Application Cycles</h2>
              <div className="space-y-4">
                {cycles.map((cycle) => {
                  const cycleDl = deadlines.filter((d) => d.applicationCycleId === cycle.id);
                  return (
                    <div key={cycle.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-800">{cycle.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cycle.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                          {cycle.status}
                        </span>
                      </div>
                      {cycle.academicYear && <p className="text-xs text-slate-500 mb-2">Academic year {cycle.academicYear}{cycle.term ? ` · ${cycle.term}` : ''}</p>}
                      {cycleDl.length > 0 && (
                        <div className="space-y-1.5">
                          {cycleDl.map((dl) => (
                            <div key={dl.id} className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-24 shrink-0">{dl.type}</span>
                              <span className="text-xs font-medium text-slate-800">{new Date(dl.dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className={`text-xs rounded-full px-2 py-0.5 ${dl.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {dl.verificationStatus === 'VERIFIED' ? '✓ Verified' : dl.verificationStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Provenance */}
          {factSources.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Sources & Provenance</h2>
              <div className="space-y-2">
                {factSources.map((fs) => (
                  <div key={fs.id} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-400 w-32 shrink-0">{fs.factKey}</span>
                    <a href={fs.source.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline truncate">
                      {fs.source.title ?? fs.source.url}
                    </a>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 ${fs.source.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {fs.source.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* CTA card */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            {session && student ? (
              <>
                <p className="text-sm font-semibold text-brand-900 mb-1">Check your eligibility</p>
                <p className="text-xs text-brand-700 mb-4">Run the eligibility check to see if you qualify for this opportunity.</p>
                <EligibilityForm opportunityId={opp.id} />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900 mb-2">Sign in to check eligibility</p>
                <Link href="/auth/login" className="block w-full rounded-lg bg-brand-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* University card */}
          {opp.university && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">University</p>
              <p className="text-sm font-semibold text-slate-900">{opp.university.nameI18n}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opp.university.city ?? ''}{opp.university.city ? ', ' : ''}{opp.university.country}</p>
              {opp.university.websiteUrl && (
                <a href={opp.university.websiteUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-brand-700 hover:underline">
                  Visit website →
                </a>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card text-xs text-slate-400 space-y-1">
            <p>Added {new Date(opp.createdAt).toLocaleDateString()}</p>
            <p>Updated {new Date(opp.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function EligibilityForm({ opportunityId }: { opportunityId: string }) {
  return (
    <form action="/api/v1/matches/evaluate" method="POST">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <button
        type="submit"
        className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
      >
        Check eligibility
      </button>
    </form>
  );
}
