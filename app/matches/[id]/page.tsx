import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Match Detail' };

type Ctx = { params: { id: string } };

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    PASS:    'bg-green-100 text-green-800',
    FAIL:    'bg-red-100 text-red-700',
    UNKNOWN: 'bg-slate-100 text-slate-600',
    NOT_APPLICABLE: 'bg-slate-50 text-slate-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[result] ?? 'bg-slate-100 text-slate-600'}`}>{result}</span>;
}

export default async function MatchDetailPage({ params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const student = await db.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!student) redirect('/profile');

  const match = await db.matchResult.findFirst({
    where: { id: params.id, studentId: student.id },
    include: {
      opportunity: {
        include: {
          university: true,
          programDetail: true,
          scholarshipDetail: true,
        },
      },
      fitScore: true,
      eligibilityEvaluation: true,
      explanations: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!match) notFound();

  const score = match.fitScore?.totalScore ?? 0;
  const components = (match.fitScore?.components ?? []) as Array<{
    dimension: string; result: string; contribution: number;
    maxScore: number; weight: number; details: string;
  }>;
  const reasons = (match.eligibilityEvaluation?.reasons ?? []) as Array<{
    field: string; result: string; message: string;
  }>;
  const opp = match.opportunity;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
      {/* Back */}
      <Link href="/matches" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        ← Back to matches
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-start gap-5">
          {/* Score */}
          <div className={`shrink-0 flex flex-col items-center justify-center h-20 w-20 rounded-2xl border-2 ${score >= 75 ? 'border-green-200 bg-green-50' : score >= 50 ? 'border-amber-200 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
            <span className={`text-3xl font-extrabold leading-none ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{Math.round(score)}</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">/ 100</span>
          </div>
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${match.eligibilityEvaluation?.result === 'ELIGIBLE' ? 'bg-green-100 text-green-800' : match.eligibilityEvaluation?.result === 'INELIGIBLE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                {match.eligibilityEvaluation?.result ?? 'UNKNOWN'}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                {opp.type}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{opp.nameI18n}</h1>
            {opp.university && (
              <p className="text-sm text-slate-500 mt-0.5">
                {opp.university.nameI18n} · {opp.university.country}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Rank #{match.rank || '—'} · Computed {new Date(match.generatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Fit Score Breakdown */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Fit Score Breakdown</h2>
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.dimension} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-xs font-medium text-slate-600 capitalize">
                {c.dimension.replace(/_/g, ' ')}
              </div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${c.result === 'PASS' ? 'bg-green-500' : c.result === 'FAIL' ? 'bg-red-400' : 'bg-slate-300'}`}
                    style={{ width: `${Math.min((c.contribution / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <ResultBadge result={c.result} />
              <span className="text-xs text-slate-400 w-12 text-right shrink-0">+{c.contribution}pts</span>
            </div>
          ))}
        </div>

        {components.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Positive:</span>{' '}
              {components.filter(c => c.result === 'PASS').map(c => c.dimension.replace(/_/g, ' ')).join(', ') || 'none'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">Unknown:</span>{' '}
              {components.filter(c => c.result === 'UNKNOWN').map(c => c.dimension.replace(/_/g, ' ')).join(', ') || 'none — high confidence'}
            </p>
          </div>
        )}
      </section>

      {/* Eligibility Reasons */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Eligibility Check</h2>
        <div className="space-y-2.5">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <ResultBadge result={r.result} />
              <div>
                <p className="text-xs font-medium text-slate-700">{r.field}</p>
                <p className="text-xs text-slate-500">{r.message}</p>
              </div>
            </div>
          ))}
          {reasons.length === 0 && (
            <p className="text-sm text-slate-400">No eligibility reasons recorded.</p>
          )}
        </div>
      </section>

      {/* Explanations */}
      {match.explanations.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Match Explanations</h2>
          <div className="space-y-2">
            {match.explanations.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <ResultBadge result={e.result} />
                <span className="text-xs text-slate-600 capitalize flex-1">{e.factor.replace(/_/g, ' ')}</span>
                <span className="text-xs font-semibold text-slate-700">+{e.contribution}pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link href={`/opportunities/${opp.id}`} className="block rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors text-center">
        View full opportunity details →
      </Link>
    </main>
  );
}
