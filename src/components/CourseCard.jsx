import { ArrowRight, Clock3, IndianRupee, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClassName } from './Button';

export default function CourseCard({ course, index }) {
  const courseQuery = encodeURIComponent(course.name);

  return (
    <article className="course-card group flex min-w-0 flex-col border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
          Course {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-mono text-xs text-[var(--text-muted)]" aria-hidden="true">{'</>'}</span>
      </div>

      <h2 className="mt-8 text-2xl font-black leading-tight tracking-[-0.035em] text-[var(--text-strong)] [overflow-wrap:anywhere]">
        {course.name}
      </h2>

      {course.description ? (
        <p className="mt-4 text-sm leading-6 text-[var(--text)] [overflow-wrap:anywhere]">{course.description}</p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          Live learning and practical project work.
        </p>
      )}

      <dl className="mt-7 grid gap-3 border-y border-[var(--border)] py-5 text-sm">
        {course.price ? (
          <div className="flex min-w-0 items-start gap-3">
            <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
            <dt className="sr-only">Price</dt>
            <dd className="font-bold text-[var(--text-strong)] [overflow-wrap:anywhere]">{course.price}</dd>
          </div>
        ) : null}
        {course.duration ? (
          <div className="flex min-w-0 items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
            <dt className="sr-only">Duration</dt>
            <dd className="[overflow-wrap:anywhere]">{course.duration}</dd>
          </div>
        ) : null}
        {course.features ? (
          <div className="flex min-w-0 items-start gap-3">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
            <dt className="sr-only">Features</dt>
            <dd className="[overflow-wrap:anywhere]">{course.features}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto pt-6">
        <Link
          to={`/admission?course=${courseQuery}`}
          className={buttonClassName({ variant: 'secondary', fullWidth: true })}
          aria-label={`Apply for ${course.name}`}
        >
          Apply for this course
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
