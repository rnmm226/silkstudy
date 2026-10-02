import { db } from '@/src/infrastructure/database';
import { NotFoundError } from '@/src/shared/errors';
import { z } from 'zod';

export const updateNotificationSchema = z.object({
  status: z.enum(['READ', 'DISMISSED']),
});

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;

export async function listNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markNotification(
  userId: string,
  notificationId: string,
  status: 'READ' | 'DISMISSED',
) {
  const notif = await db.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });
  if (!notif) throw new NotFoundError('Notification');

  return db.notification.update({
    where: { id: notificationId },
    data: { status, sentAt: status === 'READ' ? new Date() : undefined },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, status: 'PENDING' },
  });
}
