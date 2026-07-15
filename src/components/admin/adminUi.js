import { ApiError } from '../../services/api.js';

export const INPUT_CLASS =
  'min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input)] px-3.5 py-3 text-base text-[var(--text-strong)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:border-cyan-600 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60';

export const LABEL_CLASS = 'text-sm font-bold text-[var(--text-strong)]';

export const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-500 bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:border-cyan-400 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-60';

export const SECONDARY_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--text-strong)] transition-colors hover:border-cyan-500 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-cyan-300';

export function safeText(value, fallback = 'Not provided') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export function statusMessage(result, fallback) {
  return typeof result?.message === 'string' && result.message.trim()
    ? result.message.trim()
    : fallback;
}

export function actionError(error, fallback) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function loginError(error) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return 'The username or password is incorrect.';
  }
  return actionError(error, 'Login failed. Please try again.');
}
