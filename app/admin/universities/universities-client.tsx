'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface University {
  id: string; nameI18n: string; country: string; city: string | null;
  websiteUrl: string | null; status: string; createdAt: string;
  opportunityCount: number;
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';

export default function UniversitiesClient({ initialUniversities }: { initialUniversities: University[] }) {
  const router = useRouter();
  const [unis, setUnis] = useState(initialUniversities);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameI18n: '', country: '', city: '', websiteUrl: '', status: 'DRAFT' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch('/api/v1/admin/universities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, websiteUrl: form.websiteUrl || null, city: form.city || null }),
    });
    setLoading(false);
    if (res.ok) {
      const { data } = await res.json();
      setUnis((prev) => [{ ...data, createdAt: data.createdAt, opportunityCount: 0 }, ...prev]);
      setShowForm(false);
      setForm({ nameI18n: '', country: '', city: '', websiteUrl: '', status: 'DRAFT' });
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.message ?? 'Failed to create.');
    }
  }

  const STATUS_CLS: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-800',
    DRAFT:     'bg-slate-100 text-slate-600',
    ARCHIVED:  'bg-amber-100 text-amber-700',
  };

  return (
    <>
      <div className="mb-4">
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
          + Add university
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">New university</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
              <input required className={inputCls} value={form.nameI18n} onChange={set('nameI18n')} placeholder="Sorbonne University" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Country *</label>
              <input required className={inputCls} value={form.country} onChange={set('country')} placeholder="France" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
              <input className={inputCls} value={form.city} onChange={set('city')} placeholder="Paris" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Website URL</label>
              <input type="url" className={inputCls} value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {loading ? 'Creating…' : 'Create university'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Name', 'Country', 'City', 'Opportunities', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unis.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                  <p className="truncate">{u.nameI18n}</p>
                  {u.websiteUrl && <a href={u.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">{u.websiteUrl.replace('https://', '').replace('http://', '').split('/')[0]}</a>}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.country}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.city ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600 text-center">{u.opportunityCount}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[u.status] ?? 'bg-slate-100'}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
            {unis.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No universities yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
