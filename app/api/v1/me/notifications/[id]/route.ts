import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireSession } from '@/src/modules/auth';
import { markNotification, updateNotificationSchema } from '@/src/modules/notifications/service';

type Ctx = { params: { id: string } };

export const PATCH = handler(async (req, ctx) => {
  const session = await requireSession();
  const { id } = (ctx as Ctx).params;
  const { status } = await parseBody(req, updateNotificationSchema);
  const updated = await markNotification(session.user.id, id, status);
  return NextResponse.json({ data: updated });
});
