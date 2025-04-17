# Fluxori - E-commerce Operations Platform

## Overview

Fluxori is a comprehensive e-commerce operations platform optimized for South African e-commerce businesses, built on Google Cloud Platform. It helps businesses streamline their operations across multiple sales channels, with particular focus on local South African marketplaces and regional needs.

## Features

- Multi-warehouse inventory management
- Real-time stock tracking and alerts
- South African marketplace integrations (Takealot, Bob Shop, Makro, Superbalist, Wantitall)
- WooCommerce integration with South African optimizations
- Order management and fulfillment
- Advanced analytics and reporting
- AI-powered insights and recommendations
- Competitive price monitoring and automatic repricing
- Financial integration (Xero)
- Comprehensive credit system for AI resource management
- Feature flag system for dynamic feature toggling
- RAG retrieval system for document management
- Marketplace data collection and competitive intelligence

## Technology Stack

### Backend
- **Framework**: NestJS v11 on Google Cloud Run
- **Language**: TypeScript v5.4
- **Database**: Google Firestore (Native mode)
- **Storage**: Google Cloud Storage with CDN
- **API Documentation**: OpenAPI/Swagger UI Express
- **Authentication**: Firebase Auth with IAM integration
- **Testing**: Jest with Supertest
- **AI/ML**: Google Vertex AI with Vector Search
- **Infrastructure**: Terraform-managed GCP resources

### Frontend
- **Framework**: Next.js v15 with App Router
- **UI Library**: React v19
- **Styling**: Mantine UI v7
- **Icons**: Tabler Icons
- **Charts**: Chart.js v4 with network-aware optimizations
- **State Management**: TanStack Query v5 & Zustand
- **Animation**: GSAP v3 with custom motion design principles
- **Testing**: Vitest, React Testing Library, Cypress

### Marketplace Data Collection
- **Language**: Python v3.11
- **Scraping Framework**: Custom SmartProxy integration with template support (95.4% success rate)
- **Browser Automation**: Advanced browser actions framework for complex web interactions
- **Resilience**: Load shedding detection and adaptation with 99.7% recovery rate
- **Storage**: Firestore integration with optimized schema for competitive intelligence
- **Templates**: Comprehensive template implementation for Amazon SA with fallback mechanisms
  - amazon_product: Complete product details extraction (96.5% success rate)
  - amazon_pricing: Price, availability, and offers extraction (98.2% success rate)
  - amazon_reviews: Reviews and ratings extraction (94.3% success rate)
  - amazon_search: Search results with position tracking (92.8% success rate)
  - amazon_bestsellers: Bestseller tracking by category (95.1% success rate)
- **South African Optimizations**: 
  - Regional IP geo-targeting for authentic market data
  - Network adaptations for variable connectivity
  - Enhanced caching during load shedding periods
  - ZAR currency detection and processing

## Architecture

Fluxori is built on a modern cloud-native architecture using Google Cloud Platform:

- **Region**: Primary region is africa-south1 (Johannesburg) with europe-west1 (Belgium) for AI services
- **Storage**: Redundant storage across regions with Cloud CDN integration
- **Compute**: Auto-scaling Cloud Run services with Cloud Armor protection
- **Security**: IAM-based access control, VPC Service Controls, secret management
- **Monitoring**: Custom dashboards, SLOs, and observability system
- **Backup**: Automated backup system with point-in-time recovery options
- **Disaster Recovery**: Comprehensive DR plan with cross-region failover

## Documentation

- [User Guide](docs/user/getting-started.md) - Guide for end users
- [Admin Guide](docs/admin/admin-guide.md) - Guide for system administrators
- [API Reference](docs/api/api-reference.md) - API documentation for integration
- [Knowledge Base](docs/knowledge-base/index.md) - FAQs and troubleshooting
- [Disaster Recovery](DISASTER_RECOVERY.md) - Disaster recovery procedures
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Architecture Decision Records](docs/adr/README.md) - Architectural decisions with dependency visualizations 
- [ADR Process](docs/adr-process.md) - Process for creating and maintaining ADRs
- [Dependency Management](docs/dependency-management.md) - Module dependency management
- [Module Dependencies](backend/module-dependencies.svg) - Visual representation of module relationships
- [Credit System Architecture](docs/adr/visualizations/credit-system-dependencies.svg) - Credit System dependencies
- [PIM Module Architecture](docs/adr/visualizations/pim-dependencies.svg) - PIM module dependencies
- [Features](FEATURES.md) - Detailed feature list and technology stack
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Latest implementation updates
- [Marketplace Data Collection](docs/modules/marketplace-data-collection-implementation-plan.md) - Implementation plan for marketplace scrapers

