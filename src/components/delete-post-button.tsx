'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';

export function DeletePostButton({ id }: { id: string }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(t('delete_confirm'))) return;
    startTransition(async () => {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className="btn-ghost h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
      title={t('delete')}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
