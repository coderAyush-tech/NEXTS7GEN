import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClassName } from '../components/Button';

export default function NotFoundPage() {
  return (
    <section className="site-container flex min-h-[60vh] items-center py-20" aria-labelledby="not-found-heading">
      <div className="max-w-2xl border-l-4 border-cyan-500 pl-6 sm:pl-9">
        <p className="eyebrow">404 / Route not found</p>
        <h1 id="not-found-heading" className="page-title mt-4">This page is outside the syllabus.</h1>
        <p className="mt-5 text-base leading-7 text-[var(--text)]">The address may be incomplete or the page may have moved.</p>
        <Link to="/" className={`${buttonClassName()} mt-8`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
        </Link>
      </div>
    </section>
  );
}
