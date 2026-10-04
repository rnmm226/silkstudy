'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notif {
  id: string; type: string; channel: string; status: string;
  createdAt: string; sentAt: string | null;
}

const TYPE_ICON: Record<string, string> = {
  DEADLINE_REMINDER: '📅',
  APPLICATION_UPDATE: '📝',
  MATCH_READY: '📊',
  SYSTEM: '🔔',
};

export default function NotificationsClient({ initialNotifications }: { initialNotifications: Notif[] }) {
  const router = useRouter();
  const [notifs, setNotifs] = useState(initialNotifications);

  async function markAs(id: string, status: 'READ' | 'DISMISSED') {
    const res = await fetch(`/api/v1/me/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, status } : n));
      router.refresh();
    }
  }

  async function markAllRead() {
    const pending = notifs.filter((n) => n.status === 'PENDING');
    await Promise.all(pending.map((n) => markAs(n.id, 'READ')));
  }

  const unread = notifs.filter((n) => n.status === 'PENDING').length;

  if (notifs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <div className="text-4xl mb-3">🔔</div>
        <p className="font-semibold text-slate-900">No notifications</p>
        <p className="mt-1 text-sm text-slate-500">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <>
      {unread > 0 && (
        <div className="mb-4 flex justify-end">
          <button onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
            Mark all as read
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 transition-all ${
              n.status === 'PENDING'
                ? 'border-brand-200 bg-brand-50'
                : 'border-slate-200 bg-white opacity-70'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-slate-700 capitalize">
                    {n.type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="text-xs text-slate-400">· {n.channel.toLowerCase()}</span>
                  {n.status === 'PENDING' && (
                    <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {n.status === 'PENDING' && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => markAs(n.id, 'READ')}
                    className="rounded px-2 py-1 text-xs text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    Read
                  </button>
                  <button
                    onClick={() => markAs(n.id, 'DISMISSED')}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
