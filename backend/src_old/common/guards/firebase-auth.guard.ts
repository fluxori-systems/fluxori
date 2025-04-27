import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FirebaseAuthService } from "@modules/auth/services/firebase-auth.service";
import { IS_PUBLIC_KEY } from "@modules/auth/decorators/public.decorator";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly firebaseAuth: FirebaseAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authentication token",
      );
    }
    try {
      const token = authHeader.split(" ")[1];
      const decodedToken = await this.firebaseAuth.verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "user",
        organizationId: decodedToken.organizationId,
      };
      return true;
    } catch (error: any) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}
