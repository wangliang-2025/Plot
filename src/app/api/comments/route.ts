import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const commentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(4000),
  guestName: z.string().min(1).max(40).nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const postId = url.searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const items = await prisma.comment.findMany({
    where: { postId, approved: true },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true, image: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  const json = await req.json();
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const data = {
    postId: parsed.data.postId,
    content: parsed.data.content,
    parentId: parsed.data.parentId ?? null,
    authorId: session?.user?.id ?? null,
    guestName: session ? null : parsed.data.guestName ?? 'Anonymous',
  };

  const comment = await prisma.comment.create({ data });
  return NextResponse.json({ comment }, { status: 201 });
}
