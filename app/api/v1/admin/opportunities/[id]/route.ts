import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import {
  adminPatchOpportunity,
  patchOpportunitySchema,
} from '@/src/modules/admin/catalog-service';

type Ctx = { params: { id: string } };

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAdmin();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, patchOpportunitySchema);
  const updated = await adminPatchOpportunity(id, input, session.user.id);
  return NextResponse.json({ data: updated });
});
