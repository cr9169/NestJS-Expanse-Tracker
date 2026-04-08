import { AppException } from './app.exception';

/** Thrown when input is structurally valid but semantically wrong. HTTP 422. */
export class ValidationException extends AppException {
  constructor(code: string, message: string) {
    super(code, message, 422);
  }
}
