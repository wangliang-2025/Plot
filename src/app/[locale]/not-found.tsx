import { Link } from '@/i18n/routing';
import { Feather } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-prose flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Feather className="mb-4 h-12 w-12 text-accent" />
      <h1 className="font-serif text-6xl font-bold">404</h1>
      <p className="mt-3 text-muted-foreground">
        Page not found · 页面不存在
      </p>
      <Link href="/" className="btn-accent mt-8">
        Take me home
      </Link>
    </div>
  );
}
