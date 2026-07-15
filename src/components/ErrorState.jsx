import { CircleAlert, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'We could not load this content',
  message,
  onRetry,
  compact = false,
}) {
  return (
    <div
      role="alert"
      className={`border border-red-300/70 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100 ${compact ? 'rounded-lg p-4' : 'rounded-xl p-6 sm:p-8'}`}
    >
      <CircleAlert className="h-6 w-6" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      {message ? <p className="mt-2 max-w-2xl text-sm leading-6 [overflow-wrap:anywhere]">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-5">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
