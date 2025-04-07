# Fluxori - E-commerce Operations Platform

## Overview

Fluxori is a comprehensive e-commerce operations platform optimized for South African e-commerce businesses, built on Google Cloud Platform. It helps businesses streamline their operations across multiple sales channels, with particular focus on local South African marketplaces and regional needs.

## Features

- Multi-warehouse inventory management
- Real-time stock tracking and alerts
- South African marketplace integrations (Takealot, Bidorbuy, etc.)
- International marketplace support (Amazon, Shopify, etc.)
- Order management and fulfillment
- Advanced analytics and reporting
- AI-powered insights and recommendations
- Competitive price monitoring and automatic repricing
- International trade and compliance management
- Financial integration with accounting software

## Technology Stack

### Backend
- **Framework**: NestJS on Google Cloud Run
- **Language**: TypeScript
- **Database**: Google Firestore (Native mode)
- **Storage**: Google Cloud Storage with CDN
- **API Documentation**: OpenAPI/Swagger UI Express
- **Authentication**: JWT with IAM integration
- **Testing**: Jest with Supertest
- **AI/ML**: Google Vertex AI with Vector Search
- **Infrastructure**: Terraform-managed GCP resources

### Frontend
- **Framework**: Next.js
- **UI Library**: React
- **Styling**: Mantine UI
- **Icons**: Tabler Icons
- **Charts**: Chart.js with animation support
- **State Management**: TanStack Query & Zustand
- **Animation**: GSAP with custom motion design principles
- **Testing**: Jest, React Testing Library, Cypress
- **Documentation**: Storybook

## Architecture

Fluxori is built on a modern cloud-native architecture using Google Cloud Platform:

- **Region**: Primary region is africa-south1 (Johannesburg) with fallback to europe-west4 (Netherlands) for AI services
- **Storage**: Redundant storage across regions with Cloud CDN integration
- **Compute**: Auto-scaling Cloud Run services with Cloud Armor protection
- **Security**: IAM-based authentication, VPC Service Controls, secret management
- **Monitoring**: Custom dashboards, SLOs, and alerting
- **Backup**: Automated backup system with point-in-time recovery options
- **Disaster Recovery**: Comprehensive DR plan with cross-region failover

## Documentation

- [User Guide](docs/user/getting-started.md) - Guide for end users
- [Admin Guide](docs/admin/admin-guide.md) - Guide for system administrators
- [API Reference](docs/api/api-reference.md) - API documentation for integration
- [Knowledge Base](docs/knowledge-base/index.md) - FAQs and troubleshooting
- [Migration Plan](GOOGLE_CLOUD_MIGRATION.md) - GCP implementation plan
- [Migration Status](MIGRATION_IMPLEMENTATION.md) - Implementation status
- [Disaster Recovery](DISASTER_RECOVERY.md) - Disaster recovery procedures
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions

## Getting Started

### Prerequisites

- Node.js 16+
- Google Cloud SDK
- Terraform CLI
- Docker

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Development Guidelines

- Follow [NestJS best practices](https://docs.nestjs.com/)
- Use strict TypeScript with proper type definitions
- Write unit tests for all business logic
- Follow the component-driven development approach for frontend
- Document API endpoints with Swagger annotations
- Adhere to the motion design principles in [frontend/src/components/motion/README.md](frontend/src/components/motion/README.md)
- Use GCP best practices for security and reliability

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
/fluxori
├── backend/            # NestJS backend API
│   ├── src/
│   │   ├── common/     # Shared utilities, filters, guards, etc.
│   │   ├── config/     # Configuration modules
│   │   ├── modules/    # Feature modules
│   │   └── shared/     # Shared types, interfaces, & DTOs
│   └── test/           # Backend tests
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   ├── components/ # Shared components
│   │   │   ├── motion/  # Motion design system components
│   │   │   └── charts/  # Chart.js visualization components
│   │   ├── lib/        # Utility libraries
│   │   ├── hooks/      # Custom React hooks
│   │   ├── api/        # API client services
│   │   └── types/      # TypeScript type definitions
│   └── test/           # Frontend tests
├── terraform/          # IaC for GCP resources
│   ├── modules/        # Terraform modules
│   └── environments/   # Environment-specific configurations
├── scripts/            # Utility scripts
│   ├── backup/         # Backup and recovery tools
│   ├── monitoring/     # Monitoring setup
│   ├── optimization/   # Cost optimization tools
│   ├── performance-tests/ # Performance testing
│   └── security/       # Security scanning
└── docs/               # Documentation
```

## South Africa-Specific Optimizations

- Primary deployment in africa-south1 (Johannesburg) for low latency
- Network optimizations for South African internet conditions
- Marketplace integrations with popular South African platforms
- Support for South African tax and compliance requirements
- Regional payment gateway integrations
- POPIA compliance features

## Monitoring and Reliability

- Cloud Monitoring dashboards with custom metrics
- Automated alerts for critical service metrics
- Service Level Objectives (SLOs) for key user journeys
- Comprehensive backup and disaster recovery
- South Africa-specific performance monitoring

## Security

- IAM-based access control with least privilege
- VPC Service Controls for data exfiltration prevention
- Cloud Armor web application firewall
- Secure service-to-service authentication
- Regular security scanning and testing
- Secret management with GCP Secret Manager

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.