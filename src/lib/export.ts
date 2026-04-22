import type { Post, User, Category, Tag } from '@prisma/client';
import { renderMarkdown } from './markdown';

type FullPost = Post & {
  author: Pick<User, 'name' | 'displayName'>;
  category?: Pick<Category, 'name' | 'slug'> | null;
  tags?: { tag: Pick<Tag, 'name' | 'slug'> }[];
};

function buildFrontmatter(post: FullPost): string {
  const lines: string[] = ['---'];
  lines.push(`title: "${post.title.replace(/"/g, '\\"')}"`);
  lines.push(`slug: ${post.slug}`);
  if (post.excerpt) lines.push(`excerpt: "${post.excerpt.replace(/"/g, '\\"').slice(0, 200)}"`);
  if (post.publishedAt || post.createdAt)
    lines.push(`date: ${(post.publishedAt || post.createdAt).toISOString()}`);
  lines.push(`locale: ${post.locale}`);
  lines.push(`visibility: ${post.visibility}`);
  if (post.coverImage) lines.push(`cover: ${post.coverImage}`);
  if (post.category?.name) lines.push(`category: ${post.category.name}`);
  if (post.tags?.length) {
    const tagList = post.tags.map((t) => t.tag.name).join(', ');
    lines.push(`tags: [${tagList}]`);
  }
  if (post.author?.displayName || post.author?.name)
    lines.push(`author: "${post.author.displayName || post.author.name}"`);
  lines.push('---', '');
  return lines.join('\n');
}

export function exportAsMarkdown(post: FullPost): string {
  return buildFrontmatter(post) + post.content;
}

const HTML_SHELL = `<!doctype html>
<html lang="{{LOCALE}}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{{TITLE}}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin>
<style>
  :root {
    --bg: #fafaff;
    --fg: #0f0f23;
    --muted: #6b6b8a;
    --accent: #7c5cff;
    --border: rgba(124, 92, 255, .15);
    --card: rgba(255,255,255,.6);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0c0c1a;
      --fg: #ececff;
      --muted: #9c9ccf;
      --border: rgba(255,255,255,.08);
      --card: rgba(20,20,40,.5);
    }
  }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    line-height: 1.85;
    max-width: 740px;
    margin: 0 auto;
    padding: 4rem 1.5rem;
  }
  header { margin-bottom: 3rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
  h1 { font-size: 2.4rem; line-height: 1.2; letter-spacing: -.02em; margin: 0 0 .8rem; }
  .meta { color: var(--muted); font-size: .9rem; }
  .meta a { color: var(--accent); text-decoration: none; }
  article { font-size: 1.05rem; }
  article h2, article h3, article h4 { font-weight: 700; margin-top: 2.2rem; line-height: 1.3; }
  article h2 { font-size: 1.6rem; padding-bottom: .3rem; border-bottom: 1px solid var(--border); }
  article h3 { font-size: 1.25rem; }
  article p { margin: 1.1rem 0; }
  article a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  article code { font-family: "SF Mono", ui-monospace, Menlo, monospace; background: var(--card); padding: .15rem .4rem; border-radius: 4px; font-size: .92em; color: var(--accent); }
  article pre { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.1rem; overflow-x: auto; }
  article pre code { background: transparent; padding: 0; color: inherit; }
  article blockquote { margin: 1.5rem 0; padding: .8rem 1.2rem; border-left: 3px solid var(--accent); background: var(--card); border-radius: 0 10px 10px 0; color: var(--muted); }
  article img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
  article table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: .95rem; }
  article th, article td { border: 1px solid var(--border); padding: .55rem .8rem; text-align: left; }
  article th { background: var(--card); }
  article hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }
  article iframe { width: 100%; min-height: 420px; border: 1px solid var(--border); border-radius: 12px; }
  .footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: .85rem; }
</style>
</head>
<body>
<header>
  <h1>{{TITLE}}</h1>
  <div class="meta">{{META}}</div>
</header>
<article>{{CONTENT}}</article>
<div class="footer">{{FOOTER}}</div>
</body>
</html>`;

export async function exportAsHtml(post: FullPost, opts: { siteName?: string; siteUrl?: string } = {}): Promise<string> {
  const html = await renderMarkdown(post.content);
  const date = (post.publishedAt || post.createdAt).toISOString().slice(0, 10);
  const author = post.author?.displayName || post.author?.name || '';
  const tags = (post.tags ?? []).map((t) => `#${t.tag.name}`).join(' · ');
  const meta = [date, author, post.category?.name, tags].filter(Boolean).join(' · ');
  const footer = `Exported from ${opts.siteName || 'Ink'}${opts.siteUrl ? ` — ${opts.siteUrl}/${post.locale}/posts/${post.slug}` : ''}`;
  return HTML_SHELL.replace('{{LOCALE}}', post.locale)
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace('{{META}}', meta)
    .replace('{{CONTENT}}', html)
    .replace('{{FOOTER}}', footer);
}
