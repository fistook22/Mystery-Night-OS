import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'join'; code: string }
  | { page: 'guest'; token: string }
  | { page: 'tv'; token: string }
  | { page: 'host'; token: string }
  | { page: 'print'; token: string }
  | { page: 'qr'; code: string }
  | { page: 'notfound' };

export function parse(path: string): Route {
  const [, a, b, c] = path.split('/');
  if (!a) return { page: 'home' };
  if (a === 'join' && b) return { page: 'join', code: b };
  if (a === 'g' && b) return { page: 'guest', token: b };
  if (a === 'tv' && b) return { page: 'tv', token: b };
  if (a === 'host' && b && c === 'print') return { page: 'print', token: b };
  if (a === 'host' && b) return { page: 'host', token: b };
  if (a === 'qr' && b) return { page: 'qr', code: decodeURIComponent(b) };
  return { page: 'notfound' };
}

export function navigate(path: string, replace = false): void {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.pathname));
  useEffect(() => {
    const on = () => setRoute(parse(location.pathname));
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return route;
}
