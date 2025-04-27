# South African Marketplace Data Collection Framework

A comprehensive framework for collecting product data, pricing information, and market intelligence from South African e-commerce platforms, with optimizations for local market conditions like load shedding and variable network connectivity.

## Overview

This framework provides a modular, extensible solution for systematic data collection from major South African e-commerce marketplaces, starting with Takealot. It uses SmartProxy's Web Scraping API with South African IP addresses and leverages Google Cloud Native services for storage, processing, and orchestration.

## Features

- **Modular Architecture**: Abstract base classes with marketplace-specific implementations
- **Ethical Scraping**: Built-in respect for robots.txt, rate limiting, and courteous access patterns
- **South African Optimizations**: Resilience to load shedding, network variability, and regional conditions
- **Google Cloud Integration**: Firestore for storage, Pub/Sub for task distribution, Cloud Run for execution
- **Comprehensive Data Collection**: Products, prices, categories, search results, and suggestions
- **Smart Request Management**: Efficient use of SmartProxy quota with prioritization and caching
- **Observability**: Monitoring, metrics, and alerting for system health and performance
- **Multiple Marketplaces**: Support for Takealot and Bob Shop (formerly Bid or Buy), with a consistent API

## Enhanced SmartProxy Integration

The framework includes a robust SmartProxy client implementation with advanced features:

- **Browser Actions Framework**: Supports clicks, scrolls, form inputs, and waiting for complex interactions
- **Session Management**: Maintains consistent IPs for related requests with 10-minute session management
- **Quota Management**: Provides safety limits with emergency circuit breaker and priority allocation
- **User-Agent Randomization**: Rotates common user-agent strings with natural patterns
- **Load Shedding Detection**: Identifies South African power outages with adaption capabilities
- **Templated Scraping**: Supports all SmartProxy Advanced features for efficient data extraction

## Architecture

The framework is organized into several key components:

1. **Core Framework** (`src/common/`)

   - Base scraper implementation
   - Enhanced SmartProxy client
   - Browser actions framework
   - Session management system
   - Quota management system
   - User agent randomization
   - Load shedding detection

2. **Marketplace Implementations** (`src/marketplaces/`)

   - Takealot-specific implementation
   - Bob Shop (formerly Bid or Buy) implementation
   - Specialized extractors for products, search, and categories

3. **Storage Layer** (`src/storage/`)

   - Firestore repository implementation
   - Schema definitions and validation
   - Caching for resilience

4. **Orchestration** (`src/orchestration/`)
   - Task scheduling and prioritization
   - Pub/Sub task distribution
   - Monitoring and observability

## Getting Started

### Prerequisites

- Python 3.9+
- SmartProxy Web Scraping API credentials (Advanced plan)
- Google Cloud project (for production use)

### Installation

```bash
# Clone the repository
git clone https://github.com/fluxori/marketplace-scraper.git
cd marketplace-scraper

# Set up Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Configure the following environment variables:

```bash
# SmartProxy credentials
export SMARTPROXY_AUTH_TOKEN="VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi"

# Google Cloud project (for production)
export GCP_PROJECT_ID="fluxori-marketplace-data"
```

### Running the Demo

Test the enhanced SmartProxy client with the included demo script:

```bash
# Run the SmartProxy Advanced Features Demo
python -m src.examples.smartproxy_demo --url="https://www.takealot.com"

# Test with specific URL (e.g., a product page)
python -m src.examples.smartproxy_demo --url="https://www.takealot.com/all?qsearch=laptop"

# Use browser actions to navigate a page
python -m src.examples.smartproxy_demo --url="https://www.takealot.com" --actions="scroll_to_bottom"

# Run the Bob Shop scraper demo
python -m src.examples.bob_shop_demo
```

### Running Locally

```bash
# Extract details for a specific product
python src/main.py --task=product --identifier="PLID123456789"

# Search for products
python src/main.py --task=search --identifier="samsung tv"

# Extract category information
python src/main.py --task=category --identifier="electronics"

# Discover products from a category
python src/main.py --task=discover --identifier="electronics"

# Get search suggestions
python src/main.py --task=suggestions --identifier="lapt"

# Get daily deals
python src/main.py --task=dailydeals

# Run scheduled tasks
python src/main.py --task=schedule --duration=30
```

### Docker

Build and run the Docker container:

```bash
docker build -t marketplace-scraper .
docker run -e SMARTPROXY_AUTH_TOKEN="VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi" marketplace-scraper
```

## Deployment

### Google Cloud Run

The framework is designed to run as a Cloud Run service:

```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/fluxori-marketplace-data/marketplace-scraper
gcloud run deploy marketplace-scraper \
  --image gcr.io/fluxori-marketplace-data/marketplace-scraper \
  --platform managed \
  --region africa-south1 \
  --memory 1Gi \
  --set-env-vars "SMARTPROXY_AUTH_TOKEN=VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi"
