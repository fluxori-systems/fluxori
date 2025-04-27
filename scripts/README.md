# Fluxori Google Cloud Migration Scripts

This directory contains scripts for migrating, testing, and optimizing the Fluxori platform on Google Cloud Platform.

## Directory Structure

- **migration-db/**: Scripts for migrating data from MongoDB to Firestore
- **migrate-storage/**: Scripts for migrating files from Azure Blob Storage to Google Cloud Storage
- **performance-tests/**: Performance testing suite for GCP deployment
- **security/**: Security hardening scripts for GCP resources
- **optimization/**: Cost optimization scripts for GCP resources

## Migration Scripts

### DB Migration

Used to migrate data from MongoDB to Firestore:

```bash
cd migration-db
node mongo-to-firestore.js --collection=products
```

### Storage Migration

Used to migrate files from Azure Blob Storage to Google Cloud Storage:

```bash
cd migrate-storage
# Create .env file with AZURE_CONNECTION_STRING, GCP_PROJECT_ID, etc.
cp .env.example .env
# Edit .env file with your credentials
nano .env
# Run the migration script
./run-migration.sh
```

## Performance Testing

A comprehensive suite for performance testing the GCP deployment:

```bash
cd performance-tests
# Install dependencies
npm install
# Generate test data
npm run generate-data
# Run tests
npm run test:dev
# Run specific test scenario
npm run test:inventory
```

Available test commands:

- `npm run test` - Run all tests with default configuration
- `npm run test:dev` - Run tests against development environment
- `npm run test:staging` - Run tests against staging environment
- `npm run test:prod` - Run tests against production environment
- `npm run test:inventory` - Run inventory-specific tests
- `npm run test:orders` - Run order-specific tests
- `npm run test:insights` - Run AI insights-specific tests
- `npm run test:all` - Run all tests with longer duration

## Security Hardening

Scripts for implementing security best practices on GCP:

```bash
cd security
# Set required environment variables
export GCP_PROJECT_ID=your-project-id
export REGION=africa-south1
# Run security hardening script
./gcp-security-hardening.sh
```

Key security features:

- IAM best practices
- Cloud Armor protection
- Secret management
- Firestore backups
- VPC security
- Cloud Run security
- Monitoring and logging
- Audit and compliance

## Cost Optimization

Scripts for optimizing costs on GCP:

```bash
cd optimization
# Set required environment variables
export GCP_PROJECT_ID=your-project-id
export REGION=africa-south1
export BILLING_ACCOUNT_ID=your-billing-account
# Run cost optimization script
./gcp-cost-optimization.sh
```

Key cost optimization features:

- Budget alerts
- Cloud Run auto-scaling
- Firestore optimizations
- Storage lifecycle policies
- AI/ML resource quotas
- Resource cleanup
- Region-specific optimizations

## Requirements

- Node.js 18+
- Google Cloud SDK
- k6 (for performance testing)
- Access to GCP project with appropriate permissions

## Notes

- All scripts use environment variables for configuration
- Scripts should be run from their respective directories
- Always review changes before applying to production
- For security hardening, some operations may require organization-level permissions
