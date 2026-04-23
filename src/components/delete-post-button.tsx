'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';

interface Props {
  id: string;
  /** If set, render a full-width button with this label instead of the icon-only variant. */
  label?: string;
  /** Extra classes (merged after defaults). */
  className?: string;
  /** After a successful delete, navigate here (e.g. `/notes`). Defaults to refreshing the current page. */
  redirectTo?: string;
}

export function DeletePostButton({ id, label, className, redirectTo }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(t('delete_confirm'))) return;
    startTransition(async () => {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  if (label) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={
          className ??
          'btn-ghost h-9 text-destructive hover:bg-destructive/10'
        }
        title={t('delete')}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? '…' : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={
        className ??
        'btn-ghost h-8 w-8 p-0 text-destructive hover:bg-destructive/10'
      }
      title={t('delete')}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
