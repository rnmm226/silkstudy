import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import { adminVerifyOpportunity } from '@/src/modules/admin/catalog-service';
import { z } from 'zod';

type Ctx = { params: { id: string } };

const verifySchema = z.object({
  sourceId: z.string().uuid(),
  factKey:  z.string().min(1).max(100),
});

export const POST = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, verifySchema);
  const result = await adminVerifyOpportunity(id, input.sourceId, input.factKey, session.user.id);
  return NextResponse.json({ data: result }, { status: 201 });
});
