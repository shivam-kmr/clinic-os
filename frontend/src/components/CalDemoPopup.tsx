import * as React from 'react';
import { getCalApi } from '@calcom/embed-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { getDemoCalLinkFromEnv } from '@/lib/cal';

const CAL_NAMESPACE = import.meta.env.VITE_CAL_NAMESPACE || '15min';
const CAL_CONFIG = JSON.stringify({ layout: 'month_view', theme: 'light' });

type CalWindow = {
  Cal?: {
    loaded?: boolean;
  };
};

function isCalLoaded() {
  return (window as unknown as CalWindow).Cal?.loaded === true;
}

let calInitPromise: Promise<void> | null = null;

async function ensureCalInitialized() {
  const calLink = getDemoCalLinkFromEnv();
  if (!calLink) return;

  if (!calInitPromise) {
    calInitPromise = (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }

  await calInitPromise;
}

async function waitForCalLoaded({ maxWaitMs }: { maxWaitMs: number }) {
  const startedAt = Date.now();
  while (!isCalLoaded() && Date.now() - startedAt < maxWaitMs) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => window.setTimeout(r, 50));
  }
}

export function CalDemoInit() {
  React.useEffect(() => {
    const calLink = getDemoCalLinkFromEnv();
    if (!calLink) return;

    // Defer loading the embed until the browser is idle to reduce main-thread contention on first paint.
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const cancelRic = window.cancelIdleCallback ?? ((id: number) => window.clearTimeout(id));

    const id = ric(() => {
      void ensureCalInitialized();
    });

    return () => cancelRic(id as unknown as number);
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
  const bypassNextClickRef = React.useRef(false);

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

    void (async () => {
      await ensureCalInitialized();
      await waitForCalLoaded({ maxWaitMs: 3500 });
      if (localRef.current && !openedRef.current) {
        openedRef.current = true;
        // Allow the Cal embed listener to handle the click.
        bypassNextClickRef.current = true;
        localRef.current.click();
      }
    })();
  }, [autoOpen]);

  return (
    <Button
      {...props}
      ref={(el) => {
        localRef.current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      }}
      onPointerEnter={() => {
        // Prime the embed on intent to interact (so the modal feels instant).
        void ensureCalInitialized();
      }}
      onFocus={() => {
        void ensureCalInitialized();
      }}
      onClickCapture={(e) => {
        if (bypassNextClickRef.current) {
          bypassNextClickRef.current = false;
          return;
        }

        // If Cal isn't loaded yet, prevent the click, load Cal, then re-trigger the click once ready.
        if (!isCalLoaded()) {
          e.preventDefault();
          e.stopPropagation();
          void (async () => {
            await ensureCalInitialized();
            await waitForCalLoaded({ maxWaitMs: 3500 });
            if (localRef.current) {
              bypassNextClickRef.current = true;
              localRef.current.click();
            }
          })();
        }
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


