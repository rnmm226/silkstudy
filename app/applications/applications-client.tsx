'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  opportunity: {
    id: string; type: string; nameI18n: string;
    university: { nameI18n: string; country: string } | null;
  };
  applicationCycle: {
    name: string; academicYear: string | null; closesAt: Date | string | null;
  };
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  WITHDRAWN: 'bg-orange-100 text-orange-700',
  ACCEPTED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-700',
};

const ALL_STATUSES = ['DRAFT', 'SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED'] as const;

function daysLeft(closesAt: Date | string | null): number | null {
  if (!closesAt) return null;
  return Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000);
}

export default function ApplicationsClient({ initialApplications }: { initialApplications: Application[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApplications);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; notes: string }>({ status: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(app: Application) {
    setEditing(app.id);
    setEditForm({ status: app.status, notes: app.notes ?? '' });
    setError(null);
  }

  function cancelEdit() {
    setEditing(null); setError(null);
  }

  async function saveEdit(appId: string) {
    setSaving(true); setError(null);
    const res = await fetch(`/api/v1/me/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editForm.status, notes: editForm.notes || null }),
    });
    setSaving(false);
    if (res.ok) {
      const { data } = await res.json();
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: data.status, notes: data.notes } : a));
      setEditing(null);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.message ?? 'Failed to save.');
    }
  }

  async function deleteApp(appId: string) {
    if (!confirm('Remove this application?')) return;
    const res = await fetch(`/api/v1/me/applications/${appId}`, { method: 'DELETE' });
    if (res.ok) {
      setApps((prev) => prev.filter((a) => a.id !== appId));
      router.refresh();
    }
  }

  const statusCounts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc;
  }, {});

  return (
    <>
      {/* Status summary */}
      {apps.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status} className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? 'bg-slate-100'}`}>
              {count} {status.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <div className="text-4xl mb-4">📝</div>
          <p className="font-semibold text-slate-900">No applications yet</p>
          <p className="mt-2 text-sm text-slate-500">Search for opportunities and start applying.</p>
          <Link href="/search" className="mt-6 inline-block rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
            Browse opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const dl   = daysLeft(app.applicationCycle.closesAt);
            const isEditing = editing === app.id;

            return (
              <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-200 transition-all">
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">{app.opportunity.nameI18n}</p>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Add notes about this application…"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm resize-none focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(app.id)} disabled={saving} className="flex-1 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={cancelEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[app.status] ?? 'bg-slate-100'}`}>
                          {app.status}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${app.opportunity.type === 'SCHOLARSHIP' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
                          {app.opportunity.type}
                        </span>
                        {dl !== null && dl >= 0 && dl <= 30 && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                            {dl === 0 ? 'Due today' : `${dl}d left`}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-semibold text-slate-900 truncate">{app.opportunity.nameI18n}</h2>
                      {app.opportunity.university && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.opportunity.university.nameI18n} · {app.opportunity.university.country}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {app.applicationCycle.name}
                        {app.applicationCycle.academicYear ? ` · ${app.applicationCycle.academicYear}` : ''}
                        {app.applicationCycle.closesAt
                          ? ` · closes ${new Date(app.applicationCycle.closesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : ''}
                      </p>
                      {app.notes && <p className="mt-2 text-xs text-slate-500 italic line-clamp-1">{app.notes}</p>}
                    </div>
                    <div className="shrink-0 flex gap-2">
                      <button onClick={() => startEdit(app)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        Edit
                      </button>
                      <Link href={`/opportunities/${app.opportunity.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        View
                      </Link>
                      <button onClick={() => deleteApp(app.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
