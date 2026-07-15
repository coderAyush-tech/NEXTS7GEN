import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoursesPage from './CoursesPage';
import useCourses from '../hooks/useCourses';

vi.mock('../hooks/useCourses', () => ({ default: vi.fn() }));

const retry = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <CoursesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  retry.mockReset();
  useCourses.mockReset();
});

describe('CoursesPage', () => {
  it('announces the loading state while the catalogue request is pending', () => {
    useCourses.mockReturnValue({
      courses: [],
      status: 'loading',
      error: null,
      retry,
    });

    renderPage();

    expect(screen.getByRole('status', { name: 'Loading courses' })).toBeInTheDocument();
    expect(screen.getByText('Loading courses…')).toBeInTheDocument();
  });

  it('renders successful backend data as text and carries the course into the admission link', () => {
    const unsafeName = '"><img src=x onerror=alert(1)>';
    const unsafeDescription = '<script>window.studentDataStolen=true</script>';
    useCourses.mockReturnValue({
      courses: [{
        id: 'course-1',
        name: unsafeName,
        price: '₹29,999',
        duration: '40+ hrs',
        features: 'Live sessions & projects',
        description: unsafeDescription,
      }],
      status: 'success',
      error: null,
      retry,
    });

    const { container } = renderPage();

    expect(screen.getByRole('heading', { name: unsafeName })).toBeInTheDocument();
    expect(screen.getByText(unsafeDescription)).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Apply for ${unsafeName}` }))
      .toHaveAttribute('href', `/admission?course=${encodeURIComponent(unsafeName)}`);
  });

  it('shows the deliberate empty state for an empty successful response', () => {
    useCourses.mockReturnValue({
      courses: [],
      status: 'success',
      error: null,
      retry,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'No courses are available yet' })).toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
  });

  it('rejects a wholly malformed successful response and allows retry', () => {
    useCourses.mockReturnValue({
      courses: [null, 'not a course', {}, { name: '   ' }],
      status: 'success',
      error: null,
      retry,
    });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('The course response is not usable');
    expect(screen.getByRole('alert')).toHaveTextContent('without valid names');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('omits malformed records when at least one safe course remains', () => {
    useCourses.mockReturnValue({
      courses: [{ id: 1, name: 'React Foundations' }, null, { price: '₹1' }],
      status: 'success',
      error: null,
      retry,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'React Foundations' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Some malformed course records were omitted for safety.');
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('shows a helpful request error and retries through the hook', () => {
    useCourses.mockReturnValue({
      courses: [],
      status: 'error',
      error: new Error('Backend is offline'),
      retry,
    });

    renderPage();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The course catalogue is unavailable');
    expect(alert).toHaveTextContent('Backend is offline');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
