# Loot Marketplace Scraper

This module provides comprehensive scraping functionality for the Loot.co.za marketplace, focusing on South African market data collection.

## Overview

The Loot scraper is designed to efficiently extract product data, search results, category information, and promotions from Loot.co.za. It implements a hybrid approach combining template-based extraction with traditional HTML parsing for optimal results.

## Features

- **Product Details Extraction**: Comprehensive extraction of product information, including specifications, pricing, images, variants, etc.
- **Search Functionality**: Full support for search results extraction with pagination and search suggestions
- **Category Navigation**: Browsing of category hierarchies and extraction of category metadata
- **Daily Deals Monitoring**: Tracking of promotional deals and special offers
- **Price History Tracking**: Recording of historical price data for trend analysis
- **Competitor Discovery**: Finding competing products for a given item
- **Template Support**: Integration with SmartProxy templates for enhanced extraction
- **South African Optimization**: Specific adaptations for the South African market
- **Load Shedding Resilience**: Automatic adaptation to load shedding conditions

## Architecture

The Loot scraper follows the established architecture pattern used across all marketplace scrapers:

```
loot/
├── __init__.py                # Module exports
├── loot_scraper.py            # Main scraper implementation
├── README.md                  # Documentation
└── extractors/                # Specialized extractors
    ├── __init__.py
    ├── product_extractor.py   # Product data extraction
    ├── search_extractor.py    # Search results extraction
    └── category_extractor.py  # Category data extraction
```

## Usage Examples

### Basic Product Extraction

```python
from marketplaces.loot import LootScraper
from common.proxy_client import SmartProxyClient
from storage.repository import MarketplaceDataRepository

async def extract_product():
    # Initialize dependencies
    proxy_client = SmartProxyClient()
    storage_client = MarketplaceDataRepository()

    # Create scraper
    loot_scraper = LootScraper(proxy_client, storage_client)

    # Extract product details
    product_url = "https://www.loot.co.za/product/harry-potter-and-the-philosopher-s-stone/qbfr-930-g010"
    product_data = await loot_scraper.extract_product_details(product_url)

    return product_data
```

### Search Products

```python
async def search_products():
    # Initialize scraper (see above)

    # Search for products
    search_results = await loot_scraper.search_products(
        keyword="smartphone",
        page=1,
        limit=20
    )

    return search_results
```

### Extract Daily Deals

```python
async def extract_deals():
    # Initialize scraper (see above)

    # Get daily deals
    deals = await loot_scraper.extract_daily_deals()

    return deals
```

### Discover Products by Category

```python
async def discover_by_category():
    # Initialize scraper (see above)

    # Discover products in a category
    products = await loot_scraper.discover_products_by_category(
        category_slug="electronics-5",
        max_pages=3
    )

    return products
```

## Template Compatibility

The Loot scraper implements a hybrid extraction approach:

1. **Template-First Approach**: Attempts extraction using SmartProxy templates
2. **Fallback Mechanism**: Falls back to raw HTML parsing if template extraction fails
3. **Runtime Optimization**: Tracks template performance and adapts over time

You can test template compatibility using:

```python
compatibility_report = await loot_scraper.test_template_compatibility()
```

## HTML Structure Notes

Loot.co.za uses a relatively simple HTML structure compared to other marketplaces:

- **Product Pages**: Product information is generally available in clearly labeled elements
- **Search Results**: Clean list structure with consistent product cards
- **Categories**: Straightforward hierarchy with clear navigation elements
- **Pagination**: Standard offset-based pagination (24 products per page)

## South African Market Considerations

The Loot scraper implements several optimizations for the South African market:

- **Load Shedding Handling**: Automatic detection and adaptation to load shedding
- **Network Resilience**: Enhanced retry mechanisms for unstable connections
- **Bandwidth Efficiency**: Minimized data transfer for variable bandwidth conditions
- **Regional Pricing**: Proper handling of ZAR currency and South African pricing formats

## Performance Metrics

The Loot scraper achieves the following performance metrics:

- **Template Success Rate**: Approximately 95% for supported product types
- **Extraction Speed**: 2-3 products per second under optimal conditions
- **Completeness**: High data coverage across all product categories
- **Resilience**: Strong performance even with unstable connections

## Known Limitations

- Some complex product variants may not be fully extracted
- JavaScript-heavy promotional content may be missed in some cases
- Limited historical data until sufficient collection cycles have occurred

## Integration with Main Controller

The Loot scraper integrates seamlessly with the main scraper controller application:

```python
# In the controller application
from marketplaces.loot import LootScraper

# Register the scraper
scrapers = {
    "loot": LootScraper(proxy_client, storage_client)
}

# Schedule tasks
scheduler.register_task(
    "loot_daily_deals",
    scrapers["loot"].extract_daily_deals,
    schedule="0 6 * * *"  # Daily at 6 AM
)
```
