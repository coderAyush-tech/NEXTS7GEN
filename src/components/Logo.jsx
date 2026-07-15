import { Link } from 'react-router-dom';
import logoImage from '../../logo.jpeg';

export default function Logo({ compact = false, link = true, priority = true }) {
  const content = (
    <>
      <span className="logo-frame">
        <img
          src={logoImage}
          width="1254"
          height="830"
          alt="Next7Gen official logo"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className="h-auto w-full"
        />
      </span>
      <span aria-hidden="true" className={compact ? 'sr-only' : 'min-w-0 leading-none'}>
        <span className="block text-[0.98rem] font-black tracking-[-0.035em] text-[var(--text-strong)] sm:text-[1.08rem]">
          NEXT7GEN
        </span>
        <span className="mt-1 block font-mono text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Institute of Technology
        </span>
      </span>
    </>
  );

  if (!link) return <span className="inline-flex items-center gap-3">{content}</span>;

  return (
    <Link
      to="/"
      className="inline-flex min-h-11 min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--page)]"
      aria-label="Next7Gen home"
    >
      {content}
    </Link>
  );
}
