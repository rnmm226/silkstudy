import { db } from '@/src/infrastructure/database';

/**
 * Write an immutable audit log entry.
 * Fire-and-forget — never throws so it never blocks the main flow.
 */
export async function writeAuditLog(opts: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        ...opts,
        metadata: opts.metadata ? (opts.metadata as import('@prisma/client').Prisma.JsonObject) : undefined,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log', err);
  }
}
