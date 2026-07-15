import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE,
  ApiError,
  addCourse,
  createAdmin,
  deleteAdmin,
  deleteCourse,
  fetchAdmins,
  fetchCourses,
  loginAdmin,
  submitAdmission,
} from './api.js';
import { AUTH_EXPIRED_EVENT } from '../utils/auth.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.has(key) ? values.get(key) : null),
    setItem: vi.fn((key, value) => values.set(key, String(value))),
    removeItem: vi.fn((key) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    snapshot: () => Object.fromEntries(values),
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('API compatibility contract', () => {
  it('keeps the exact localhost API base', () => {
    expect(API_BASE).toBe('http://localhost:8080/api');
  });

  it('fetches direct and safely wrapped course arrays from GET /courses', async () => {
    fetch.mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'Java' }]));
    await expect(fetchCourses()).resolves.toEqual([{ id: 1, name: 'Java' }]);

    expect(fetch).toHaveBeenLastCalledWith(
      `${API_BASE}/courses`,
      expect.objectContaining({ method: 'GET' }),
    );

    fetch.mockResolvedValueOnce(jsonResponse({ data: { courses: [{ id: 2, name: 'React' }] } }));
    await expect(fetchCourses()).resolves.toEqual([{ id: 2, name: 'React' }]);
  });

  it('posts the exact login fields and accepts a safely wrapped response', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({
      message: 'Welcome',
      data: { token: 'admin-token', role: 'MASTER_ADMIN' },
    }));

    await expect(loginAdmin({ username: 'admin', password: ' pass with spaces ' }))
      .resolves.toEqual(expect.objectContaining({
        token: 'admin-token',
        role: 'MASTER_ADMIN',
        message: 'Welcome',
      }));

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/admin/login`);
    expect(request.method).toBe('POST');
    expect(request.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(request.body)).toEqual({
      username: 'admin',
      password: ' pass with spaces ',
    });
  });

  it('accepts the backend\'s direct login response shape', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ token: 'direct-token', role: 'ADMIN' }));

    await expect(loginAdmin({ username: 'staff', password: 'secret' }))
      .resolves.toEqual({ token: 'direct-token', role: 'ADMIN' });
  });

  it('rejects a successful login response that has no nonempty token', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ role: 'MASTER_ADMIN' }));

    await expect(loginAdmin({ username: 'admin', password: 'secret' }))
      .rejects.toMatchObject({ name: 'ApiError', code: 'INVALID_RESPONSE' });
  });

  it('rejects successful scalar login bodies that do not contain the expected token field', async () => {
    fetch.mockResolvedValueOnce(new Response('OK', { status: 200 }));

    await expect(loginAdmin({ username: 'admin', password: 'secret' }))
      .rejects.toMatchObject({ name: 'ApiError', code: 'INVALID_RESPONSE' });
  });

  it('posts the exact course fields with the existing Bearer header', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Created' }, 201));
    const course = {
      name: 'Full Stack',
      price: '₹29,999',
      duration: '40+ hrs',
      features: 'Projects',
      description: 'Practical course',
      ignored: 'must not be sent',
    };

    await addCourse(course, { token: 'admin-token' });

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/admin/courses`);
    expect(request.method).toBe('POST');
    expect(request.headers.Authorization).toBe('Bearer admin-token');
    expect(JSON.parse(request.body)).toEqual({
      name: course.name,
      price: course.price,
      duration: course.duration,
      features: course.features,
      description: course.description,
    });
  });

  it('deletes a course through the exact endpoint and tolerates an empty 204', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(deleteCourse(42, { token: 'admin-token' })).resolves.toEqual({});

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/admin/courses/42`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
      }),
    );
  });

  it('creates only an ADMIN with the exact existing request fields', async () => {
    fetch.mockResolvedValueOnce(new Response('Admin created', { status: 201 }));

    await createAdmin({ username: 'staff', password: 'secret', role: 'MASTER_ADMIN' }, {
      token: 'admin-token',
    });

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/admin/create`);
    expect(request.method).toBe('POST');
    expect(request.headers.Authorization).toBe('Bearer admin-token');
    expect(JSON.parse(request.body)).toEqual({
      username: 'staff',
      password: 'secret',
      role: 'ADMIN',
    });
  });

  it('reads direct and wrapped admin-list response shapes', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ admins: [{ username: 'admin' }] }));
    await expect(fetchAdmins({ token: 'admin-token' }))
      .resolves.toEqual([{ username: 'admin' }]);

    fetch.mockResolvedValueOnce(jsonResponse({ data: [{ username: 'staff' }] }));
    await expect(fetchAdmins({ token: 'admin-token' }))
      .resolves.toEqual([{ username: 'staff' }]);

    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE}/admin/all`);
    expect(fetch.mock.calls[0][1].method).toBe('GET');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer admin-token');
  });

  it('uses DELETE /admin/delete/{username} with Bearer auth', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Deleted' }));

    await deleteAdmin('staff', { token: 'admin-token' });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/admin/delete/staff`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
      }),
    );
  });

  it('submits only the exact admission fields and never stores admission PII', async () => {
    const storage = createStorage();
    const target = new EventTarget();
    Object.defineProperty(target, 'localStorage', { value: storage });
    vi.stubGlobal('window', target);
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Received' }, 201));
    const admission = {
      name: 'Student',
      email: 'student@example.com',
      phone: '9999999999',
      course: 'Java',
      payment: 'One Time Payment',
      message: 'Interested',
      timestamp: '2026-07-15T00:00:00.000Z',
      ignored: 'must not be sent',
    };

    await submitAdmission(admission);

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE}/admissions`);
    expect(request.method).toBe('POST');
    expect(request.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(request.body)).toEqual({
      name: admission.name,
      email: admission.email,
      phone: admission.phone,
      course: admission.course,
      payment: admission.payment,
      message: admission.message,
      timestamp: admission.timestamp,
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('API failure handling', () => {
  it('keeps text errors helpful even when the server does not return JSON', async () => {
    fetch.mockResolvedValueOnce(new Response('Backend unavailable', { status: 503 }));

    await expect(fetchCourses()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      code: 'HTTP_ERROR',
      message: 'Backend unavailable',
    });
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
  ])('clears the exact auth keys and emits the expiry event on HTTP %i', async (status, reason) => {
    const storage = createStorage({
      adminToken: 'admin-token',
      adminUsername: 'admin',
      adminRole: 'MASTER_ADMIN',
    });
    const target = new EventTarget();
    Object.defineProperty(target, 'localStorage', { value: storage });
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener(AUTH_EXPIRED_EVENT, listener);
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Token expired' }, status));

    await expect(fetchAdmins({ token: 'admin-token' })).rejects.toMatchObject({
      status,
      code: 'SESSION_EXPIRED',
      message: 'Token expired',
    });
    expect(storage.snapshot()).toEqual({});
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual({ reason });
  });

  it.each([
    ['course catalogue', () => fetchCourses()],
    ['admission submission', () => submitAdmission({})],
    ['login', () => loginAdmin({ username: 'admin', password: 'wrong' })],
  ])('does not clear an admin session for an unauthenticated %s 401', async (_label, makeRequest) => {
    const storage = createStorage({
      adminToken: 'admin-token',
      adminUsername: 'admin',
      adminRole: 'MASTER_ADMIN',
    });
    const target = new EventTarget();
    Object.defineProperty(target, 'localStorage', { value: storage });
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener(AUTH_EXPIRED_EVENT, listener);
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'Request rejected' }, 401));

    await expect(makeRequest()).rejects.toMatchObject({ status: 401 });
    expect(storage.snapshot()).toEqual({
      adminToken: 'admin-token',
      adminUsername: 'admin',
      adminRole: 'MASTER_ADMIN',
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('tolerates text from a successful response that claims to be JSON', async () => {
    fetch.mockResolvedValueOnce(new Response('Course created', {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(addCourse({
      name: 'Java',
      price: '₹1',
      duration: '1 hr',
      features: '',
      description: '',
    }, { token: 'admin-token' })).resolves.toEqual({ message: 'Course created' });
  });

  it('reports network failures as typed ApiError instances', async () => {
    fetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    const error = await fetchCourses().catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('aborts slow requests and reports a typed timeout', async () => {
    vi.useFakeTimers();
    fetch.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    }));

    const assertion = expect(fetchCourses({ timeoutMs: 25 }))
      .rejects.toMatchObject({ name: 'ApiError', code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(26);

    await assertion;
  });
});
