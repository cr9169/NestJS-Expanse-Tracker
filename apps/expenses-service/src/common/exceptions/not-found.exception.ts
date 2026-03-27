import { AppException } from './app.exception';

/** Thrown when a requested resource does not exist or does not belong to the user. HTTP 404. */
export class NotFoundException extends AppException {
  constructor(code: string, message: string) {
    super(code, message, 404);
  }
}
