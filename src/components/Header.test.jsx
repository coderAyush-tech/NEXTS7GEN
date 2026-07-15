import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Header from './Header';
import { ThemeProvider } from '../context/ThemeContext';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderHeader(initialEntries = ['/']) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Header />
        <LocationProbe />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  vi.unstubAllGlobals();
});

describe('Header', () => {
  it('shows the primary student navigation and Apply now without exposing Admin', () => {
    renderHeader();

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });

    expect(
      within(primaryNavigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Courses', 'About', 'Admission']);
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();

    const applyLink = screen.getByRole('link', { name: /apply now/i });
    expect(applyLink).toHaveAttribute('href', '/admission');
  });

  it('exposes accurate collapsed and expanded states for the mobile menu', async () => {
    const user = userEvent.setup();
    renderHeader();

    const openButton = screen.getByRole('button', {
      name: 'Open navigation menu',
    });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    expect(openButton).toHaveAttribute('aria-controls', 'mobile-navigation');
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).not.toBeInTheDocument();

    await user.click(openButton);

    const closeButton = screen.getByRole('button', {
      name: 'Close navigation menu',
    });
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    });
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    expect(mobileNavigation.parentElement).toHaveAttribute(
      'id',
      'mobile-navigation',
    );
    expect(
      within(mobileNavigation).getByRole('link', { name: /apply now/i }),
    ).toHaveAttribute('href', '/admission');

    await user.click(closeButton);

    expect(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).not.toBeInTheDocument();
  });

  it('closes the mobile menu after a student navigates', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    );
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    });

    await user.click(
      within(mobileNavigation).getByRole('link', { name: 'Courses' }),
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/courses');
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape and restores focus to the menu button', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    );

    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    });
    await waitFor(() => {
      expect(
        within(mobileNavigation).getByRole('link', { name: 'Home' }),
      ).toHaveFocus();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Open navigation menu' }),
      ).toHaveFocus();
    });
    expect(
      screen.queryByRole('navigation', { name: 'Mobile navigation' }),
    ).not.toBeInTheDocument();
  });

  it('persists theme changes under the exact theme key with an accessible state', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('theme', 'light');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderHeader();

    const themeButton = screen.getByRole('button', {
      name: 'Switch to dark theme',
    });
    expect(themeButton).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('theme')).toBe('light');

    await user.click(themeButton);

    const darkThemeButton = screen.getByRole('button', {
      name: 'Switch to light theme',
    });
    expect(darkThemeButton).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');
    expect(window.localStorage).toHaveLength(1);
    expect(window.localStorage.key(0)).toBe('theme');
  });
});
