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

interface Props {
  universities: University[];
  mode: 'create' | 'edit';
  defaultValues?: DefaultValues;
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';

export default function CatalogForm({ universities, mode, defaultValues }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    type:            defaultValues?.type            ?? 'SCHOLARSHIP',
    nameI18n:        defaultValues?.nameI18n        ?? '',
    descriptionI18n: defaultValues?.descriptionI18n ?? '',
    status:          defaultValues?.status          ?? 'DRAFT',
    universityId:    defaultValues?.universityId    ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);

    const url = mode === 'create'
      ? '/api/v1/admin/opportunities'
      : `/api/v1/admin/opportunities/${defaultValues?.id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        universityId: form.universityId || null,
      }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/admin/catalog');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.message ?? 'Failed to save.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Type *</label>
        <select className={inputCls} value={form.type} onChange={set('type')} required>
          <option value="SCHOLARSHIP">Scholarship</option>
          <option value="PROGRAM">Program</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Name *</label>
        <input required className={inputCls} value={form.nameI18n} onChange={set('nameI18n')} placeholder="DEMO Full Scholarship 2027" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          value={form.descriptionI18n}
          onChange={set('descriptionI18n')}
          placeholder="Short description of the opportunity…"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">University</label>
        <select className={inputCls} value={form.universityId} onChange={set('universityId')}>
          <option value="">— No university —</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.nameI18n} ({u.country})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Status *</label>
        <select className={inputCls} value={form.status} onChange={set('status')} required>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Saving…' : mode === 'create' ? 'Create opportunity' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
