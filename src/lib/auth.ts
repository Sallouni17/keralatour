import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole } from './types.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'company-a-kochi-secret-session-key-32chars-min';
const PREVIEW_SECRET = process.env.PREVIEW_SECRET || 'preview-secret-salt-kochi-travel';

export const SESSION_COOKIE_NAME = 'company_a_session';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Signs a session payload using HMAC-SHA256 into a safe base64url string.
 */
export function createSessionToken(payload: Omit<SessionPayload, 'createdAt' | 'expiresAt'>, durationMs = 7 * 24 * 60 * 60 * 1000): string {
  const now = Date.now();
  const session: SessionPayload = {
    ...payload,
    createdAt: now,
    expiresAt: now + durationMs,
  };

  const dataStr = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataStr)
    .digest('base64url');

  return `${dataStr}.${signature}`;
}

/**
 * Verifies and parses a session token.
 */
export function verifySessionToken(tokenString?: string | null): SessionPayload | null {
  if (!tokenString) return null;
  const parts = tokenString.split('.');
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataStr)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(dataStr, 'base64url').toString('utf-8');
    const session: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Checks role-based access control.
 * ADMIN has universal access.
 * Otherwise user's role must match one of allowedRoles.
 */
export function checkRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === 'ADMIN') return true;
  return allowedRoles.includes(userRole);
}

/**
 * Signs a draft package preview URL with expiry.
 */
export function signPreviewToken(packageId: string, versionId: string, expiresInMs = 2 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + expiresInMs;
  const payload = `${packageId}:${versionId}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', PREVIEW_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/**
 * Verifies a draft package preview token.
 */
export function verifyPreviewToken(token?: string | null): {
  valid: boolean;
  packageId?: string;
  versionId?: string;
} {
  if (!token) return { valid: false };

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };

    const [packageId, versionId, expiresAtStr, sig] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${packageId}:${versionId}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', PREVIEW_SECRET).update(payload).digest('hex');

    if (sig !== expectedSig) {
      return { valid: false };
    }

    return { valid: true, packageId, versionId };
  } catch {
    return { valid: false };
  }
}
