import { AppException } from './app.exception';

/** Thrown when a user is not authorized to perform an action. HTTP 401. */
export class UnauthorizedException extends AppException {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}
