import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Decorator to get the authenticated user from the request
 */
export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
