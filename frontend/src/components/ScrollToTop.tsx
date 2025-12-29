import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router doesn't automatically reset scroll on navigation.
 * This ensures every route change starts at the top, unless a hash anchor is present.
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // If the route includes a hash (e.g. "/#pricing"), scroll to that element.
    if (location.hash) {
      const id = location.hash.replace('#', '');
      // Defer to ensure the target element exists after route render.
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
      });
      return;
    }

    // Default: start at top of page for any route navigation.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return null;
}


