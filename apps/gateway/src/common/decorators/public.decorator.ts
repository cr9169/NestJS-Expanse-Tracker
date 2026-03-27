import { SetMetadata } from '@nestjs/common';

/**
 * Mark a route as public (no JWT required).
 *
 * ARCHITECTURE NOTE:
 * The default is AUTHENTICATED — every route requires a valid JWT unless
 * explicitly opted out with @Public(). This "secure by default" pattern
 * means a developer can never accidentally forget to add auth to a new route.
 * In an opt-in model, a forgotten @UseGuards() leaves the route open.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
