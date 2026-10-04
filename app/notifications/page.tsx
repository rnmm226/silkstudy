import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import NotificationsClient from './notifications-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {notifications.filter((n) => n.status === 'PENDING').length} unread
        </p>
      </div>
      <NotificationsClient
        initialNotifications={notifications.map((n) => ({
          ...n,
          scheduledFor: n.scheduledFor?.toISOString() ?? null,
          sentAt:       n.sentAt?.toISOString()       ?? null,
          createdAt:    n.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
