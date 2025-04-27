# Fluxori Administrator Guide

This guide provides comprehensive information for Fluxori administrators on system configuration, user management, and advanced settings.

## Table of Contents

1. [Administrator Responsibilities](#administrator-responsibilities)
2. [System Configuration](#system-configuration)
3. [User Management](#user-management)
4. [Organization Settings](#organization-settings)
5. [Marketplace Configuration](#marketplace-configuration)
6. [AI Credit Management](#ai-credit-management)
7. [Integration Settings](#integration-settings)
8. [Security Settings](#security-settings)
9. [Monitoring & Reports](#monitoring--reports)
10. [Troubleshooting](#troubleshooting)

## Administrator Responsibilities

As a Fluxori administrator, you are responsible for:

- Setting up and configuring the platform for your organization
- Managing user accounts and permissions
- Configuring integrations with marketplaces and other systems
- Managing AI credit allocation
- Maintaining security settings
- Monitoring system usage and performance
- Resolving issues and supporting users

## System Configuration

### Initial Setup

When setting up Fluxori for the first time:

1. Complete the organization profile in **Settings → Organization**
2. Configure your warehouses in **Settings → Warehouses**
3. Set up tax rates in **Settings → Tax Settings**
4. Configure shipping methods in **Settings → Shipping**
5. Set up payment methods in **Settings → Payments**

### Email Configuration

Configure email notifications:

1. Navigate to **Settings → Notifications**
2. Configure your SMTP settings:
   - SMTP server and port
   - Authentication credentials
   - Default sender address
3. Configure notification templates for:
   - Order confirmations
   - Shipping notifications
   - Inventory alerts
   - User invitations

### System Defaults

Set system-wide defaults:

1. Go to **Settings → System Defaults**
2. Configure:
   - Default currency (ZAR recommended for South African businesses)
   - Date and time format
   - Default warehouse for new stock
   - Default marketplace settings
   - System timeout and security settings

## User Management

### User Roles

Fluxori has the following built-in roles:

- **Super Admin**: Full access to all features and settings (limit to 1-2 people)
- **Admin**: Can configure most system settings but not billing or API keys
- **Manager**: Can manage inventory, orders, and view reports
- **Staff**: Basic access to assigned areas (order processing, inventory, etc.)
- **Viewer**: Read-only access to assigned areas (for auditors, consultants)

### Creating Users

To add a new user:

1. Go to **Settings → Users**
2. Click **Invite User**
3. Enter their email address
4. Select their role
5. Choose which warehouses they can access
6. Set any additional permissions
7. Click **Send Invitation**

The user will receive an email to create their account and set a password.

### Managing Permissions

For fine-grained access control:

1. Navigate to **Settings → Roles & Permissions**
2. Select a role to customize
3. Adjust permissions for each module:
   - **View**: Can see but not change
   - **Edit**: Can make changes
   - **Create**: Can add new items
   - **Delete**: Can remove items
   - **Approve**: Can approve changes or actions
4. Save the updated permissions

### User Activity Logs

Monitor user activity:

1. Go to **Settings → Activity Logs**
2. View all actions taken by users
3. Filter by:
   - User
   - Date range
   - Action type
   - Module
4. Export logs for compliance or audit purposes

## Organization Settings

### Company Information

Set up your organization profile:

1. Navigate to **Settings → Organization**
2. Configure:
   - Legal business name
   - Trading name
   - Registration number
   - VAT number
   - Physical address
   - Contact information
   - Logo and branding

### Billing Information

Manage your subscription and billing:

1. Go to **Settings → Billing**
2. View current subscription plan
3. Update payment method
4. View billing history
5. Download invoices
6. Change subscription tier (contact support)

### Warehouse Configuration

Set up your physical locations:

1. Navigate to **Settings → Warehouses**
2. Click **Add Warehouse** to create new locations
3. For each warehouse, configure:
   - Name and code
   - Physical address
   - Contact person
   - Operating hours
   - Picking strategy (FIFO, LIFO, etc.)
   - Zone and bin structure

## Marketplace Configuration

### Adding Marketplace Connections

1. Go to **Settings → Marketplaces**
2. Click **Add Marketplace**
3. Select from supported South African marketplaces:
   - Takealot
   - Bob Shop (formerly Bidorbuy)
   - Wantitall
   - OneDayOnly
   - Loot
   - Everyshop
   - International marketplaces (Amazon, eBay, etc.)
4. Follow the OAuth authentication flow
5. Configure sync settings:
   - How often to sync inventory
   - How often to fetch orders
   - Default handling time
   - Return policy

### Marketplace Mapping

Map your products to marketplace listings:

1. Navigate to **Marketplaces → Mapping**
2. Either:
   - Import existing marketplace listings and map to your products
   - Create new listings from your products
3. Configure category mappings
4. Set pricing rules by marketplace

## AI Credit Management

### Credit Allocation

Manage AI credits across your organization:

1. Go to **Settings → AI Credits**
2. View current credit balance
3. Purchase additional credits
4. Allocate credits by:
   - Department
   - User
   - Feature

### Usage Monitoring

Track AI feature usage:

1. Navigate to **Settings → AI Credits → Usage**
2. View consumption by:
   - Feature (pricing optimization, product analysis, etc.)
   - User
   - Time period
3. Set up alerts for high usage

## Integration Settings

### API Configuration

Set up API access for third-party integrations:

1. Go to **Settings → Integrations → API**
2. Generate API keys for different services
3. Set permissions and rate limits for each key
4. View API usage statistics

### Accounting Integration

Connect to accounting software:

1. Navigate to **Settings → Integrations → Accounting**
2. Select your accounting package:
   - Xero
   - Sage
   - QuickBooks
   - Others
3. Follow the connection steps
4. Configure sync settings for:
   - Invoices
   - Payments
   - Expenses
   - Tax

### Shipping Integration

Set up shipping providers:

1. Go to **Settings → Integrations → Shipping**
2. Add shipping carriers:
   - CourierGuy
   - The Courier Guy
   - Aramex
   - DHL
   - PostNet
   - SAPO
3. Configure account details
4. Set default shipping services
5. Configure label printing settings

## Security Settings

### Authentication Settings

Configure authentication requirements:

1. Navigate to **Settings → Security → Authentication**
2. Set password policies:
   - Minimum length
   - Complexity requirements
   - Rotation period
3. Configure 2FA options:
   - SMS
   - Authenticator apps
   - Email
4. Set session timeouts

### Access Control

Manage IP restrictions:

1. Go to **Settings → Security → Access Control**
2. Enable IP whitelisting
3. Add allowed IP addresses or ranges
4. Configure trusted devices

### Audit Settings

Configure security auditing:

1. Navigate to **Settings → Security → Audit**
2. Select events to audit
3. Set retention period for logs
4. Configure export settings for compliance

## Monitoring & Reports

### System Health

Monitor system performance:

1. Go to **Settings → System → Health**
2. View:
   - API response times
   - Database query performance
   - Background task status
   - Storage usage

### Custom Reports

Create organization-specific reports:

1. Navigate to **Reports → Custom Reports**
2. Click **Create Report**
3. Select data sources
4. Configure metrics and dimensions
5. Set visualization type
6. Schedule automatic generation and distribution

## Troubleshooting

### Common Issues

Solutions for frequently encountered problems:

#### Marketplace Sync Issues

1. Check API credentials
2. Verify marketplace status (may be down for maintenance)
3. Check for product validation errors
4. Review sync logs at **Settings → System → Logs**

#### Inventory Discrepancies

1. Run the reconciliation tool at **Inventory → Tools → Reconcile**
2. Check for pending stock movements
3. Verify recent stock adjustments in the audit log
4. Check for failed marketplace syncs

#### User Access Problems

1. Verify the user's role and permissions
2. Check if their account is locked (failed login attempts)
3. Clear their browser cache
4. Reset their password if necessary

### Support Channels

If you need additional help:

- Email: [admin-support@fluxori.com](mailto:admin-support@fluxori.com)
- Phone: +27 12 345 6789 (Admin Support Line)
- Knowledge Base: [help.fluxori.com/admin](https://help.fluxori.com/admin)
- Community Forum: [community.fluxori.com](https://community.fluxori.com)

---

## Additional Resources

- [Advanced Configuration Guide](./advanced-configuration.md)
- [Data Migration Guide](./data-migration.md)
- [Security Best Practices](./security-best-practices.md)
- [Custom Integration Development](./custom-integrations.md)
- [Backup and Disaster Recovery](./backup-recovery.md)
