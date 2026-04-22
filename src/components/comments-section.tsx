'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';
import { MessageSquare, User } from 'lucide-react';

interface CommentItem {
  id: string;
  content: string;
  guestName: string | null;
  createdAt: string;
  author: { name: string | null; image: string | null } | null;
}

export function CommentsSection({ postId }: { postId: string }) {
  const t = useTranslations('post');
  const locale = useLocale();
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await fetch(`/api/comments?postId=${postId}`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { items: CommentItem[] };
      setComments(data.items);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = () => {
    setError(null);
    if (!content.trim()) return;
    if (!session && !name.trim()) {
      setError(t('your_name'));
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId, content, guestName: session ? null : name }),
      });
      if (res.ok) {
        setContent('');
        await load();
      } else {
        setError('Failed');
      }
    });
  };

  return (
    <section className="mt-14 pt-10">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <MessageSquare className="h-5 w-5 text-[hsl(var(--accent))]" />
        {t('comment_count', { count: comments.length })}
      </h2>

      <div className="card glass mt-6 p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('leave_comment')}</h3>
        {!session && (
          <input
            type="text"
            placeholder={t('your_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input mb-3"
          />
        )}
        <textarea
          placeholder={t('your_comment')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea"
          rows={4}
        />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            onClick={submit}
            disabled={isPending || !content.trim()}
            className="btn-accent"
          >
            {isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">—</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="card glass-soft p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white">
                  {c.author?.image ? (
                    <img src={c.author.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="font-medium">
                  {c.author?.name || c.guestName || 'Anonymous'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.createdAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
