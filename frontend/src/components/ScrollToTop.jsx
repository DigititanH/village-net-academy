import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to the top of the page on every route change. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
