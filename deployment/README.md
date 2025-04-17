# Marketplace Scraper Deployment

This directory contains all the necessary scripts and configurations to deploy the Fluxori marketplace scrapers to Google Cloud Platform.

## Quick Start

To deploy the entire system, run:

```bash
./deploy-all.sh YOUR_SMARTPROXY_TOKEN
```

This script will handle the complete deployment process, including:
- Setting up GCP infrastructure
- Configuring Firestore database
- Building and deploying the application
- Setting up scheduled tasks
- Configuring monitoring and alerting

## Deployment Architecture

The deployment architecture consists of:

- **Cloud Run**: Hosts the scraper application service
- **Firestore**: Stores marketplace data
- **Pub/Sub**: Manages task distribution
- **Cloud Scheduler**: Schedules recurring scraping tasks
- **Secret Manager**: Secures SmartProxy credentials
- **Cloud Monitoring**: Provides dashboards and alerts

All components are deployed to the **africa-south1** (Johannesburg) region for optimal performance with South African marketplaces.

## Key Features

1. **South African Market Optimizations**
   - Load shedding detection and adaptation
   - Regional deployment for lower latency
   - South African timezone scheduling

2. **Quota Management**
   - Conservative quota usage (82K requests/month)
   - Priority-based allocation
   - Circuit breaker for quota protection

3. **Monitoring & Alerting**
   - Comprehensive dashboard
   - Email alerts for critical issues
   - Daily status reports

4. **Autonomous Operation**
   - Self-healing capabilities
   - Adaptive behavior during outages
   - Minimal human intervention required

## Directory Structure

- `deploy-all.sh` - Main deployment script
- `Dockerfile` - Container definition
- `docker-compose.yml` - Local development setup
- `docs/` - Documentation files
- `monitoring/` - Dashboard and alert configurations
- `phase1-6_*.sh` - Individual phase scripts (advanced use)

## Documentation

- [Deployment Instructions](/DEPLOYMENT_INSTRUCTIONS.md)
- [Pre-Departure Checklist](/deployment/docs/PRE_DEPARTURE_CHECKLIST.md)
- Monitoring Instructions (created during deployment)
- Emergency Recovery (created during deployment)

## Support

For any issues with the deployment, contact:
- DevOps Team: devops@fluxori.com