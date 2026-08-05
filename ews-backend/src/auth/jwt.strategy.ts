// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { getJwtSecret } from '../config/security.config';

// export interface JwtPayload {
//   sub: number;
//   email: string;
//   role: string;
//   schoolId?: number | null;
//   opdId?: number | null;
//   wilayahId?: number | null;
// }

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(config: ConfigService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: getJwtSecret(config),
//     });
//   }

//   async validate(payload: JwtPayload) {
//     // Attaches to request.user, consumed by @CurrentUser() and RolesGuard
//     return {
//       userId: payload.sub,
//       email: payload.email,
//       role: payload.role,
//       schoolId: payload.schoolId,
//       opdId: payload.opdId,
//       wilayahId: payload.wilayahId,
//     };
//   }
// }

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getJwtSecret, ACCESS_TOKEN_COOKIE } from '../config/security.config';

// SECURITY: token diambil dari cookie httpOnly (ACCESS_TOKEN_COOKIE), bukan
// dari header Authorization lagi — frontend tidak pernah menyimpan/mengirim
// token secara manual, jadi tidak ada JS yang bisa membacanya (mitigasi XSS).
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.[ACCESS_TOKEN_COOKIE] || null;
};

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  schoolId?: number | null;
  opdId?: number | null;
  wilayahId?: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(config),
    });
  }

  async validate(payload: JwtPayload) {
    // Attaches to request.user, consumed by @CurrentUser() and RolesGuard
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
      opdId: payload.opdId,
      wilayahId: payload.wilayahId,
    };
  }
}