'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  type: string;
  nameI18n: string;
  descriptionI18n: string | null;
  university: { nameI18n: string; country: string; city: string | null } | null;
  programDetail: { degreeLevel: string; fieldOfStudy: string; languagesOfInstruction: string[] } | null;
  scholarshipDetail: { tuitionCoverageType: string; livingCoverageType: string; coverageScope: string } | null;
  nextDeadline: { dueAt: string; timezone: string; verificationStatus: string } | null;
}

interface SearchResponse {
  data: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';
const selectCls = inputCls;

function coverageColor(c: string) {
  if (c === 'FULL')    return 'bg-green-100 text-green-800';
  if (c === 'PARTIAL') return 'bg-amber-100 text-amber-800';
  if (c === 'NONE')    return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-500';
}

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return null;
  if (diff === 0) return 'Due today';
  if (diff <= 7)  return `${diff}d left`;
  if (diff <= 30) return `${diff}d left`;
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [query,     setQuery]     = useState(params.get('q') ?? '');
  const [country,   setCountry]   = useState(params.get('country') ?? '');
  const [degree,    setDegree]    = useState(params.get('degreeLevel') ?? '');
  const [field,     setField]     = useState(params.get('field') ?? '');
  const [language,  setLanguage]  = useState(params.get('language') ?? '');
  const [type,      setType]      = useState(params.get('type') ?? '');
  const [tuition,   setTuition]   = useState(params.get('tuitionCoverage') ?? '');
  const [living,    setLiving]    = useState(params.get('livingCoverage') ?? '');
  const [page,      setPage]      = useState(1);

  const [results,  setResults]  = useState<SearchResponse | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (query)    p.set('q', query);
    if (country)  p.set('country', country);
    if (degree)   p.set('degreeLevel', degree);
    if (field)    p.set('field', field);
    if (language) p.set('language', language);
    if (type)     p.set('type', type);
    if (tuition)  p.set('tuitionCoverage', tuition);
    if (living)   p.set('livingCoverage', living);
    p.set('page', String(page));
    return p;
  }, [query, country, degree, field, language, type, tuition, living, page]);

  const doSearch = useCallback(async (p: URLSearchParams) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/v1/search?${p.toString()}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search on mount if params present
  useEffect(() => {
    if (params.size > 0) {
      const p = new URLSearchParams(params.toString());
      doSearch(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    const p = buildParams();
    p.set('page', '1');
    router.replace(`/search?${p.toString()}`, { scroll: false });
    doSearch(p);
  }

  function handlePage(newPage: number) {
    setPage(newPage);
    const p = buildParams();
    p.set('page', String(newPage));
    router.replace(`/search?${p.toString()}`, { scroll: false });
    doSearch(p);
  }

  function clearFilters() {
    setQuery(''); setCountry(''); setDegree(''); setField('');
    setLanguage(''); setType(''); setTuition(''); setLiving('');
    setPage(1); setResults(null); setSearched(false);
    router.replace('/search', { scroll: false });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Search Opportunities</h1>
        <p className="mt-1 text-sm text-slate-500">Filter programs and scholarships. Filters are strict — no silent relaxation.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── Filters sidebar ── */}
        <aside className="w-full lg:w-72 shrink-0">
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Filters</h2>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Keyword search</label>
              <input className={inputCls} placeholder="AI, scholarship, Berlin…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All types</option>
                <option value="PROGRAM">Program</option>
                <option value="SCHOLARSHIP">Scholarship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Country</label>
              <input className={inputCls} placeholder="France, Germany…" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Degree level</label>
              <input className={inputCls} placeholder="Master, Bachelor…" value={degree} onChange={(e) => setDegree(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Field of study</label>
              <input className={inputCls} placeholder="Computer Science, AI…" value={field} onChange={(e) => setField(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Language of instruction</label>
              <input className={inputCls} placeholder="English, French…" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tuition coverage</label>
              <select className={selectCls} value={tuition} onChange={(e) => setTuition(e.target.value)}>
                <option value="">Any</option>
                <option value="FULL">Full tuition</option>
                <option value="PARTIAL">Partial tuition</option>
                <option value="NONE">No tuition coverage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Living coverage</label>
              <select className={selectCls} value={living} onChange={(e) => setLiving(e.target.value)}>
                <option value="">Any</option>
                <option value="FULL">Full living</option>
                <option value="PARTIAL">Partial living</option>
                <option value="NONE">No living coverage</option>
              </select>
            </div>

            <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
              Search
            </button>
            {searched && (
              <button type="button" onClick={clearFilters} className="w-full rounded-lg border border-slate-200 py-2 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                Clear filters
              </button>
            )}
          </form>
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          )}

          {!loading && searched && results && (
            <>
              <p className="mb-4 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{results.total}</span> result{results.total !== 1 ? 's' : ''}
                {results.total === 0 && ' — try adjusting your filters'}
              </p>

              <div className="space-y-3">
                {results.data.map((opp) => {
                  const deadline = opp.nextDeadline ? daysUntil(opp.nextDeadline.dueAt) : null;
                  return (
                    <div key={opp.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-200 hover:shadow-card-md transition-all">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${opp.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                          {opp.type === 'SCHOLARSHIP' ? 'Scholarship' : 'Program'}
                        </span>
                        {opp.scholarshipDetail && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${coverageColor(opp.scholarshipDetail.tuitionCoverageType)}`}>
                            Tuition: {opp.scholarshipDetail.tuitionCoverageType.toLowerCase()}
                          </span>
                        )}
                        {opp.scholarshipDetail && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${coverageColor(opp.scholarshipDetail.livingCoverageType)}`}>
                            Living: {opp.scholarshipDetail.livingCoverageType.toLowerCase()}
                          </span>
                        )}
                        {deadline && (
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                            {deadline}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900">{opp.nameI18n}</h3>

                      {opp.university && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {opp.university.nameI18n} · {opp.university.country}{opp.university.city ? `, ${opp.university.city}` : ''}
                        </p>
                      )}

                      {opp.programDetail && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{opp.programDetail.degreeLevel}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{opp.programDetail.fieldOfStudy}</span>
                          {opp.programDetail.languagesOfInstruction.slice(0, 2).map((l) => (
                            <span key={l} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{l}</span>
                          ))}
                        </div>
                      )}

                      {opp.descriptionI18n && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2">{opp.descriptionI18n}</p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <Link href={`/opportunities/${opp.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                          View details →
                        </Link>
                        {opp.nextDeadline && (
                          <span className={`text-xs ${opp.nextDeadline.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-slate-400'}`}>
                            {opp.nextDeadline.verificationStatus === 'VERIFIED' ? '✓ Verified deadline' : 'Deadline unverified'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {results.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-slate-500">Page {results.page} of {results.totalPages}</span>
                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page >= results.totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-500 text-sm">Use the filters to search programs and scholarships.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
