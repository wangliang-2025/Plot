import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateCategory, deleteCategory } from '@/lib/categories';

const patchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(280).nullable().optional(),
  color: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
});

async function ensureOwnerOrAdmin(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return null;
  if (cat.ownerId && cat.ownerId !== session.user.id && session.user.role !== 'admin') return null;
  return { session, cat };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await ensureOwnerOrAdmin(id);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data };
  if (data.color && !data.color.startsWith('#')) data.color = `#${data.color}`;

  const cat = await updateCategory(id, data);
  return NextResponse.json({ category: cat });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await ensureOwnerOrAdmin(id);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
