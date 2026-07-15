import { BookOpenCheck } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import useCourses from '../hooks/useCourses';
import { normalizeCourse } from '../utils/display';

export default function CoursesPage() {
  const { courses, status, error, retry } = useCourses();
  const allNormalizedCourses = courses.map(normalizeCourse);
  const normalizedCourses = allNormalizedCourses.filter((course) => course.name);
  const hasMalformedCourses = courses.length > normalizedCourses.length;

  return (
    <div className="page-section">
      <section className="site-container" aria-labelledby="courses-heading">
        <div className="editorial-heading-grid border-b border-[var(--border-strong)] pb-10 sm:pb-12">
          <div>
            <p className="eyebrow">Course catalogue</p>
            <h1 id="courses-heading" className="page-title mt-4">Choose what you want to build next.</h1>
          </div>
          <div className="max-w-xl lg:justify-self-end lg:pt-9">
            <p className="text-base leading-7 text-[var(--text)] sm:text-lg">
              Learn through live sessions, practical projects, and guided feedback.
              Every listed course comes directly from the institute catalogue.
            </p>
            <div className="mt-5 flex items-start gap-3 border-l-2 border-cyan-500 pl-4 text-sm leading-6 text-[var(--text-muted)]">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
              <span>Courses include a certificate and placement guidance.</span>
            </div>
          </div>
        </div>

        <div className="mt-10" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' ? <LoadingState label="Loading courses" /> : null}
          {status === 'error' ? (
            <ErrorState
              title="The course catalogue is unavailable"
              message={error?.message || 'Please check that the local Spring Boot server is running, then try again.'}
              onRetry={retry}
            />
          ) : null}
          {status === 'success' && courses.length === 0 ? <EmptyState /> : null}
          {status === 'success' && courses.length > 0 && normalizedCourses.length === 0 ? (
            <ErrorState
              title="The course response is not usable"
              message="The server returned course records without valid names. No placeholder courses have been shown."
              onRetry={retry}
            />
          ) : null}
          {status === 'success' && normalizedCourses.length > 0 ? (
            <>
              {hasMalformedCourses ? (
                <p role="status" className="mb-5 border-l-2 border-amber-500 pl-4 text-sm leading-6 text-[var(--text)]">
                  Some malformed course records were omitted for safety.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {normalizedCourses.map((course, index) => (
                  <CourseCard key={`${course.id}-${index}`} course={course} index={index} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
