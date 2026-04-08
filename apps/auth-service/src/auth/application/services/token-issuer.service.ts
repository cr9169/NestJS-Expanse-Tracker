import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { AppConfigService } from '../../../config/app-config.service';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';
import { BCRYPT_ROUNDS } from '../auth.constants';

/**
 * Centralises access + refresh token creation, refresh-token rotation,
 * and the expiresIn calculation so auth use-cases stay focused on their
 * own business rules.
 */
@Injectable()
export class TokenIssuerService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async issueTokenPair(
    userId: string,
    email: string,
  ): Promise<TokenResponseDto> {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwtSecret,
      expiresIn: this.config.jwtExpiration,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiration,
    });

    // Rotate: store hash of new refresh token, never the token itself
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.updateRefreshToken(userId, hash);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationToSeconds(this.config.jwtExpiration),
    };
  }

  /**
   * Converts a shorthand duration string (e.g. '15m', '1h', '7d') to seconds.
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // fallback to 15 minutes

    const value = parseInt(match[1]!, 10);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] ?? 60);
  }
}
