# Authentication Access Pattern

## Overview

This document describes the standardized pattern for accessing authentication-related functionality throughout the Fluxori application.

## Common Auth Module

The common auth module provides a unified interface for accessing auth components, making it easier to use auth functionality consistently across the application.

### Usage

```typescript
// Import all needed auth components from the common auth module
import { 
  FirebaseAuthGuard, 
  GetUser, 
  DecodedFirebaseToken,
  AuthUtils 
} from 'src/common/auth';

@Controller('my-endpoint')
@UseGuards(FirebaseAuthGuard)
export class MyController {
  
  @Get()
  async myEndpoint(@GetUser() user: DecodedFirebaseToken) {
    // Use the typed user object
    const userId = user.uid;
    const userOrg = user.organizationId;
    
    // Use auth utilities for common checks
    if (AuthUtils.isAdmin(user)) {
      // User is an admin
    }
    
    if (AuthUtils.isInOrganization(user, 'org-123')) {
      // User belongs to the organization
    }
    
    if (AuthUtils.isOwner(user, 'resource-owner-id')) {
      // User owns the resource
    }
  }
}
```

## Key Components

### 1. Guards

The `FirebaseAuthGuard` is used to protect routes that require authentication.

```typescript
@UseGuards(FirebaseAuthGuard)
export class MyController {
  // Protected routes
}
```

### 2. Decorators

The `GetUser` decorator provides access to the authenticated user.

```typescript
@Get()
async myEndpoint(@GetUser() user: DecodedFirebaseToken) {
  // Access user properties
}
```

### 3. Types

The `DecodedFirebaseToken` interface provides a standardized type for user information.

```typescript
interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  organizationId?: string;
  role?: string;
  [key: string]: any;
}
```

### 4. Utilities

The `AuthUtils` object provides helper methods for common auth operations.

```typescript
// Check if a user has admin role
AuthUtils.isAdmin(user);

// Check if a user belongs to an organization
AuthUtils.isInOrganization(user, organizationId);

// Check if a user is the owner of a resource
AuthUtils.isOwner(user, ownerId);
```

## Best Practices

1. **Always use the common auth module**
   - Import from `src/common/auth` instead of directly from the auth module
   - This ensures consistent usage and simplifies future refactoring

2. **Type your user objects**
   - Always type user objects as `DecodedFirebaseToken`
   - This provides better type safety and code completion

3. **Use auth utilities for common checks**
   - Use the provided utility functions rather than reimplementing checks
   - This ensures consistent behavior across the application

4. **Don't expose auth internals**
   - Don't export internal auth implementation details from your modules
   - If you need custom auth functionality, extend the common auth module

## Implementation Details

The common auth module is implemented as a set of re-exports from the auth module, with additional utilities for common operations. This approach allows us to refactor the auth module internals without breaking dependent code.

```typescript
// src/common/auth/index.ts
export {
  FirebaseAuthGuard,
  GetUser,
  Public,
  AuthService,
  FirebaseAuthService
} from 'src/modules/auth';

// Additional utilities and types...
```