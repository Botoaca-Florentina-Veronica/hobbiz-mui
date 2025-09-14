import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to automatically scroll to top when route changes
 */
export default function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly when route changes
    window.scrollTo(0, 0);
  }, [pathname]);
}