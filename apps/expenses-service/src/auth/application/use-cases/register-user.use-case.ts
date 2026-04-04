import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { RegisterDto } from '@shared/dtos/auth/register.dto';
import type { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { ValidationException } from '../../../common/exceptions/validation.exception';
import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../tokens';
import { BCRYPT_ROUNDS } from '../auth.constants';
import { TokenIssuerService } from '../services/token-issuer.service';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly tokenIssuer: TokenIssuerService,
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

    return this.tokenIssuer.issueTokenPair(user.id, user.email);
  }
}
