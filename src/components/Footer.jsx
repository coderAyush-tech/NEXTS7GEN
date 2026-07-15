import { ArrowUpRight, LockKeyhole, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="site-container grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="max-w-md">
          <Logo link={false} priority={false} />
          <p className="mt-5 text-sm leading-6 text-[var(--text)]">
            Practical coding education built around live learning, real projects,
            thoughtful feedback, and interview preparation.
          </p>
        </div>

        <div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Explore</h2>
          <nav className="mt-4 grid gap-1" aria-label="Footer navigation">
            {[
              ['Courses', '/courses'],
              ['About', '/about'],
              ['Admission', '/admission'],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:text-cyan-300">
                {label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Enquiry</h2>
          <div className="mt-4 grid gap-1">
            <a href="tel:+919631649865" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:text-cyan-300">
              <Phone className="h-4 w-4" aria-hidden="true" /> 9631649865
            </a>
            <a href="tel:+919279391127" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:text-cyan-300">
              <Phone className="h-4 w-4" aria-hidden="true" /> 9279391127
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="site-container flex flex-col gap-3 py-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Next7Gen Institute of Technology.</p>
          <Link to="/admin" className="inline-flex min-h-11 items-center gap-2 self-start rounded-md px-2 font-semibold hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:self-auto">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Admin access
          </Link>
        </div>
      </div>
    </footer>
  );
}
