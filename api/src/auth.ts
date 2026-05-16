import type { Env } from './index';

export function isAdmin(request: Request, env: Env): boolean {
  if (!env.ADMIN_KEY) return false;
  const url = new URL(request.url);
  const keyFromQuery = url.searchParams.get('key');
  const keyFromHeader = request.headers.get('X-Admin-Key');
  const provided = keyFromHeader || keyFromQuery;
  return Boolean(provided) && provided === env.ADMIN_KEY;
}
