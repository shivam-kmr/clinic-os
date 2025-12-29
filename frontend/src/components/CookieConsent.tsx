import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type ConsentMode = 'all' | 'custom';

type StoredConsentV1 = {
  version: 1;
  mode: ConsentMode;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

type StoredConsentV2 = {
  version: 2;
  mode: ConsentMode;
  necessary: true;
  functional: boolean;
  performance: boolean;
  targeting: boolean;
  timestamp: number;
};

type NormalizedConsent = {
  mode: ConsentMode;
  necessary: true;
  functional: boolean;
  performance: boolean;
  targeting: boolean;
  timestamp: number;
};

const STORAGE_KEY = 'clinicos_cookie_consent_v1';
const SESSION_DISMISS_KEY = 'clinicos_cookie_consent_dismissed_v1';
const COOKIE_NAME = 'clinicos_cookie_consent';

function safeStorageGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeStorageSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // ignore storage failures (e.g., strict private mode)
  }
}

function readStoredConsent(): NormalizedConsent | null {
  try {
    const raw = safeStorageGet(localStorage, STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsentV1 | StoredConsentV2;
    if (parsed?.necessary !== true) return null;
    if (parsed?.mode !== 'all' && parsed?.mode !== 'custom') return null;
    if (typeof (parsed as any)?.timestamp !== 'number') return null;

    // Backward compatible with older shape (analytics/marketing)
    if ((parsed as any)?.version === 1) {
      const v1 = parsed as StoredConsentV1;
      if (typeof v1.analytics !== 'boolean') return null;
      if (typeof v1.marketing !== 'boolean') return null;
      return {
        mode: v1.mode,
        necessary: true,
        functional: true,
        performance: v1.analytics,
        targeting: v1.marketing,
        timestamp: v1.timestamp,
      };
    }

    if ((parsed as any)?.version === 2) {
      const v2 = parsed as StoredConsentV2;
      if (typeof v2.functional !== 'boolean') return null;
      if (typeof v2.performance !== 'boolean') return null;
      if (typeof v2.targeting !== 'boolean') return null;
      return {
        mode: v2.mode,
        necessary: true,
        functional: v2.functional,
        performance: v2.performance,
        targeting: v2.targeting,
        timestamp: v2.timestamp,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

export function CookieConsent({
  className,
  privacyPolicyUrl = 'https://asset.splitpe.in/privacy.html',
  termsUrl = 'https://asset.splitpe.in/terms.html',
}: {
  className?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [performance, setPerformance] = useState(true);
  const [targeting, setTargeting] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'your-privacy' | 'necessary' | 'functional' | 'performance' | 'targeting'
  >('your-privacy');

  const hasStoredConsent = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return !!readStoredConsent();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasStoredConsent) return;
    if (safeStorageGet(sessionStorage, SESSION_DISMISS_KEY) === '1') return;
    setVisible(true);
  }, [hasStoredConsent]);

  useEffect(() => {
    if (!prefsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrefsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prefsOpen]);

  const persistConsent = (
    mode: ConsentMode,
    next: { functional: boolean; performance: boolean; targeting: boolean }
  ) => {
    const consent: StoredConsentV2 = {
      version: 2,
      mode,
      necessary: true,
      functional: next.functional,
      performance: next.performance,
      targeting: next.targeting,
      timestamp: Date.now(),
    };

    safeStorageSet(localStorage, STORAGE_KEY, JSON.stringify(consent));
    const cookieValue =
      mode === 'all'
        ? 'all'
        : `custom:f=${next.functional ? 1 : 0}&p=${next.performance ? 1 : 0}&t=${next.targeting ? 1 : 0}`;
    // 180 days
    writeCookie(COOKIE_NAME, cookieValue, 60 * 60 * 24 * 180);

    safeStorageSet(sessionStorage, SESSION_DISMISS_KEY, '1');
    setPrefsOpen(false);
    setVisible(false);
  };

  const acceptAll = () => persistConsent('all', { functional: true, performance: true, targeting: true });
  const confirmChoices = () => persistConsent('custom', { functional, performance, targeting });

  const dismiss = () => {
    safeStorageSet(sessionStorage, SESSION_DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className={cn('fixed inset-x-0 bottom-0 z-[60] p-3 md:p-4', className)}>
        <div className="mx-auto max-w-5xl rounded-2xl border bg-background shadow-lg">
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-sm text-foreground">
                We use cookies to improve your experience and analyze site traffic. See our{' '}
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const existing = readStoredConsent();
                  if (existing) {
                    setFunctional(existing.functional);
                    setPerformance(existing.performance);
                    setTargeting(existing.targeting);
                  }
                  setActiveTab('your-privacy');
                  setPrefsOpen(true);
                }}
              >
                Preferences
              </Button>
              <Button onClick={acceptAll}>Accept all</Button>
              <button
                type="button"
                onClick={dismiss}
                className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background hover:bg-muted"
                aria-label="Dismiss cookie banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {prefsOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 md:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPrefsOpen(false);
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div className="text-2xl font-semibold text-foreground">Privacy Preference Center</div>
              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-muted hover:opacity-90"
                aria-label="Close preference center"
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex max-h-[70vh] flex-col md:flex-row">
              {/* Sidebar */}
              <div className="w-full border-b bg-background md:w-72 md:border-b-0 md:border-r">
                <div className="p-3 md:p-4">
                  <div className="space-y-2">
                    {(
                      [
                        { id: 'your-privacy', label: 'Your Privacy' },
                        { id: 'necessary', label: 'Strictly Necessary Cookies' },
                        { id: 'functional', label: 'Functional Cookies' },
                        { id: 'performance', label: 'Performance Cookies' },
                        { id: 'targeting', label: 'Targeting Cookies' },
                      ] as const
                    ).map((item) => {
                      const selected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            'w-full rounded-md border p-4 text-left transition-colors',
                            selected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                          )}
                        >
                          <div className="text-base font-semibold text-foreground">{item.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8">
                {activeTab === 'your-privacy' ? (
                  <div className="space-y-4">
                    <div className="text-xl font-semibold text-foreground">Your Privacy</div>
                    <p className="text-sm text-muted-foreground">
                      When you visit our site, we may store or retrieve information in your browser, mostly in the form of cookies.
                      This information might be about you, your preferences, or your device and is mostly used to make the site work as you expect it to.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can choose to allow or block some types of cookies. Blocking some types of cookies may impact your experience and the services we are able to offer.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Learn more in our{' '}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-4 hover:opacity-90"
                      >
                        Privacy Policy
                      </a>{' '}
                      and{' '}
                      <a
                        href={termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline underline-offset-4 hover:opacity-90"
                      >
                        Terms of Service
                      </a>
                      .
                    </div>
                  </div>
                ) : null}

                {activeTab === 'necessary' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-foreground">Strictly Necessary Cookies</div>
                        <div className="text-sm text-muted-foreground">
                          These cookies are required for the website to function and cannot be switched off.
                        </div>
                      </div>
                      <Switch checked disabled aria-label="Strictly necessary cookies always enabled" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences,
                      logging in, or filling in forms.
                    </p>
                  </div>
                ) : null}

                {activeTab === 'functional' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-foreground">Functional Cookies</div>
                        <div className="text-sm text-muted-foreground">
                          These cookies enable enhanced functionality and personalization.
                        </div>
                      </div>
                      <Switch
                        checked={functional}
                        onChange={(e) => setFunctional(e.currentTarget.checked)}
                        aria-label="Functional cookies"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies,
                      some or all of these services may not function properly.
                    </p>
                  </div>
                ) : null}

                {activeTab === 'performance' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-foreground">Performance Cookies</div>
                        <div className="text-sm text-muted-foreground">
                          These cookies allow us to count visits and traffic sources to measure and improve performance.
                        </div>
                      </div>
                      <Switch
                        checked={performance}
                        onChange={(e) => setPerformance(e.currentTarget.checked)}
                        aria-label="Performance cookies"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      They help us know which pages are the most and least popular and see how visitors move around the site.
                      All information these cookies collect is aggregated and therefore anonymous.
                    </p>
                  </div>
                ) : null}

                {activeTab === 'targeting' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-foreground">Targeting Cookies</div>
                        <div className="text-sm text-muted-foreground">
                          These cookies may be set through our site by our advertising partners.
                        </div>
                      </div>
                      <Switch
                        checked={targeting}
                        onChange={(e) => setTargeting(e.currentTarget.checked)}
                        aria-label="Targeting cookies"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                      They do not store directly personal information, but are based on uniquely identifying your browser and internet device.
                      If you do not allow these cookies, you will experience less targeted advertising.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t p-5">
              <Button onClick={confirmChoices} className="px-8">
                Confirm My Choices
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


