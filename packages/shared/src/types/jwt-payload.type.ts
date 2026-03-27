/**
 * The decoded JWT payload shape, shared between gateway (verification)
 * and expenses-service (authorization checks in use-cases).
 * Living in @app/shared ensures both apps can never drift out of sync.
 */
export interface JwtPayload {
  /** User ID (subject claim) */
  sub: string;
  /** User email */
  email: string;
  /** Issued at (Unix timestamp) — set by JWT library */
  iat?: number;
  /** Expiration (Unix timestamp) — set by JWT library */
  exp?: number;
}
