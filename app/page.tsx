import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';

const features = [
  {
    icon: '🔍',
    title: 'Smart Discovery',
    desc: 'Filter thousands of programs and scholarships by country, degree, language, funding coverage and more.',
  },
  {
    icon: '✅',
    title: 'Eligibility Engine',
    desc: 'Deterministic rules — know exactly why you qualify or not, with no black-box decisions.',
  },
  {
    icon: '📊',
    title: 'Explainable Matching',
    desc: 'Every match comes with a ranked breakdown so you understand what drove the result.',
  },
  {
    icon: '📅',
    title: 'Deadline Tracking',
    desc: 'All deadlines are verified, cycle-aware, and tied directly to the opportunity — never out of date.',
  },
  {
    icon: '💰',
    title: 'Full Funding Clarity',
    desc: 'Coverage is broken down field by field: tuition, living, accommodation, visa, stipend, and more.',
  },
  {
    icon: '🤝',
    title: 'Human Support',
    desc: 'Stuck? Raise a help request and connect with an advisor who knows the platform.',
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 40%, #fff 0%, transparent 60%)' }} />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-100 mb-6">
            Study Abroad Platform
          </span>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            Find the right opportunity.<br />
            <span className="text-brand-300">Know exactly why it fits.</span>
          </h1>
          <p className="mt-6 text-lg text-brand-100 max-w-2xl mx-auto leading-relaxed">
            SilkStudy matches your profile to verified programs and scholarships worldwide —
            with transparent eligibility checks, real deadlines, and full funding breakdowns.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-800 shadow hover:bg-brand-50 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-800 shadow hover:bg-brand-50 transition-colors"
                >
                  Get started — it&apos;s free
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-white/30 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl grid grid-cols-3 divide-x divide-slate-200 px-6 py-8 text-center">
          {[
            { value: '500+', label: 'Verified opportunities' },
            { value: '60+', label: 'Countries covered' },
            { value: '100%', label: 'Explainable decisions' },
          ].map((s) => (
            <div key={s.label} className="px-4">
              <p className="text-3xl font-bold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need, nothing you don&apos;t</h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Built for students who want clear answers, not vague recommendations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-md transition-shadow">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA bottom ── */}
      {!session && (
        <section className="bg-brand-700">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center text-white">
            <h2 className="text-3xl font-bold">Ready to find your match?</h2>
            <p className="mt-3 text-brand-200">
              Create your profile in minutes and get personalised results instantly.
            </p>
            <Link
              href="/auth/login"
              className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors"
            >
              Start for free
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} SilkStudy</span>
          <span>Study Abroad Platform — MVP v0.1</span>
        </div>
      </footer>
    </main>
  );
}
