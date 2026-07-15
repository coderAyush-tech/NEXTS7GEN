import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { API_BASE } from '../services/api.js';
import AdminPage from './AdminPage';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status = 200) {
  return new Response(null, { status });
}

function restoreSession({
  token = 'restored-admin-token',
  username = 'restored-admin',
  role = 'ADMIN',
} = {}) {
  window.localStorage.setItem('adminToken', token);
  window.localStorage.setItem('adminUsername', username);
  window.localStorage.setItem('adminRole', role);
}

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <AdminPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function enterCredentials(user, {
  username = 'admin',
  password = 'secret-password',
} = {}) {
  await user.type(screen.getByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
}

function loginRequestCalls() {
  return fetch.mock.calls.filter(([url]) => url === `${API_BASE}/admin/login`);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AdminPage login', () => {
  it('validates required credentials and provides a keyboard-operable password reveal', async () => {
    const user = userEvent.setup();
    renderAdmin();

    const username = screen.getByLabelText('Username');
    const password = screen.getByLabelText('Password');
    const reveal = screen.getByRole('button', { name: 'Show password' });

    expect(username).toHaveAttribute('autocomplete', 'username');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(reveal);
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('Enter your username.')).toBeVisible();
    expect(screen.getByText('Enter your password.')).toBeVisible();
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a useful incorrect-credentials error for a 401 login response', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'Bad credentials' }, 401));
    const user = userEvent.setup();
    renderAdmin();

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('The username or password is incorrect.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Admin dashboard' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('adminToken')).toBeNull();
  });

  it('shows a useful connection error when the login request cannot reach the backend', async () => {
    fetch.mockRejectedValue(new TypeError('connection refused'));
    const user = userEvent.setup();
    renderAdmin();

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('Could not connect to the server. Check that the backend is running.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Admin dashboard' })).not.toBeInTheDocument();
  });

  it.each([
    ['a malformed success body', () => jsonResponse({ role: 'ADMIN' })],
    ['an empty success body', () => emptyResponse()],
  ])('keeps the dashboard hidden for %s', async (_label, responseFactory) => {
    fetch.mockResolvedValue(responseFactory());
    const user = userEvent.setup();
    renderAdmin();

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('Login succeeded without a valid admin token.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Admin dashboard' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('adminToken')).toBeNull();
    expect(window.localStorage.getItem('adminUsername')).toBeNull();
    expect(window.localStorage.getItem('adminRole')).toBeNull();
  });

  it('stores the exact authentication keys and opens the dashboard after a valid login', async () => {
    fetch.mockImplementation((url) => {
      if (url === `${API_BASE}/admin/login`) {
        return Promise.resolve(jsonResponse({ token: 'valid-token', role: 'ADMIN' }));
      }
      if (url === `${API_BASE}/courses`) return Promise.resolve(jsonResponse([]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    const user = userEvent.setup();
    renderAdmin();

    await enterCredentials(user, { username: 'course-admin', password: 'private-value' });
    await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
    expect(window.localStorage.getItem('adminToken')).toBe('valid-token');
    expect(window.localStorage.getItem('adminUsername')).toBe('course-admin');
    expect(window.localStorage.getItem('adminRole')).toBe('ADMIN');
    expect(window.localStorage.length).toBe(3);
  });

  it('locks synchronously against duplicate login submissions', async () => {
    let resolveLogin;
    const pendingLogin = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    fetch.mockImplementation((url) => {
      if (url === `${API_BASE}/admin/login`) return pendingLogin;
      if (url === `${API_BASE}/courses`) return Promise.resolve(jsonResponse([]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    const user = userEvent.setup();
    renderAdmin();
    await enterCredentials(user);

    const form = screen.getByRole('button', { name: 'Sign in to dashboard' }).closest('form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(loginRequestCalls()).toHaveLength(1);

    resolveLogin(jsonResponse({ token: 'single-token', role: 'ADMIN' }));
    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
  });
});

describe('AdminPage session lifecycle', () => {
  it('clears every auth key and returns to login on logout', async () => {
    restoreSession();
    fetch.mockResolvedValue(jsonResponse([]));
    const user = userEvent.setup();
    renderAdmin();

    expect(screen.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeVisible();
    expect(screen.getByText('You signed out successfully.')).toBeVisible();
    expect(window.localStorage.getItem('adminToken')).toBeNull();
    expect(window.localStorage.getItem('adminUsername')).toBeNull();
    expect(window.localStorage.getItem('adminRole')).toBeNull();
  });

  it.each([
    [401, 'Your admin session is no longer valid. Please sign in again.'],
    [403, 'The server rejected this admin session. Please sign in again.'],
  ])('clears a restored session after a protected HTTP %s and explains why', async (status, notice) => {
    restoreSession({ role: 'MASTER_ADMIN' });
    fetch.mockImplementation((url) => {
      if (url === `${API_BASE}/courses`) return Promise.resolve(jsonResponse([]));
      if (url === `${API_BASE}/admin/all`) {
        return Promise.resolve(jsonResponse({ message: 'Rejected' }, status));
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeVisible();
    expect(screen.getByText(notice)).toBeVisible();
    expect(window.localStorage.getItem('adminToken')).toBeNull();
    expect(window.localStorage.getItem('adminUsername')).toBeNull();
    expect(window.localStorage.getItem('adminRole')).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/admin/all`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer restored-admin-token' }),
      }),
    );
  });
});

describe('AdminPage administrator role gates', () => {
  it('shows the administrator directory to a master admin and deletes a selected account', async () => {
    restoreSession({ username: 'admin', role: 'MASTER_ADMIN' });
    fetch.mockImplementation((url, request = {}) => {
      if (url === `${API_BASE}/courses`) return Promise.resolve(jsonResponse([]));
      if (url === `${API_BASE}/admin/all`) {
        return Promise.resolve(jsonResponse({
          admins: [
            { username: 'admin', role: 'MASTER_ADMIN' },
            { username: 'staff-user', role: 'ADMIN' },
          ],
        }));
      }
      if (url === `${API_BASE}/admin/delete/staff-user` && request.method === 'DELETE') {
        return Promise.resolve(emptyResponse(204));
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    const user = userEvent.setup();
    renderAdmin();

    const directory = await screen.findByRole('region', { name: 'Administrator directory' });
    expect(within(directory).getByText('admin')).toBeVisible();
    expect(within(directory).getByText('staff-user')).toBeVisible();
    expect(within(directory).getByText('Protected')).toBeVisible();

    await user.click(within(directory).getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete administrator?' });
    expect(within(dialog).getByText('staff-user')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Delete administrator' }));

    await waitFor(() => {
      expect(within(directory).queryByText('staff-user')).not.toBeInTheDocument();
    });

    const deleteCall = fetch.mock.calls.find(([url]) => url === `${API_BASE}/admin/delete/staff-user`);
    expect(deleteCall).toBeDefined();
    expect(deleteCall[1]).toEqual(expect.objectContaining({
      method: 'DELETE',
      headers: expect.objectContaining({ Authorization: 'Bearer restored-admin-token' }),
    }));
  });

  it('keeps administrator listing and deletion controls hidden from an ordinary admin', async () => {
    restoreSession({ username: 'course-admin', role: 'ADMIN' });
    fetch.mockImplementation((url) => {
      if (url === `${API_BASE}/courses`) return Promise.resolve(jsonResponse([]));
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    renderAdmin();

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/courses`,
      expect.objectContaining({ method: 'GET' }),
    ));

    expect(screen.getByRole('heading', { name: 'Create an administrator' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Administrator directory' })).not.toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => url === `${API_BASE}/admin/all`)).toBe(false);
  });
});
