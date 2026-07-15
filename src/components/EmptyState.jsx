import { BookOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No courses are available yet',
  description = 'The course catalogue is empty. Please check again soon.',
}) {
  return (
    <div className="border-y border-[var(--border)] py-16 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-black text-[var(--text-strong)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text)]">{description}</p>
    </div>
  );
}
