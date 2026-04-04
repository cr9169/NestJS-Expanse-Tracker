import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { AppConfigService } from '../../../config/app-config.service';
import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';
import { TokenIssuerService } from '../services/token-issuer.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly tokenIssuer: TokenIssuerService,
  ) {}

  async execute(refreshToken: string): Promise<TokenResponseDto> {
    // Verify the refresh token signature and expiry
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Validate that the presented token matches the stored hash (rotation check)
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Token reuse detected — revoke all tokens for this user
      await this.userRepository.updateRefreshToken(user.id, null);
      throw new UnauthorizedException('Refresh token has already been used');
    }

    return this.tokenIssuer.issueTokenPair(user.id, user.email);
  }
}
