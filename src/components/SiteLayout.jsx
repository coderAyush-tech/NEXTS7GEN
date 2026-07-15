import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

const routeNames = {
  '/': 'Home',
  '/courses': 'Courses',
  '/about': 'About',
  '/admission': 'Admission',
  '/admin': 'Admin',
};

export default function SiteLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const routeName = routeNames[location.pathname] || 'Page not found';
    document.title = `${routeName} | Next7Gen Institute of Technology`;
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-[var(--page)] text-[var(--text)]">
      <button
        type="button"
        className="skip-link"
        onClick={() => {
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView({ block: 'start' });
        }}
      >
        Skip to main content
      </button>
      <Header key={`${location.pathname}${location.search}`} />
      <main id="main-content" ref={mainRef} tabIndex="-1" className="outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
