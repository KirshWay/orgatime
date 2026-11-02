import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SESSION = /^v1:([0-9a-f-]{36}):([0-9a-f]{64})$/;

type TokenClaims = {
  sub: string;
  sid: string;
  purpose: 'access' | 'refresh';
  iat: number;
  exp: number;
};

export function parseTokenClaims(
  value: unknown,
  purpose: TokenClaims['purpose'],
): TokenClaims {
  if (typeof value !== 'object' || value === null) {
    throw new UnauthorizedException('Invalid token');
  }
  const claims = value as Record<string, unknown>;
  if (
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    typeof claims.sid !== 'string' ||
    !UUID.test(claims.sid) ||
    claims.purpose !== purpose ||
    !Number.isSafeInteger(claims.iat) ||
    !Number.isSafeInteger(claims.exp) ||
    (claims.exp as number) <= Math.floor(Date.now() / 1000) ||
    (purpose === 'refresh' &&
      (typeof claims.jti !== 'string' || !UUID.test(claims.jti)))
  ) {
    throw new UnauthorizedException('Invalid token');
  }
  return {
    sub: claims.sub,
    sid: claims.sid,
    purpose,
    iat: claims.iat as number,
    exp: claims.exp as number,
  };
}

export function readSession(value: string | null | undefined) {
  const match = typeof value === 'string' ? SESSION.exec(value) : null;
  return match && UUID.test(match[1]) ? { sid: match[1] } : null;
}

export function storeSession(sid: string, refreshToken: string): string {
  const digest = createHash('sha256').update(refreshToken).digest('hex');
  return `v1:${sid}:${digest}`;
}
