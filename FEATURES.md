# Fluxori - Features & Technical Stack

## Core Features

### Inventory Management
- **Multi-warehouse Management**: Track inventory across multiple physical locations
- **Product Catalog**: Comprehensive product information management
- **Stock Levels**: Real-time monitoring of available, reserved, and pending inventory
- **Low Stock Alerts**: Automated notifications when inventory falls below thresholds
- **Inventory Valuation**: FIFO, LIFO, and average cost methods
- **Batch & Lot Tracking**: Support for batch numbers and expiration dates
- **Barcode Scanning**: Integration with barcode scanners for stock operations
- **Inventory Adjustments**: Tools for stock takes, cycle counts, and adjustments
- **Bundled Products**: Create and manage product bundles with component tracking

### Marketplace Integration
- **Amazon Integration**: Full integration with Amazon Marketplace API
- **Shopify Integration**: Complete Shopify store management
- **Takealot Integration**: South African marketplace connectivity
- **Multi-channel Listing**: Publish products across multiple marketplaces
- **Centralized Inventory**: Synchronized stock levels across all channels
- **Order Synchronization**: Automatically import orders from all connected marketplaces
- **Pricing Management**: Set channel-specific pricing rules
- **Listing Optimization**: Tools for optimizing marketplace listings
- **Performance Analytics**: Track sales performance across channels

### Order Management
- **Centralized Order Dashboard**: View and manage orders from all channels
- **Order Status Tracking**: Real-time updates on order statuses
- **Fulfillment Management**: Tools for picking, packing, and shipping
- **Shipping Integration**: Connect with multiple shipping carriers
- **Bulk Order Processing**: Process multiple orders simultaneously
- **Order Prioritization**: Set rules for order fulfillment sequence
- **Split Orders**: Handle partial shipments and backorders
- **Returns Management**: Process returns and exchanges
- **Customer Communication**: Automated order status notifications

### BuyBox & Repricing
- **Competitor Monitoring**: Track competitor pricing across marketplaces
- **BuyBox Tracking**: Monitor BuyBox ownership status on Amazon
- **Automated Repricing**: Dynamic price adjustments based on rules
- **Min/Max Pricing**: Set floor and ceiling prices for repricing algorithms
- **Cost-based Rules**: Factor in costs and desired margins
- **Competitor-based Rules**: React to competitor price changes
- **Time-based Rules**: Scheduled price changes for promotions
- **Velocity-based Rules**: Adjust prices based on sales velocity
- **Rule Testing**: Simulate repricing rules before applying them

### AI Insights
- **Sales Forecasting**: AI-powered prediction of future sales
- **Inventory Optimization**: Recommendations for optimal stock levels
- **Pricing Intelligence**: Dynamic pricing suggestions based on market data
- **Demand Prediction**: Forecast product demand by season and trends
- **Anomaly Detection**: Identify unusual patterns in sales or inventory
- **Opportunity Identification**: Highlight potential new marketplace opportunities
- **Performance Analysis**: AI-enhanced reports on business performance
- **Sentiment Analysis**: Track customer sentiment across reviews
- **Competitive Intelligence**: Insights on competitor strategies

### International Trade
- **Multi-currency Support**: Manage prices and orders in multiple currencies
- **Tax Compliance**: Tools for VAT, GST, and sales tax across jurisdictions
- **Customs Documentation**: Generate required customs paperwork
- **International Shipping**: Integration with global shipping providers
- **Import/Export Compliance**: Tools for managing trade restrictions
- **Landed Cost Calculation**: Factor in duties, taxes, and fees
- **Country-specific Requirements**: Support for local regulations and requirements
- **Translation Management**: Handle product descriptions in multiple languages
- **International Returns**: Process returns across borders

### Notifications
- **Multi-channel Notifications**: Email, SMS, in-app, and webhook notifications
- **Customizable Alerts**: Configure notification triggers and content
- **User Preferences**: Allow users to set notification preferences
- **Scheduled Notifications**: Automated regular reports and alerts
- **Event-based Alerts**: Real-time notifications for critical events
- **Escalation Rules**: Configure notification priority and escalation
- **Action Center**: Centralized dashboard for pending actions
- **Notification History**: Track all sent notifications
- **Read Receipts**: Track which notifications have been viewed

### RAG Retrieval System
- **Document Management**: Store and index important documents
- **Semantic Search**: Find information based on meaning, not just keywords
- **Knowledge Base**: Build a searchable repository of company knowledge
- **Embedding Generation**: Convert text to vector embeddings for similarity search
- **Multi-provider Support**: Connect to OpenAI, HuggingFace, Cohere, or Vertex AI
- **Document Chunking**: Break documents into manageable pieces for better search
- **Metadata Filtering**: Filter search results by document type, category, etc.
- **Context Preservation**: Maintain document context when searching
- **Relevance Scoring**: Rank search results by relevance

### Scheduled Tasks
- **Automated Jobs**: Schedule recurring tasks for regular execution
- **Task Management**: Monitor and manage automated task execution
- **Failure Handling**: Automatic retry and notification for failed tasks
- **Data Synchronization**: Schedule regular data imports/exports
- **Report Generation**: Automatically generate and distribute reports
- **Maintenance Tasks**: Schedule cleanup and optimization operations
- **Custom Task Scheduling**: Define custom schedules for specific business needs
- **Priority Levels**: Set task priorities for resource allocation
- **Execution History**: Track task execution history and performance

