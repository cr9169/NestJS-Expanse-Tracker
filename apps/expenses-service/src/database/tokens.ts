/**
 * ARCHITECTURE NOTE:
 * Using a string token (not Symbol) here because better-sqlite3's Database
 * instance needs to be injected across module boundaries, and Symbols don't
 * serialize well across dynamic module loading in some NestJS edge cases.
 * For use-case and repository tokens we use Symbols — only DB gets a string.
 */
export const DATABASE_TOKEN = 'DATABASE';
