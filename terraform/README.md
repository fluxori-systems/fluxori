# Fluxori GCP Infrastructure

This directory contains Terraform configurations for setting up the Google Cloud Platform (GCP) infrastructure for the Fluxori e-commerce operations platform.

## Infrastructure Components

The Terraform configuration sets up the following GCP resources:

- **GCP Project**: Project setup with appropriate organization structure
- **Firestore**: Native mode Firestore database as our primary database
- **Cloud Storage**: Buckets for file storage
- **Cloud Run**: Containerized services for backend and frontend
- **Vertex AI**: AI capabilities for insights and RAG retrieval
- **Secret Manager**: Secure storage for credentials
- **IAM**: Identity and Access Management configuration
- **Monitoring**: Cloud Monitoring and Logging
- **VPC**: Virtual Private Cloud with appropriate security settings

## Directory Structure

```
terraform/
├── main.tf                 # Main configuration file
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── environments/
│   ├── dev/                # Development environment
│   │   └── terraform.tfvars # Development variables
│   └── prod/               # Production environment
│       └── terraform.tfvars # Production variables
└── modules/                # Terraform modules
    ├── project/            # GCP Project module
    ├── firestore/          # Firestore module
    ├── cloud-storage/      # Cloud Storage module
    ├── cloud-run/          # Cloud Run module
    ├── vertex-ai/          # Vertex AI module
    ├── secret-manager/     # Secret Manager module
    ├── iam/                # IAM module
    ├── monitoring/         # Monitoring module
    └── vpc/                # VPC module
```

## Setup Instructions

### Prerequisites

1. Install Terraform (version 1.0.0 or later)
2. Install Google Cloud SDK
3. Authenticate with Google Cloud: `gcloud auth application-default login`

### Deploying the Infrastructure

1. Navigate to the environment directory you want to deploy:

```bash
cd environments/dev
```

2. Initialize Terraform:

```bash
terraform init ../../
```

3. Plan the deployment:

```bash
terraform plan -var-file=terraform.tfvars -state=terraform.tfstate ../../
```

4. Apply the changes:

```bash
terraform apply -var-file=terraform.tfvars -state=terraform.tfstate ../../
```

### South Africa-Specific Considerations

This configuration is optimized for the South African market:

- Uses `africa-south1` (Johannesburg) region where available
- Uses `europe-west4` (Netherlands) for GenAI services that aren't available in South Africa yet
- Optimizes latency for South African users

### Multi-Account Architecture

The infrastructure supports multiple organization accounts with proper isolation:

- Each organization has its own set of resources
- Firestore collections are prefixed with organization IDs
- Storage buckets include organization isolation
- IAM permissions are scoped to specific resources

### AI Credit System

The Terraform configuration includes a credit system for tracking AI resource usage:

- Vertex AI Feature Store is used to store credit information
- Custom metrics track credit usage
- Monitoring alerts notify when credits are low

## Customization

### Adding/Modifying Environments

To create a new environment:

1. Create a new directory under `environments/`
2. Copy an existing `terraform.tfvars` file and modify as needed

### Updating Infrastructure

To update the infrastructure:

1. Modify the relevant Terraform files
2. Run `terraform plan` to see the changes
3. Run `terraform apply` to apply the changes

## Environment Variable Configuration

After deploying the infrastructure, you need to configure your application to connect to the GCP services. Use the `.env.gcp.template` file in the backend directory as a starting point.

## Important Notes

- **Deletion Protection**: Production resources have deletion protection enabled
- **State Management**: Each environment has its own state file
- **Sensitive Data**: Sensitive values are marked as sensitive in Terraform and should be stored securely