import { useMemo, useRef, useState } from 'react';
import { Check, ClipboardCheck, Phone, RotateCcw, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import FormField from '../components/FormField';
import useCourses from '../hooks/useCourses';
import { submitAdmission } from '../services/api';
import { displayText, normalizeCourse } from '../utils/display';

const PAYMENT_OPTIONS = [
  'One Time Payment',
  'Installments (3 Months)',
  'Scholarship',
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  course: '',
  payment: PAYMENT_OPTIONS[0],
  message: '',
};

const inputClassName =
  'min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input)] px-3.5 py-3 text-base text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60';

function validate(form) {
  const errors = {};
  const digits = form.phone.replace(/\D/g, '');

  if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^[\d+()\-\s]+$/.test(form.phone.trim()) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a valid phone number, with country code if needed.';
  }
  if (!form.course) errors.course = 'Choose a course.';
  if (!PAYMENT_OPTIONS.includes(form.payment)) errors.payment = 'Choose a payment option.';
  return errors;
}

function PreviewRow({ label, value }) {
  return (
    <div className="grid min-w-0 gap-1 border-b border-[var(--border)] py-3 last:border-b-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold text-[var(--text-strong)] [overflow-wrap:anywhere]">{value || 'Not entered yet'}</dd>
    </div>
  );
}

