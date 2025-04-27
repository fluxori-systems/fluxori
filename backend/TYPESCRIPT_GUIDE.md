# TypeScript Configuration Guide for Fluxori Backend

## Overview

This document provides guidelines for working with TypeScript in the Fluxori backend codebase, focusing on specific compiler configurations needed for NestJS and decorator metadata to work correctly.

## TypeScript Configuration

The backend uses the following TypeScript configuration to ensure compatibility with NestJS decorators:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,

    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,

    "useUnknownInCatchVariables": false,
    "useDefineForClassFields": true,

    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "resolveJsonModule": true,

    "downlevelIteration": true,
    "importHelpers": true,
    "lib": ["es2022", "dom"],

    "typeRoots": ["./node_modules/@types", "./src/types"],
    "allowJs": true
  }
}
```

## NestJS Decorator Metadata

The NestJS framework relies heavily on TypeScript decorators and reflection metadata. Key compiler options required for NestJS decorators to work correctly:

- `"emitDecoratorMetadata": true`
- `"experimentalDecorators": true`
- `"target": "es2022"` (ES2022 or higher is needed for modern JavaScript features)
- `"module": "NodeNext"` (with matching `"moduleResolution": "nodenext"`)

## Common TypeScript Errors and Solutions

### 1. Decorator-related Errors

Errors such as:

```
Unable to resolve signature of method decorator when called as an expression.
```

or

```
Decorators are not valid here.
```

**Solution**:

- Ensure `experimentalDecorators` and `emitDecoratorMetadata` are set to true
- If errors persist, consider using `@ts-ignore` in isolated places where decorators are causing issues
- For controllers with many decorator errors, consider a solution-specific approach that disables type checking for that file

### 2. Set/Map Iteration Errors

Errors such as:

```
Type 'Set<K>' can only be iterated through when using the '--downlevelIteration' flag
```

**Solution**:

- Ensure `downlevelIteration` is set to true
- Use ES2022 or higher as target

### 3. Module Resolution Errors

Errors like:

```
Cannot find module '...' or its corresponding type declarations.
```

**Solution**:

- Use proper moduleResolution ("nodenext" paired with "NodeNext" module)
- Ensure paths are correctly configured
- Use `skipLibCheck` for third-party libraries causing issues

## Type Checking Scripts

- Regular type checking: `npm run typecheck`
- Type checking with skipped libraries: `npm run typecheck -- --skipLibCheck`
- Individual file checking: `npx tsc path/to/file.ts --noEmit --skipLibCheck`

## Best Practices for NestJS and TypeScript

1. **Decorators**:

   - Use proper import syntax from NestJS modules
   - Place decorators on separate lines for better readability
   - For parameter decorators, ensure they are directly attached to parameters

2. **Type Definitions**:

   - Create interfaces for DTOs, entities, and repository methods
   - Use generics for repository pattern implementation
   - Prefer explicit return types on methods, especially in services and controllers

3. **Dependency Injection**:

   - Use constructor injection and proper type annotations
   - Use the @Injectable() decorator on services
   - Use @Inject() only when necessary for non-class tokens

4. **Working with South African Specific Features**:
   - Ensure proper typing for load shedding detection and network optimization features
   - Use well-typed interfaces for regional configurations

## Maintaining TypeScript in the Future

1. **Adding New Files**:

   - Follow existing patterns for similar components
   - Use interfaces for models and DTOs
   - Add explicit return types to all methods

2. **Troubleshooting**:

   - For specific decorator issues that cannot be fixed with configuration, use targeted `@ts-ignore` comments
   - For third-party library issues, use `skipLibCheck` but document the issue
   - For module resolution issues, check import paths and tsconfig paths configuration

3. **Node.js Version Compatibility**:
   - Be aware that some packages require Node.js v20+ while the project currently uses v18
   - Document any workarounds needed for version compatibility
