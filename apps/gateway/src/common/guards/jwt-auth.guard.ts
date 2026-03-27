import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * ARCHITECTURE NOTE:
 * This guard extends Passport's AuthGuard('jwt') and adds the @Public() opt-out.
 * It is registered GLOBALLY in main.ts — not per-controller — so auth cannot be
 * accidentally omitted from a new route. The guard checks for the IS_PUBLIC_KEY
 * metadata set by @Public() before delegating to Passport.
 *
 * Registering globally in bootstrap (not as a module provider) is intentional:
 * module-level guards can be bypassed by importing a module without the guard.
 * Bootstrap-level registration applies unconditionally to every route.
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
