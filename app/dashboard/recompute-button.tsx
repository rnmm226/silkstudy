'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecomputeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleClick() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch('/api/v1/me/matches/recompute', { method: 'POST' });
      if (res.ok) {
        setDone(true);
        router.refresh();
        setTimeout(() => setDone(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Computing…' : done ? '✓ Done' : '↻ Recompute matches'}
    </button>
  );
}
