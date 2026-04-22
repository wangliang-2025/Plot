'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme || theme : null;

  return (
    <button
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="btn-ghost relative h-9 w-9 overflow-hidden p-0"
      aria-label="Toggle theme"
    >
      <span
        className="absolute inset-0 grid place-items-center transition-all"
        style={{
          opacity: current === 'dark' ? 0 : 1,
          transform: current === 'dark' ? 'rotate(-90deg) scale(0.6)' : 'rotate(0) scale(1)',
          transitionDuration: 'var(--dur-fluid)',
          transitionTimingFunction: 'var(--ease-fluid)',
        }}
      >
        <Moon className="h-4 w-4" />
      </span>
      <span
        className="absolute inset-0 grid place-items-center transition-all"
        style={{
          opacity: current === 'dark' ? 1 : 0,
          transform: current === 'dark' ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.6)',
          transitionDuration: 'var(--dur-fluid)',
          transitionTimingFunction: 'var(--ease-fluid)',
        }}
      >
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}
