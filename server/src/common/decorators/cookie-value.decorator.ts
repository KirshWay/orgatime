import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { CookieRequestLike } from '../http/http.types';

export const CookieValue = createParamDecorator(
  (cookieName: string, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<CookieRequestLike>();
    return request.cookies?.[cookieName];
  },
);
