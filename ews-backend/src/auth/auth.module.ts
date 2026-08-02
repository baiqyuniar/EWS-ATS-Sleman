import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { CaptchaService } from './captcha.service';
import { WebauthnService } from './webauthn.service';
import { WebauthnController } from './webauthn.controller';
import { getJwtSecret } from '../config/security.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getJwtSecret(config),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '8h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, CaptchaService, WebauthnService],
  controllers: [AuthController, WebauthnController],
  exports: [AuthService],
})
export class AuthModule {}
