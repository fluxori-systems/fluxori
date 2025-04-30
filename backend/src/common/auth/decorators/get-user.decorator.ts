// Placeholder for GetUser decorator
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// User interface should be defined according to your application's user model
export interface User {
  id: string;
  email: string;
  organizationId?: string;
  // Add any additional fields as needed
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    return request.user;
  },
);
