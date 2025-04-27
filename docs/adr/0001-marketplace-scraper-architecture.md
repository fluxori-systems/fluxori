# ADR-0001: South African Marketplace Data Collection Framework

## Status

Proposed

## Date

2025-04-16

## Context

Fluxori is building a Google Cloud Native competitive intelligence platform for South African e-commerce sellers. To provide comprehensive market intelligence, product data, competitive analysis, and pricing insights, we need to systematically collect data from major South African e-commerce marketplaces.

The initial focus is on Takealot (South Africa's largest online marketplace), with plans to expand to Amazon SA, Bob Shop, Makro, Loot, and incorporate historical data from Buck.cheap.

This data collection framework will form the foundation for:

- Product research capabilities for merchants
- Comprehensive price tracking across marketplaces
- Keyword analysis and search intelligence
- Competitive intelligence for South African e-commerce sellers
- Data for our browser extension (Phase 2B)

### Key Challenges

1. **South African Market Peculiarities**:

   - Frequent load shedding (power outages) requiring resilient systems
   - Variable network connectivity and bandwidth limitations
   - Regional compliance considerations for data collection
   - South African marketplace-specific data structures and patterns

2. **Technical Requirements**:

   - Need for a modular, extensible scraper framework supporting multiple marketplaces
   - Efficient use of SmartProxy Web Scraping API (Advanced plan with 82K requests/month)
   - Scalable Google Cloud Native architecture optimized for cost and performance
   - Reliable data processing pipeline with validation and normalization
   - Ethical scraping approach respecting website terms and robots.txt

3. **Data Management Requirements**:
   - Structured storage in Google Cloud Firestore
   - Efficient schema design for query performance
   - Historical data preservation for trend analysis
   - Incremental update strategies to minimize API usage

## Decision

We will implement a modular South African Marketplace Data Collection Framework using Google Cloud Native services, following a clean separation of concerns between data collection, processing, storage, and consumption layers.

### Core Architecture Components

1. **Marketplace Scraper Framework**:

   - Abstract base classes for consistent scraper implementation
   - Marketplace-specific adapters for each target e-commerce platform
   - SmartProxy client with authentication, rate limiting, and request optimization
   - Extensible data extraction and parsing system
   - Compliance-focused design with respect for robots.txt

2. **Google Cloud Infrastructure**:

   - Cloud Run for scraper execution with auto-scaling
   - Firestore for structured data storage
   - Pub/Sub for task coordination and distribution
   - Cloud Scheduler for recurring scraping tasks
   - Secret Manager for API credential management
   - Error Reporting and Monitoring for observability

3. **Data Processing Pipeline**:

   - Validation and cleaning services
   - Schema normalization across marketplaces
   - Price and availability history tracking
   - Incremental update strategies
   - Data transformation for analytics

4. **Ethical Scraping Approach**:
   - Respect for robots.txt directives
   - Reasonable rate limiting and request distribution
   - User-agent transparency
   - Focus on publicly available product data
   - Compliance with marketplace terms of service

### Technical Implementation

#### Marketplace Scraper Framework

```python
# Abstract base scraper with shared functionality
class MarketplaceScraper:
    def __init__(self, proxy_client, storage_client):
        self.proxy_client = proxy_client
        self.storage_client = storage_client
        self.logger = setup_structured_logging()

    async def fetch_page(self, url, **params):
        """Fetch page content via SmartProxy with error handling and retries"""
        pass

    async def extract_data(self, content, extractor_type):
        """Extract structured data from page content"""
        pass

    async def save_data(self, data, collection_name):
        """Save extracted data to Firestore"""
        pass

    async def check_robots_txt(self, domain):
        """Check if scraping is allowed by robots.txt"""
        pass

    # Abstract methods to be implemented by specific marketplace scrapers
    async def discover_products(self):
        """Discover products from the marketplace"""
        raise NotImplementedError

    async def extract_product_details(self, product_url):
        """Extract detailed product information"""
        raise NotImplementedError

    async def search_products(self, keyword):
        """Search for products using a keyword"""
        raise NotImplementedError

# Takealot-specific implementation
class TakealotScraper(MarketplaceScraper):
    def __init__(self, proxy_client, storage_client):
        super().__init__(proxy_client, storage_client)
        self.base_url = "https://www.takealot.com"

    async def discover_products(self):
        """Takealot-specific product discovery logic"""
        # Implementation for discovering products via categories, bestsellers, etc.
        pass

    async def extract_product_details(self, product_url):
        """Takealot-specific product detail extraction"""
        # Implementation for extracting product details, specs, pricing, etc.
        pass

    async def search_products(self, keyword):
        """Takealot-specific search implementation"""
        # Implementation for search results extraction
        pass

    async def extract_search_suggestions(self, keyword_prefix):
        """Takealot-specific search suggestion extraction"""
        # Implementation for harvesting keyword suggestions
        pass
```

#### SmartProxy Client

```python
class SmartProxyClient:
    def __init__(self,
                auth_token="VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi",
                base_url="https://scraper-api.smartproxy.com/v2",
                region="south-africa"):
        self.auth_token = auth_token
        self.base_url = base_url
        self.region = region
        self.session = aiohttp.ClientSession()
        self.request_count = 0
        self.monthly_limit = 82000  # Advanced plan limit

    async def fetch_sync(self, url, **params):
        """Fetch content via SmartProxy synchronous API with SA IP address"""
        if not self._check_quota():
            raise QuotaExceededError("Monthly SmartProxy quota exceeded")

        headers = {
            "Authorization": f"Basic {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "url": url,
            "geo": "ZA",  # South Africa
            "device_type": params.get("device_type", "desktop"),
            "headless": params.get("headless", "html"),  # Use JS rendering
            "session_id": params.get("session_id", None),
            "successful_status_codes": params.get("successful_status_codes", None)
        }

        # Add optional parameters if provided
        if params.get("headers"):
            payload["headers"] = params.get("headers")

        if params.get("cookies"):
            payload["cookies"] = params.get("cookies")

        try:
            async with self.session.post(
                f"{self.base_url}/scrape",
                json=payload,
                headers=headers
            ) as response:
                self.request_count += 1
                return await response.json()
        except Exception as e:
            self.logger.error(f"SmartProxy request failed: {str(e)}")
            raise

    async def fetch_async(self, url, **params):
        """Create asynchronous scraping task"""
        headers = {
            "Authorization": f"Basic {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "url": url,
            "geo": "ZA",  # South Africa
            "device_type": params.get("device_type", "desktop"),
            "headless": params.get("headless", "html")
        }

        try:
            async with self.session.post(
                f"{self.base_url}/task",
                json=payload,
                headers=headers
            ) as response:
                self.request_count += 1
                return await response.json()
        except Exception as e:
            self.logger.error(f"SmartProxy async task failed: {str(e)}")
            raise

    async def fetch_batch(self, urls, **params):
        """Create batch scraping task for multiple URLs"""
        headers = {
            "Authorization": f"Basic {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        tasks = []
        for url in urls:
            tasks.append({
                "url": url,
                "geo": "ZA",
                "device_type": params.get("device_type", "desktop"),
                "headless": params.get("headless", "html")
            })

        try:
            async with self.session.post(
                f"{self.base_url}/task/batch",
                json={"tasks": tasks},
                headers=headers
            ) as response:
                self.request_count += len(urls)
                return await response.json()
        except Exception as e:
            self.logger.error(f"SmartProxy batch task failed: {str(e)}")
            raise

    def _check_quota(self):
        """Check if we're within our monthly quota"""
        return self.request_count < self.monthly_limit

    async def get_quota_status(self):
        """Get current quota usage from SmartProxy API"""
        # Implementation for checking quota status
        pass

    async def get_task_result(self, task_id):
        """Get result of an asynchronous task"""
        headers = {
            "Authorization": f"Basic {self.auth_token}",
            "Accept": "application/json"
        }

        try:
            async with self.session.get(
                f"{self.base_url}/task/{task_id}",
                headers=headers
            ) as response:
                return await response.json()
        except Exception as e:
            self.logger.error(f"Failed to get task result: {str(e)}")
            raise
```

#### Firestore Data Storage

```python
class MarketplaceDataRepository:
    def __init__(self, firestore_client):
        self.db = firestore_client
        self.products_collection = self.db.collection("marketplace_products")
        self.prices_collection = self.db.collection("product_prices")
        self.keywords_collection = self.db.collection("search_keywords")

    async def save_product(self, product_data):
        """Save product data with efficient document structure"""
        product_ref = self.products_collection.document(product_data["product_id"])

        # Check if product exists to determine if this is an update
        existing = await product_ref.get()

        if existing.exists:
            # Update existing product with change tracking
            await product_ref.update({
                "title": product_data["title"],
                "description": product_data["description"],
                "brand": product_data["brand"],
                "categories": product_data["categories"],
                "specifications": product_data["specifications"],
                "images": product_data["images"],
                "last_updated": firestore.SERVER_TIMESTAMP,
                "update_count": firestore.Increment(1)
            })
        else:
            # Create new product
            await product_ref.set({
                **product_data,
                "first_seen": firestore.SERVER_TIMESTAMP,
                "last_updated": firestore.SERVER_TIMESTAMP,
                "update_count": 1
            })

        # Always save current price as a new price point for historical tracking
        await self.save_price_point(product_data["product_id"], product_data["price"], product_data["marketplace"])

    async def save_price_point(self, product_id, price_data, marketplace):
        """Save a price point in the historical price collection"""
        await self.prices_collection.add({
            "product_id": product_id,
            "marketplace": marketplace,
            "price": price_data["current"],
            "list_price": price_data.get("list", None),
            "discount_percentage": price_data.get("discount_percentage", None),
            "currency": price_data.get("currency", "ZAR"),
            "in_stock": price_data.get("in_stock", True),
            "timestamp": firestore.SERVER_TIMESTAMP
        })

    async def save_search_results(self, keyword, results, marketplace):
        """Save search results with position tracking"""
        search_ref = self.keywords_collection.document(f"{marketplace}_{sanitize_key(keyword)}")

        await search_ref.set({
            "keyword": keyword,
            "marketplace": marketplace,
            "result_count": len(results),
            "timestamp": firestore.SERVER_TIMESTAMP,
            "results": [
                {
                    "position": idx + 1,
                    "product_id": result["product_id"],
                    "title": result["title"],
                    "price": result["price"],
                }
                for idx, result in enumerate(results[:100])  # Store top 100 positions
            ]
        })
```

#### Cloud Run Service

```python
# app.py - Cloud Run service entry point
from flask import Flask, request, jsonify
import functions_framework
from google.cloud import firestore, secretmanager, pubsub_v1
import asyncio

from scrapers import TakealotScraper, BobShopScraper, MakroScraper
from clients import SmartProxyClient
from repositories import MarketplaceDataRepository

app = Flask(__name__)

# Initialize clients
db = firestore.Client()
publisher = pubsub_v1.PublisherClient()
secret_client = secretmanager.SecretManagerServiceClient()

# Load secrets
api_key = access_secret("smartproxy-api-key")
smart_proxy_client = SmartProxyClient(api_key, "https://scrape.smartproxy.com")
data_repo = MarketplaceDataRepository(db)

# Initialize scrapers
scrapers = {
    "takealot": TakealotScraper(smart_proxy_client, data_repo),
    "bobshop": BobShopScraper(smart_proxy_client, data_repo),
    "makro": MakroScraper(smart_proxy_client, data_repo)
}

@functions_framework.http
def scrape_product(request):
    """Cloud Run HTTP handler for product scraping"""
    request_json = request.get_json(silent=True)

    marketplace = request_json.get("marketplace", "takealot")
    product_id = request_json.get("product_id")

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    if marketplace not in scrapers:
        return jsonify({"error": f"Unsupported marketplace: {marketplace}"}), 400

    try:
        scraper = scrapers[marketplace]
        result = asyncio.run(scraper.extract_product_details(product_id))
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@functions_framework.http
def scrape_search(request):
    """Cloud Run HTTP handler for search scraping"""
    request_json = request.get_json(silent=True)

    marketplace = request_json.get("marketplace", "takealot")
    keyword = request_json.get("keyword")

    if not keyword:
        return jsonify({"error": "keyword is required"}), 400

    if marketplace not in scrapers:
        return jsonify({"error": f"Unsupported marketplace: {marketplace}"}), 400

    try:
        scraper = scrapers[marketplace]
        result = asyncio.run(scraper.search_products(keyword))
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@functions_framework.cloud_event
def handle_pubsub_task(cloud_event):
    """Handle Pub/Sub message for background scraping tasks"""
    import base64
    import json

    message = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    task_data = json.loads(message)

    task_type = task_data.get("task_type")
    marketplace = task_data.get("marketplace", "takealot")

    if task_type == "discover_products":
        asyncio.run(scrapers[marketplace].discover_products(
            category=task_data.get("category"),
            page=task_data.get("page", 1),
            limit=task_data.get("limit", 50)
        ))
    elif task_type == "update_product":
        asyncio.run(scrapers[marketplace].extract_product_details(
            task_data.get("product_id")
        ))
    elif task_type == "search_keyword":
        asyncio.run(scrapers[marketplace].search_products(
            task_data.get("keyword")
        ))
    else:
        print(f"Unknown task type: {task_type}")
```

#### Pub/Sub Task Distribution

```python
class ScraperTaskDistributor:
    def __init__(self, publisher_client, topic_name):
        self.publisher = publisher_client
        self.topic_name = topic_name

    async def schedule_product_discovery(self, marketplace, category=None, page=1, limit=50):
        """Schedule a product discovery task"""
        task_data = {
            "task_type": "discover_products",
            "marketplace": marketplace,
            "category": category,
            "page": page,
            "limit": limit,
            "scheduled_at": str(datetime.datetime.now())
        }

        await self._publish_task(task_data)

    async def schedule_product_update(self, marketplace, product_id):
        """Schedule a product update task"""
        task_data = {
            "task_type": "update_product",
            "marketplace": marketplace,
            "product_id": product_id,
            "scheduled_at": str(datetime.datetime.now())
        }

        await self._publish_task(task_data)

    async def schedule_search(self, marketplace, keyword):
        """Schedule a search scraping task"""
        task_data = {
            "task_type": "search_keyword",
            "marketplace": marketplace,
            "keyword": keyword,
            "scheduled_at": str(datetime.datetime.now())
        }

        await self._publish_task(task_data)

    async def _publish_task(self, task_data):
        """Publish a task to Pub/Sub"""
        try:
            topic_path = self.publisher.topic_path(
                "fluxori-marketplace-data", self.topic_name
            )
            data = json.dumps(task_data).encode("utf-8")
            future = self.publisher.publish(topic_path, data)
            return await future
        except Exception as e:
            print(f"Error publishing task: {str(e)}")
            raise
```

### Data Processing Pipeline

The data processing pipeline will handle validating, normalizing, transforming, and enriching the raw data collected from the marketplace scrapers:

```python
class MarketplaceDataProcessor:
    def __init__(self, storage_client):
        self.storage_client = storage_client
        self.schema_validators = {
            "takealot": TakealotProductValidator(),
            "bobshop": BobShopProductValidator(),
            "makro": MakroProductValidator()
        }

    async def process_product(self, raw_product_data, marketplace):
        """Process raw product data through the pipeline"""
        # Step 1: Validate data against marketplace schema
        validator = self.schema_validators.get(marketplace)
        if not validator:
            raise ValueError(f"No validator available for marketplace: {marketplace}")

        validated_data = await validator.validate(raw_product_data)

        # Step 2: Normalize data to common schema
        normalized_data = await self.normalize_to_common_schema(validated_data, marketplace)

        # Step 3: Enrich data with additional information
        enriched_data = await self.enrich_data(normalized_data)

        # Step 4: Transform for specific use cases
        transformed_data = {
            "analytics": await self.transform_for_analytics(enriched_data),
            "search": await self.transform_for_search(enriched_data),
            "storage": await self.transform_for_storage(enriched_data)
        }

        return transformed_data

    async def normalize_to_common_schema(self, data, marketplace):
        """Normalize marketplace-specific data to common schema"""
        # Implementation for schema normalization
        pass

    async def enrich_data(self, data):
        """Enrich data with additional information"""
        # Implementation for data enrichment
        pass

    async def transform_for_analytics(self, data):
        """Transform data for analytics use cases"""
        # Implementation for analytics transformation
        pass

    async def transform_for_search(self, data):
        """Transform data for search use cases"""
        # Implementation for search transformation
        pass

    async def transform_for_storage(self, data):
        """Transform data for efficient storage"""
        # Implementation for storage transformation
        pass
```

### Firestore Schema Design

The Firestore schema is designed for efficient querying, historical tracking, and scalability:

```
collections/
├── marketplace_products/
│   ├── takealot_{product_id}/
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── brand: string
│   │   ├── categories: array<string>
│   │   ├── specifications: map<string, string>
│   │   ├── images: array<string>
│   │   ├── current_price: number
│   │   ├── list_price: number
│   │   ├── discount_percentage: number
│   │   ├── currency: string
│   │   ├── in_stock: boolean
│   │   ├── marketplace: string
│   │   ├── url: string
│   │   ├── product_code: string
│   │   ├── seller: string
│   │   ├── review_count: number
│   │   ├── rating: number
│   │   ├── first_seen: timestamp
│   │   ├── last_updated: timestamp
│   │   └── update_count: number
├── product_prices/
│   ├── auto_id/
│   │   ├── product_id: string
│   │   ├── marketplace: string
│   │   ├── price: number
│   │   ├── list_price: number
│   │   ├── discount_percentage: number
│   │   ├── currency: string
│   │   ├── in_stock: boolean
│   │   └── timestamp: timestamp
├── search_keywords/
│   ├── takealot_{keyword}/
│   │   ├── keyword: string
│   │   ├── marketplace: string
│   │   ├── result_count: number
│   │   ├── timestamp: timestamp
│   │   └── results: array<object>
│   │       ├── position: number
│   │       ├── product_id: string
│   │       ├── title: string
│   │       └── price: number
├── search_suggestions/
│   ├── takealot_{keyword_prefix}/
│   │   ├── prefix: string
│   │   ├── marketplace: string
│   │   ├── timestamp: timestamp
│   │   └── suggestions: array<string>
└── marketplace_categories/
    ├── takealot_{category_id}/
    │   ├── name: string
    │   ├── url: string
    │   ├── parent_id: string
    │   ├── level: number
    │   ├── product_count: number
    │   ├── marketplace: string
    │   └── subcategories: array<string>
```

### Cloud Scheduler Configuration

```yaml
# Cloud Scheduler jobs for recurring tasks
jobs:
  - name: takealot-daily-bestsellers
    schedule: "0 0 * * *" # Daily at midnight
    time_zone: "Africa/Johannesburg"
    target:
      type: pubsub
      pubsub_target:
        topic_name: projects/fluxori-marketplace-data/topics/scraper-tasks
        data: |
          {
            "task_type": "discover_products",
            "marketplace": "takealot",
            "category": "bestsellers",
            "limit": 100
          }

  - name: takealot-product-updates
    schedule: "0 */3 * * *" # Every 3 hours
    time_zone: "Africa/Johannesburg"
    target:
      type: pubsub
      pubsub_target:
        topic_name: projects/fluxori-marketplace-data/topics/scraper-tasks
        data: |
          {
            "task_type": "update_products",
            "marketplace": "takealot",
            "strategy": "prioritized",
            "limit": 300
          }

  - name: takealot-keyword-tracking
    schedule: "0 6,18 * * *" # Twice daily at 6 AM and 6 PM
    time_zone: "Africa/Johannesburg"
    target:
      type: pubsub
      pubsub_target:
        topic_name: projects/fluxori-marketplace-data/topics/scraper-tasks
        data: |
          {
            "task_type": "track_keywords",
            "marketplace": "takealot",
            "keyword_list": "top_keywords",
            "limit": 50
          }
```

## Boundary Rules

### Module Boundary Rules

The Marketplace Data Collection framework will maintain strict boundaries between its components:

1. **Scraper Framework**:

   - May only access SmartProxy client for external requests
   - May only access Storage layer through repository interfaces
   - Must not directly access analytics or presentation layers

2. **Data Processing Pipeline**:

   - May only access data through Storage layer repositories
   - Must not directly access scrapers or external APIs
   - Must provide normalized data to consumers

3. **Storage Layer**:

   - Must provide abstract repositories for data access
   - Must encapsulate Firestore implementation details
   - Must not contain business logic

4. **Task Distribution**:
   - Must coordinate tasks via Pub/Sub
   - Must not directly invoke scraper methods
   - Must handle failure cases gracefully

### Dependency Rules

```javascript
// Dependency enforcement rules
{
  name: "scraper-boundary-rule",
  severity: "error",
  comment: "Scrapers should only use allowed dependencies",
  from: {
    path: "^src/scrapers/"
  },
  to: {
    path: [
      "^src/clients/",
      "^src/repositories/",
      "^src/utils/"
    ],
    pathNot: [
      "^src/analytics/",
      "^src/api/",
      "^src/frontend/"
    ]
  }
},
{
  name: "storage-boundary-rule",
  severity: "error",
  comment: "Storage layer should not access other modules",
  from: {
    path: "^src/repositories/"
  },
  to: {
    pathNot: [
      "^src/scrapers/",
      "^src/api/",
      "^src/analytics/"
    ]
  }
}
```

## Consequences

### Positive

1. **Modularity and Extensibility**:

   - Clean separation of concerns enables adding new marketplaces easily
   - Abstract interfaces allow swapping implementations without affecting other components
   - Support for different data processing strategies as needs evolve

2. **Cost Optimization**:

   - Efficient use of SmartProxy API through request optimization
   - Serverless architecture with Cloud Run minimizes infrastructure costs
   - Incremental updates reduce redundant data collection
   - Firestore schema designed for cost-efficient querying

3. **South African Market Optimizations**:

   - Architecture accounts for load shedding and variable connectivity
   - Regional IP access through SmartProxy ensures accurate market data
   - Scheduling aligned with South African time zones and peak periods

4. **Ethical and Compliant Approach**:
   - Respect for robots.txt and crawler directives
   - Rate limiting to minimize impact on target sites
   - Focus on publicly available product data
   - Clear user-agent identification

### Negative

1. **API Quota Limitations**:

   - 82K monthly requests limits the breadth and frequency of data collection
   - Need for careful prioritization of what to scrape

2. **Complexity**:

   - Multiple abstraction layers add development complexity
   - Need for comprehensive error handling across distributed components

3. **Data Completeness Challenges**:

   - Some marketplaces may be difficult to scrape completely
   - Dynamic content may require sophisticated extraction techniques

4. **Maintenance Requirements**:
   - Marketplace websites change frequently, requiring scraper maintenance
   - Need for monitoring to detect breaking changes

### Mitigation Strategies

1. **Request Prioritization System**:

   - Machine learning to predict which products need updates
   - Prioritize high-volume searches and popular products
   - Adaptive scheduling based on historical price volatility

2. **Comprehensive Testing**:

   - Automated testing with sample pages
   - Continuous validation of extraction patterns
   - Monitoring for extraction failures

3. **Fallback Mechanisms**:

   - Alternative extraction methods when primary patterns fail
   - Graceful degradation for partial data

4. **Incremental Architecture**:
   - Build core functionality first, then extend to additional marketplaces
   - Validate approach with Takealot before expanding

## Compliance Validation

Compliance with this architecture will be validated through:

1. **Dependency Validation**:

   - Static code analysis to enforce module boundaries
   - Regular dependency graph visualization and review

2. **Code Reviews**:

   - Focus on separation of concerns
   - Validation of ethical scraping practices

3. **Automated Testing**:

   - Unit tests for each component
   - Integration tests for end-to-end workflows
   - Simulated failure scenarios

4. **Monitoring**:
   - Dashboards for scraping performance and success rates
   - Alerting for extraction failures or pattern changes
   - Quota usage tracking and forecasting

## South African Market Considerations

### Load Shedding Resilience

1. **Task Persistence and Recovery**:

   - Tasks survive service restarts
   - Idempotent operations allow safe retries
   - Transaction boundaries prevent partial updates

2. **Scheduled Operation Windows**:

   - Align intensive operations with known power availability
   - Dynamic scheduling based on load shedding forecasts
   - Regional load shedding schedule awareness

3. **Checkpoint System**:
   - Regular state preservation during long-running operations
   - Resume capability after interruptions
   - Progress tracking for multi-stage tasks

### Network Resilience

1. **Bandwidth Optimization**:

   - Compressed data transfer
   - Selective field updates
   - Batch operations to reduce request overhead

2. **Connection Resilience**:
   - Exponential backoff for retries
   - Circuit breakers for failing endpoints
   - Connection pooling and reuse

### South African Marketplace Peculiarities

1. **Takealot-Specific Features**:

   - Daily Deals tracking
   - Promotion monitoring (e.g., Blue Dot Sale)
   - Club members' pricing
   - Takealot Marketplace vs. Direct offerings

2. **Regional Pricing Patterns**:
   - Currency fluctuation handling (ZAR volatility)
   - VAT inclusion/exclusion detection
   - Shipping cost considerations

## Alternatives Considered

### 1. Traditional Web Scraping Without SmartProxy

**Pros**:

- No API quota limitations
- Lower direct costs
- More control over request patterns

**Cons**:

- Higher infrastructure complexity
- IP blocking risks
- More maintenance for crawler logic
- Need for proxy rotation and management

### 2. Event-Driven vs. Scheduled Scraping

**Pros of Event-Driven**:

- More responsive to external triggers
- Can react to marketplace events
- Potentially more efficient use of quota

**Cons of Event-Driven**:

- More complex coordination
- Harder to predict and budget quota usage
- Risk of cascading events overwhelming system

### 3. Single Monolithic Service vs. Microservices

**Pros of Monolithic**:

- Simpler initial implementation
- Easier debugging and state management
- Lower operational overhead

**Cons of Monolithic**:

- Limited scaling flexibility
- All-or-nothing deployment
- Harder to maintain as complexity grows

## Related Decisions

- [ADR-001: Module Boundary Enforcement](ADR-001-module-boundary-enforcement.md)
- [ADR-002: Repository Pattern Implementation](ADR-002-repository-pattern-implementation.md)
- [Regional Caching Strategy](regional-caching-strategy.md)
- [Low Bandwidth Mode](low-bandwidth-mode.md)