export default function AdmissionPage() {
  const [searchParams] = useSearchParams();
  const requestedCourse = searchParams.get('course') || '';
  const { courses, status: courseStatus, error: courseError, retry } = useCourses();
  const normalizedCourses = useMemo(
    () => courses.map(normalizeCourse).filter((course) => course.name),
    [courses],
  );
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    course: requestedCourse,
  }));
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const submitLock = useRef(false);

  const selectedCourse = normalizedCourses.some((course) => course.name === form.course)
    ? form.course
    : '';
  const completedFields = [form.name, form.email, form.phone, selectedCourse].filter((value) => value.trim()).length;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitState.status !== 'idle') setSubmitState({ status: 'idle', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;

    const submissionForm = { ...form, course: selectedCourse };
    const nextErrors = validate(submissionForm);
    setErrors(nextErrors);
    setSubmitState({ status: 'idle', message: '' });

    if (Object.keys(nextErrors).length) {
      const firstInvalidName = Object.keys(nextErrors)[0];
      event.currentTarget.elements.namedItem(firstInvalidName)?.focus();
      return;
    }

    submitLock.current = true;
    setSubmitState({ status: 'loading', message: 'Submitting your application…' });

    try {
      await submitAdmission({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        course: selectedCourse,
        payment: form.payment,
        message: form.message.trim(),
        timestamp: new Date().toISOString(),
      });
      setSubmitState({
        status: 'success',
        message: 'Application submitted successfully. The institute will follow up using the details you provided.',
      });
      setForm(emptyForm);
      setErrors({});
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error?.message || 'The application could not be submitted. Please try again.',
      });
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <div className="page-section">
      <section className="site-container" aria-labelledby="admission-heading">
        <div className="editorial-heading-grid border-b border-[var(--border-strong)] pb-10 sm:pb-12">
          <div>
            <p className="eyebrow">Admission</p>
            <h1 id="admission-heading" className="page-title mt-4">Start with a simple application.</h1>
          </div>
          <div className="max-w-xl lg:justify-self-end lg:pt-9">
            <p className="text-base leading-7 text-[var(--text)] sm:text-lg">
              Tell us what you want to learn. Your details are sent directly to the institute and are not saved in this browser.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <a className="phone-link" href="tel:+919631649865"><Phone className="h-4 w-4" aria-hidden="true" />9631649865</a>
              <a className="phone-link" href="tel:+919279391127"><Phone className="h-4 w-4" aria-hidden="true" />9279391127</a>
            </div>
          </div>
        </div>

        <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] lg:items-start">
          <div className="min-w-0 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-7 lg:p-8">
            <form noValidate onSubmit={handleSubmit} className="grid min-w-0 gap-5" aria-busy={submitState.status === 'loading'}>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <FormField id="admission-name" label="Full name" required error={errors.name}>
                  {(ariaProps) => (
                    <input {...ariaProps} id="admission-name" name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your full name" className={inputClassName} disabled={submitState.status === 'loading'} />
                  )}
                </FormField>
                <FormField id="admission-email" label="Email" required error={errors.email}>
                  {(ariaProps) => (
                    <input {...ariaProps} id="admission-email" name="email" type="email" inputMode="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" className={inputClassName} disabled={submitState.status === 'loading'} />
                  )}
                </FormField>
              </div>

              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <FormField id="admission-phone" label="Phone" required error={errors.phone} hint="Indian and international formats are accepted.">
                  {(ariaProps) => (
                    <input {...ariaProps} id="admission-phone" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={updateField} autoComplete="tel" placeholder="+91 98765 43210" className={inputClassName} disabled={submitState.status === 'loading'} />
                  )}
                </FormField>
                <FormField id="admission-course" label="Course" required error={errors.course}>
                  {(ariaProps) => (
                    <select {...ariaProps} id="admission-course" name="course" value={selectedCourse} onChange={updateField} className={inputClassName} disabled={courseStatus !== 'success' || submitState.status === 'loading'}>
                      <option value="">{courseStatus === 'loading' ? 'Loading courses…' : 'Choose a course'}</option>
                      {normalizedCourses.map((course, index) => (
                        <option key={`${course.id}-${index}`} value={course.name}>{course.name}</option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>

              {courseStatus === 'error' ? (
                <ErrorState compact title="Courses could not be loaded" message={courseError?.message} onRetry={retry} />
              ) : null}

              <fieldset className="min-w-0">
                <legend className="text-sm font-bold text-[var(--text-strong)]">Payment option <span className="text-cyan-600 dark:text-cyan-300" aria-hidden="true">*</span></legend>
                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
                  {PAYMENT_OPTIONS.map((option) => (
                    <label key={option} className="payment-option">
                      <input className="peer sr-only" type="radio" name="payment" value={option} checked={form.payment === option} onChange={updateField} disabled={submitState.status === 'loading'} />
                      <span className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--input)] px-3 py-2.5 text-sm font-semibold text-[var(--text)] peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-[var(--text-strong)] peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500">
                        <Check className={`h-4 w-4 shrink-0 ${form.payment === option ? 'opacity-100' : 'opacity-20'}`} aria-hidden="true" />
                        <span className="[overflow-wrap:anywhere]">{option}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <FormField id="admission-message" label="Message" hint="Optional — share a question or anything that will help the team guide you.">
                {(ariaProps) => (
                  <textarea {...ariaProps} id="admission-message" name="message" value={form.message} onChange={updateField} rows="5" maxLength="1000" placeholder="What would you like to learn?" className={`${inputClassName} resize-y`} disabled={submitState.status === 'loading'} />
                )}
              </FormField>

              <div
                role={submitState.status === 'error' ? 'alert' : 'status'}
                aria-live={submitState.status === 'error' ? 'assertive' : 'polite'}
                className={`min-h-6 text-sm font-semibold leading-6 [overflow-wrap:anywhere] ${
                  submitState.status === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : submitState.status === 'success'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                {submitState.message}
              </div>

              <Button type="submit" fullWidth loading={submitState.status === 'loading'} loadingLabel="Submitting application…">
                <Send className="h-4 w-4" aria-hidden="true" /> Submit application
              </Button>
            </form>
          </div>

          <aside className="min-w-0 border-t-4 border-cyan-500 bg-[var(--surface-muted)] p-5 sm:p-7" aria-labelledby="application-preview-heading">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Application preview</p>
                <h2 id="application-preview-heading" className="mt-3 text-2xl font-black text-[var(--text-strong)]">Check before you send.</h2>
              </div>
              <ClipboardCheck className="h-6 w-6 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
            </div>

            <div className="mt-6">
              <dl>
                <PreviewRow label="Name" value={form.name} />
                <PreviewRow label="Email" value={form.email} />
                <PreviewRow label="Phone" value={form.phone} />
                <PreviewRow label="Course" value={selectedCourse} />
                <PreviewRow label="Payment" value={displayText(form.payment)} />
                <PreviewRow label="Message" value={form.message} />
              </dl>
            </div>

            <div className="mt-6 border-t border-[var(--border-strong)] pt-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-bold text-[var(--text-strong)]">Required details</span>
                <span className="font-mono text-xs text-[var(--text-muted)]">{completedFields}/4 complete</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-[var(--skeleton)]" aria-hidden="true">
                <div className="h-full bg-cyan-500 transition-[width] motion-reduce:transition-none" style={{ width: `${completedFields * 25}%` }} />
              </div>
            </div>

            {Object.values(form).some((value) => value && value !== PAYMENT_OPTIONS[0]) ? (
              <Button
                variant="quiet"
                className="mt-5"
                disabled={submitState.status === 'loading'}
                onClick={() => {
                  if (submitLock.current) return;
                  setForm(emptyForm);
                  setErrors({});
                  setSubmitState({ status: 'idle', message: '' });
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Clear form
              </Button>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
