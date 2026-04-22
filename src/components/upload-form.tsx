'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportResult {
  file: string;
  status: 'ok' | 'error';
  message?: string;
  slug?: string;
}

export function UploadForm({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [publish, setPublish] = useState(true);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles(list.filter((f) => /\.mdx?$/i.test(f.name)));
    setResults([]);
  };

  const submit = () => {
    if (files.length === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('locale', locale);
      fd.append('published', publish ? '1' : '0');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        setResults([{ file: 'upload', status: 'error', message: 'Upload failed' }]);
        return;
      }
      const data = (await res.json()) as { results: ImportResult[] };
      setResults(data.results);
      router.refresh();
    });
  };

  const okCount = results.filter((r) => r.status === 'ok').length;

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div
          className="rounded-lg border-2 border-dashed border-border p-10 text-center transition hover:border-accent/60"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{t('upload_select')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            .md / .mdx · multiple files supported
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.mdx"
            multiple
            className="hidden"
            onChange={onPick}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">{files.length} file(s) selected:</p>
            <ul className="space-y-1 text-sm">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {f.name}
                  <span className="ml-auto text-xs">{(f.size / 1024).toFixed(1)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            {t('publish_now')}
          </label>
          <button
            onClick={submit}
            disabled={isPending || files.length === 0}
            className="btn-accent"
          >
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
            {results.map((r) => (
              <li key={r.file} className="flex items-start gap-2">
                {r.status === 'ok' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0">
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
