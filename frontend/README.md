# Fluxori Frontend

This is the frontend application for Fluxori, a comprehensive e-commerce operations platform tailored for South African e-commerce sellers.

## Features

- **Authentication**: Secure user authentication with Firebase Auth
- **Multi-tenancy**: Organization-based data isolation for secure multi-tenant operations
- **Dashboard**: Analytics and overview of key business metrics
- **Inventory Management**: Track inventory across multiple warehouses
- **Product Management**: Create and manage products with variants
- **Order Management**: Process and fulfill orders from multiple channels
- **Marketplace Integration**: Connect with popular e-commerce marketplaces
- **Analytics**: Business intelligence and reporting

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.4.2
- **UI Library**: Mantine UI
- **State Management**: React Context + React Query + Zustand
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage

## Authentication & Multi-Tenancy

### Authentication Features

- **Multiple Providers**: Email/password and Google OAuth 2.0
- **Token Management**: Secure JWT with automatic refresh mechanism
- **Middleware Security**: Route protection at the edge using Next.js middleware
- **Session Persistence**: Cookie-based auth state for SSR and client-side protection
- **CSRF Protection**: Cookie security with SameSite attributes and CSRF mitigation

### Multi-Tenancy Features

- **Organization-Based Isolation**: Data separated by organization ID
- **Role-Based Access Control**: Admin, Manager, and User role levels
- **Permission-Based Security**: Granular permissions for specific operations
- **User Management**: Invite system for adding organization members
- **Firestore Security Rules**: Comprehensive data access controls

### Using Authentication Guards

```tsx
// Route-level protection (whole page)
import RouteGuard from '@/components/auth/route-guard';

export default function ProtectedPage() {
  return (
    <RouteGuard 
      requiredRole="admin" 
      requiredPermissions={['settings:write']} 
      redirectTo="/login"
    >
      <AdminContent />
    </RouteGuard>
  );
}

// Component-level protection (UI elements)
import PermissionGuard from '@/components/auth/permission-guard';

export function MyComponent() {
  return (
    <>
      <Content />
      
      <PermissionGuard permission="users:write" fallback={<RestrictedMessage />}>
        <AdminControls />
      </PermissionGuard>
    </>
  );
}

// Hooks-based access control (conditional rendering)
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { hasPermission, isAdmin, hasRole } = useAuth();
  
  return (
    <>
      {hasPermission('inventory:read') && <InventoryData />}
      {isAdmin && <AdminPanel />}
      {hasRole('manager') && <ManagerTools />}
    </>
  );
}
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- Firebase project with Firestore and Authentication enabled
- GCP Project configured for South Africa region (optional for production)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fluxori.git
   cd fluxori/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables file and configure it:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Firebase project configuration.

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:3000.

### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Create a Firestore database in South Africa region (if possible)
4. Get your Firebase config from Project Settings
5. Update your `.env.local` file with the Firebase config values

### Setting up Firebase Emulators (Optional)

For local development, you can use Firebase emulators to simulate Firebase services:

1. Install Firebase tools:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase in your project:
   ```bash
   firebase init emulators
   ```

3. Configure emulators for Authentication, Firestore, and Storage.

4. Start the emulators:
   ```bash
   firebase emulators:start
   ```

5. Update your `.env.local` file:
   ```
   NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
   ```

## Project Structure

```
src/
├── app/                 # Next.js 15 app router pages
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── providers/           # Provider components
├── repositories/        # Data repositories
├── styles/              # Global styles
└── types/               # TypeScript type definitions
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production application
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check code quality
- `npm run typecheck`: Run TypeScript compiler to check types
- `npm test`: Run tests
- `npm run storybook`: Start Storybook for component development

## UI Component Library & Design System

The Fluxori frontend features a comprehensive UI component library built on top of Mantine UI with enhanced features specifically designed for the South African market.

### 1. Component Architecture

We've implemented a multi-layered component architecture that provides:

