'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Link2, Check, FileCode, FileText } from 'lucide-react';

export function PostActions({ postId }: { postId: string }) {
  const t = useTranslations('post');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary h-9"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" />
        {t('export')}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="card glass-strong absolute right-0 top-11 z-50 min-w-[210px] overflow-hidden p-1 text-sm shadow-xl">
            <a
              href={`/api/posts/${postId}/export?format=md`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/40 dark:hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <FileText className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              {t('export_md')}
            </a>
            <a
              href={`/api/posts/${postId}/export?format=html`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/40 dark:hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <FileCode className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              {t('export_html')}
            </a>
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-white/40 dark:hover:bg-white/5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Link2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              )}
              {copied ? t('copied') : t('copy_link')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
