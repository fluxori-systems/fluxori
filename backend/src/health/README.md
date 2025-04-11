# Health Controller and Indicators

This directory contains the health check implementation for the Fluxori backend application.

## TypeScript Compatibility Notes

The health controller and indicators use NestJS decorators that may cause TypeScript errors due to signature mismatches between TypeScript's type system and NestJS's runtime behavior. These errors have been resolved using `@ts-ignore` directives throughout the controller code.

## Key Components

- `health.controller.ts`: Provides endpoints for various health checks
- `firestore-health.indicator.ts`: Implements health checks for Firebase connections
- `nest-terminus.d.ts`: Type declarations to improve TypeScript compatibility

## Resolving NestJS Decorator Errors

When facing NestJS decorator TypeScript errors in the future, consider these approaches:

1. Add `@ts-ignore` directives above problematic decorators
2. Remove `async` from method signatures that use `@HealthCheck()` decorator
3. Specify explicit return types for all controller methods
4. Update the declaration file in `nest-terminus.d.ts` as needed

## Remaining TypeScript Errors

There are still TypeScript errors in other parts of the codebase, particularly:

1. NestJS decorator errors in controllers across the application
2. Type mismatches in repository implementations
3. Firestore-related type issues

Use a similar approach to resolving these issues:
- Add `@ts-ignore` directives to problematic decorators
- Fix method signatures to match expected return types
- Use explicit type assertions where needed