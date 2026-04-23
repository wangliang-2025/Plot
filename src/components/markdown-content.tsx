'use client';

import { useEffect, useRef } from 'react';

interface MarkdownContentProps {
  html: string;
}

/**
 * Renders pre-sanitized markdown HTML, and progressively enhances each image
 * with a graceful onerror fallback so that broken external images (CORS,
 * hotlink protection, expired CDN, etc.) do not leave an awkward empty box
 * in the middle of the article.
 */
export function MarkdownContent({ html }: MarkdownContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const imgs = root.querySelectorAll<HTMLImageElement>('img.md-img');
    imgs.forEach((img) => {
      // If the image fails to load, swap in a placeholder link so the reader
      // still sees the alt-text and can click through to the original URL.
      const onError = () => {
        const src = img.getAttribute('data-img-src') || img.src;
        const alt = img.alt || 'image';
        const holder = document.createElement('a');
        holder.className = 'md-img-broken';
        holder.href = src;
        holder.target = '_blank';
        holder.rel = 'noreferrer';
        holder.textContent = `🖼  ${alt} (source unavailable — open original)`;
        img.replaceWith(holder);
      };

      if (img.complete && img.naturalWidth === 0 && img.src) {
        onError();
      } else {
        img.addEventListener('error', onError, { once: true });
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="article"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
