# Fixing API Types

This document provides guidelines for fixing API-related TypeScript errors in the Fluxori frontend.

## Common API Type Issues

1. **Missing parameter types**

   - Function parameters without explicit type annotations
   - Example: `getSignedUploadUrl: async (params) => { ... }`

2. **Unknown API response types**

   - Using `any` or `unknown` for API responses
   - Example: `return await client.get<any[]>('/files', { params });`

3. **Type assertion issues**
   - Incorrect type assertions when setting state
   - Example: `setOrganizations(orgs);` where `orgs` is untyped

## Solution Approach

### 1. Create Comprehensive API Types

Create a well-organized set of type definitions for API requests and responses:

```typescript
// src/lib/api/types/storage.ts
export interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  path: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignedUrlRequest {
  fileName: string;
  contentType: string;
  entityType?: string;
  entityId?: string;
}

export interface SignedUrlResponse {
  url: string;
  fileId: string;
  fields: Record<string, string>;
}
```

### 2. Create Type-Safe API Client

Implement a type-safe API client that uses the defined types:

```typescript
// src/lib/api/client.ts
import axios, { AxiosInstance } from "axios";
import {
  FileMetadata,
  SignedUrlRequest,
  SignedUrlResponse,
} from "./types/storage";

export function createApiClient(): AxiosInstance {
  // Implementation details...
}

export const storageApi = {
  getSignedUploadUrl: async (
    params: SignedUrlRequest,
  ): Promise<SignedUrlResponse> => {
    const client = createApiClient();
    const response = await client.post<SignedUrlResponse>(
      "/files/signed-url",
      params,
    );
    return response;
  },

  getFiles: async (params: {
    entityType?: string;
    entityId?: string;
  }): Promise<FileMetadata[]> => {
    const client = createApiClient();
    const response = await client.get<FileMetadata[]>("/files", { params });
    return response;
  },
  // Other methods...
};
```

### 3. Use Type Guards for API Responses

Implement type guards to safely handle API responses:

```typescript
// src/lib/api/guards.ts
import { FileMetadata } from "./types/storage";

export function isFileMetadata(data: unknown): data is FileMetadata {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "fileName" in data &&
    "contentType" in data
  );
}

export function isFileMetadataArray(data: unknown): data is FileMetadata[] {
  return Array.isArray(data) && (data.length === 0 || isFileMetadata(data[0]));
}
```

### 4. Update Component Usage

Update components to use the type-safe API client and proper type assertions:

```tsx
// Before
const fetchFiles = async () => {
  const files = await api.storage.getFiles({ entityType: "product" });
  setFiles(files); // Type error: files has unknown type
};

// After
const fetchFiles = async () => {
  const files = await storageApi.getFiles({ entityType: "product" });
  // No type error because files is properly typed as FileMetadata[]
  setFiles(files);
};
```

## Implementation Steps

1. **Create type definition files**

   - Create separate files for different API domains (storage, auth, etc.)
   - Define interfaces for all request and response types

2. **Implement type-safe API client**

   - Create a new API client that uses the defined types
   - Add proper return types to all API methods

3. **Add type guards**

   - Create type guards for runtime type checking
   - Use these guards when working with API responses

4. **Update component usage**
   - Update all components to use the new type-safe API client
   - Fix any remaining type assertion issues

## Testing the Implementation

After implementing these changes:

1. **Run TypeScript check**

   ```bash
   npm run typecheck
   ```

2. **Test API interactions**
   - Verify that API calls work correctly
   - Check that type errors are properly caught during development
