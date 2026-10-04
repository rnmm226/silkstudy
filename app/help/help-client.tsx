'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HelpRequest {
  id: string; category: string; subject: string;
  status: string; createdAt: string; resolvedAt: string | null;
}

const STATUS_CLS: Record<string, string> = {
  OPEN:     'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED:   'bg-slate-100 text-slate-600',
};

const CATEGORIES = ['ELIGIBILITY', 'APPLICATION', 'DOCUMENTS', 'FUNDING', 'VISA', 'OTHER'] as const;

export default function HelpClient({ initialRequests }: { initialRequests: HelpRequest[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [showForm, setShowForm]  = useState(false);
  const [category, setCategory]  = useState<string>(CATEGORIES[0]);
  const [subject,  setSubject]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const res = await fetch('/api/v1/me/help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, subject }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { data } = await res.json();
      setRequests((prev) => [{ ...data, createdAt: data.createdAt, resolvedAt: null }, ...prev]);
      setShowForm(false); setSubject(''); setCategory(CATEGORIES[0]);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.message ?? 'Failed to submit.');
    }
  }

  async function closeRequest(id: string) {
    const res = await fetch(`/api/v1/me/help/${id}/close`, { method: 'POST' });
    if (res.ok) {
      const { data } = await res.json();
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: data.status, resolvedAt: data.resolvedAt } : r));
      router.refresh();
    }
  }

  return (
    <>
      {/* New request button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          + New help request
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">New request</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subject *</label>
            <input
              required
              className={inputCls}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describe your question briefly…"
              maxLength={300}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-card">
          <div className="text-4xl mb-3">🤝</div>
          <p className="font-semibold text-slate-900">No requests yet</p>
          <p className="mt-1 text-sm text-slate-500">Submit a request if you need guidance from an advisor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status] ?? 'bg-slate-100'}`}>
                      {r.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {r.category.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{r.subject}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.resolvedAt ? ` · Resolved ${new Date(r.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                  </p>
                </div>
                {r.status === 'OPEN' && (
                  <button
                    onClick={() => closeRequest(r.id)}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
