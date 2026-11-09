/**
 * Zero-dependency standard HTTP cookie parser and serializer.
 */

export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    if (!key) continue;
    try {
      list[key] = decodeURIComponent(val);
    } catch {
      list[key] = val;
    }
  }
  return list;
}

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  domain?: string;
}

export function serializeCookie(name: string, val: string, options: CookieOptions = {}): string {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;

  if (options.maxAge !== undefined) {
    str += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.domain) {
    str += `; Domain=${options.domain}`;
  }
  if (options.path) {
    str += `; Path=${options.path}`;
  }
  if (options.httpOnly) {
    str += '; HttpOnly';
  }
  if (options.secure) {
    str += '; Secure';
  }
  if (options.sameSite) {
    const s = options.sameSite;
    str += `; SameSite=${s.charAt(0).toUpperCase() + s.slice(1)}`;
  }

  return str;
}
