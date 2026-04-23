import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPost } from '@/lib/posts';
import { slugify } from '@/lib/utils';

interface ImportResult {
  file: string;
  status: 'ok' | 'error';
  message?: string;
  slug?: string;
}

interface Frontmatter {
  title?: string;
  slug?: string;
  excerpt?: string;
  date?: string;
  tags?: string[] | string;
  cover?: string;
  coverImage?: string;
  locale?: string;
  published?: boolean;
  visibility?: 'public' | 'private' | 'unlisted';
}

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, content: raw };

  const block = m[1];
  const content = raw.slice(m[0].length);
  const data: Frontmatter = {};

  for (const line of block.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].trim();
    let value: string = kv[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const target = data as Record<string, unknown>;
    if (key === 'tags') {
      const arr = value.startsWith('[')
        ? value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : value.split(',').map((s) => s.trim());
      target[key] = arr.filter(Boolean);
    } else if (key === 'published') {
      target[key] = /^(true|1|yes)$/i.test(value);
    } else {
      target[key] = value;
    }
  }
  return { data, content };
}

/**
 * Authenticated user markdown import endpoint.
 * Any signed-in user can import .md / .mdx files as their own notes.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll('files');
  const defaultLocale = (form.get('locale') as string) || 'zh';
  const defaultPublished = form.get('published') === '1';
  const defaultVisibility =
    (form.get('visibility') as 'public' | 'private' | 'unlisted' | null) ?? 'private';

  const results: ImportResult[] = [];

  for (const item of files) {
    if (!(item instanceof File)) continue;
    const name = item.name;
    try {
      const text = await item.text();
      const { data, content } = parseFrontmatter(text);

      const fallbackTitle = name
        .replace(/\.mdx?$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const title = (data.title || fallbackTitle).trim();
      const tags = Array.isArray(data.tags) ? data.tags : [];

      const post = await createPost({
        title,
        slug: data.slug || slugify(title),
        excerpt: data.excerpt,
        coverImage: data.cover || data.coverImage || null,
        content,
        locale: data.locale || defaultLocale,
        visibility: data.visibility || defaultVisibility,
        published:
          data.published !== undefined ? data.published : defaultPublished,
        tags,
        authorId: session.user.id,
      });

      results.push({ file: name, status: 'ok', slug: post.slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({ file: name, status: 'error', message });
    }
  }

  return NextResponse.json({ results });
}