## Technical Stack

### Backend Technologies

#### Core Framework & Language
- **NestJS**: v11.0.13, a progressive Node.js framework
- **TypeScript**: v5.4.2, for type safety and modern JavaScript features
- **Node.js**: v20.x, JavaScript runtime

#### Database & Storage
- **MongoDB**: v8.0, NoSQL database
- **Mongoose**: v8.13.0, MongoDB object modeling for Node.js
- **Azure Blob Storage**: For file storage and management
- **Google Cloud Storage**: Alternative storage option

#### Authentication & Security
- **JWT**: JSON Web Tokens for authentication
- **Passport.js**: Authentication middleware
- **bcrypt**: v5.1.1, for password hashing
- **Helmet**: v7.1.0, HTTP security headers

#### API & Documentation
- **OpenAPI/Swagger**: v7.3.1, API documentation
- **class-validator**: v0.14.1, for DTO validation
- **class-transformer**: v0.5.1, for object transformation

#### AI & Machine Learning
- **Google Vertex AI**: For embedding generation and AI features
- **Vector Similarity Search**: For semantic document retrieval
- **Custom ML models**: For business intelligence and forecasting

#### Testing
- **Jest**: v29.7.0, testing framework
- **Supertest**: v7.1.0, HTTP assertions
- **mongodb-memory-server**: v10.1.4, in-memory MongoDB for testing

#### Utilities
- **RxJS**: v7.8.1, reactive programming library
- **Winston**: v3.13.0, logging library
- **dotenv**: v16.3.1, environment variable management
- **uuid**: v11.1.0, UUID generation
- **compression**: v1.7.4, HTTP compression middleware

#### Design Patterns
- **Repository Pattern**: For data access abstraction
- **Dependency Injection**: For loose coupling and testability
- **Module Pattern**: For organizing code by feature
- **Decorator Pattern**: For extending class functionality
- **Adapter Pattern**: For marketplace integrations
- **Strategy Pattern**: For interchangeable algorithms

### Frontend Technologies

#### Core Framework & Language
- **Next.js**: v15.2.4, React framework with server-side rendering
- **React**: v19.1.0, UI library
- **TypeScript**: v5.4.2, type-safe JavaScript

#### UI & Styling
- **Mantine UI**: v7.17.3, component library
- **Tabler Icons**: v3.1.0, icon set
- **Emotion**: CSS-in-JS library
- **GSAP (GreenSock Animation Platform)**: v3.12.7, animation library

#### State Management
- **TanStack Query**: v5.2.1, for server state management
- **Zustand**: For client state management
- **React Context API**: For component state sharing

#### Data Visualization
- **Chart.js**: v4.4.2, for charts and graphs
- **react-chartjs-2**: React wrapper for Chart.js

#### Form Management
- **React Hook Form**: Form validation and state management
- **Zod**: TypeScript-first schema validation

#### Testing
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing

#### Documentation
- **Storybook**: v8.0, component documentation and testing

### DevOps & Infrastructure

#### Containerization & Orchestration
- **Docker**: Application containerization
- **Kubernetes**: Container orchestration
- **Docker Compose**: Multi-container Docker applications

#### CI/CD
- **GitHub Actions**: Automated workflows
- **Jest**: Automated testing in CI pipeline
- **ESLint & Prettier**: Code quality and formatting

#### Monitoring & Logging
- **Winston**: Application logging
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Sentry**: Error tracking

#### Security
- **Helmet**: Security headers
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-Origin Resource Sharing controls
- **Content Security Policy**: Browser security policy enforcement

## Architecture

### Backend Architecture
- **Modular Design**: Feature-based module organization
- **Layered Architecture**: Controllers → Services → Repositories
- **RESTful API**: HTTP-based API following REST principles
- **Strong Typing**: Comprehensive TypeScript interface definitions
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Validation**: Request validation using DTOs and class-validator
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: MongoDB with Mongoose schemas and indexes
- **Caching**: In-memory and Redis-based caching strategies

### Frontend Architecture
- **App Router**: Next.js App Router for page routing
- **Component-Based**: Reusable React components
- **Atomic Design**: Organizing components by complexity
- **Server Components**: Next.js server components for improved performance
- **Client Components**: Interactive UI components with client-side state
- **Responsive Design**: Mobile-first responsive layouts
- **Accessibility**: WCAG compliance for all components
- **Motion Design System**: Custom animation system following defined principles
- **API Integration**: Typed HTTP clients for backend communication
- **Form Management**: Consistent form handling with validation

### Integration Architecture
- **API Gateway**: Centralized API access point
- **Message Queue**: For asynchronous processing
- **Webhooks**: For real-time notifications and integrations
- **OAuth2**: For third-party service authentication
- **API Clients**: Typed clients for marketplace integrations
- **Event-Driven**: Event-based architecture for system communication
- **Scheduled Jobs**: Cron-based scheduled task execution