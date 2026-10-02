'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Cycle {
  id: string;
  name: string;
  academicYear: string | null;
  status: string;
  closesAt: Date | string | null;
}

export default function ApplyButton({
  opportunityId,
  cycles,
}: {
  opportunityId: string;
  cycles: Cycle[];
}) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const openCycles = cycles.filter((c) => c.status === 'OPEN');

  async function handleApply() {
    if (!cycleId) return;
    setLoading(true); setError(null);
    const res = await fetch('/api/v1/me/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId, applicationCycleId: cycleId }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { setOpen(false); router.push('/applications'); }, 1200);
    } else {
      const data = await res.json();
      setError(data.message ?? 'Failed to apply.');
    }
  }

  if (openCycles.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic text-center">No open application cycles right now.</p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
      >
        Apply now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Start your application</h3>
            <p className="text-xs text-slate-500 mb-4">Select the cycle you want to apply to.</p>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            {success ? (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 text-center">
                ✓ Application created! Redirecting…
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {openCycles.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${cycleId === c.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="cycle"
                        value={c.id}
                        checked={cycleId === c.id}
                        onChange={() => setCycleId(c.id)}
                        className="mt-0.5 accent-brand-700"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        {c.academicYear && <p className="text-xs text-slate-500">Year {c.academicYear}</p>}
                        {c.closesAt && (
                          <p className="text-xs text-slate-400">
                            Closes {new Date(c.closesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApply}
                    disabled={loading || !cycleId}
                    className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
                  >
                    {loading ? 'Applying…' : 'Confirm application'}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setError(null); }}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
