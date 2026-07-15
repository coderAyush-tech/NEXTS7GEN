import {
  clearAuth,
  isJwtExpired,
  isNonEmptyToken,
  readAuth,
} from '../utils/auth.js';

export const API_BASE = 'http://localhost:8080/api';
export const API_TIMEOUT_MS = 12_000;

const WRAPPER_KEYS = ['data', 'result', 'payload'];

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'API_ERROR';
    this.details = options.details ?? null;
    this.url = options.url ?? '';

    if (options.cause && !this.cause) this.cause = options.cause;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOptions(options) {
  if (typeof options === 'string') return { token: options };
  return isRecord(options) ? options : {};
}

function responseContentType(response) {
  try {
    return response.headers?.get?.('content-type') || '';
  } catch {
    return '';
  }
}

async function parseResponse(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return null;

  const contentType = responseContentType(response).toLowerCase();
  const resemblesJson = trimmed.startsWith('[')
    || /^[{"-]|^(?:true|false|null|\d)/.test(trimmed);

  if (contentType.includes('json') || resemblesJson) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Some Spring error handlers, proxies, and 204-like responses send a
      // misleading JSON content type. Preserve their text instead of masking
      // the HTTP status with a SyntaxError.
    }
  }

  return trimmed;
}

function findMessage(payload) {
  const queue = [payload];
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();

    if (typeof current === 'string' && current.trim()) {
      const message = current.trim();
      if (!/^\s*<!doctype|^\s*<html/i.test(message)) return message.slice(0, 500);
      continue;
    }

    if (!isRecord(current) || visited.has(current)) continue;
    visited.add(current);

    for (const key of ['message', 'error', 'detail', 'title']) {
      if (typeof current[key] === 'string' && current[key].trim()) {
        return current[key].trim().slice(0, 500);
      }
    }

    WRAPPER_KEYS.forEach((key) => {
      if (key in current) queue.push(current[key]);
    });
  }

  return '';
}

function normalizeSuccessfulMutation(payload) {
  if (payload === null) return {};
  if (typeof payload === 'string') return { message: payload };
  if (!isRecord(payload)) return { data: payload };

  let current = payload;
  const visited = new Set();

  while (isRecord(current) && !visited.has(current)) {
    visited.add(current);
    const wrapperKey = WRAPPER_KEYS.find((key) => key in current && current[key] != null);
    if (!wrapperKey) break;

    const inner = current[wrapperKey];
    if (isRecord(inner)) {
      const outerMessage = typeof current.message === 'string' ? current.message : undefined;
      current = outerMessage && typeof inner.message !== 'string'
        ? { ...inner, message: outerMessage }
        : inner;
      continue;
    }

    return {
      data: inner,
      ...(typeof current.message === 'string' ? { message: current.message } : {}),
    };
  }

  return current;
}

function findArray(payload, collectionKey, url) {
  if (payload === null) return [];

  const queue = [payload];
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (Array.isArray(current)) return current;
    if (!isRecord(current) || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current[collectionKey])) return current[collectionKey];

    WRAPPER_KEYS.forEach((key) => {
      if (key in current) queue.push(current[key]);
    });
  }

  throw new ApiError(`The server returned an invalid ${collectionKey} response.`, {
    code: 'INVALID_RESPONSE',
    details: payload,
    url,
  });
}

function normalizeLogin(payload, url) {
  const queue = [payload];
  const visited = new Set();
  let outerRole;
  let outerMessage;

  while (queue.length) {
    const current = queue.shift();

    if (!isRecord(current) || visited.has(current)) continue;
    visited.add(current);

    if (!outerRole && typeof current.role === 'string') outerRole = current.role;
    if (!outerMessage && typeof current.message === 'string') outerMessage = current.message;

    if ('token' in current) {
      if (!isNonEmptyToken(current.token)) break;

      return {
        ...current,
        token: current.token.trim(),
        role: typeof current.role === 'string' && current.role.trim()
          ? current.role
          : outerRole || 'ADMIN',
        ...(typeof current.message === 'string'
          ? {}
          : outerMessage ? { message: outerMessage } : {}),
      };
    }

    WRAPPER_KEYS.forEach((key) => {
      if (key in current) queue.push(current[key]);
    });
  }

  throw new ApiError('Login succeeded without a valid admin token.', {
    code: 'INVALID_RESPONSE',
    details: payload,
    url,
  });
}

