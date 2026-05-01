import type { JwtPayload } from '@shared/types/jwt-payload.type';

/**
 * Client-side JWT decode. Treat the result as ADVISORY ONLY — do not gate
 * sensitive logic on it. The server is the authority on identity; this is just
 * for surfacing the email in the topbar without an extra round trip.
 *
 * Signature is NOT verified here. We only base64url-decode the payload segment.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
