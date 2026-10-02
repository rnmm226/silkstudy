import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { requireSession } from '@/src/modules/auth';
import { listNotifications, getUnreadCount } from '@/src/modules/notifications/service';

export const GET = handler(async () => {
  const session = await requireSession();
  const [notifications, unread] = await Promise.all([
    listNotifications(session.user.id),
    getUnreadCount(session.user.id),
  ]);
  return NextResponse.json({ data: notifications, meta: { unread } });
});
