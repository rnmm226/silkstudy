import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Matches' };

async function getMatches(studentId: string) {
  return db.matchResult.findMany({
    where: { studentId },
    orderBy: [{ rank: 'asc' }, { generatedAt: 'desc' }],
    take: 50,
    include: {
      opportunity: {
        select: {
          id: true, type: true, nameI18n: true,
          university: { select: { nameI18n: true, country: true, city: true } },
          programDetail: { select: { degreeLevel: true, fieldOfStudy: true } },
          scholarshipDetail: { select: { tuitionCoverageType: true, livingCoverageType: true, coverageScope: true } },
        },
      },
      fitScore: { select: { totalScore: true, components: true } },
      eligibilityEvaluation: { select: { result: true } },
    },
  });
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-full border-2 ${score >= 75 ? 'border-green-200 bg-green-50' : score >= 50 ? 'border-amber-200 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
      <span className={`text-lg font-extrabold leading-none ${color}`}>{score}</span>
      <span className="text-[9px] text-slate-400 uppercase tracking-wide">score</span>
    </div>
  );
}

function CoverageTag({ label, value }: { label: string; value: string }) {
  const cls =
    value === 'FULL'    ? 'bg-green-100 text-green-800' :
    value === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
    value === 'NONE'    ? 'bg-red-100 text-red-700'     :
                          'bg-slate-100 text-slate-500';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}: {value.toLowerCase()}
    </span>
  );
}

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const student = await db.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!student) redirect('/profile');

  const matches = await getMatches(student.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Matches</h1>
          <p className="mt-1 text-sm text-slate-500">
            {matches.length > 0
              ? `${matches.length} ranked opportunities — sorted by fit score.`
              : 'No matches yet. Recompute to generate results.'}
          </p>
        </div>
        <RecomputeButton />
      </div>

      {matches.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="text-4xl mb-4">📊</div>
          <p className="font-semibold text-slate-900">No matches yet</p>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Complete your profile (academic records, budget, preferences) then click
            Recompute to score all opportunities.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/profile" className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
              Complete profile
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match) => {
          const opp = match.opportunity;
          const score = match.fitScore?.totalScore ?? 0;
          const eligResult = match.eligibilityEvaluation?.result;
          const components = (match.fitScore?.components ?? []) as Array<{ dimension: string; result: string; contribution: number; details: string }>;

          return (
            <div key={match.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-200 transition-all">
              <div className="flex items-start gap-4">
                {/* Score ring */}
                <div className="shrink-0 mt-0.5">
                  <ScoreRing score={Math.round(score)} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Rank + eligibility */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-400">#{match.rank || '—'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      eligResult === 'ELIGIBLE'   ? 'bg-green-100 text-green-800' :
                      eligResult === 'INELIGIBLE' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'}`}>
                      {eligResult ?? 'UNKNOWN'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                      {opp.type === 'SCHOLARSHIP' ? 'Scholarship' : 'Program'}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold text-slate-900 leading-snug">{opp.nameI18n}</h2>

                  {opp.university && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {opp.university.nameI18n} · {opp.university.country}
                      {opp.university.city ? `, ${opp.university.city}` : ''}
                    </p>
                  )}

                  {/* Coverage tags */}
                  {opp.scholarshipDetail && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <CoverageTag label="Tuition" value={opp.scholarshipDetail.tuitionCoverageType} />
                      <CoverageTag label="Living"  value={opp.scholarshipDetail.livingCoverageType} />
                    </div>
                  )}

                  {opp.programDetail && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{opp.programDetail.degreeLevel}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{opp.programDetail.fieldOfStudy}</span>
                    </div>
                  )}

                  {/* Score breakdown (top 3 components) */}
                  {components.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {components.slice(0, 3).map((c) => (
                        <div key={c.dimension} className="flex items-center gap-2">
                          <div className="w-20 shrink-0">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.result === 'PASS' ? 'bg-green-500' : c.result === 'FAIL' ? 'bg-red-400' : 'bg-slate-300'}`}
                                style={{ width: `${Math.min(c.contribution * 10, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate">{c.details}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <Link href={`/opportunities/${opp.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                      View opportunity →
                    </Link>
                    <Link href={`/matches/${match.id}`} className="text-xs font-medium text-slate-500 hover:text-brand-700 hover:underline">
                      Full explanation →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

// Client component for the recompute button
function RecomputeButton() {
  return (
    <form action="/api/v1/me/matches/recompute" method="POST">
      <button
        type="submit"
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shrink-0"
      >
        ↻ Recompute
      </button>
    </form>
  );
}
