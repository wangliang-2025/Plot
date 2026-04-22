import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listPosts, createPost } from '@/lib/posts';

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: z.string().url().nullable().optional(),
  locale: z.enum(['zh', 'en']).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  allowEmbed: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
  const locale = url.searchParams.get('locale') ?? undefined;
  const tag = url.searchParams.get('tag') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const query = url.searchParams.get('q') ?? undefined;

  const data = await listPosts({ page, pageSize, locale, tag, category, query });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await createPost({
    ...parsed.data,
    authorId: session.user.id,
  });
  return NextResponse.json({ post }, { status: 201 });
}
