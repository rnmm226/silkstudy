'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface University { id: string; nameI18n: string; country: string }

interface DefaultValues {
  id?: string;
  type: string;
  nameI18n: string;
  descriptionI18n: string;
  status: string;
  universityId: string;
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';
const COVERAGE_OPTIONS = ['FULL', 'PARTIAL', 'NONE', 'UNKNOWN'];

export default function CatalogForm({
  universities, mode, defaultValues,
}: {
  universities: University[];
  mode: 'create' | 'edit';
  defaultValues?: DefaultValues;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    type:            defaultValues?.type            ?? 'SCHOLARSHIP',
    nameI18n:        defaultValues?.nameI18n        ?? '',
    descriptionI18n: defaultValues?.descriptionI18n ?? '',
    status:          defaultValues?.status          ?? 'DRAFT',
    universityId:    defaultValues?.universityId    ?? '',
  });

  // Program detail fields
  const [prog, setProg] = useState({
    degreeLevel:            '',
    fieldOfStudy:           '',
    languagesOfInstruction: '',
    durationMonths:         '',
    studyMode:              '',
  });

  // Scholarship detail fields
  const [schol, setSchol] = useState({
    tuitionCoverageType:       'UNKNOWN',
    livingCoverageType:        'UNKNOWN',
    accommodationCoverageType: 'UNKNOWN',
    transportCoverageType:     'UNKNOWN',
    insuranceCoverageType:     'UNKNOWN',
    visaCoverageType:          'UNKNOWN',
    applicationFeeCoverageType:'UNKNOWN',
    coverageScope:             'UNKNOWN',
    fundingBody:               '',
    monthlyStipendAmount:      '',
    monthlyStipendCurrency:    'EUR',
    renewable:                 '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function setField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function setProgField(field: keyof typeof prog) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProg((p) => ({ ...p, [field]: e.target.value }));
  }

  function setScholField(field: keyof typeof schol) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSchol((s) => ({ ...s, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);

    // 1. Create / update core opportunity
    const url    = mode === 'create' ? '/api/v1/admin/opportunities' : `/api/v1/admin/opportunities/${defaultValues?.id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, universityId: form.universityId || null }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.message ?? 'Failed to save.');
      setLoading(false);
      return;
    }

    // 2. TODO: persist ProgramDetail / ScholarshipDetail via dedicated admin endpoints
    //    For now they are displayed as fields — future sprint will add those API routes.
    setLoading(false);
    router.push('/admin/catalog');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Core fields ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 pb-2 border-b border-slate-100">Basic info</h2>

        <div>
          <label className={labelCls}>Type *</label>
          <select className={inputCls} value={form.type} onChange={setField('type')} required>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="PROGRAM">Program</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Name *</label>
          <input required className={inputCls} value={form.nameI18n} onChange={setField('nameI18n')} placeholder="e.g. DAAD Research Grant 2027" />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.descriptionI18n} onChange={setField('descriptionI18n')} placeholder="Short description…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>University</label>
            <select className={inputCls} value={form.universityId} onChange={setField('universityId')}>
              <option value="">— None —</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.nameI18n} ({u.country})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status *</label>
            <select className={inputCls} value={form.status} onChange={setField('status')} required>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Program detail (PROGRAM type) ── */}
      {form.type === 'PROGRAM' && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 pb-2 border-b border-blue-100">Program details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Degree level</label>
              <input className={inputCls} value={prog.degreeLevel} onChange={setProgField('degreeLevel')} placeholder="Master" />
            </div>
            <div>
              <label className={labelCls}>Field of study</label>
              <input className={inputCls} value={prog.fieldOfStudy} onChange={setProgField('fieldOfStudy')} placeholder="Computer Science" />
            </div>
            <div>
              <label className={labelCls}>Languages of instruction</label>
              <input className={inputCls} value={prog.languagesOfInstruction} onChange={setProgField('languagesOfInstruction')} placeholder="English, French" />
            </div>
            <div>
              <label className={labelCls}>Study mode</label>
              <input className={inputCls} value={prog.studyMode} onChange={setProgField('studyMode')} placeholder="FULL_TIME" />
            </div>
            <div>
              <label className={labelCls}>Duration (months)</label>
              <input type="number" className={inputCls} value={prog.durationMonths} onChange={setProgField('durationMonths')} placeholder="24" />
            </div>
          </div>
        </div>
      )}

      {/* ── Scholarship detail (SCHOLARSHIP type) ── */}
      {form.type === 'SCHOLARSHIP' && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 pb-2 border-b border-violet-100">Scholarship / funding details</h2>

          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ['tuitionCoverageType',        'Tuition coverage'],
                ['livingCoverageType',         'Living coverage'],
                ['accommodationCoverageType',  'Accommodation'],
                ['transportCoverageType',      'Transport'],
                ['insuranceCoverageType',      'Insurance'],
                ['visaCoverageType',           'Visa'],
                ['applicationFeeCoverageType', 'Application fee'],
                ['coverageScope',              'Overall scope'],
              ] as [keyof typeof schol, string][]
            ).map(([field, label]) => (
              <div key={field}>
                <label className={labelCls}>{label}</label>
                <select className={inputCls} value={schol[field]} onChange={setScholField(field)}>
                  {COVERAGE_OPTIONS.map((o) => <option key={o} value={o}>{o.toLowerCase()}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-violet-100">
            <div>
              <label className={labelCls}>Monthly stipend amount</label>
              <input type="number" className={inputCls} value={schol.monthlyStipendAmount} onChange={setScholField('monthlyStipendAmount')} placeholder="800" />
            </div>
            <div>
              <label className={labelCls}>Stipend currency</label>
              <input className={inputCls} maxLength={3} value={schol.monthlyStipendCurrency} onChange={setScholField('monthlyStipendCurrency')} placeholder="EUR" />
            </div>
            <div>
              <label className={labelCls}>Funding body</label>
              <input className={inputCls} value={schol.fundingBody} onChange={setScholField('fundingBody')} placeholder="DAAD, Erasmus…" />
            </div>
            <div>
              <label className={labelCls}>Renewable</label>
              <select className={inputCls} value={schol.renewable} onChange={setScholField('renewable')}>
                <option value="">Unknown</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors">
          {loading ? 'Saving…' : mode === 'create' ? 'Create opportunity' : 'Save changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
