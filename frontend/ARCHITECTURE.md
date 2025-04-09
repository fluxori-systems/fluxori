# Fluxori Frontend Architecture

This document outlines the architecture and design decisions for the Fluxori frontend application.

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Layer](#data-layer)
- [UI Components](#ui-components)
- [State Management](#state-management)
- [Authentication & Authorization](#authentication--authorization)
- [Security Considerations](#security-considerations)
- [Deployment Strategy](#deployment-strategy)

## Project Overview

Fluxori is a comprehensive e-commerce operations platform tailored for South African e-commerce sellers. The frontend application provides an intuitive interface for managing inventory, orders, marketplaces, and analytics.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.4.2
- **UI Library**: Mantine UI
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Hosting**: Vercel/GCP Cloud Run
- **State Management**: React Context API + Zustand

## Project Structure

```
src/
├── app/                 # Next.js 15 app router pages
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── firebase/        # Firebase configuration and services
│   └── ui/              # UI utility functions
├── providers/           # Provider components
├── repositories/        # Data repositories
├── styles/              # Global styles
└── types/               # TypeScript type definitions
    ├── core/            # Core type definitions
    ├── inventory/       # Inventory-related types
    ├── organization/    # Organization-related types
    ├── product/         # Product-related types
    └── user/            # User-related types
```

## Data Layer

The data layer is built around the Repository pattern, which provides a clean abstraction for interacting with the Firestore database. Each entity type (user, product, inventory, etc.) has its own repository that handles CRUD operations and implements business logic.

### Key Features:

1. **Type Safety**: All database interactions are fully typed using TypeScript.
2. **Multi-tenancy**: The repositories enforce data isolation through organization-scoped queries.
3. **Caching**: Firestore data is cached using React Query for improved performance.
4. **Error Handling**: Comprehensive error handling and logging.

## UI Components

The UI is built using Mantine UI, a comprehensive React component library. Components are organized into categories:

- **Layout Components**: App shell, containers, grids
- **Form Components**: Inputs, selectors, file uploads
- **Data Display**: Tables, cards, charts
- **Navigation**: Menus, tabs, breadcrumbs
- **Feedback**: Alerts, notifications, loaders

## State Management

State management is handled through a combination of:

1. **React Context API**: For global states like user authentication
2. **Zustand**: For complex UI state management
3. **React Query**: For server state management and data fetching

## Authentication & Authorization

### Authentication Architecture

Authentication is implemented using Firebase Authentication with a comprehensive multi-tenant security model:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│   Browser   │◀────▶│  Firebase   │◀────▶│  Firestore  │
│             │      │    Auth     │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                        ▲
       │                                        │
       ▼                                        │
┌─────────────┐                           ┌─────────────┐
│  Auth       │                           │             │
│  Cookies    │                           │  Security   │
│             │                           │   Rules     │
└─────────────┘                           └─────────────┘
       │                                        ▲
       │                                        │
       ▼                                        │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Next.js    │      │  Component  │      │  Data       │
│  Middleware │◀────▶│   Guards    │◀────▶│  Access     │
│             │      │             │      │  Layer      │
└─────────────┘      └─────────────┘      └─────────────┘
```

1. **Authentication Providers**:
   - Email/password authentication with secure password policies
   - Google OAuth 2.0 integration
   - Future support for additional social auth providers

2. **Token Management**:
   - JWT tokens handled securely via Firebase Auth
   - Tokens stored in cookies with appropriate security attributes
   - Automatic token refresh mechanism
   - Firestore security rules validate authentication tokens

3. **Session Management**:
   - Client-side session state via React Context
   - Cookie-based persistence for page reloads
   - Automatic session recovery on page load
   - Session timeout handling with graceful re-authentication

### Multi-Tenant Authorization

The authorization system implements multiple layers of security:

1. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full access to organization resources
   - **Manager**: Access to operational features, limited settings
   - **User**: Basic access to day-to-day operations
   - **Guest**: Read-only access to specific resources

2. **Permission-Based Access Control**:
   - Granular permissions for specific operations (e.g., `users:read`, `inventory:write`)
   - Permissions can be assigned directly or inherited through roles
   - Component-level permissions checks for UI rendering
   - API-level permission validation

3. **Organization Scoping**:
   - All data queries scoped to user's organization ID
   - Cross-organization data access prevented by:
     - Repository layer filtering
     - Firestore security rules
     - API request validation

4. **Route Protection**:
   - Next.js middleware for server-side route guarding
   - Client-side route guards using React components
   - Redirection to login or unauthorized pages based on access rights
   - Deep path protection for nested resources

5. **Feature Access Control**:
   - Feature flags at organization level
   - User-specific feature access based on subscription tier
   - UI adaptation based on available features

### Implementation Components

1. **Authentication Context** (`/src/contexts/firebase-context.tsx`):
   - Central state for authentication information
   - Methods for login, logout, registration
   - Token refresh and session management
   - Organization context integration

2. **Route Guards** (`/src/components/auth/route-guard.tsx`):
   - Protects routes based on authentication status
   - Role-based access control for pages
   - Permission-based access verification
   - Organization validation

3. **Permission Guards** (`/src/components/auth/permission-guard.tsx`):
   - Component-level access control
   - Conditionally renders UI elements based on permissions
   - Supports fallback content for unauthorized users

4. **Auth Hooks** (`/src/hooks/useAuth.ts`):
   - React hooks for accessing authentication state
   - Permission checking utilities
   - Role validation helpers
   - Organization context access

5. **Next.js Middleware** (`/src/middleware.ts`):
   - Server-side route protection
   - Token validation before rendering pages
   - Redirection to login for unauthenticated requests
   - Role-based route access control

## Security Considerations

### Data Security

1. **Firestore Security Rules**: 
   - Comprehensive rules to enforce data access control
   - Organization-scoped document access
   - Role-based permission validation
   - Field-level access control for sensitive data
   - Rule versioning and testing

2. **Input Validation**:
   - Client-side validation using React Hook Form
   - Server-side validation with Zod schemas
   - Field type and constraint enforcement
   - Sanitization of user-generated content

3. **Data Encryption**:
   - Sensitive data encryption for PII
   - Secure credential storage
   - Data-at-rest encryption with Firebase
   - End-to-end encryption for sensitive communications

### Authentication Security

4. **Firebase Auth Protections**:
   - Email verification enforcement
   - Password strength requirements
   - Account lockout after multiple failed attempts
   - Multi-factor authentication support
   - Secure session management

5. **Token Security**:
   - JWT token validation
   - Short-lived access tokens (1 hour)
   - Longer-lived refresh tokens (30 days)
   - Token rotation on suspicious activity
   - Secure cookie storage with HttpOnly and SameSite attributes

6. **CSRF/XSS Protection**:
   - CSRF token validation
   - Content Security Policy implementation
   - XSS prevention through React's auto-escaping
   - Strict input sanitization
   - Security headers configuration

### Network Security

7. **API Security**:
   - HTTPS-only communication
   - Request rate limiting
   - API key validation
   - Input sanitization
   - Response data filtering based on permissions

8. **Infrastructure Security**:
   - GCP security best practices
   - Virtual Private Cloud configuration
   - Firewall rules and network security
   - Regular security scanning
   - Vulnerability management

### Operational Security

9. **Monitoring and Alerting**:
   - Security event logging
   - Anomaly detection for authentication events
   - Real-time security alerts
   - Audit logging for sensitive operations
   - Compliance reporting

10. **CI/CD Security**:
    - Secret scanning in code repositories
    - Dependency vulnerability scanning
    - Container image scanning
    - Infrastructure-as-code security checks
    - Deployment validation and verification

## Deployment Strategy

The frontend is deployed on Vercel with:

1. **Environment-specific Configurations**: Development, staging, and production environments
2. **CI/CD Pipeline**: Automated testing and deployment on GitHub pushes
3. **Performance Optimization**: Code splitting, lazy loading, and image optimization
4. **CDN**: Content delivery network for static assets
5. **South Africa Optimization**: CDN edge locations in Johannesburg for optimal performance

## Database Design

### Multi-tenancy Approach

We've implemented organization-based multi-tenancy where:

1. Each entity has an `organizationId` field
2. All queries filter by the current user's organization
3. Security rules enforce organization-based access control
4. Cross-organization data access is prevented

### Core Entities

1. **Organization**: Represents a customer account with its own users and data
2. **User**: End-users of the system with roles and permissions
3. **Product**: Products sold by the organization
4. **Inventory**: Stock levels, warehouses, and movements
5. **Order**: Customer orders, fulfillment, and shipping

### Data Denormalization Strategy

For optimal query performance, we've denormalized certain data:

1. **Category/Brand Names**: Stored in product documents for faster listing
2. **Stock Summaries**: Aggregated stock levels stored in product documents
3. **User Details**: Basic user info denormalized in related entities for display