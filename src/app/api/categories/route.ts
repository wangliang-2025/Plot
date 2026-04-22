import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listCategories, createCategory } from '@/lib/categories';

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(280).optional().nullable(),
  color: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const owner = url.searchParams.get('owner');

  if (owner === 'me') {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await listCategories({ ownerId: session.user.id, includeOwnerless: true });
    return NextResponse.json({ items });
  }

  const items = await listCategories();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const cat = await createCategory({
    ...parsed.data,
    color: parsed.data.color
      ? parsed.data.color.startsWith('#')
        ? parsed.data.color
        : `#${parsed.data.color}`
      : null,
    ownerId: session.user.id,
  });
  return NextResponse.json({ category: cat }, { status: 201 });
}
