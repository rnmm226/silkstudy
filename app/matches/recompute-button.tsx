'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecomputeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState(false);

  async function handleClick() {
    setLoading(true); setDone(false); setError(false);
    try {
      const res = await fetch('/api/v1/me/matches/recompute', { method: 'POST' });
      if (res.ok) {
        setDone(true);
        router.refresh();
        setTimeout(() => setDone(false), 3000);
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 shrink-0 ${
        done    ? 'bg-green-100 text-green-800 border border-green-200' :
        error   ? 'bg-red-100 text-red-700 border border-red-200' :
                  'bg-brand-700 text-white hover:bg-brand-800'
      }`}
    >
      {loading ? '⏳ Computing…' : done ? '✓ Done' : error ? '✗ Failed — retry' : '↻ Recompute'}
    </button>
  );
}
