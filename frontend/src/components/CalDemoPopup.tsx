import * as React from 'react';
import { getCalApi } from '@calcom/embed-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { getDemoCalLinkFromEnv } from '@/lib/cal';

const CAL_NAMESPACE = import.meta.env.VITE_CAL_NAMESPACE || '15min';
const CAL_CONFIG = JSON.stringify({ layout: 'month_view', theme: 'light' });

export function CalDemoInit() {
  React.useEffect(() => {
    const calLink = getDemoCalLinkFromEnv();
    if (!calLink) return;

    (async function () {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }, []);

  return null;
}

export const CalDemoButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'onClick'> & { children: React.ReactNode; autoOpen?: boolean }
>(({ children, autoOpen, ...props }, forwardedRef) => {
  const calLink = getDemoCalLinkFromEnv();
  const localRef = React.useRef<HTMLButtonElement | null>(null);
  const openedRef = React.useRef(false);

  if (!calLink) {
    // No redirect fallback (per UX request). Keep CTA but disable it when not configured.
    return (
      <Button {...props} disabled title="Cal.com demo link is not configured">
        {children}
      </Button>
    );
  }

  React.useEffect(() => {
    if (!autoOpen) return;
    if (openedRef.current) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const cal = (window as unknown as { Cal?: { loaded?: boolean } }).Cal;
      if (cal?.loaded && localRef.current) {
        openedRef.current = true;
        localRef.current.click();
        window.clearInterval(timer);
      } else if (attempts >= 12) {
        window.clearInterval(timer);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [autoOpen]);

  return (
    <Button
      {...props}
      ref={(el) => {
        localRef.current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      }}
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={calLink}
      data-cal-config={CAL_CONFIG}
      type="button"
    >
      {children}
    </Button>
  );
});
CalDemoButton.displayName = 'CalDemoButton';


