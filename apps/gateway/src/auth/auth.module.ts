import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';

import { AppConfigService } from '../config/app-config.service';

import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EXPENSES_SERVICE_TOKEN } from './tokens'; // used as the ClientProxy name

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiration },
      }),
    }),

    // TCP client for communicating with expenses-service
    ClientsModule.registerAsync([
      {
        name: EXPENSES_SERVICE_TOKEN,
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.tcpHost,
            port: config.tcpPort,
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  // JwtStrategy and PassportModule are exported so the global JwtAuthGuard
  // (registered in bootstrap) can use the 'jwt' strategy defined here.
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
