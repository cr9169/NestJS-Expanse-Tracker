import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { LoginDto } from '@shared/dtos/auth/login.dto';
import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { AppConfigService } from '../../../config/app-config.service';
import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    // Use constant-time comparison to prevent timing attacks.
    // Even if user doesn't exist, we run bcrypt.compare against a dummy hash
    // so the response time is the same regardless — an attacker can't enumerate
    // valid emails by measuring response time differences.
    const dummyHash = '$2b$12$invalidhashpaddingtomatchlength...............................';
    const passwordToCompare = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(dto.password, passwordToCompare);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: '7d',
    });

    // Rotate: invalidate old token, store hash of new one
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.updateRefreshToken(user.id, hash);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