function requireToken(explicitToken) {
  const storedAuth = explicitToken == null ? readAuth() : null;
  const token = explicitToken ?? storedAuth?.token;

  if (!isNonEmptyToken(token)) {
    throw new ApiError('An admin session is required for this action.', {
      status: 401,
      code: 'AUTH_REQUIRED',
    });
  }

  const normalized = token.trim();
  if (isJwtExpired(normalized)) {
    clearAuth({ reason: 'expired', notify: true });
    throw new ApiError('Your admin session has expired. Please sign in again.', {
      status: 401,
      code: 'SESSION_EXPIRED',
    });
  }

  return normalized;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(0, options.timeoutMs)
    : API_TIMEOUT_MS;
  let timedOut = false;
  let timeoutId;

  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) {
    abortFromCaller();
  } else {
    options.signal?.addEventListener?.('abort', abortFromCaller, { once: true });
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    if (options.token && (response.status === 401 || response.status === 403)) {
      clearAuth({
        reason: response.status === 401 ? 'unauthorized' : 'forbidden',
        notify: true,
      });
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
      const fallback = response.status
        ? `Request failed with HTTP ${response.status}.`
        : 'The request failed.';

      throw new ApiError(findMessage(payload) || fallback, {
        status: response.status,
        code: response.status === 401 || response.status === 403
          ? 'SESSION_EXPIRED'
          : 'HTTP_ERROR',
        details: payload,
        url,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (timedOut) {
      throw new ApiError('The server took too long to respond. Please try again.', {
        code: 'TIMEOUT',
        url,
        cause: error,
      });
    }

    if (controller.signal.aborted || error?.name === 'AbortError') {
      throw new ApiError('The request was cancelled.', {
        code: 'ABORTED',
        url,
        cause: error,
      });
    }

    throw new ApiError('Could not connect to the server. Check that the backend is running.', {
      code: 'NETWORK_ERROR',
      url,
      cause: error,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    options.signal?.removeEventListener?.('abort', abortFromCaller);
  }
}

export async function fetchCourses(options = {}) {
  options = normalizeOptions(options);
  const path = '/courses';
  const payload = await request(path, options);
  return findArray(payload, 'courses', `${API_BASE}${path}`);
}

export async function loginAdmin(credentials, options = {}) {
  options = normalizeOptions(options);
  const path = '/admin/login';
  const payload = await request(path, {
    ...options,
    method: 'POST',
    body: {
      username: credentials?.username,
      password: credentials?.password,
    },
  });

  const auth = normalizeLogin(payload, `${API_BASE}${path}`);
  if (isJwtExpired(auth.token)) {
    clearAuth({ reason: 'expired', notify: true });
    throw new ApiError('The server returned an expired admin token.', {
      status: 401,
      code: 'SESSION_EXPIRED',
      details: payload,
      url: `${API_BASE}${path}`,
    });
  }

  return auth;
}

export async function addCourse(course, options = {}) {
  options = normalizeOptions(options);
  const token = requireToken(options.token);
  const payload = await request('/admin/courses', {
    ...options,
    method: 'POST',
    token,
    body: {
      name: course?.name,
      price: course?.price,
      duration: course?.duration,
      features: course?.features,
      description: course?.description,
    },
  });

  return normalizeSuccessfulMutation(payload);
}

export async function deleteCourse(id, options = {}) {
  options = normalizeOptions(options);
  const token = requireToken(options.token);
  const payload = await request(`/admin/courses/${encodeURIComponent(String(id))}`, {
    ...options,
    method: 'DELETE',
    token,
  });

  return normalizeSuccessfulMutation(payload);
}

export async function createAdmin(credentials, options = {}) {
  options = normalizeOptions(options);
  const token = requireToken(options.token);
  const payload = await request('/admin/create', {
    ...options,
    method: 'POST',
    token,
    body: {
      username: credentials?.username,
      password: credentials?.password,
      role: 'ADMIN',
    },
  });

  return normalizeSuccessfulMutation(payload);
}

export async function fetchAdmins(options = {}) {
  options = normalizeOptions(options);
  const path = '/admin/all';
  const token = requireToken(options.token);
  const payload = await request(path, { ...options, token });
  return findArray(payload, 'admins', `${API_BASE}${path}`);
}

export async function deleteAdmin(username, options = {}) {
  options = normalizeOptions(options);
  const token = requireToken(options.token);
  const payload = await request(`/admin/delete/${encodeURIComponent(String(username))}`, {
    ...options,
    method: 'DELETE',
    token,
  });

  return normalizeSuccessfulMutation(payload);
}

export async function submitAdmission(admission, options = {}) {
  options = normalizeOptions(options);
  const payload = await request('/admissions', {
    ...options,
    method: 'POST',
    body: {
      name: admission?.name,
      email: admission?.email,
      phone: admission?.phone,
      course: admission?.course,
      payment: admission?.payment,
      message: admission?.message,
      timestamp: admission?.timestamp,
    },
  });

  return normalizeSuccessfulMutation(payload);
}
