// Placeholder for AuthUtils
export class AuthUtils {
  static isOwner(user: { uid: string }, userId: string): boolean {
    return user.uid === userId;
  }
  // Add additional methods as needed
}
