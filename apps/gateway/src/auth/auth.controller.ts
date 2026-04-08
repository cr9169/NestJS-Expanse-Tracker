import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import { RegisterDto } from '@shared/dtos/auth/register.dto';
import { LoginDto } from '@shared/dtos/auth/login.dto';
import { RefreshTokenDto } from '@shared/dtos/auth/refresh-token.dto';
import { TokenResponseDto } from '@shared/dtos/auth/token-response.dto';

import { Public } from '../common/decorators/public.decorator';
import { ThrottlerBehindProxyGuard } from '../common/guards/throttler-behind-proxy.guard';

import { AUTH_SERVICE_TOKEN } from './tokens';

/**
 * ARCHITECTURE NOTE:
 * All auth routes are @Public() because they are the mechanism by which a user
 * GETS their token — they cannot present a token they don't yet have.
 * Rate limiting via ThrottlerGuard is applied specifically to auth routes to
 * prevent brute-force attacks, with a separate (stricter) limit than API routes.
 */
@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly client: ClientProxy,
  ) {}

  @Public()
  @UseGuards(ThrottlerBehindProxyGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered', type: TokenResponseDto })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async register(@Body() dto: RegisterDto): Promise<TokenResponseDto> {
    return firstValueFrom(
      this.client.send<TokenResponseDto>(TCP_PATTERNS.AUTH_REGISTER, dto),
    );
  }

  @Public()
  @UseGuards(ThrottlerBehindProxyGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return firstValueFrom(
      this.client.send<TokenResponseDto>(TCP_PATTERNS.AUTH_LOGIN, dto),
    );
  }

  @Public()
  @UseGuards(ThrottlerBehindProxyGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return firstValueFrom(
      this.client.send<TokenResponseDto>(TCP_PATTERNS.AUTH_REFRESH, { refreshToken: dto.refreshToken }),
    );
  }
}
