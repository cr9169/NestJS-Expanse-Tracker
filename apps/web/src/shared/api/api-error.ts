/**
 * Mirrors the gateway's ApiErrorResponse shape:
 *   { statusCode, error, message, code }
 *
 * Surfacing the machine-readable `code` field lets components branch on it
 * (e.g. show "Email already taken" inline on register) without parsing
 * human-readable strings.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;

  constructor(message: string, statusCode: number, code: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static fromUnknown(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    if (err instanceof Error) {
      return new ApiError(err.message, 0, 'UNKNOWN');
    }
    return new ApiError('Unknown error', 0, 'UNKNOWN');
  }
}
