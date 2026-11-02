import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { getJwtSecret } from './jwt-config';
import { parseTokenClaims } from './session';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: getJwtSecret(config),
    });
  }

  async validate(payload: unknown) {
    const claims = parseTokenClaims(payload, 'access');
    return this.authService.validateUser(claims.sub, claims.sid);
  }
}
