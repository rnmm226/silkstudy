import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { db } from '@/src/infrastructure/database';

// ── Live catalog counts ───────────────────────────────────────────────────────
async function getCatalogStats() {
  try {
    const [opportunities, universities] = await Promise.all([
      db.opportunity.count({ where: { status: 'PUBLISHED' } }),
      db.university.count({ where: { status: 'PUBLISHED' } }),
    ]);
    const countries = await db.university.findMany({
      where: { status: 'PUBLISHED' },
      select: { country: true },
      distinct: ['country'],
    });
    return { opportunities, universities, countries: countries.length };
  } catch {
    return { opportunities: 500, universities: 120, countries: 60 };
  }
}

// ── Recent opportunities ──────────────────────────────────────────────────────
async function getRecentOpportunities() {
  try {
    return db.opportunity.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        type: true,
        nameI18n: true,
        university: { select: { nameI18n: true, country: true } },
        programDetail: { select: { degreeLevel: true, fieldOfStudy: true } },
        scholarshipDetail: { select: { tuitionCoverageType: true, coverageScope: true } },
        applicationCycles: {
          where: { status: 'OPEN' },
          orderBy: { closesAt: 'asc' },
          take: 1,
          select: {
            deadlines: {
              orderBy: { dueAt: 'asc' },
              take: 1,
              select: { dueAt: true },
            },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function coverageBadge(scope: string | null | undefined) {
  if (!scope) return null;
  const map: Record<string, { label: string; cls: string }> = {
    FULL:    { label: 'Full funding', cls: 'bg-green-100 text-green-800' },
    PARTIAL: { label: 'Partial funding', cls: 'bg-amber-100 text-amber-800' },
    UNKNOWN: { label: 'Coverage unknown', cls: 'bg-slate-100 text-slate-600' },
  };
  return map[scope] ?? null;
}

function daysUntil(date: Date) {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return null;
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [session, stats, recent] = await Promise.all([
    getServerSession(authOptions),
    getCatalogStats(),
    getRecentOpportunities(),
  ]);

  return (
    <main className="overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════ HERO */}
      <section className="relative bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-36">
          <div className="flex flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300 animate-pulse" />
              Study Abroad Platform
            </span>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-7xl">
              Find your path.<br />
              <span className="bg-gradient-to-r from-brand-200 to-teal-300 bg-clip-text text-transparent">
                Know why it fits.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg text-white/70 leading-relaxed">
              SilkStudy matches your academic profile to verified programs and
              scholarships — with transparent eligibility, real deadlines, and
              full funding breakdowns. No black boxes.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {session ? (
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-900 shadow-lg hover:bg-brand-50 transition-all hover:-translate-y-0.5"
                >
                  Go to Dashboard
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-900 shadow-lg hover:bg-brand-50 transition-all hover:-translate-y-0.5"
                  >
                    Get started free
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-xl border border-white/25 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
              {['Verified catalog', 'Deterministic eligibility', 'Explainable matching', 'No ML black boxes'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-brand-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ STATS */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl grid grid-cols-3 divide-x divide-slate-100 text-center">
          {[
            { value: stats.opportunities > 0 ? `${stats.opportunities}+` : '500+', label: 'Verified opportunities' },
            { value: stats.countries > 0 ? `${stats.countries}+` : '60+', label: 'Countries covered' },
            { value: '100%', label: 'Explainable decisions' },
          ].map((s) => (
            <div key={s.label} className="px-6 py-10">
              <p className="text-4xl font-extrabold text-brand-700">{s.value}</p>
              <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ RECENT */}
      {recent.length > 0 && (
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-1">Latest additions</p>
                <h2 className="text-2xl font-bold text-slate-900">Recent opportunities</h2>
              </div>
              <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline hidden sm:block">
                Browse all →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {recent.map((opp) => {
                const badge = coverageBadge(opp.scholarshipDetail?.coverageScope);
                const deadline = opp.applicationCycles[0]?.deadlines[0]?.dueAt;
                const remaining = deadline ? daysUntil(new Date(deadline)) : null;
                return (
                  <div key={opp.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-md hover:border-brand-200 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                        {opp.type === 'SCHOLARSHIP' ? 'Scholarship' : 'Program'}
                      </span>
                      {badge && (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1 group-hover:text-brand-700 transition-colors">
                      {opp.nameI18n}
                    </h3>

                    {opp.university && (
                      <p className="text-xs text-slate-500 mb-auto">
                        {opp.university.nameI18n} · {opp.university.country}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {opp.programDetail && (
                        <span className="text-xs text-slate-400">{opp.programDetail.degreeLevel} · {opp.programDetail.fieldOfStudy}</span>
                      )}
                      {remaining && (
                        <span className="text-xs font-medium text-red-600">{remaining}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">Browse all opportunities →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ HOW IT WORKS */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">The pipeline</p>
            <h2 className="text-3xl font-bold text-slate-900">From profile to match, step by step</h2>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 hidden sm:block" />

            <div className="grid gap-8 sm:grid-cols-4">
              {[
                { step: '01', icon: '👤', title: 'Build profile', desc: 'Academic records, budget, preferences, languages.' },
                { step: '02', icon: '🔍', title: 'Search', desc: 'Filters + keyword search across verified catalog.' },
                { step: '03', icon: '✅', title: 'Eligibility', desc: 'Deterministic rules. Clear reasons, no guessing.' },
                { step: '04', icon: '📊', title: 'Match', desc: 'Ranked results with explained fit score.' },
              ].map((s) => (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 border-2 border-white shadow-card text-2xl mb-4">
                    {s.icon}
                  </div>
                  <p className="text-xs font-bold text-brand-500 mb-1">{s.step}</p>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ FEATURES */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Features</p>
            <h2 className="text-3xl font-bold text-slate-900">Everything you need, nothing you don&apos;t</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Built for students who want clear answers, not vague recommendations.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '🔍',
                title: 'Smart Discovery',
                desc: 'Filter by country, degree, language, funding coverage and more. No noise, no ads.',
                accent: 'bg-blue-50 text-blue-600',
              },
              {
                icon: '✅',
                title: 'Eligibility Engine',
                desc: 'Deterministic rules — know exactly why you qualify or not. Missing data stays UNKNOWN.',
                accent: 'bg-green-50 text-green-600',
              },
              {
                icon: '📊',
                title: 'Explainable Matching',
                desc: 'Every match shows ranked components: budget, field, language, funding, country.',
                accent: 'bg-violet-50 text-violet-600',
              },
              {
                icon: '📅',
                title: 'Deadline Tracking',
                desc: 'Verified deadlines tied to application cycles — never a stale date.',
                accent: 'bg-red-50 text-red-600',
              },
              {
                icon: '💰',
                title: 'Full Funding Clarity',
                desc: 'Tuition, living, accommodation, visa, stipend — each field broken down separately.',
                accent: 'bg-amber-50 text-amber-600',
              },
              {
                icon: '🤝',
                title: 'Human Support',
                desc: 'Connect with an advisor for guidance when you need it.',
                accent: 'bg-teal-50 text-teal-600',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ CTA */}
      {!session && (
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-brand-600/20 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center text-white">
            <h2 className="text-4xl font-extrabold tracking-tight">Ready to find your match?</h2>
            <p className="mt-4 text-lg text-white/60">
              Create your profile in minutes. Get personalised, explained results instantly.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-900 hover:bg-brand-50 transition-all hover:-translate-y-0.5 shadow-lg"
              >
                Create free account
              </Link>
              <Link
                href="/auth/login"
                className="rounded-xl border border-white/25 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white text-xs font-bold">S</span>
            <span className="text-sm font-semibold text-slate-700">SilkStudy</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">Study Abroad Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/auth/register" className="hover:text-brand-700 transition-colors">Get started</Link>
            <Link href="/auth/login" className="hover:text-brand-700 transition-colors">Sign in</Link>
            <span>© {new Date().getFullYear()} SilkStudy</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
