import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { RegisterDto } from '@shared/dtos/auth/register.dto';
import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { AppConfigService } from '../../../config/app-config.service';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async execute(dto: RegisterDto): Promise<TokenResponseDto> {
    // Check uniqueness before hashing (cheaper)
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ValidationException('EMAIL_TAKEN', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = User.create({ email: dto.email, passwordHash });
    await this.userRepository.save(user);

    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<TokenResponseDto> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: '7d',
    });

    // Store hash of refresh token — never the token itself
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepository.updateRefreshToken(user.id, hash);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
