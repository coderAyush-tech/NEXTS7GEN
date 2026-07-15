export const AUTH_STORAGE_KEYS = Object.freeze({
  token: 'adminToken',
  username: 'adminUsername',
  role: 'adminRole',
});

export const LEGACY_ADMISSIONS_STORAGE_KEY = 'Next7Gen_admissions';
export const AUTH_EXPIRED_EVENT = 'next7gen:auth-expired';

function defaultStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function resolveOptions(options) {
  if (options && typeof options.getItem === 'function') {
    return { storage: options };
  }

  return options || {};
}

function decodeJwtPayload(token) {
  const segments = token.split('.');
  if (segments.length !== 3 || !segments[1]) return null;

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = globalThis.atob(padded);
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json);

    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : null;
  } catch {
    return null;
  }
}

function dispatchAuthExpired(reason) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  const detail = { reason };
  let event;

  if (typeof globalThis.CustomEvent === 'function') {
    event = new CustomEvent(AUTH_EXPIRED_EVENT, { detail });
  } else if (typeof globalThis.Event === 'function') {
    event = new Event(AUTH_EXPIRED_EVENT);
    Object.defineProperty(event, 'detail', { value: detail });
  } else {
    return;
  }

  window.dispatchEvent(event);
}

export function isNonEmptyToken(token) {
  if (typeof token !== 'string') return false;

  const normalized = token.trim();
  return Boolean(normalized)
    && normalized.toLowerCase() !== 'undefined'
    && normalized.toLowerCase() !== 'null';
}

export function isJwtExpired(token, now = Date.now()) {
  if (!isNonEmptyToken(token)) return false;

  const payload = decodeJwtPayload(token.trim());
  if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return false;
  }

  return payload.exp * 1000 <= now;
}

export function purgeLegacyAdmissions(storage = defaultStorage()) {
  if (!storage) return false;

  try {
    storage.removeItem(LEGACY_ADMISSIONS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearAuth(options = {}) {
  const {
    storage = defaultStorage(),
    reason = 'logout',
    notify = false,
  } = resolveOptions(options);

  let cleared = true;

  if (storage) {
    Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
      try {
        storage.removeItem(key);
      } catch {
        cleared = false;
      }
    });
  }

  if (notify) dispatchAuthExpired(reason);
  return cleared;
}

export function readAuth(options = {}) {
  const {
    storage = defaultStorage(),
    now = Date.now(),
    notify = true,
  } = resolveOptions(options);

  if (!storage) return null;

  let token;
  let username;
  let role;

  try {
    token = storage.getItem(AUTH_STORAGE_KEYS.token);
    username = storage.getItem(AUTH_STORAGE_KEYS.username);
    role = storage.getItem(AUTH_STORAGE_KEYS.role);
  } catch {
    return null;
  }

  if (!isNonEmptyToken(token)) {
    if (token !== null) {
      clearAuth({ storage, reason: 'invalid', notify });
    }
    return null;
  }

  const normalizedToken = token.trim();
  if (isJwtExpired(normalizedToken, now)) {
    clearAuth({ storage, reason: 'expired', notify });
    return null;
  }

  return {
    token: normalizedToken,
    username: typeof username === 'string' ? username : '',
    role: typeof role === 'string' && role.trim() ? role : 'ADMIN',
  };
}

export function saveAuth(auth, options = {}) {
  const {
    storage = defaultStorage(),
    now = Date.now(),
  } = resolveOptions(options);

  const token = typeof auth?.token === 'string' ? auth.token.trim() : auth?.token;

  if (!isNonEmptyToken(token)) {
    throw new TypeError('A nonempty admin token is required.');
  }

  if (isJwtExpired(token, now)) {
    clearAuth({ storage, reason: 'expired', notify: true });
    throw new TypeError('The admin token is already expired.');
  }

  const session = {
    token,
    username: typeof auth?.username === 'string' ? auth.username : '',
    role: typeof auth?.role === 'string' && auth.role.trim() ? auth.role : 'ADMIN',
  };

  if (!storage) return session;

  try {
    storage.setItem(AUTH_STORAGE_KEYS.token, session.token);
    storage.setItem(AUTH_STORAGE_KEYS.username, session.username);
    storage.setItem(AUTH_STORAGE_KEYS.role, session.role);
  } catch (cause) {
    clearAuth({ storage });
    const error = new Error('The admin session could not be saved.');
    error.name = 'AuthStorageError';
    error.cause = cause;
    throw error;
  }

  return session;
}

// Remove PII written by the legacy single-file frontend as soon as the auth
// utilities load. Admission submissions are never persisted by the new client.
purgeLegacyAdmissions();
