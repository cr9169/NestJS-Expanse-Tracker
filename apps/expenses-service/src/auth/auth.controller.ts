import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import type { RegisterDto } from '@shared/dtos/auth/register.dto';
import type { LoginDto } from '@shared/dtos/auth/login.dto';

import { handleRpc } from '../common/handle-rpc';

import type { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import type { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import type { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import {
  REGISTER_USER_USE_CASE_TOKEN,
  LOGIN_USER_USE_CASE_TOKEN,
  REFRESH_TOKEN_USE_CASE_TOKEN,
} from './tokens';

@Controller()
export class AuthController {
  constructor(
    @Inject(REGISTER_USER_USE_CASE_TOKEN)
    private readonly registerUser: RegisterUserUseCase,

    @Inject(LOGIN_USER_USE_CASE_TOKEN)
    private readonly loginUser: LoginUserUseCase,

    @Inject(REFRESH_TOKEN_USE_CASE_TOKEN)
    private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  @MessagePattern(TCP_PATTERNS.AUTH_REGISTER)
  async register(@Payload() dto: RegisterDto): Promise<unknown> {
    return handleRpc(() => this.registerUser.execute(dto));
  }

  @MessagePattern(TCP_PATTERNS.AUTH_LOGIN)
  async login(@Payload() dto: LoginDto): Promise<unknown> {
    return handleRpc(() => this.loginUser.execute(dto));
  }

  @MessagePattern(TCP_PATTERNS.AUTH_REFRESH)
  async refresh(@Payload() payload: { refreshToken: string }): Promise<unknown> {
    return handleRpc(() => this.refreshToken.execute(payload.refreshToken));
  }
}
