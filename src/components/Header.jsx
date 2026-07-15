import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import Logo from './Logo';
import { buttonClassName } from './Button';
import { useTheme } from '../context/ThemeContext';

const navigation = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
  { to: '/admission', label: 'Admission' },
];

function NavigationLinks({ mobile = false, onNavigate }) {
  return navigation.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
          mobile ? 'w-full' : '',
          isActive
            ? 'bg-[var(--surface-muted)] text-cyan-700 dark:text-cyan-300'
            : 'text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]',
        ].join(' ')
      }
    >
      {item.label}
    </NavLink>
  ));
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const firstLink = panelRef.current?.querySelector('a');
    firstLink?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-md">
      <div className="site-container flex min-h-[4.75rem] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          <NavigationLinks />
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:border-cyan-500 hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? <Sun className="h-[1.1rem] w-[1.1rem]" /> : <Moon className="h-[1.1rem] w-[1.1rem]" />}
          </button>

          <span className="hidden sm:inline-flex">
            <Link
              to="/admission"
              className={buttonClassName()}
            >
              Apply now
            </Link>
          </span>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" ref={panelRef} className="border-t border-[var(--border)] bg-[var(--page)] px-4 py-4 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
            <NavigationLinks mobile onNavigate={() => setMenuOpen(false)} />
            <Link
              to="/admission"
              onClick={() => setMenuOpen(false)}
              className={`${buttonClassName()} mt-3 sm:hidden`}
            >
              Apply now
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
