export default function LoadingState({ count = 3, label = 'Loading content' }) {
  return (
    <div role="status" aria-label={label} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="min-h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 motion-reduce:animate-none"
          aria-hidden="true"
        >
          <div className="h-3 w-20 rounded bg-[var(--skeleton)]" />
          <div className="mt-7 h-7 w-3/4 rounded bg-[var(--skeleton)]" />
          <div className="mt-4 h-4 w-full rounded bg-[var(--skeleton)]" />
          <div className="mt-2 h-4 w-5/6 rounded bg-[var(--skeleton)]" />
          <div className="mt-10 h-11 w-full rounded-lg bg-[var(--skeleton)]" />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
