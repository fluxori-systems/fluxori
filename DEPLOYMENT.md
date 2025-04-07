# Fluxori Deployment Guide

This document outlines the deployment process for the Fluxori platform on Google Cloud Platform (GCP). Follow these procedures for deploying to development, staging, and production environments.

## Prerequisites

Before deploying, ensure you have:

1. **GCP Credentials**: Access to the appropriate GCP project with necessary permissions
2. **Terraform**: Version 1.0.0 or later installed
3. **Google Cloud SDK**: Latest version installed and configured
4. **Docker**: Latest version installed
5. **GitHub Access**: Access to the Fluxori GitHub repository

## Environment Setup

Each environment (development, staging, production) has its own configuration. The configurations are stored in the following locations:

- **Terraform**: `terraform/environments/<environment>/terraform.tfvars`
- **Backend**: `.env.<environment>` files
- **Frontend**: `.env.<environment>` files

### Setting up Environment Variables

For local deployment preparation, copy the appropriate environment files:

```bash
# For backend
cp .env.example .env.<environment>
# Edit .env.<environment> with the appropriate values

# For frontend
cp frontend/.env.example frontend/.env.<environment>
# Edit frontend/.env.<environment> with the appropriate values
```

## Deployment Process

### 1. Infrastructure Deployment

The infrastructure is managed using Terraform. Follow these steps to deploy the infrastructure:

```bash
# Navigate to the terraform directory
cd terraform

# Initialize Terraform
terraform init -backend-config=environments/<environment>/backend.tfvars

# Select the appropriate workspace
terraform workspace select <environment> || terraform workspace new <environment>

# Plan the deployment
terraform plan -var-file=environments/<environment>/terraform.tfvars -out=tfplan

# Review the plan and apply
terraform apply tfplan
```

#### Important Infrastructure Components

The core infrastructure includes:

- **VPC Network**: Isolated network for the application
- **Firestore**: NoSQL database for application data
- **Cloud Storage**: For file storage and static assets
- **Cloud Run**: For containerized services
- **Vertex AI**: For AI features
- **Cloud CDN**: For content delivery
- **Secret Manager**: For secure storage of secrets

### 2. Application Deployment

The application consists of a frontend and a backend service, both deployed to Cloud Run.

#### Backend Deployment

The backend is deployed using GitHub Actions. To trigger a deployment:

1. Push to the appropriate branch:
   - `dev` branch for development environment
   - `staging` branch for staging environment
   - `main` branch for production environment

2. The GitHub Actions workflow will:
   - Build the Docker image
   - Push to Google Container Registry
   - Deploy to Cloud Run
   - Update traffic routing

To manually deploy the backend:

```bash
# Build the Docker image
docker build -t gcr.io/fluxori-<environment>/backend:latest ./backend

# Push the image
docker push gcr.io/fluxori-<environment>/backend:latest

# Deploy to Cloud Run
gcloud run deploy fluxori-backend \
  --image gcr.io/fluxori-<environment>/backend:latest \
  --platform managed \
  --region africa-south1 \
  --project fluxori-<environment> \
  --allow-unauthenticated
```

#### Frontend Deployment

The frontend is also deployed using GitHub Actions. To manually deploy:

```bash
# Build the Docker image
docker build -t gcr.io/fluxori-<environment>/frontend:latest ./frontend

# Push the image
docker push gcr.io/fluxori-<environment>/frontend:latest

# Deploy to Cloud Run
gcloud run deploy fluxori-frontend \
  --image gcr.io/fluxori-<environment>/frontend:latest \
  --platform managed \
  --region africa-south1 \
  --project fluxori-<environment> \
  --allow-unauthenticated
```

### 3. Post-Deployment Verification

After deploying, verify that the application is working correctly:

```bash
# Run the smoke tests
cd scripts/integration-tests
npm run test:<environment> -- --scenario=smoke

# Run the API tests
npm run test:<environment> -- --scenario=api
```

Verify the following endpoints:

- **Frontend**: `https://app.<environment>.fluxori.com`
- **Backend API**: `https://api.<environment>.fluxori.com/health`

## Rollback Procedures

In case of a failed deployment, follow these rollback procedures:

### Infrastructure Rollback

```bash
# Revert to the previous state
terraform workspace select <environment>
terraform plan -var-file=environments/<environment>/terraform.tfvars -out=tfplan -target=<resource>
terraform apply tfplan
```

### Application Rollback

```bash
# Rollback to the previous deployment
gcloud run services update-traffic fluxori-backend \
  --region=africa-south1 \
  --project=fluxori-<environment> \
  --to-revisions=<previous-revision>=100

gcloud run services update-traffic fluxori-frontend \
  --region=africa-south1 \
  --project=fluxori-<environment> \
  --to-revisions=<previous-revision>=100
```

## Monitoring and Logging

### Monitoring Dashboards

The monitoring dashboards are available at:

- **Overall System**: `https://console.cloud.google.com/monitoring/dashboards/builder/[DASHBOARD_ID]?project=fluxori-<environment>`
- **API Performance**: `https://console.cloud.google.com/monitoring/dashboards/builder/[API_DASHBOARD_ID]?project=fluxori-<environment>`
- **Frontend Performance**: `https://console.cloud.google.com/monitoring/dashboards/builder/[FRONTEND_DASHBOARD_ID]?project=fluxori-<environment>`

### Logs

Logs are available in Cloud Logging:

- **Backend Logs**: `https://console.cloud.google.com/logs/query?project=fluxori-<environment>&query=resource.type%3D%22cloud_run_revision%22+AND+resource.labels.service_name%3D%22fluxori-backend%22`
- **Frontend Logs**: `https://console.cloud.google.com/logs/query?project=fluxori-<environment>&query=resource.type%3D%22cloud_run_revision%22+AND+resource.labels.service_name%3D%22fluxori-frontend%22`

## Alerting

Alerts are configured in Cloud Monitoring. When an alert is triggered, notifications are sent to:

- Email: `alerts@fluxori.com`
- Slack: `#fluxori-alerts` channel

## Environment-Specific Configurations

### Development Environment

- **Project ID**: `fluxori-dev`
- **Base URL**: `https://app.dev.fluxori.com`
- **API URL**: `https://api.dev.fluxori.com`

### Staging Environment

- **Project ID**: `fluxori-staging`
- **Base URL**: `https://app.staging.fluxori.com`
- **API URL**: `https://api.staging.fluxori.com`

### Production Environment

- **Project ID**: `fluxori-prod`
- **Base URL**: `https://app.fluxori.com`
- **API URL**: `https://api.fluxori.com`

## South Africa Region-Specific Considerations

Fluxori is optimized for the South African market with the following region-specific considerations:

1. **Primary Region**: `africa-south1` (Johannesburg)
2. **Secondary Region for AI Services**: `europe-west4` (Netherlands)
3. **Network Configuration**:
   - Premium tier for external traffic
   - Standard tier for internal traffic
   - Cloud CDN for static assets
   - Cross-region data replication for resilience

4. **Performance Optimization**:
   - Pre-warming Cloud Run instances during peak hours
   - Local caching of frequently accessed data
   - Optimized image delivery via Cloud CDN

## Contact Information

For deployment issues, contact:

- **Development Team**: `dev@fluxori.com`
- **DevOps Team**: `devops@fluxori.com`
- **Emergency Support**: `+27 12 345 6789`