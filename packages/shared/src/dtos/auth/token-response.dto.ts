import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15 min)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived refresh token (7 days) — store securely' })
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiration in seconds', example: 900 })
  expiresIn!: number;
}
