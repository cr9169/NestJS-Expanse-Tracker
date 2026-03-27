import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtPayload } from '@shared/types/jwt-payload.type';

/**
 * Extracts the authenticated user's JWT payload from the request.
 * The JwtStrategy populates request.user after successful token verification.
 *
 * Usage: async myRoute(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
