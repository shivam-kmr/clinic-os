export function toCalLink(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';

  // Accept either:
  // - full URL: https://cal.com/handle/event
  // - calLink: handle/event
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const u = new URL(raw);
      return u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  return raw.replace(/^\/+/, '').replace(/\/+$/, '');
}

export function getDemoCalLinkFromEnv(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = (import.meta as any).env?.VITE_CAL_DEMO_URL || '';
  return toCalLink(url);
}



