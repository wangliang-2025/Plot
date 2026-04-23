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
  Paperclip,
  Table,
  Globe,
  Upload,
  X,
} from 'lucide-react';
import {
  compressImageToDataUrl,
  dataUrlByteSize,
  formatBytes,
} from '@/lib/image-utils';

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

/**
 * Max size cap (bytes) for a single embedded image after compression.
 * Inlining large images as data URLs bloats the post row in the database,
 * so we reject anything that stays absurdly large after compression.
 */
const MAX_INLINE_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * In-editor placeholder scheme for inline assets.
 * A pasted/uploaded image's base64 data URL can be megabytes long and makes
 * the source view unreadable. We keep the full data URL in an in-memory map
 * and show a short, readable token in the textarea instead:
 *
 *   ![alt](ink-asset://abc12345)
 *
 * Tokens are expanded back to the original data URL right before preview
 * rendering and submission, so the stored content is still fully portable
 * markdown that works everywhere else (RSS, exports, other viewers).
 */
const ASSET_SCHEME = 'ink-asset://';
const ASSET_TOKEN_RE = /ink-asset:\/\/([a-z0-9]+)/gi;

function newAssetId(): string {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  );
}

export function PostEditor({ initial, categories }: Props) {
  const t = useTranslations('editor');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // ── Inline asset placeholder store ─────────────────────────────────
  // Keeps {tokenId -> full data URL} so the textarea can show short tokens
  // instead of multi-megabyte base64 strings.
  const [assets, setAssets] = useState<Record<string, string>>({});
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  const registerAsset = useCallback((dataUrl: string): string => {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    const id = newAssetId();
    setAssets((prev) => ({ ...prev, [id]: dataUrl }));
    return `${ASSET_SCHEME}${id}`;
  }, []);

  const expandTokens = useCallback((text: string): string => {
    if (!text.includes(ASSET_SCHEME)) return text;
    return text.replace(ASSET_TOKEN_RE, (m, id: string) =>
      assetsRef.current[id] ?? m
    );
  }, []);

  // One-time migration: when we first mount with existing content that
  // contains raw data URLs (e.g. loaded from DB), collapse them into tokens
  // so they aren't displayed as giant base64 blobs.
  const didMigrateRef = useRef(false);
  useEffect(() => {
    if (didMigrateRef.current) return;
    didMigrateRef.current = true;
    const src = initial?.content ?? '';
    if (!src || !src.includes('data:')) return;
    const found: Record<string, string> = {};
    const collapsed = src
      // Markdown image/link syntax:  ](data:...)
      .replace(/\]\((data:[^)\s]+)\)/g, (_m, url: string) => {
        const id = newAssetId();
        found[id] = url;
        return `](${ASSET_SCHEME}${id})`;
      })
      // Raw <img src="data:..."> style
      .replace(/(src|href)=(["'])(data:[^"']+)\2/g, (_m, attr, q, url: string) => {
        const id = newAssetId();
        found[id] = url;
        return `${attr}=${q}${ASSET_SCHEME}${id}${q}`;
      });
    if (Object.keys(found).length > 0) {
      setAssets(found);
      setContent(collapsed);
    }
  }, [initial?.content]);

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
          content: expandTokens(content),
          locale,
          visibility,
          allowEmbed,
          categoryId: categoryId || null,
          published: publish,
          tags: tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
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
      expandTokens,
    ]
  );

  const togglePreview = async () => {
    if (!preview) {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: expandTokens(content), allowEmbed }),
      });
      if (res.ok) {
        const data = (await res.json()) as { html: string };
        setPreviewHtml(data.html);
      }
    }
    setPreview((v) => !v);
  };

  // ── Toolbar helpers ────────────────────────────────────────────────
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

  const insertAtCursor = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el) {
        setContent((prev) => prev + text);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = content.slice(0, start) + text + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + text.length;
        el.selectionStart = el.selectionEnd = pos;
      });
    },
    [content]
  );

  // ── Image / attachment helpers ─────────────────────────────────────
  const insertImageFromFile = useCallback(
    async (file: File) => {
      setError(null);
      setNotice(null);
      setUploadingImage(true);
      try {
        const dataUrl = await compressImageToDataUrl(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });
        const size = dataUrlByteSize(dataUrl);
        if (size > MAX_INLINE_IMAGE_BYTES) {
          setError(
            `Image too large after compression (${formatBytes(size)}). Please resize first.`
          );
          return;
        }
        const alt = file.name.replace(/\.[^/.]+$/, '');
        const token = registerAsset(dataUrl);
        insertAtCursor(`\n![${alt}](${token})\n`);
        setNotice(
          `Inserted image: ${file.name} · ${formatBytes(file.size)} → ${formatBytes(size)}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Image insert failed: ${msg}`);
      } finally {
        setUploadingImage(false);
      }
    },
    [insertAtCursor, registerAsset]
  );

  const insertAttachmentFromFile = useCallback(
    async (file: File) => {
      setError(null);
      setNotice(null);
      try {
        if (file.size > 2 * 1024 * 1024) {
          setError(
            `Attachment exceeds 2 MB (${formatBytes(file.size)}). Consider linking externally.`
          );
          return;
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(reader.error);
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
        const token = registerAsset(dataUrl);
        insertAtCursor(`\n[📎 ${file.name}](${token})\n`);
        setNotice(`Attached: ${file.name} · ${formatBytes(file.size)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Attachment insert failed: ${msg}`);
      }
    },
    [insertAtCursor, registerAsset]
  );

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    list.forEach((f) => {
      if (f.type.startsWith('image/')) insertImageFromFile(f);
    });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const onPickAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    list.forEach((f) => insertAttachmentFromFile(f));
    if (attachInputRef.current) attachInputRef.current.value = '';
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (!f) return;
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(f, {
        maxWidth: 1800,
        maxHeight: 1200,
        quality: 0.82,
      });
      const size = dataUrlByteSize(dataUrl);
      if (size > MAX_INLINE_IMAGE_BYTES) {
        setError(
          `Cover too large after compression (${formatBytes(size)}). Please pick a smaller image.`
        );
        return;
      }
      setCoverImage(dataUrl);
      setNotice(
        `Cover ready: ${f.name} · ${formatBytes(f.size)} → ${formatBytes(size)}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Cover load failed: ${msg}`);
    }
  };

  // ── Paste handler: intercept image clipboard items ─────────────────
  const onPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const images: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === 'file' && it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) images.push(f);
        }
      }

      if (images.length === 0) return;

      // We want the pasted image to be inserted as markdown — not the OS's
      // default "paste image" behaviour which often yields nothing in a
      // textarea. Prevent default and handle ourselves.
      e.preventDefault();
      for (const f of images) await insertImageFromFile(f);
    },
    [insertImageFromFile]
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
      if (k === 'b') {
        e.preventDefault();
        wrapSelection('**', '**', 'bold');
      } else if (k === 'i') {
        e.preventDefault();
        wrapSelection('*', '*', 'italic');
      } else if (k === 'k') {
        e.preventDefault();
        wrapSelection('[', '](https://)', 'link');
      } else if (k === 's') {
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
      {notice && !error && (
        <div className="card px-4 py-3 text-xs text-muted-foreground">
          {notice}
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
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => wrapSelection('**', '**', 'bold')}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => wrapSelection('*', '*', 'italic')}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => wrapSelection('`', '`', 'code')}
                title="Inline code"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => wrapSelection('[', '](https://)', 'link')}
                title="Link (Ctrl+K)"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/30 dark:bg-white/10" />
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => insertLine('## ')}
                title="Heading"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => insertLine('- ')}
                title="Bullet list"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => insertLine('1. ')}
                title="Numbered list"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => insertLine('> ')}
                title="Quote"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/30 dark:bg-white/10" />
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => wrapSelection('![', '](https://)', 'alt')}
                title="Image by URL"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-ghost h-8 px-2 text-xs"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                title={t('insert_local_image')}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingImage ? '…' : t('local_image')}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickImage}
              />
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() => attachInputRef.current?.click()}
                title={t('insert_attachment')}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <input
                ref={attachInputRef}
                type="file"
                className="hidden"
                onChange={onPickAttach}
              />
              <button
                type="button"
                className="btn-ghost h-8 w-8 p-0"
                onClick={() =>
                  wrapSelection(
                    '\n| Header | Header |\n| --- | --- |\n| Cell | Cell |\n',
                    ''
                  )
                }
                title="Table"
              >
                <Table className="h-3.5 w-3.5" />
              </button>
              {allowEmbed && (
                <button
                  type="button"
                  className="btn-ghost h-8 w-8 p-0"
                  onClick={() =>
                    wrapSelection(
                      '\n<iframe src="',
                      '" width="100%" height="450"></iframe>\n',
                      'https://'
                    )
                  }
                  title="Embed iframe"
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="ml-auto" />
              <button
                type="button"
                onClick={togglePreview}
                className="btn-ghost h-8 px-3 text-xs"
              >
                {preview ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {preview ? t('edit') : t('preview')}
              </button>
            </div>

            {preview ? (
              <div
                className="article max-h-[70vh] min-h-[480px] overflow-auto p-6"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={onPaste}
                  className="block w-full resize-none border-0 bg-transparent p-5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                  placeholder={
                    '# Hello\n\nWrite your post in **Markdown**...\n\n```ts\nconsole.log("hi")\n```\n\n$E = mc^2$\n\n📎 Tip: paste or drop images directly to inline them.'
                  }
                  rows={24}
                />
                {Object.keys(assets).length > 0 && (
                  <div className="border-t border-white/30 bg-white/30 px-4 py-2 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                    {Object.keys(assets).length} inline asset
                    {Object.keys(assets).length === 1 ? '' : 's'} ·{' '}
                    <code className="rounded bg-black/5 px-1 py-0.5 font-mono dark:bg-white/10">
                      {ASSET_SCHEME}xxx
                    </code>{' '}
                    {t('asset_hint')}
                  </div>
                )}
              </>
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
                  onChange={(e) =>
                    setVisibility(e.target.value as 'public' | 'private' | 'unlisted')
                  }
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
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
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
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="input"
                  >
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
                <div className="flex gap-2">
                  <input
                    value={
                      coverImage.startsWith('data:')
                        ? `[inline image · ${formatBytes(dataUrlByteSize(coverImage))}]`
                        : coverImage
                    }
                    onChange={(e) => {
                      // Don't allow editing while a data URL is held — user
                      // must clear it first via the × button to type a URL.
                      if (coverImage.startsWith('data:')) return;
                      setCoverImage(e.target.value);
                    }}
                    readOnly={coverImage.startsWith('data:')}
                    className="input flex-1"
                    placeholder="https://... or pick local"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="btn-secondary h-auto shrink-0 px-3"
                    title={t('pick_local')}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickCover}
                  />
                </div>
                {coverImage && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/40 bg-white/30 p-2 dark:border-white/10 dark:bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1 text-[11px] text-muted-foreground">
                      <p className="truncate">
                        {coverImage.startsWith('data:')
                          ? `inline · ${formatBytes(dataUrlByteSize(coverImage))}`
                          : coverImage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="btn-ghost h-6 w-6 p-0"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
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
