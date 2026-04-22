import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { renderMarkdown } from '@/lib/markdown';

export async function POST(req: Request) {
  // Authenticated users can use the preview endpoint.
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content, allowEmbed = true } = await req.json();
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }
  const html = await renderMarkdown(content, { allowEmbed: !!allowEmbed });
  return NextResponse.json({ html });
}
