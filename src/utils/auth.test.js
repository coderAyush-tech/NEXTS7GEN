import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_EXPIRED_EVENT,
  AUTH_STORAGE_KEYS,
  LEGACY_ADMISSIONS_STORAGE_KEY,
  clearAuth,
  isJwtExpired,
  isNonEmptyToken,
  purgeLegacyAdmissions,
  readAuth,
  saveAuth,
} from './auth.js';

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

function makeJwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value))
    .toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auth storage contract', () => {
  it('uses the exact existing localStorage key names', () => {
    expect(AUTH_STORAGE_KEYS).toEqual({
      token: 'adminToken',
      username: 'adminUsername',
      role: 'adminRole',
    });
  });

  it('saves and reads a valid admin session', () => {
    const storage = createStorage();

    saveAuth({ token: ' token-value ', username: 'admin', role: 'MASTER_ADMIN' }, { storage });

    expect(storage.snapshot()).toEqual({
      adminToken: 'token-value',
      adminUsername: 'admin',
      adminRole: 'MASTER_ADMIN',
    });
    expect(readAuth({ storage })).toEqual({
      token: 'token-value',
      username: 'admin',
      role: 'MASTER_ADMIN',
    });
  });

  it.each([undefined, null, '', '   ', 'undefined', 'NULL'])(
    'rejects an invalid token value: %s',
    (token) => {
      expect(isNonEmptyToken(token)).toBe(false);
      expect(() => saveAuth({ token }, { storage: createStorage() }))
        .toThrow('A nonempty admin token is required.');
    },
  );

  it('accepts opaque non-JWT tokens without inventing an expiry', () => {
    expect(isJwtExpired('opaque-session-token', 10_000)).toBe(false);
  });

  it('clears an expired JWT instead of restoring its session', () => {
    const token = makeJwt({ exp: 100 });
    const storage = createStorage({
      adminToken: token,
      adminUsername: 'admin',
      adminRole: 'MASTER_ADMIN',
    });

    expect(readAuth({ storage, now: 100_001, notify: false })).toBeNull();
    expect(storage.snapshot()).toEqual({});
  });

  it('emits the exported expiry event when an invalid session is cleared', () => {
    const storage = createStorage({ adminToken: 'token' });
    const target = new EventTarget();
    Object.defineProperty(target, 'localStorage', { value: storage });
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener(AUTH_EXPIRED_EVENT, listener);

    clearAuth({ storage, reason: 'unauthorized', notify: true });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual({ reason: 'unauthorized' });
  });

  it('purges only the legacy admission PII key', () => {
    const storage = createStorage({
      [LEGACY_ADMISSIONS_STORAGE_KEY]: '[{"name":"Student"}]',
      adminToken: 'keep-until-auth-clear',
    });

    expect(purgeLegacyAdmissions(storage)).toBe(true);
    expect(storage.snapshot()).toEqual({ adminToken: 'keep-until-auth-clear' });
  });
});
