import { CheckCircle2, CircleAlert, X } from 'lucide-react';

export default function Toast({ message, tone = 'success', onDismiss }) {
  if (!message) return null;

  const success = tone === 'success';
  const Icon = success ? CheckCircle2 : CircleAlert;

  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
      className={`fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-lg items-start gap-3 rounded-xl border p-4 shadow-xl sm:inset-x-auto sm:right-5 sm:bottom-5 ${
        success
          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50'
          : 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-50'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-semibold leading-6 [overflow-wrap:anywhere]">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
