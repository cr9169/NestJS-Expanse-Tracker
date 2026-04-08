import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { LoginDto } from '@shared/dtos/auth/login.dto';
import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';
import { TokenIssuerService } from '../services/token-issuer.service';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly tokenIssuer: TokenIssuerService,
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

    return this.tokenIssuer.issueTokenPair(user.id, user.email);
  }
}
