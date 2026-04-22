'use client';

import { useRouter } from '@/i18n/routing';
import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

interface Props {
  initialQuery?: string;
  placeholder?: string;
}

export function SearchInput({ initialQuery = '', placeholder }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push({ pathname: '/search', query: q ? { q } : {} });
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input h-14 rounded-2xl pl-11 text-base"
      />
    </form>
  );
}
