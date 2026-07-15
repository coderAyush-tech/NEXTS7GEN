export default function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-[var(--text-strong)]">
        {label}
        {required ? <span className="ml-1 text-cyan-600 dark:text-cyan-300" aria-hidden="true">*</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {typeof children === 'function'
          ? children({
            'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
            'aria-invalid': Boolean(error),
            'aria-required': required || undefined,
          })
        : children}
      {hint ? <p id={hintId} className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
      {error ? <p id={errorId} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