```

### Cloud Scheduler

Set up recurring tasks with Cloud Scheduler:

```bash
# Set up daily product refresh
gcloud scheduler jobs create http refresh-products \
  --schedule="0 0 * * *" \
  --uri="https://marketplace-scraper-xxxxx-uc.a.run.app/tasks/refresh-products" \
  --http-method=POST \
  --oidc-service-account-email="marketplace-scraper@fluxori-marketplace-data.iam.gserviceaccount.com"
```

## South African Market Considerations

### Load Shedding Resilience

- **Automatic Detection**: Pattern-based and API-based detection of load shedding
- **Task Persistence**: Durable storage of task state for recovery after outages
- **Adaptive Scheduling**: Intelligent task scheduling around power availability
- **Checkpoint System**: Regular state preservation during long-running operations
- **Emergency Mode**: Reduced functionality during extended outages
- **EskomSePush Integration**: Optional integration with load shedding APIs

### Network Optimization

- **Bandwidth-Efficient Operations**: Compressed transfers and selective field updates
- **Intelligent Caching**: Extended cache lifetime during network degradation
- **Progressive Degradation**: Graceful quality reduction during poor connectivity
- **Request Prioritization**: Critical operations take precedence during constraints
- **Variable Timeouts**: Automatically extended timeouts for unreliable connections

### Regional Compliance

- **POPIA Compliance**: Respect for South African data protection requirements
- **Ethical Scraping Practices**: Aligned with local regulations and best practices
- **Transparent Collection**: Clear identification and purpose specification
- **Data Minimization**: Collection limited to necessary information

## Advanced Usage

### Browser Actions Framework

Create complex browser interactions using the browser actions builder:

```python
from fluxori.common import BrowserActionBuilder

# Create a sequence of browser actions
actions = (BrowserActionBuilder()
    .capture_network("xhr,fetch")  # Capture network requests
    .click(".cookie-notice-button", optional=True)  # Accept cookies if present
    .wait(500)  # Wait 500ms
    .scroll("document.body.scrollHeight * 0.3")  # Scroll down 30%
    .wait(500)
    .scroll("document.body.scrollHeight * 0.6")  # Scroll down 60%
    .wait(500)
    .scroll("document.body.scrollHeight")  # Scroll to bottom
    .click(".load-more-button", optional=True)  # Click load more if present
    .wait(1000)
    .scroll("document.body.scrollHeight")  # Scroll to bottom again
    .build())  # Build the action sequence
```

### Session Management

Maintain IP consistency across related requests:

```python
from fluxori.common import SessionManager

# Initialize session manager
session_manager = SessionManager(max_lifetime=600)  # 10 minutes

# Get a session for specific category
session_id = session_manager.get_session_for_category("electronics")

# Use the session ID in requests
response = await smart_proxy_client.scrape_sync(
    url="https://www.takealot.com/electronics",
    session_id=session_id
)

# Update session usage
session_manager.update_session_usage(session_id)
```

### Quota Management

Prioritize and distribute quota across different task types:

```python
from fluxori.common import QuotaManager, QuotaDistributor, QuotaPriority

# Initialize quota manager
quota_manager = QuotaManager(monthly_quota=82000)

# Create quota distributor
distributor = QuotaDistributor(quota_manager)

# Register task types with priorities
distributor.register_task_type("competitor_pricing", QuotaPriority.CRITICAL)
distributor.register_task_type("product_details", QuotaPriority.HIGH)
distributor.register_task_type("search_results", QuotaPriority.MEDIUM)
distributor.register_task_type("category_browsing", QuotaPriority.LOW)

# Check if quota allows a task
if distributor.check_quota("product_details"):
    # Perform the task
    # ...

    # Record usage
    distributor.record_usage("product_details")
```

### Load Shedding Adaptation

Adapt behavior during power outages:

```python
from fluxori.common import LoadSheddingDetector, LoadSheddingAdapter

# Initialize components
detector = LoadSheddingDetector()
adapter = LoadSheddingAdapter(detector, cache_dir="./cache")

# Get adapted request parameters
adapted_params = adapter.get_adapted_parameters()

# Use cached data if available during outages
cache_key = adapter.get_cache_key(url)
cached_data = adapter.get_from_cache(cache_key, max_age=3600)

if cached_data:
    # Use cached data
    response = cached_data
else:
    # Make live request with adapted parameters
    response = await smart_proxy_client.scrape_sync(
        url=url,
        retries=adapted_params["retries"],
        backoff_factor=adapted_params["backoff_factor"],
        timeout=adapted_params["timeout"]
    )

    # Cache the response
    adapter.save_to_cache(cache_key, response)
```

## License

Copyright (c) 2025 Fluxori. All rights reserved.
