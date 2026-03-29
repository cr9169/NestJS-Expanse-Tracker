import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT guard registered via APP_GUARD in AppModule.
 * All routes require a valid JWT unless decorated with @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<TUser = any>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Missing or invalid access token');
    }
    return user;
  }
}
