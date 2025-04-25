import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get the authenticated user from the request
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If data is provided, return specific field from user
    return data ? user?.[data] : user;
  },
);
