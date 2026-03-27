import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { JwtPayload } from '@shared/types/jwt-payload.type';

import { AppConfigService } from '../../config/app-config.service';

/**
 * Extracts and validates JWT Bearer tokens on every authenticated request.
 * The validated payload becomes request.user, accessible via @CurrentUser().
 * The strategy runs BEFORE the controller — if validation fails, NestJS throws
 * UnauthorizedException before the controller method is ever called.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  /** Called after signature verification — return value becomes request.user */
  validate(payload: JwtPayload): JwtPayload {
    return { sub: payload.sub, email: payload.email };
  }
}
