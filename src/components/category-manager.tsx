'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Folder, Plus, Trash2, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  count: number;
  ownerId: string | null;
}

const PRESET_COLORS = [
  '#7c5cff', // violet
  '#5c8aff', // blue
  '#5cd6ff', // cyan
  '#5cffaa', // mint
  '#ffd45c', // amber
  '#ff7c5c', // coral
  '#ff5c9e', // pink
  '#b35cff', // purple
];

export function CategoryManager({ initial }: { initial: Category[] }) {
  const t = useTranslations('categories');
  const router = useRouter();
  const [items, setItems] = useState(initial);
  // Keep local state in sync with server-rendered initial prop after router.refresh().
  // Without this, newly-created or deleted categories reflected in server data
  // wouldn't update the client view once this component has mounted.
  useEffect(() => {
    setItems(initial);
  }, [initial]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const create = () => {
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description: description || null, color }),
      });
      if (!res.ok) {
        setError('Create failed');
        return;
      }
      const { category } = (await res.json()) as { category: Category };
      setItems([...items, { ...category, count: 0 }]);
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setCreating(false);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm(t('delete_confirm'))) return;
    startTransition(async () => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter((i) => i.id !== id));
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Existing */}
      {items.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground">{t('no_categories')}</div>
      ) : (
        <div className="card glass space-y-1 p-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/40 dark:hover:bg-white/5"
            >
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                style={{
                  background: c.color
                    ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                    : 'hsl(var(--accent))',
                }}
              >
                <Folder className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                {c.description && (
                  <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{c.count}</span>
              {c.ownerId && (
                <button
                  onClick={() => remove(c.id)}
                  disabled={isPending}
                  className="btn-ghost h-8 w-8 p-0 text-destructive opacity-0 transition group-hover:opacity-100"
                  title={t('delete_confirm')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      {creating ? (
        <div className="card glass-strong space-y-3 p-5">
          <h3 className="text-sm font-bold">{t('create')}</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name')}
            className="input"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('description')}
            className="textarea min-h-[60px]"
          />
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              {t('color')}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                    borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent',
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={create}
              disabled={isPending || !name.trim()}
              className="btn-accent"
            >
              <Save className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="card card-hover flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-muted-foreground transition hover:text-[hsl(var(--accent))]"
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </button>
      )}
    </div>
  );
}
