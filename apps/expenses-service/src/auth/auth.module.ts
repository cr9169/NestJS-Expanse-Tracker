import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppConfigService } from '../config/app-config.service';
import { DatabaseModule } from '../database/database.module';

import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { AuthController } from './auth.controller';
import { SqliteUserRepository } from './infrastructure/repositories/sqlite-user.repository';
import {
  LOGIN_USER_USE_CASE_TOKEN,
  REFRESH_TOKEN_USE_CASE_TOKEN,
  REGISTER_USER_USE_CASE_TOKEN,
  USER_REPOSITORY_TOKEN,
} from './tokens';

@Module({
  imports: [
    DatabaseModule,
    // JwtModule without a default secret — each use-case passes the secret
    // explicitly so we can use different secrets for access vs refresh tokens.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AppConfigService,
    { provide: USER_REPOSITORY_TOKEN, useClass: SqliteUserRepository },
    { provide: REGISTER_USER_USE_CASE_TOKEN, useClass: RegisterUserUseCase },
    { provide: LOGIN_USER_USE_CASE_TOKEN, useClass: LoginUserUseCase },
    { provide: REFRESH_TOKEN_USE_CASE_TOKEN, useClass: RefreshTokenUseCase },
  ],
})
export class AuthModule {}
