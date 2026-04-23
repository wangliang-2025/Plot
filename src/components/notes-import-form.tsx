'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ImportResult {
  file: string;
  status: 'ok' | 'error';
  message?: string;
  slug?: string;
}

export function NotesImportForm({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const tNotes = useTranslations('notes');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [publish, setPublish] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>(
    'private'
  );
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (list: File[]) => {
    const mds = list.filter((f) => /\.mdx?$/i.test(f.name));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...mds.filter((f) => !existing.has(f.name + f.size))];
    });
    setResults([]);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = () => {
    if (files.length === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('locale', locale);
      fd.append('published', publish ? '1' : '0');
      fd.append('visibility', visibility);

      const res = await fetch('/api/notes/import', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        setResults([{ file: 'upload', status: 'error', message: 'Upload failed' }]);
        return;
      }
      const data = (await res.json()) as { results: ImportResult[] };
      setResults(data.results);
      setFiles([]);
      router.refresh();
    });
  };

  const okCount = results.filter((r) => r.status === 'ok').length;

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div
          className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
            dragOver
              ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.05)]'
              : 'border-border hover:border-[hsl(var(--accent))]/60'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{t('upload_select')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tNotes('import_hint')}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.mdx,text/markdown"
            multiple
            className="hidden"
            onChange={onPick}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">
              {tNotes('files_selected', { count: files.length })}
            </p>
            <ul className="space-y-1 text-sm">
              {files.map((f, i) => (
                <li
                  key={f.name + i}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/40 dark:hover:bg-white/5"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {f.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="btn-ghost h-6 w-6 p-0"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {tNotes('import_visibility')}
            </label>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as 'public' | 'private' | 'unlisted')
              }
              className="input"
            >
              <option value="private">{tNotes('filter_private')}</option>
              <option value="unlisted">{tNotes('visibility_unlisted')}</option>
              <option value="public">{tNotes('filter_published')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex w-full items-center gap-2 rounded-xl border border-input bg-white/30 px-3 py-2 text-sm dark:bg-white/5">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--accent))]"
              />
              {t('publish_now')}
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={submit}
            disabled={isPending || files.length === 0}
            className="btn-accent"
          >
            <Upload className="h-4 w-4" />
            {isPending ? t('saving') : t('upload_run')}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="card p-5">
          <p className="mb-3 text-sm font-medium">
            {t('uploaded', { count: okCount })}
          </p>
          <ul className="space-y-1.5 text-sm">
            {results.map((r, i) => (
              <li key={r.file + i} className="flex items-start gap-2">
                {r.status === 'ok' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{r.file}</p>
                  {r.message && (
                    <p className="text-xs text-muted-foreground">{r.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
