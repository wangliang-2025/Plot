'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Save,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  ListOrdered,
  List,
  Quote,
  Heading2,
  Image as ImageIcon,
  Table,
  Globe,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}
interface InitialValue {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string | null;
  content?: string;
  locale?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  published?: boolean;
  allowEmbed?: boolean;
  categoryId?: string | null;
  tags?: string[];
}

interface Props {
  initial?: InitialValue;
  categories: Category[];
}

export function PostEditor({ initial, categories }: Props) {
  const t = useTranslations('editor');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [locale, setLocale] = useState(initial?.locale ?? 'zh');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>(
    initial?.visibility ?? 'public'
  );
  const [allowEmbed, setAllowEmbed] = useState(initial?.allowEmbed ?? true);
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));

  const submit = useCallback(
    (publish: boolean) => {
      setError(null);
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      if (!content.trim()) {
        setError('Content is required');
        return;
      }
      startTransition(async () => {
        const body = {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || undefined,
          coverImage: coverImage.trim() || null,
          content,
          locale,
          visibility,
          allowEmbed,
          categoryId: categoryId || null,
          published: publish,
          tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
        };

        const url = initial?.id ? `/api/posts/${initial.id}` : '/api/posts';
        const method = initial?.id ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === 'string' ? data.error : 'Save failed');
          return;
        }
        router.push('/notes');
        router.refresh();
      });
    },
    [
      title,
      content,
      slug,
      excerpt,
      coverImage,
      locale,
      visibility,
      allowEmbed,
      categoryId,
      tags,
      initial?.id,
      router,
    ]
  );

  const togglePreview = async () => {
    if (!preview) {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, allowEmbed }),
      });
      if (res.ok) {
        const data = (await res.json()) as { html: string };
        setPreviewHtml(data.html);
      }
    }
    setPreview((v) => !v);
  };

  // Toolbar helpers — wrap selection
  const wrapSelection = useCallback(
    (before: string, after: string = before, placeholder = '') => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const sel = content.slice(start, end) || placeholder;
      const next = content.slice(0, start) + before + sel + after + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + sel.length;
      });
    },
    [content]
  );

  const insertLine = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + prefix.length;
      });
    },
    [content]
  );

  // Keyboard shortcuts (Ctrl/Cmd + B/I/K, etc.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (preview) return;
      const el = textareaRef.current;
      if (!el || document.activeElement !== el) return;
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); wrapSelection('**', '**', 'bold'); }
      else if (k === 'i') { e.preventDefault(); wrapSelection('*', '*', 'italic'); }
      else if (k === 'k') { e.preventDefault(); wrapSelection('[', '](https://)', 'link'); }
      else if (k === 's') {
        e.preventDefault();
        submit(initial?.published ?? false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wrapSelection, preview, submit, initial?.published]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="card border-destructive/40 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="card p-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent px-3 py-2 font-serif text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
              placeholder={t('title')}
            />
          </div>

          <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-white/30 px-2 py-1.5 dark:border-white/10">
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('**', '**', 'bold')} title="Bold (Ctrl+B)">
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('*', '*', 'italic')} title="Italic (Ctrl+I)">
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('`', '`', 'code')} title="Inline code">
                <Code className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('[', '](https://)', 'link')} title="Link (Ctrl+K)">
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/30 dark:bg-white/10" />
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => insertLine('## ')} title="Heading">
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => insertLine('- ')} title="Bullet list">
                <List className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => insertLine('1. ')} title="Numbered list">
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => insertLine('> ')} title="Quote">
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('![', '](https://)', 'alt')} title="Image">
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost h-8 w-8 p-0" onClick={() => wrapSelection('\n| Header | Header |\n| --- | --- |\n| Cell | Cell |\n', '')} title="Table">
                <Table className="h-3.5 w-3.5" />
              </button>
              {allowEmbed && (
                <button
                  type="button"
                  className="btn-ghost h-8 w-8 p-0"
                  onClick={() => wrapSelection('\n<iframe src="', '" width="100%" height="450"></iframe>\n', 'https://')}
                  title="Embed iframe"
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="ml-auto" />
              <button type="button" onClick={togglePreview} className="btn-ghost h-8 px-3 text-xs">
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview ? t('edit') : t('preview')}
              </button>
            </div>

            {preview ? (
              <div
                className="article max-h-[70vh] min-h-[480px] overflow-auto p-6"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full resize-none border-0 bg-transparent p-5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                placeholder={'# Hello\n\nWrite your post in **Markdown**...\n\n```ts\nconsole.log("hi")\n```\n\n$E = mc^2$'}
                rows={24}
              />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card glass p-5">
            <h3 className="mb-3 text-sm font-bold">{t('settings')}</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('visibility')}
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                  className="input"
                >
                  <option value="public">{t('visibility_public')}</option>
                  <option value="unlisted">{t('visibility_unlisted')}</option>
                  <option value="private">{t('visibility_private')}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('category')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input"
                >
                  <option value="">{t('no_category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Link
                  href="/notes/categories"
                  className="mt-1 inline-block text-xs text-[hsl(var(--accent))] hover:underline"
                >
                  + manage
                </Link>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('tags_input')}
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input"
                  placeholder="tech, react, ..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('slug')}
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input"
                  placeholder="auto-generated"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Locale
                  </label>
                  <select value={locale} onChange={(e) => setLocale(e.target.value)} className="input">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex w-full items-center gap-2 rounded-xl border border-input bg-white/30 px-3 py-2 text-xs dark:bg-white/5">
                    <input
                      type="checkbox"
                      checked={allowEmbed}
                      onChange={(e) => setAllowEmbed(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
                    />
                    embed
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('cover_image')}
                </label>
                <input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('excerpt')}
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="textarea min-h-[70px]"
                  placeholder="optional"
                />
              </div>
            </div>
          </div>

          <div className="card glass-strong sticky top-24 space-y-2 p-4">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={isPending}
              className="btn-accent w-full"
            >
              <Save className="h-4 w-4" />
              {isPending ? t('saving') : t('publish_now')}
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={isPending}
              className="btn-secondary w-full"
            >
              {t('save_draft')}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              ⌘/Ctrl + B / I / K · S to save
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