- **Strict Type Safety**: All components use TypeScript with strict typing and proper ref forwarding
- **Design System Integration**: Seamless integration with our design token system
- **Motion Framework**: Animation system optimized for varying network conditions
- **Accessibility**: WCAG AA compliance for all components

### 2. Enhanced Component Features

Our components extend Mantine with specialized features:

- **Network-Aware Animations**: Optimized for South African network conditions
- **Token-Based Styling**: Consistent design tokens across all components
- **Motion Strategy**: Smart animation decisions based on user preferences and device capability
- **Standardized Props**: Common prop interfaces with semantic naming

### 3. Using UI Components

Import components from our UI library:

```tsx
import { Button, Card, Text, Container } from '@/lib/ui';

// Example usage with design system tokens and animation
<Button 
  intent="primary" 
  animated 
  radius="md"
>
  Click Me
</Button>
```

### 4. Available Component Types

- **Structural**: `Container`, `Grid`, `Stack`, etc.
- **Interactive**: `Button`, `Menu`, `Tabs`, etc.
- **Display**: `Text`, `Card`, etc.
- **Form**: `FormField`, etc.
- **Feedback**: `Alert`, etc.
- **AI-Focused**: `AgentMessage`, etc.

### 5. Motion Framework

Our UI components integrate with a motion framework optimized for the South African market:

- **Reduced Motion Support**: Respects user preferences for reduced motion
- **Connection Quality Detection**: Adapts animations based on network quality
- **Animation Strategies**: Different animation approaches based on device capability
- **Performance Optimization**: Memory and CPU-aware animation management

### 6. Testing & Documentation

All components include:

- **Automated Tests**: Unit tests with accessibility verification
- **Token Usage Analysis**: Analysis of design token usage
- **Documentation**: Detailed component API docs and examples

### 7. Developer Guidelines

For creating and modifying components, refer to:

- [Component Guidelines](./src/lib/ui/COMPONENT_GUIDELINES.md): Standards and best practices
- [UI Components Documentation](./UI_COMPONENTS.md): Component API reference
- [Design System Documentation](./DESIGN_SYSTEM.md): Token system and design principles
- [Dependency Inversion](./DEPENDENCY_INVERSION.md): How we avoid circular dependencies

## TypeScript and Mantine UI Compliance

This project enforces strict TypeScript compliance and proper usage of Mantine UI v7+ components. We've implemented several tools to ensure best practices:

### 1. Type Definitions

Custom type definitions for Mantine components are provided in `/src/types/mantine/index.d.ts`. These extend the official Mantine types to ensure proper property usage:

- Use `c` instead of `color`
- Use `fw` instead of `weight`
- Use `ta` instead of `align`
- Use `gap` instead of `spacing`
- Use `justify` instead of `position`
- Use `leftSection` instead of `leftIcon`
- And more...

### 2. ESLint Rules

Custom ESLint rules enforce proper Mantine UI usage and Next.js best practices:

- `mantine/no-deprecated-props`: Warns about using deprecated Mantine props
- `mantine/enforce-client-directive`: Ensures 'use client' directive is used appropriately

### 3. UI Component Library

A typed UI component library is available at `/src/lib/ui-components`. Use these components to ensure proper typing:

```tsx
import { Text, Button, Group } from '@/lib/ui-components';
```

### 4. Pre-commit Hooks

Husky and lint-staged ensure code is type-checked and linted before committing:

- TypeScript checking
- ESLint validation
- Detection of deprecated Mantine props
- Checking for proper 'use client' directive usage

### 5. Style Guide

Refer to `STYLE_GUIDE.md` for comprehensive guidelines on:

- Mantine UI prop usage
- Next.js client component best practices
- TypeScript patterns
- Code organization

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure all checks pass
4. Submit a pull request

## License

Proprietary - All rights reserved

## Documentation

- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [API Reference](../docs/api/api-reference.md)