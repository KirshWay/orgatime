import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { IpRequestLike } from '../http/http.types';

export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<IpRequestLike>();
    return request.ip || 'unknown';
  },
);
