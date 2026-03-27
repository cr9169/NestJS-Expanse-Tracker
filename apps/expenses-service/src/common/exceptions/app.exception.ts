/**
 * ARCHITECTURE NOTE:
 * AppException is the root of all intentional errors in this system.
 * Extending Error ensures stack traces are preserved. The `code` field is a
 * stable machine-readable string (e.g. "EXPENSE_NOT_FOUND") that never changes
 * — unlike `message` which may be localised. The `statusCode` field lets the
 * gateway exception filter map to the correct HTTP status without a lookup table.
 *
 * WHY not throw raw Errors: Raw errors have no `code` or `statusCode`. The
 * filter would have to inspect `message` strings (brittle) or use instanceof
 * chains (fragile across module boundaries). Custom hierarchy makes the mapping
 * deterministic and extensible.
 */
export class AppException extends Error {
  constructor(
    /** Stable machine-readable code for frontend conditionals and i18n */
    public readonly code: string,
    /** Human-readable message — may be shown to users */
    message: string,
    /** HTTP status code to send from the gateway */
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper prototype chain in TypeScript → ES5 transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
