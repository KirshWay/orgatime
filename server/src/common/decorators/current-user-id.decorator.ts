import {
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

type AuthenticatedRequestLike = {
  user?: {
    id?: string;
  };
};

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequestLike>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return userId;
  },
);
