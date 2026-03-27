import { AppException } from './app.exception';

/** Thrown when a domain invariant is violated (e.g. negative amount). HTTP 400. */
export class DomainException extends AppException {
  constructor(code: string, message: string) {
    super(code, message, 400);
  }
}
