# Fluxori - Features & Technology Stack

## Core Features

### Inventory Management

- **Multi-warehouse Management**: Track inventory across multiple physical locations
- **Product Catalog**: Comprehensive product information management
- **Stock Levels**: Real-time monitoring of available, reserved, and pending inventory
- **Stock Movements**: Track product movements between warehouses and customers
- **Inventory Adjustments**: Tools for stock takes, cycle counts, and adjustments

### Marketplace Integration

- **Takealot Integration**: South African marketplace connectivity
- **Multi-channel Listing**: Publish products across multiple marketplaces
- **Centralized Inventory**: Synchronized stock levels across all channels
- **Order Synchronization**: Automatically import orders from all connected marketplaces
- **Pricing Management**: Set channel-specific pricing rules

### BuyBox & Repricing

- **Competitor Monitoring**: Track competitor pricing across marketplaces
- **BuyBox Tracking**: Monitor BuyBox ownership status on marketplaces
- **Automated Repricing**: Dynamic price adjustments based on rules
- **Min/Max Pricing**: Set floor and ceiling prices for repricing algorithms
- **Cost-based Rules**: Factor in costs and desired margins

### AI Insights

- **Sales Forecasting**: AI-powered prediction of future sales
- **Inventory Optimization**: Recommendations for optimal stock levels
- **Pricing Intelligence**: Dynamic pricing suggestions based on market data
- **Credit System**: Token-based credit allocation for AI feature usage
- **Model Selection**: Cost-optimized AI model selection

### International Trade

- **Multi-currency Support**: Manage prices and orders in multiple currencies across all African nations
- **Regional Taxation Framework**: Comprehensive tax handling for 10+ African countries
- **South African Optimization**: Special features for South African e-commerce businesses
- **Regional Warehouse Management**: Cross-border shipping and optimal warehouse selection
- **International Shipping**: Integration with global shipping providers
- **African Market Adaptations**: Network resilience and load shedding protection

### RAG Retrieval System

- **Document Management**: Store and index important documents
- **Semantic Search**: Find information based on meaning, not just keywords
- **Knowledge Base**: Build a searchable repository of company knowledge
- **Embedding Generation**: Convert text to vector embeddings for similarity search
- **Multi-provider Support**: Connect to Vertex AI for embeddings

### Feature Flag System

- **Dynamic Feature Toggling**: Enable/disable features without deployment
- **Targeting Rules**: Control feature access by user, organization, or region
- **A/B Testing**: Test new features with selected user groups
- **Gradual Rollouts**: Progressive feature deployment
- **Audit Logging**: Track all feature flag changes

### Agent Framework

- **AI Model Integration**: Connect to various AI models and providers
- **Conversation Management**: Track and manage AI conversations
- **Model Registry**: Centralized configuration for different AI models
- **Token Usage Tracking**: Monitor and optimize token consumption

## Technical Stack

### Backend Technologies

#### Core Framework & Language

- **NestJS**: v11.0.13, progressive Node.js framework
- **TypeScript**: v5.4.2, strongly typed JavaScript

#### Database & Storage

- **Google Cloud Firestore**: NoSQL document database
- **Google Cloud Storage**: Object storage for files and assets

#### Authentication & Security

- **Firebase Authentication**: User authentication and management
- **Cloud Armor**: DDoS protection and WAF
- **Secret Manager**: Secure credential storage
- **VPC Service Controls**: Network security boundaries
- **Data Loss Prevention**: Sensitive data scanning and protection

#### AI & Machine Learning

- **Google Vertex AI**: AI model hosting and management
- **Vector Similarity Search**: For semantic document retrieval
- **Token-based Credit System**: For AI resource allocation and tracking

#### Observability

- **Logging**: Enhanced structured logging with context
- **Metrics**: Custom business and technical metrics
- **Tracing**: Distributed request tracing
- **Health Checks**: Comprehensive system health monitoring

### Frontend Technologies

#### Core Framework & Language

- **Next.js**: v15.2.4, React framework with server-side rendering
- **React**: v19.1.0, UI library
- **TypeScript**: v5.8.3, static type checking

#### UI & Styling

- **Mantine UI**: v7.17.3, component library
- **GSAP**: v3.12.7, animation platform
- **South African Optimizations**: Performance enhancements for regional networks

#### State Management

- **TanStack Query**: v5.2.1, for server state management
- **Zustand**: For client state management

#### Data Visualization

- **Chart.js**: v4.4.2, for charts and graphs
- **Network-Aware Charts**: Optimized for varying connection quality

#### Testing

- **Vitest**: Modern testing framework for JavaScript
- **React Testing Library**: Component testing
- **Network Simulation**: Test components under different network conditions

## Architecture

### Backend Architecture

- **Modular Design**: Feature-based module organization
- **Strict Module Boundaries**: Enforced through dependency-cruiser
- **Repository Pattern**: Type-safe data access abstraction
- **Dependency Injection**: For loose coupling and testability
- **Credit System**: Token-based AI resource management

### Frontend Architecture

- **App Router**: Next.js App Router for page routing
- **Component-Based**: Reusable React components
- **Server Components**: Next.js server components for improved performance
- **Network-Aware Design**: Components that adapt to connection quality
- **Role-Based Navigation**: Permission-based access to navigation elements for admins and customers
- **South African Market Optimizations**: Performance enhancements for South African network conditions

### Cloud Infrastructure

- **Google Cloud Platform**: Primary cloud provider
- **Regional Deployment**: Primary region in africa-south1 (Johannesburg)
- **GenAI Region**: AI models hosted in europe-west1 (Belgium)
- **Global CDN**: Content delivery optimization for South African users
- **Cloud Run**: Container-based serverless hosting
- **VPC Networks**: Secure network configuration

### DevOps

- **Terraform**: Infrastructure as Code
- **GitHub Actions**: CI/CD automation
- **Module Dependency Enforcement**: Automated boundary checking
- **TypeScript Guardrails**: Strong typing and linting
- **Architecture Decision Records**: Documented architectural decisions

## Development Tooling

### Dependency Management

- **Dependency-Cruiser**: Module boundary enforcement
- **ESLint**: Code quality and import rules
- **TypeScript**: Strong typing and interface enforcement

### Architecture Documentation

- **Architecture Decision Records (ADR)**: Documented key decisions
- **Module Documentation**: Comprehensive module documentation
- **Repository Pattern Implementation**: Consistent data access patterns
- **Credit System Architecture**: AI resource management design
