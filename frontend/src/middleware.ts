import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware function for authentication and routing
 * Runs on the edge before page rendering
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for authentication cookies
  const authToken = request.cookies.get("fluxori_auth_token")?.value;
  const refreshToken = request.cookies.get("fluxori_refresh_token")?.value;
  const userRole = request.cookies.get("fluxori_user_role")?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/reset-password",
    "/forgot-password",
    "/verify-email",
    "/join-organization",
    "/privacy-policy",
    "/terms-of-service",
  ];

  // Admin-only routes
  const adminRoutes = [
    "/admin",
    "/dashboard/settings/users",
    "/dashboard/settings/organization",
    "/dashboard/settings/billing",
  ];

  // Manager-only routes (admin can also access these)
  const managerRoutes = ["/dashboard/settings/integrations"];

  // Static assets and API routes should be excluded from middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // Files like favicon.ico, etc.
  ) {
    return NextResponse.next();
  }

  // If accessing a protected route without being logged in, redirect to login
  if (
    !authToken &&
    !publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If already logged in and trying to access login/register pages, redirect to dashboard
  if (authToken && (pathname === "/login" || pathname === "/register")) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  // Role-based access checks for admin routes
  if (
    authToken &&
    adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ) &&
    userRole !== "admin"
  ) {
    const url = new URL("/unauthorized", request.url);
    return NextResponse.redirect(url);
  }

  // Role-based access checks for manager routes
  if (
    authToken &&
    managerRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ) &&
    userRole !== "admin" &&
    userRole !== "manager"
  ) {
    const url = new URL("/unauthorized", request.url);
    return NextResponse.redirect(url);
  }

  // Check token expiration (rough check, will be verified properly by the API)
  const tokenExpiry = request.cookies.get("fluxori_token_expiry")?.value;
  const isTokenExpired = tokenExpiry && parseInt(tokenExpiry, 10) < Date.now();

  // If token is expired but we have a refresh token, add a header for client-side refresh
  if (authToken && isTokenExpired && refreshToken) {
    const response = NextResponse.next();
    response.headers.set("X-Auth-Token-Expired", "true");
    return response;
  }

  // For other routes, allow the request to proceed
  return NextResponse.next();
}

/**
 * Configuration for which paths to run middleware on
 */
export const config = {
  // Apply middleware only to specific routes
  matcher: [
    /*
     * Match all request paths except for:
     * 1. Static files like images, fonts, etc
     * 2. API routes
     * 3. Next.js internal routes (_next)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
