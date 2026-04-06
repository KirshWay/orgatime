import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieReplyLike } from '../http/http.types';

@Injectable()
export class RefreshTokenCookieService {
  private static readonly COOKIE_NAME = 'refreshToken';
  private static readonly COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  private static readonly COOKIE_MAX_AGE_SECONDS =
    RefreshTokenCookieService.COOKIE_MAX_AGE_MS / 1000;

  constructor(private readonly configService: ConfigService) {}

  set(reply: CookieReplyLike, refreshToken: string): void {
    reply.setCookie(
      RefreshTokenCookieService.COOKIE_NAME,
      refreshToken,
      this.getCookieOptions(),
    );
  }

  clear(reply: CookieReplyLike): void {
    reply.clearCookie(
      RefreshTokenCookieService.COOKIE_NAME,
      this.getCookieOptions(),
    );
  }

  private getCookieOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: RefreshTokenCookieService.COOKIE_MAX_AGE_SECONDS,
      expires: new Date(
        Date.now() + RefreshTokenCookieService.COOKIE_MAX_AGE_MS,
      ),
    };
  }
}
