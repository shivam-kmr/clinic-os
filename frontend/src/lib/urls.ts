export const APP_BASE_URL: string =
  (import.meta.env.VITE_APP_BASE_URL as string | undefined) || 'https://app.useclinicos.com';

export const MARKETING_BASE_URL: string =
  (import.meta.env.VITE_MARKETING_BASE_URL as string | undefined) || 'https://useclinicos.com';

export const APP_LOGIN_URL = `${APP_BASE_URL}/login`;


