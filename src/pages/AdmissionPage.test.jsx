import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdmissionPage from './AdmissionPage';
import useCourses from '../hooks/useCourses';
import { submitAdmission } from '../services/api';

vi.mock('../hooks/useCourses', () => ({ default: vi.fn() }));
vi.mock('../services/api', () => ({ submitAdmission: vi.fn() }));

const retry = vi.fn();
const courses = [
  { id: 1, name: 'React & Node' },
  { id: 2, name: 'Java Full Stack' },
];

function renderPage(initialEntry = '/admission') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdmissionPage />
    </MemoryRouter>,
  );
}

async function completeValidForm(user, overrides = {}) {
  const values = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+91 98765 43210',
    course: 'Java Full Stack',
    message: 'Please share the next batch date.',
    ...overrides,
  };

  await user.type(screen.getByLabelText(/full name/i), values.name);
  await user.type(screen.getByLabelText(/^email/i), values.email);
  await user.type(screen.getByLabelText(/^phone/i), values.phone);
  await user.selectOptions(screen.getByLabelText(/^course/i), values.course);
  if (values.message) await user.type(screen.getByLabelText(/^message/i), values.message);
}

beforeEach(() => {
  retry.mockReset();
  useCourses.mockReset();
  submitAdmission.mockReset();
  useCourses.mockReturnValue({
    courses,
    status: 'success',
    error: null,
    retry,
  });
});

describe('AdmissionPage accessibility and course loading', () => {
  it('connects every visible form label and reports validation errors on its controls', async () => {
    const user = userEvent.setup();
    renderPage();

    const name = screen.getByLabelText(/full name/i);
    const email = screen.getByLabelText(/^email/i);
    const phone = screen.getByLabelText(/^phone/i);
    const course = screen.getByLabelText(/^course/i);
    const message = screen.getByLabelText(/^message/i);

    expect(name).toHaveAttribute('name', 'name');
    expect(email).toHaveAttribute('name', 'email');
    expect(phone).toHaveAttribute('name', 'phone');
    expect(course).toHaveAttribute('name', 'course');
    expect(message).toHaveAttribute('name', 'message');
    expect(name).toHaveAttribute('aria-required', 'true');
    expect(email).toHaveAttribute('aria-required', 'true');
    expect(phone).toHaveAttribute('aria-required', 'true');
    expect(course).toHaveAttribute('aria-required', 'true');
    expect(message).not.toHaveAttribute('aria-required');
    expect(screen.getByRole('group', { name: /payment option/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    expect(await screen.findByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number, with country code if needed.')).toBeInTheDocument();
    expect(screen.getByText('Choose a course.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'admission-name-error');
    expect(submitAdmission).not.toHaveBeenCalled();
  });

  it('preselects an exact course supplied by the enrolment query string', async () => {
    renderPage('/admission?course=React%20%26%20Node');

    await waitFor(() => {
      expect(screen.getByLabelText(/^course/i)).toHaveValue('React & Node');
    });
  });

  it('shows the course error, disables selection, and calls the hook retry', async () => {
    const user = userEvent.setup();
    useCourses.mockReturnValue({
      courses: [],
      status: 'error',
      error: new Error('Catalogue request failed'),
      retry,
    });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Courses could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('Catalogue request failed');
    expect(screen.getByLabelText(/^course/i)).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe('AdmissionPage submission', () => {
  it('posts the exact fields and timestamp once without writing student PII to localStorage', async () => {
    const user = userEvent.setup();
    const timestamp = '2026-07-15T07:30:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(timestamp);
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
    submitAdmission.mockResolvedValue({ message: 'Received' });
    renderPage();

    await completeValidForm(user, {
      name: '  Ada Lovelace  ',
      email: '  ada@example.com  ',
      phone: '  +91 98765 43210  ',
      message: '  Please share the next batch date.  ',
    });
    await user.click(screen.getByRole('radio', { name: 'Scholarship' }));
    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    await waitFor(() => expect(submitAdmission).toHaveBeenCalledOnce());
    expect(submitAdmission).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+91 98765 43210',
      course: 'Java Full Stack',
      payment: 'Scholarship',
      message: 'Please share the next batch date.',
      timestamp,
    });
    expect(await screen.findByText(/application submitted successfully/i)).toBeInTheDocument();
    expect(storageWrite).not.toHaveBeenCalled();
    expect(window.localStorage).toHaveLength(0);
  });

  it('prevents a second submission while the first request is still pending', async () => {
    const user = userEvent.setup();
    let resolveRequest;
    submitAdmission.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    renderPage();
    await completeValidForm(user);

    const submitButton = screen.getByRole('button', { name: 'Submit application' });
    const form = submitButton.closest('form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(submitAdmission).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submitting application…' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Clear form' })).toBeDisabled();

    await act(async () => {
      resolveRequest({ message: 'Received' });
    });
    expect(await screen.findByText(/application submitted successfully/i)).toBeInTheDocument();
  });

  it('shows the backend failure and never reports a false success', async () => {
    const user = userEvent.setup();
    submitAdmission.mockRejectedValue(new Error('Admissions are temporarily closed'));
    renderPage();
    await completeValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Admissions are temporarily closed');
    expect(screen.queryByText(/application submitted successfully/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Ada Lovelace');
  });
});
