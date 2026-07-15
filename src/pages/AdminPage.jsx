import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  addCourse,
  createAdmin,
  deleteAdmin as removeAdmin,
  deleteCourse as removeCourse,
  fetchAdmins,
  fetchCourses,
} from '../services/api.js';

const EMPTY_COURSE = Object.freeze({
  name: '',
  price: '',
  duration: '',
  features: '',
  description: '',
});

const EMPTY_ADMIN = Object.freeze({ username: '', password: '' });

const INPUT_CLASS =
  'min-h-12 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input)] px-3.5 py-3 text-base text-[var(--text-strong)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:border-cyan-600 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60';
const LABEL_CLASS = 'text-sm font-bold text-[var(--text-strong)]';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-500 bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:border-cyan-400 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-60';
const SECONDARY_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--text-strong)] transition-colors hover:border-cyan-500 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-cyan-300';

function safeText(value, fallback = 'Not provided') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function statusMessage(result, fallback) {
  return typeof result?.message === 'string' && result.message.trim()
    ? result.message.trim()
    : fallback;
}

function actionError(error, fallback) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function loginError(error) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return 'The username or password is incorrect.';
  }
  return actionError(error, 'Login failed. Please try again.');
}

function sessionNoticeText(notice) {
  if (typeof notice === 'string') return notice.trim();
  if (typeof notice?.message === 'string') return notice.message.trim();
  return '';
}

function sessionNoticeIsSuccess(notice) {
  return typeof notice === 'object' && notice?.tone === 'success';
}

