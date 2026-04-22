'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, Check } from 'lucide-react';

export function PasswordForm() {
  const t = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setDone(false);
    if (next.length < 6) {
      setError(tAuth('password_too_short'));
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Failed');
        return;
      }
      setCurrent('');
      setNext('');
      setDone(true);
      setTimeout(() => setDone(false), 2400);
    });
  };

  return (
    <div className="card glass p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[hsl(var(--accent))]" />
        <h2 className="text-lg font-bold">{t('change_password')}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('current_password')}
          </label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('new_password')}
          </label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : done ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            {t('password_changed')}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={submit}
          disabled={isPending || !current || !next}
          className="btn-secondary"
        >
          {isPending ? t('saving') : t('change_password')}
        </button>
      </div>
    </div>
  );
}
