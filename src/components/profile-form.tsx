'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Save, User as UserIcon, Check } from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  image: string | null;
}

export function ProfileForm({ initial }: { initial: UserData }) {
  const t = useTranslations('profile');
  const [user, setUser] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          displayName: user.displayName,
          bio: user.bio,
          website: user.website,
          location: user.location,
          image: user.image,
        }),
      });
      if (!res.ok) {
        setError('Save failed');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    });
  };

  const update = (k: keyof UserData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setUser({ ...user, [k]: e.target.value });

  return (
    <div className="card glass p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white">
          {user.image ? (
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-7 w-7" />
          )}
        </div>
        <div>
          <p className="text-base font-bold">{user.displayName || user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('display_name')}
          </label>
          <input
            value={user.displayName ?? ''}
            onChange={update('displayName')}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('name')}
          </label>
          <input value={user.name ?? ''} onChange={update('name')} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('avatar')}
          </label>
          <input
            value={user.image ?? ''}
            onChange={update('image')}
            className="input"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('website')}
          </label>
          <input
            type="url"
            value={user.website ?? ''}
            onChange={update('website')}
            className="input"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('location')}
          </label>
          <input
            value={user.location ?? ''}
            onChange={update('location')}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('bio')}
          </label>
          <textarea
            value={user.bio ?? ''}
            onChange={update('bio')}
            className="textarea"
            rows={4}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : saved ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            {t('saved')}
          </p>
        ) : (
          <span />
        )}
        <button onClick={submit} disabled={isPending} className="btn-accent">
          <Save className="h-4 w-4" />
          {isPending ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