function StatusMessage({ id, status, className = '' }) {
  if (!status?.message) return null;

  const isError = status.type === 'error';
  const isLoading = status.type === 'loading';
  const Icon = isError ? AlertCircle : isLoading ? LoaderCircle : CheckCircle2;

  return (
    <div
      id={id}
      className={`flex min-w-0 items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? 'border-red-300/70 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
          : isLoading
            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200'
            : 'border-green-300/70 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200'
      } ${className}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${isLoading ? 'animate-spin motion-reduce:animate-none' : ''}`}
        aria-hidden="true"
      />
      <span className="min-w-0 [overflow-wrap:anywhere]">{status.message}</span>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  autoComplete,
  disabled,
  visible,
  onToggle,
}) {
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0 space-y-2">
      <label className={LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <div className="relative min-w-0">
        <input
          id={id}
          name={name}
          className={`${INPUT_CLASS} pr-14 ${error ? 'border-red-500' : ''}`}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          required
        />
        <button
          className="absolute right-1 top-1 inline-flex size-11 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ConfirmDialog({ action, busy, error, onCancel, onConfirm }) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;

    if (event.shiftKey && event.target === cancelRef.current) {
      event.preventDefault();
      confirmRef.current?.focus();
    } else if (!event.shiftKey && event.target === confirmRef.current) {
      event.preventDefault();
      cancelRef.current?.focus();
    }
  }

  const itemType = action.kind === 'course' ? 'course' : 'administrator';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#071421]/80 p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        onKeyDown={handleKeyDown}
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <Trash2 className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-black tracking-tight text-[var(--text-strong)]">
              Delete {itemType}?
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--text)]">
              <span className="font-semibold text-[var(--text-strong)] [overflow-wrap:anywhere]">{action.label}</span>{' '}
              will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>

        <StatusMessage
          status={error ? { type: 'error', message: error } : null}
          className="mt-5"
        />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            ref={cancelRef}
            className={SECONDARY_BUTTON_CLASS}
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            Keep {itemType}
          </button>
          <button
            ref={confirmRef}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-600 px-4 py-2.5 font-bold text-white transition-colors hover:border-red-500 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Trash2 className="size-5" aria-hidden="true" />
            )}
            {busy ? 'Deleting…' : `Delete ${itemType}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const {
    session,
    login,
    logout,
    sessionMessage,
    clearSessionMessage,
  } = useAuth();

  const loginId = useId();
  const courseId = useId();
  const adminId = useId();
  const lastDeleteTrigger = useRef(null);
  const courseListHeading = useRef(null);
  const adminListHeading = useRef(null);
  const loginSubmitLock = useRef(false);
  const courseSubmitLock = useRef(false);
  const adminSubmitLock = useRef(false);
  const deletionLock = useRef(false);
  const currentSessionToken = useRef(session?.token);
  currentSessionToken.current = session?.token;

  const [loginForm, setLoginForm] = useState(EMPTY_ADMIN);
  const [loginErrors, setLoginErrors] = useState({});
  const [loginStatus, setLoginStatus] = useState(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [courseErrors, setCourseErrors] = useState({});
  const [courseStatus, setCourseStatus] = useState(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [adminErrors, setAdminErrors] = useState({});
  const [adminStatus, setAdminStatus] = useState(null);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const sessionToken = session?.token;
  const sessionRole = session?.role;
  const isMasterAdmin = sessionRole === 'MASTER_ADMIN';
  const noticeText = sessionNoticeText(sessionMessage);
  const noticeIsSuccess = sessionNoticeIsSuccess(sessionMessage);

  const loadCourses = useCallback(async (options = {}) => {
    const requestToken = currentSessionToken.current;
    setCoursesLoading(true);
    setCoursesError('');

    try {
      const data = await fetchCourses(options);
      if (currentSessionToken.current !== requestToken) return;
      setCourses(data);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ABORTED') return;
      if (currentSessionToken.current !== requestToken) return;
      setCourses([]);
      setCoursesError(actionError(error, 'Courses could not be loaded.'));
    } finally {
      if (currentSessionToken.current === requestToken) setCoursesLoading(false);
    }
  }, []);

  const loadAdmins = useCallback(async (options = {}) => {
    if (!isMasterAdmin || !sessionToken) return;
    const requestToken = sessionToken;

    setAdminsLoading(true);
    setAdminsError('');

    try {
      const data = await fetchAdmins({ ...options, token: sessionToken });
      if (currentSessionToken.current !== requestToken) return;
      setAdmins(data);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ABORTED') return;
      if (currentSessionToken.current !== requestToken) return;
      setAdmins([]);
      setAdminsError(actionError(error, 'Administrators could not be loaded.'));
    } finally {
      if (currentSessionToken.current === requestToken) setAdminsLoading(false);
    }
  }, [isMasterAdmin, sessionToken]);

  useEffect(() => {
    setLoginForm(EMPTY_ADMIN);
    setLoginErrors({});
    setLoginStatus(null);
    setShowLoginPassword(false);
    setIsLoggingIn(false);
    setIsLoggingOut(false);
    setCourses([]);
    setCoursesLoading(false);
    setCoursesError('');
    setCourseForm(EMPTY_COURSE);
    setCourseErrors({});
    setCourseStatus(null);
    setIsAddingCourse(false);
    setAdmins([]);
    setAdminsLoading(false);
    setAdminsError('');
    setAdminForm(EMPTY_ADMIN);
    setAdminErrors({});
    setAdminStatus(null);
    setShowNewAdminPassword(false);
    setIsCreatingAdmin(false);
    setConfirmAction(null);
    setConfirmBusy(false);
    setConfirmError('');
    courseSubmitLock.current = false;
    adminSubmitLock.current = false;
    deletionLock.current = false;
    loginSubmitLock.current = false;
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) return undefined;

    const controller = new AbortController();
    void loadCourses({ signal: controller.signal });
    if (isMasterAdmin) void loadAdmins({ signal: controller.signal });

    return () => controller.abort();
  }, [isMasterAdmin, loadAdmins, loadCourses, sessionToken]);

  async function handleLogin(event) {
    event.preventDefault();
    if (loginSubmitLock.current || isLoggingIn) return;

    const username = loginForm.username.trim();
    const errors = {};
    if (!username) errors.username = 'Enter your username.';
    if (!loginForm.password) errors.password = 'Enter your password.';

    setLoginErrors(errors);
    setLoginStatus(null);
    clearSessionMessage();
    if (Object.keys(errors).length) return;

    loginSubmitLock.current = true;
    setIsLoggingIn(true);
    setLoginStatus({ type: 'loading', message: 'Signing in securely…' });

    try {
      await login({ username, password: loginForm.password });
      setLoginForm(EMPTY_ADMIN);
      setLoginStatus(null);
    } catch (error) {
      setLoginStatus({ type: 'error', message: loginError(error) });
    } finally {
      loginSubmitLock.current = false;
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setConfirmAction(null);

    try {
      await logout('You signed out successfully.');
    } catch (error) {
      setCourseStatus({
        type: 'error',
        message: actionError(error, 'Logout failed. Please try again.'),
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  function updateCourseField(event) {
    const { name, value } = event.target;
    setCourseForm((current) => ({ ...current, [name]: value }));
    setCourseErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleAddCourse(event) {
    event.preventDefault();
    if (courseSubmitLock.current || isAddingCourse || !sessionToken) return;

    const body = {
      name: courseForm.name.trim(),
      price: courseForm.price.trim(),
      duration: courseForm.duration.trim(),
      features: courseForm.features.trim(),
      description: courseForm.description.trim(),
    };
    const errors = {};
    if (!body.name) errors.name = 'Enter a course name.';
    if (!body.price) errors.price = 'Enter a price.';
    if (!body.duration) errors.duration = 'Enter a duration.';

    setCourseErrors(errors);
    setCourseStatus(null);
    if (Object.keys(errors).length) return;

    const requestToken = sessionToken;
    courseSubmitLock.current = true;
    setIsAddingCourse(true);
    setCourseStatus({ type: 'loading', message: 'Adding the course…' });

    try {
      const result = await addCourse(body, { token: requestToken });
      if (currentSessionToken.current !== requestToken) return;
      setCourseForm(EMPTY_COURSE);
      setCourseStatus({
        type: 'success',
        message: statusMessage(result, 'Course added successfully.'),
      });
      await loadCourses();
    } catch (error) {
      if (currentSessionToken.current !== requestToken) return;
      setCourseStatus({
        type: 'error',
        message: actionError(error, 'The course could not be added.'),
      });
    } finally {
      courseSubmitLock.current = false;
      if (currentSessionToken.current === requestToken) setIsAddingCourse(false);
    }
  }

  function updateAdminField(event) {
    const { name, value } = event.target;
    setAdminForm((current) => ({ ...current, [name]: value }));
    setAdminErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();
    if (adminSubmitLock.current || isCreatingAdmin || !sessionToken) return;

    const body = {
      username: adminForm.username.trim(),
      password: adminForm.password,
    };
    const errors = {};
    if (!body.username) errors.username = 'Enter a username.';
    if (!body.password) errors.password = 'Enter a password.';

    setAdminErrors(errors);
    setAdminStatus(null);
    if (Object.keys(errors).length) return;

    const requestToken = sessionToken;
    adminSubmitLock.current = true;
    setIsCreatingAdmin(true);
    setAdminStatus({ type: 'loading', message: 'Creating the administrator…' });

    try {
      const result = await createAdmin(body, { token: requestToken });
      if (currentSessionToken.current !== requestToken) return;
      setAdminForm(EMPTY_ADMIN);
      setAdminStatus({
        type: 'success',
        message: statusMessage(result, 'Administrator created successfully.'),
      });
      if (isMasterAdmin) await loadAdmins();
    } catch (error) {
      if (currentSessionToken.current !== requestToken) return;
      setAdminStatus({
        type: 'error',
        message: actionError(error, 'The administrator could not be created.'),
      });
    } finally {
      adminSubmitLock.current = false;
      if (currentSessionToken.current === requestToken) setIsCreatingAdmin(false);
    }
  }

  function askToDeleteCourse(course, event) {
    if (course?.id === null || course?.id === undefined) return;
    lastDeleteTrigger.current = event.currentTarget;
    setConfirmError('');
    setConfirmAction({
      kind: 'course',
      id: course.id,
      label: safeText(course.name, 'Name unavailable'),
      sessionToken,
    });
  }

  function askToDeleteAdmin(admin, event) {
    const username = typeof admin?.username === 'string' ? admin.username.trim() : '';
    if (!username) return;
    lastDeleteTrigger.current = event.currentTarget;
    setConfirmError('');
    setConfirmAction({
      kind: 'admin',
      username,
      label: username,
      sessionToken,
    });
  }

  function closeConfirmDialog() {
    if (confirmBusy) return;
    setConfirmAction(null);
    setConfirmError('');
    requestAnimationFrame(() => lastDeleteTrigger.current?.focus());
  }

  function restoreFocusAfterDelete(kind) {
    requestAnimationFrame(() => {
      if (lastDeleteTrigger.current?.isConnected) {
        lastDeleteTrigger.current.focus();
        return;
      }

      if (kind === 'course') courseListHeading.current?.focus();
      else adminListHeading.current?.focus();
    });
  }

  async function confirmDeletion() {
    if (!confirmAction || deletionLock.current || confirmBusy || !sessionToken) return;
    const deletedKind = confirmAction.kind;
    const requestToken = sessionToken;
    deletionLock.current = true;
    setConfirmBusy(true);
    setConfirmError('');

    try {
      if (confirmAction.kind === 'course') {
        const result = await removeCourse(confirmAction.id, { token: requestToken });
        if (currentSessionToken.current !== requestToken) return;
        setCourses((current) => current.filter(
          (course) => String(course?.id) !== String(confirmAction.id),
        ));
        setCourseStatus({
          type: 'success',
          message: statusMessage(result, 'Course deleted successfully.'),
        });
      } else {
        const result = await removeAdmin(confirmAction.username, { token: requestToken });
        if (currentSessionToken.current !== requestToken) return;
        setAdmins((current) => current.filter(
          (admin) => admin?.username !== confirmAction.username,
        ));
        setAdminStatus({
          type: 'success',
          message: statusMessage(result, 'Administrator deleted successfully.'),
        });
      }

      setConfirmAction(null);
      restoreFocusAfterDelete(deletedKind);
    } catch (error) {
      if (currentSessionToken.current !== requestToken) return;
      setConfirmError(actionError(error, 'The item could not be deleted.'));
    } finally {
      deletionLock.current = false;
      if (currentSessionToken.current === requestToken) setConfirmBusy(false);
    }
  }

  if (!session) {
    return (
      <div className="page-section bg-[var(--page)]">
        <section className="site-container" aria-labelledby={`${loginId}-title`}>
          <div className="editorial-heading-grid border-b border-[var(--border-strong)] pb-10 sm:pb-12">
            <div>
              <p className="eyebrow">Admin access</p>
              <h1 id={`${loginId}-title`} className="page-title mt-4">
                Run the institute from one focused dashboard.
              </h1>
            </div>
            <div className="max-w-xl lg:justify-self-end lg:pt-9">
              <p className="text-base leading-7 text-[var(--text)] sm:text-lg">
                Manage the courses students see and keep administrator access organised with clear feedback for every action.
              </p>
              <div className="mt-6 grid border-y border-[var(--border)] sm:grid-cols-2">
                <div className="min-w-0 border-b border-[var(--border)] py-4 sm:border-b-0 sm:border-r sm:pr-4">
                  <BookOpen className="size-5 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
                  <p className="mt-2 font-bold text-[var(--text-strong)]">Course control</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Publish and remove catalogue entries.</p>
                </div>
                <div className="min-w-0 py-4 sm:pl-4">
                  <UsersRound className="size-5 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
                  <p className="mt-2 font-bold text-[var(--text-strong)]">Role-aware access</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Master controls stay restricted.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.58fr)] lg:items-start lg:justify-between">
            <aside className="min-w-0 border-t-4 border-cyan-500 bg-[var(--surface-muted)] p-5 sm:p-7" aria-label="Protected workspace information">
              <ShieldCheck className="size-7 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-black tracking-[-0.025em] text-[var(--text-strong)]">Protected workspace</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text)]">
                Sign in with credentials provided by the institute. Sessions are cleared when the server rejects or expires access.
              </p>
            </aside>

            <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
              <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-[var(--text-strong)]">Administrator sign in</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Use your assigned username and password.</p>

              {noticeText ? (
                <div className="mt-5 flex min-w-0 items-start gap-3 rounded-lg border border-red-300/70 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{noticeText}</span>
                  <button
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950"
                    type="button"
                    onClick={clearSessionMessage}
                    aria-label="Dismiss session message"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              <form className="mt-6 space-y-5" onSubmit={handleLogin} noValidate aria-busy={isLoggingIn}>
                <div className="space-y-2">
                  <label className={LABEL_CLASS} htmlFor={`${loginId}-username`}>Username</label>
                  <input
                    id={`${loginId}-username`}
                    className={`${INPUT_CLASS} ${loginErrors.username ? 'border-red-500' : ''}`}
                    name="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(event) => {
                      setLoginForm((current) => ({ ...current, username: event.target.value }));
                      setLoginErrors((current) => ({ ...current, username: '' }));
                    }}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    aria-invalid={Boolean(loginErrors.username)}
                    aria-describedby={loginErrors.username ? `${loginId}-username-error` : undefined}
                    disabled={isLoggingIn}
                    required
                    autoFocus
                  />
                  {loginErrors.username ? (
                    <p id={`${loginId}-username-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                      {loginErrors.username}
                    </p>
                  ) : null}
                </div>

                <PasswordField
                  id={`${loginId}-password`}
                  name="password"
                  label="Password"
                  value={loginForm.password}
                  onChange={(event) => {
                    setLoginForm((current) => ({ ...current, password: event.target.value }));
                    setLoginErrors((current) => ({ ...current, password: '' }));
                  }}
                  error={loginErrors.password}
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                  visible={showLoginPassword}
                  onToggle={() => setShowLoginPassword((current) => !current)}
                />

                <StatusMessage status={loginStatus} />

                <button className={`${PRIMARY_BUTTON_CLASS} w-full`} type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <KeyRound className="size-5" aria-hidden="true" />
                  )}
                  {isLoggingIn ? 'Signing in…' : 'Sign in to dashboard'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const activeConfirm = confirmAction?.sessionToken === sessionToken ? confirmAction : null;

  return (
    <div className="page-section min-w-0 overflow-x-hidden bg-[var(--page)]">
      <section className="site-container" aria-labelledby="admin-dashboard-title">
        {noticeText ? (
          <div className="mb-6 flex min-w-0 items-start gap-3 rounded-lg border border-red-300/70 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{noticeText}</span>
            <button
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950"
              type="button"
              onClick={clearSessionMessage}
              aria-label="Dismiss session message"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <header className="flex min-w-0 flex-col gap-6 border-b border-[var(--border-strong)] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div className="min-w-0">
            <p className="eyebrow">Institute operations</p>
            <h1 id="admin-dashboard-title" className="mt-4 text-4xl font-black tracking-[-0.045em] text-[var(--text-strong)] sm:text-5xl">
              Admin dashboard
            </h1>
            <p className="mt-3 min-w-0 text-sm text-[var(--text)] [overflow-wrap:anywhere]">
              Signed in as <strong className="text-[var(--text-strong)]">{safeText(session.username, 'Name unavailable')}</strong>
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] px-4 text-sm font-bold text-[var(--text-strong)] [overflow-wrap:anywhere]">
              <ShieldCheck className="size-4 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
              {safeText(sessionRole, 'Not provided').replaceAll('_', ' ')}
            </span>
            <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <LogOut className="size-5" aria-hidden="true" />
              )}
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        <dl className="grid min-w-0 border-b border-[var(--border-strong)] sm:grid-cols-3">
          <div className="min-w-0 border-b border-[var(--border)] py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Courses</dt>
            <dd className="mt-2 text-3xl font-black text-[var(--text-strong)]">{coursesLoading ? '—' : courses.length}</dd>
          </div>
          <div className="min-w-0 border-b border-[var(--border)] py-5 sm:border-b-0 sm:border-r sm:px-5">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Access level</dt>
            <dd className="mt-2 min-w-0 text-lg font-black text-[var(--text-strong)] [overflow-wrap:anywhere]">
              {isMasterAdmin ? 'Master admin' : 'Admin'}
            </dd>
          </div>
          <div className="min-w-0 py-5 sm:pl-5">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Administrators</dt>
            <dd className="mt-2 text-3xl font-black text-[var(--text-strong)]">
              {isMasterAdmin ? (adminsLoading ? '—' : admins.length) : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid min-w-0 gap-7 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="add-course-title">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <Plus className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="add-course-title" className="text-xl font-black text-[var(--text-strong)]">Add a course</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Publish the details students need to make a decision.</p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleAddCourse} noValidate aria-busy={isAddingCourse}>
              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor={`${courseId}-name`}>Course name</label>
                <input
                  id={`${courseId}-name`}
                  className={`${INPUT_CLASS} ${courseErrors.name ? 'border-red-500' : ''}`}
                  name="name"
                  value={courseForm.name}
                  onChange={updateCourseField}
                  aria-invalid={Boolean(courseErrors.name)}
                  aria-describedby={courseErrors.name ? `${courseId}-name-error` : undefined}
                  disabled={isAddingCourse}
                  required
                />
                {courseErrors.name ? <p id={`${courseId}-name-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">{courseErrors.name}</p> : null}
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <label className={LABEL_CLASS} htmlFor={`${courseId}-price`}>Price</label>
                  <input
                    id={`${courseId}-price`}
                    className={`${INPUT_CLASS} ${courseErrors.price ? 'border-red-500' : ''}`}
                    name="price"
                    value={courseForm.price}
                    onChange={updateCourseField}
                    placeholder="e.g. ₹29,999"
                    aria-invalid={Boolean(courseErrors.price)}
                    aria-describedby={courseErrors.price ? `${courseId}-price-error` : undefined}
                    disabled={isAddingCourse}
                    required
                  />
                  {courseErrors.price ? <p id={`${courseId}-price-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">{courseErrors.price}</p> : null}
                </div>
                <div className="min-w-0 space-y-2">
                  <label className={LABEL_CLASS} htmlFor={`${courseId}-duration`}>Duration</label>
                  <input
                    id={`${courseId}-duration`}
                    className={`${INPUT_CLASS} ${courseErrors.duration ? 'border-red-500' : ''}`}
                    name="duration"
                    value={courseForm.duration}
                    onChange={updateCourseField}
                    placeholder="e.g. 40+ hrs"
                    aria-invalid={Boolean(courseErrors.duration)}
                    aria-describedby={courseErrors.duration ? `${courseId}-duration-error` : undefined}
                    disabled={isAddingCourse}
                    required
                  />
                  {courseErrors.duration ? <p id={`${courseId}-duration-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">{courseErrors.duration}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor={`${courseId}-features`}>Features</label>
                <input id={`${courseId}-features`} className={INPUT_CLASS} name="features" value={courseForm.features} onChange={updateCourseField} placeholder="e.g. live sessions, projects" disabled={isAddingCourse} />
              </div>

              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor={`${courseId}-description`}>Description</label>
                <textarea id={`${courseId}-description`} className={`${INPUT_CLASS} min-h-28 resize-y`} name="description" value={courseForm.description} onChange={updateCourseField} disabled={isAddingCourse} />
              </div>

              <StatusMessage status={courseStatus} />

              <button className={`${PRIMARY_BUTTON_CLASS} w-full`} type="submit" disabled={isAddingCourse}>
                {isAddingCourse ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
                {isAddingCourse ? 'Adding course…' : 'Add course'}
              </button>
            </form>
          </section>

          <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="course-list-title">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 ref={courseListHeading} id="course-list-title" className="text-xl font-black text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" tabIndex="-1">
                  Published courses
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Current offerings returned by the institute API.</p>
              </div>
              <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={() => loadCourses()} disabled={coursesLoading}>
                <RefreshCw className={`size-4 ${coursesLoading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>

            <div className="mt-5" aria-live="polite" aria-busy={coursesLoading}>
              {coursesLoading ? (
                <div className="flex min-h-40 items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--border-strong)] text-sm text-[var(--text)]" role="status">
                  <LoaderCircle className="size-5 animate-spin text-cyan-700 motion-reduce:animate-none dark:text-cyan-300" aria-hidden="true" />
                  Loading courses…
                </div>
              ) : coursesError ? (
                <div className="rounded-lg border border-red-300/70 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <p className="min-w-0 text-sm [overflow-wrap:anywhere]">{coursesError}</p>
                  </div>
                  <button className={`${SECONDARY_BUTTON_CLASS} mt-4`} type="button" onClick={() => loadCourses()}>
                    <RefreshCw className="size-4" aria-hidden="true" /> Try again
                  </button>
                </div>
              ) : courses.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] p-6 text-center">
                  <GraduationCap className="size-8 text-[var(--text-muted)]" aria-hidden="true" />
                  <p className="mt-3 font-bold text-[var(--text-strong)]">No courses yet</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Use the form to publish the first course.</p>
                </div>
              ) : (
                <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Published courses">
                  {courses.map((course, index) => {
                    const id = course?.id;
                    const canDelete = id !== null && id !== undefined;
                    return (
                      <li key={canDelete ? `${String(id)}-${index}` : `course-${index}`} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-black text-[var(--text-strong)] [overflow-wrap:anywhere]">{safeText(course?.name, 'Name unavailable')}</h3>
                            <p className="mt-1 text-sm font-bold text-cyan-700 [overflow-wrap:anywhere] dark:text-cyan-300">{safeText(course?.price)}</p>
                          </div>
                          {canDelete ? (
                            <button
                              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-500/50 text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300 dark:hover:bg-red-950/40"
                              type="button"
                              onClick={(event) => askToDeleteCourse(course, event)}
                              aria-label={`Delete ${safeText(course?.name, 'Name unavailable')}`}
                            >
                              <Trash2 className="size-5" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm text-[var(--text)] [overflow-wrap:anywhere]">{safeText(course?.duration)}</p>
                        {safeText(course?.features, '') ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)] [overflow-wrap:anywhere]">{safeText(course?.features, '')}</p> : null}
                        {safeText(course?.description, '') ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)] [overflow-wrap:anywhere]">{safeText(course?.description, '')}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className={`mt-7 grid min-w-0 gap-7 ${isMasterAdmin ? 'xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]' : ''}`}>
          <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="create-admin-title">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <UserPlus className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="create-admin-title" className="text-xl font-black text-[var(--text-strong)]">Create an administrator</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Provision a separate account; never share your own password.</p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateAdmin} noValidate aria-busy={isCreatingAdmin}>
              <div className="space-y-2">
                <label className={LABEL_CLASS} htmlFor={`${adminId}-username`}>New username</label>
                <input
                  id={`${adminId}-username`}
                  className={`${INPUT_CLASS} ${adminErrors.username ? 'border-red-500' : ''}`}
                  name="username"
                  value={adminForm.username}
                  onChange={updateAdminField}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  aria-invalid={Boolean(adminErrors.username)}
                  aria-describedby={adminErrors.username ? `${adminId}-username-error` : undefined}
                  disabled={isCreatingAdmin}
                  required
                />
                {adminErrors.username ? <p id={`${adminId}-username-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">{adminErrors.username}</p> : null}
              </div>

              <PasswordField
                id={`${adminId}-password`}
                name="password"
                label="New password"
                value={adminForm.password}
                onChange={updateAdminField}
                error={adminErrors.password}
                autoComplete="new-password"
                disabled={isCreatingAdmin}
                visible={showNewAdminPassword}
                onToggle={() => setShowNewAdminPassword((current) => !current)}
              />

              <StatusMessage status={adminStatus} />

              <button className={`${PRIMARY_BUTTON_CLASS} w-full`} type="submit" disabled={isCreatingAdmin}>
                {isCreatingAdmin ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <UserPlus className="size-5" aria-hidden="true" />}
                {isCreatingAdmin ? 'Creating account…' : 'Create administrator'}
              </button>
            </form>
          </section>

          {isMasterAdmin ? (
            <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="admin-list-title">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 ref={adminListHeading} id="admin-list-title" className="text-xl font-black text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" tabIndex="-1">
                    Administrator directory
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Master-only account visibility and removal controls.</p>
                </div>
                <button className={SECONDARY_BUTTON_CLASS} type="button" onClick={() => loadAdmins()} disabled={adminsLoading}>
                  <RefreshCw className={`size-4 ${adminsLoading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                  Refresh
                </button>
              </div>

              <div className="mt-5" aria-live="polite" aria-busy={adminsLoading}>
                {adminsLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--border-strong)] text-sm text-[var(--text)]" role="status">
                    <LoaderCircle className="size-5 animate-spin text-cyan-700 motion-reduce:animate-none dark:text-cyan-300" aria-hidden="true" />
                    Loading administrators…
                  </div>
                ) : adminsError ? (
                  <div className="rounded-lg border border-red-300/70 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                      <p className="min-w-0 text-sm [overflow-wrap:anywhere]">{adminsError}</p>
                    </div>
                    <button className={`${SECONDARY_BUTTON_CLASS} mt-4`} type="button" onClick={() => loadAdmins()}>
                      <RefreshCw className="size-4" aria-hidden="true" /> Try again
                    </button>
                  </div>
                ) : admins.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] p-6 text-center">
                    <UsersRound className="size-8 text-[var(--text-muted)]" aria-hidden="true" />
                    <p className="mt-3 font-bold text-[var(--text-strong)]">No administrators returned</p>
                  </div>
                ) : (
                  <ul className="min-w-0 divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]" aria-label="Administrators">
                    {admins.map((admin, index) => {
                      const username = safeText(admin?.username, 'Name unavailable');
                      const isProtected = admin?.username === 'admin';
                      const canDelete = typeof admin?.username === 'string' && admin.username.trim() && !isProtected;
                      return (
                        <li key={`${username}-${index}`} className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-black text-[var(--text-strong)] [overflow-wrap:anywhere]">{username}</p>
                            <p className="mt-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] [overflow-wrap:anywhere]">
                              {safeText(admin?.role).replaceAll('_', ' ')}
                            </p>
                          </div>
                          {isProtected ? (
                            <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-green-500/40 bg-green-500/10 px-3 text-sm font-bold text-green-800 dark:text-green-300 sm:self-auto">
                              <ShieldCheck className="size-4" aria-hidden="true" /> Protected
                            </span>
                          ) : canDelete ? (
                            <button
                              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-red-500/50 px-4 font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300 dark:hover:bg-red-950/40 sm:self-auto"
                              type="button"
                              onClick={(event) => askToDeleteAdmin(admin, event)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" /> Delete
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {activeConfirm ? (
        <ConfirmDialog action={activeConfirm} busy={confirmBusy} error={confirmError} onCancel={closeConfirmDialog} onConfirm={confirmDeletion} />
      ) : null}
    </div>
  );
}
