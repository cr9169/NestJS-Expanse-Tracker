import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import type { RegisterDto } from '@shared/dtos/auth/register.dto';
import type { LoginDto } from '@shared/dtos/auth/login.dto';

import { AppException } from '../common/exceptions/app.exception';

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
    return this.handle(() => this.registerUser.execute(dto));
  }

  @MessagePattern(TCP_PATTERNS.AUTH_LOGIN)
  async login(@Payload() dto: LoginDto): Promise<unknown> {
    return this.handle(() => this.loginUser.execute(dto));
  }

  @MessagePattern(TCP_PATTERNS.AUTH_REFRESH)
  async refresh(@Payload() payload: { refreshToken: string }): Promise<unknown> {
    return this.handle(() => this.refreshToken.execute(payload.refreshToken));
  }

  private async handle<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AppException) {
        throw new RpcException({
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });
      }
      throw new RpcException({ code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 });
    }
  }
}
