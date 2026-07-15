import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loginAdmin } from '../services/api';
import {
  AUTH_EXPIRED_EVENT,
  clearAuth,
  purgeLegacyAdmissions,
  readAuth,
  saveAuth,
} from '../utils/auth';

const AuthContext = createContext(null);

const sessionMessages = {
  expired: 'Your admin session expired. Sign in again to continue.',
  unauthorized: 'Your admin session is no longer valid. Please sign in again.',
  forbidden: 'The server rejected this admin session. Please sign in again.',
  invalid: 'An invalid saved session was removed. Please sign in again.',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readAuth({ notify: false }));
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    purgeLegacyAdmissions();

    const handleExpired = (event) => {
      const reason = event.detail?.reason || 'unauthorized';
      setSession(null);
      setSessionMessage({
        message: sessionMessages[reason] || sessionMessages.unauthorized,
        tone: 'error',
      });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    setSessionMessage('');
    const auth = await loginAdmin({ username, password });
    const nextSession = saveAuth({
      token: auth.token,
      username,
      role: auth.role || 'ADMIN',
    });
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback((message = '') => {
    clearAuth();
    setSession(null);
    setSessionMessage(message ? { message, tone: 'success' } : '');
  }, []);

  const clearSessionMessage = useCallback(() => setSessionMessage(''), []);

  const value = useMemo(
    () => ({ session, login, logout, sessionMessage, clearSessionMessage }),
    [session, login, logout, sessionMessage, clearSessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
