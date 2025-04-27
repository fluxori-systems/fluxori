import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { FirebaseAuthService } from "../services/firebase-auth.service";

/**
 * Firebase Authentication Guard for Nest routes
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseAuth: FirebaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authentication token",
      );
    }
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await this.firebaseAuth.verifyIdToken(token);
      request.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "user",
        organizationId: decodedToken.organizationId,
      };
      return true;
    } catch (e) {
      this.logger.error(
        `Authentication failed: ${(e as Error).message}`,
        (e as Error).stack,
      );
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}