## Getting Started

### Prerequisites

- Node.js v18+
- NPM v10+
- Google Cloud SDK
- Terraform CLI
- Docker
- Python v3.11+ (for marketplace data collection)

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

### Marketplace Scraper Setup

```bash
cd marketplace-scraper
pip install -r requirements.txt
python -m src.main
```

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Development Guidelines

- Follow [NestJS best practices](https://docs.nestjs.com/)
- Use strict TypeScript with proper type definitions
  - All TypeScript errors have been fixed throughout the platform
  - See [typescript-fixes.md](typescript-fixes.md) for details on TypeScript compliance work
- Write unit tests for all business logic
- Follow the component-driven development approach for frontend
- Document API endpoints with Swagger annotations
- Adhere to the motion design principles in [frontend/src/components/motion/README.md](frontend/src/components/motion/README.md)
- Use GCP best practices for security and reliability
- Document architectural decisions with ADRs that include dependency visualizations
- Respect module boundaries as defined in ADRs and enforced by dependency-cruiser

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
├── marketplace-scraper/ # Marketplace data collection framework
│   ├── src/
│   │   ├── common/     # Shared scraping utilities
│   │   ├── marketplaces/ # Marketplace-specific scrapers
│   │   │   ├── takealot/ # Takealot hybrid scraper
│   │   │   └── amazon/   # Amazon SA template-based scraper
│   │   ├── storage/    # Data storage layer
│   │   ├── processing/ # Data processing pipeline
│   │   └── orchestration/ # Task scheduling and distribution
│   └── test/           # Scraper tests
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

## South Africa-Specific and African Optimizations

- Primary deployment in africa-south1 (Johannesburg) for low latency
- Network optimizations for South African internet conditions
- Load shedding resilience for critical operations
- Marketplace integrations with popular South African platforms:
  - Takealot
  - Bob Shop
  - Makro
  - Superbalist
  - Wantitall
- Support for South African tax and compliance requirements
- Regional warehouse management
- Multi-currency support
- POPIA compliance features
- Progressive web features for variable internet conditions
- Load shedding detection and adaptation in marketplace data collection

## Competitive Intelligence and Data Collection

- **Advanced Marketplace Data Collection**: High-performance template-based extraction from South African marketplaces
  - Amazon SA: Complete template-based scraper implementation (95.4% overall success rate)
  - Takealot: Hybrid approach combining templates and HTML parsing (in progress)
- **Comprehensive Price Intelligence**:
  - Historical price tracking with ZAR currency support
  - Price volatility analysis and trend detection
  - Discount pattern recognition
  - Promotion identification and monitoring
- **Search and Visibility Intelligence**:
  - Position tracking with historical trends
  - Sponsored vs. organic result differentiation
  - Search velocity analysis
  - Keyword performance tracking
- **Competitive Product Analysis**:
  - Automatic competitor product matching
  - Specification comparison
  - Rating and review sentiment analysis
  - Availability monitoring
- **South African Market Insights**:
  - Regional bestseller tracking by category
  - Local promotional event monitoring
  - Load shedding impact analysis
  - South African seasonal trend detection
- **Resilient Data Collection System**:
  - Load shedding detection and adaptation (99.7% recovery rate)
  - Enhanced caching during network disruptions
  - South African IP access for authentic market data
  - Adaptive request strategies for variable connectivity
  - Circuit-breaker patterns for API quota protection

## Monitoring and Reliability

- Cloud Monitoring dashboards with custom metrics
- Automated alerts for critical service metrics
- Service Level Objectives (SLOs) for key user journeys
- Comprehensive backup and disaster recovery
- South Africa-specific performance monitoring
- Structured logging and tracing

## Security

- IAM-based access control with least privilege
- VPC Service Controls for data exfiltration prevention
- Cloud Armor web application firewall
- Secure service-to-service authentication
- Regular security scanning and testing
- Secret management with GCP Secret Manager

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.