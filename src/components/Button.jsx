import { LoaderCircle } from 'lucide-react';

export function buttonClassName({ variant = 'primary', fullWidth = false } = {}) {
  const variants = {
    primary:
      'border-cyan-500 bg-cyan-500 text-slate-950 hover:border-cyan-400 hover:bg-cyan-400',
    secondary:
      'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-strong)] hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300',
    quiet:
      'border-transparent bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]',
    danger:
      'border-red-500/50 bg-transparent text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40',
  };

  return [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-55',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)]',
    variants[variant] || variants.primary,
    fullWidth ? 'w-full' : '',
  ].join(' ');
}

export default function Button({
  children,
  loading = false,
  loadingLabel = 'Working…',
  variant = 'primary',
  fullWidth = false,
  disabled,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${buttonClassName({ variant, fullWidth })} ${className}`}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
      {loading ? loadingLabel : children}
    </button>
  );
}
