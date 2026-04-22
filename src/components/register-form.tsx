'use client';

import { signIn } from 'next-auth/react';
import { Link, useRouter } from '@/i18n/routing';
import { useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, UserPlus } from 'lucide-react';

export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('password_too_short'));
      return;
    }
    if (password !== confirm) {
      setError(t('password_mismatch'));
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === 'email_exists') setError(t('email_exists'));
        else setError(t('register_failed'));
        return;
      }
      // Auto-login after register
      const login = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push('/login');
        return;
      }
      router.push('/notes');
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="card glass-strong relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-3))] opacity-30 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white shadow-lg shadow-[hsl(var(--aurora-1)/0.4)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold gradient-text">{t('register_title')}</h1>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">{t('register_subtitle')}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('name')}
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('password')}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('confirm_password')}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn-accent w-full">
              <UserPlus className="h-4 w-4" />
              {isPending ? t('signing_up') : t('sign_up')}
            </button>

            <p className="pt-1 text-center text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-[hsl(var(--accent))]">
                {t('to_login')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
