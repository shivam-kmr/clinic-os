import type { ReactNode } from 'react';
import { CookieConsent } from '@/components/CookieConsent';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background scroll-smooth overflow-x-hidden">
      <PublicHeader />
      {children}
      <PublicFooter />
      <CookieConsent />
    </div>
  );
}


