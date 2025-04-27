# Fluxori Backend

## Google Cloud-based NestJS Backend

This is the backend API for Fluxori, an e-commerce operations platform built exclusively on Google Cloud Platform services.

## Architecture

The backend is built on top of the following Google Cloud services:

### Core GCP Services

- **Google Cloud Run**: Hosts the NestJS application
- **Google Firestore**: NoSQL database for all application data
- **Google Cloud Storage**: Storage for files and assets
- **Firebase Authentication**: User authentication and management
- **Google Cloud Logging**: Centralized logging
- **Google Cloud Scheduler**: Scheduled tasks and jobs
- **Google Vertex AI**: AI/ML services for insights and recommendations
- **Google Cloud Monitoring**: Application monitoring and observability

### Key Features

- **Scalable Architecture**: Fully cloud-native design that scales automatically
- **Serverless Components**: No infrastructure management required
- **Secure by Design**: Built with Google's security best practices
- **South African Optimized**: Primary region in Johannesburg for low latency

## Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Google Cloud SDK

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:

   ```
   cp .env.example .env
   ```

   Then edit `.env` with your Google Cloud project details.

4. Run the application:
   ```
   npm run start:dev
   ```

### Authentication

Firebase Authentication is used for all user authentication. The authentication flow works as follows:

1. Users register/login through Firebase Auth (email/password or social providers)
2. Firebase Auth issues a token that is used for all API requests
3. The backend validates the token and extracts user information
4. Role-based access control is implemented using Firebase custom claims

### Database

Google Firestore is used as the primary database. Key collections include:

- `users`: User profiles and preferences
- `organizations`: Company information
- `products`: Product catalog data
- `orders`: Order information
- `insights`: AI-generated business insights

### File Storage

Google Cloud Storage is used for all file storage:

- Product images
- Documents
- Reports
- User uploads

### Scheduled Tasks

Google Cloud Scheduler is used for all scheduled tasks:

- Inventory checks
- Data synchronization
- Report generation
- Cleanup jobs

## Deployment

The application is deployed to Google Cloud Run. A typical deployment process:

1. Build the Docker image
2. Push to Google Container Registry
3. Deploy to Cloud Run

### Production Environment

The production environment uses:

- Multiple Cloud Run instances
- Cloud Armor for security
- Cloud CDN for static assets
- VPC Service Controls for network security

## License

Proprietary - All rights reserved
