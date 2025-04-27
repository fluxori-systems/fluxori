# Makro Marketplace Scraper

## Overview

The Makro marketplace scraper is part of the Fluxori SaaS platform's South African marketplace data collection system. It provides comprehensive data extraction capabilities for [Makro](https://www.makro.co.za), one of South Africa's largest retailers.

The scraper implements a hybrid approach that combines SmartProxy templates with traditional HTML parsing for optimal results, with specific optimizations for South African market conditions like load shedding resilience.

## Features

- **Comprehensive Product Data Extraction**: Retrieves detailed product information including specifications, images, variants, and pricing.
- **Category Navigation**: Efficiently navigates Makro's category hierarchy for systematic product discovery.
- **Search Capabilities**: Performs and extracts results from product searches with various parameters.
- **Deals Monitoring**: Tracks daily deals and special promotions for competitive analysis.
- **Location-Based Availability**: Checks product availability across different Makro store locations.
- **Load Shedding Resilience**: Adapts to South African power outage conditions with fallback strategies.

## Implementation Details

The implementation follows the architecture established in the other marketplace scrapers with the following components:

- `makro_scraper.py`: Main scraper class that implements the core functionality.
- `extractors/`: Directory containing specialized extractors:
  - `product_extractor.py`: Extracts product details
  - `search_extractor.py`: Extracts search results and suggestions
  - `category_extractor.py`: Extracts category details and navigation

### Hybrid Scraping Approach

The scraper implements a hybrid approach that:

1. Attempts template-based extraction first using SmartProxy's templates
2. Falls back to traditional HTML parsing if template extraction fails
3. Tracks and reports on the success rates of each method
4. Automatically adapts to the most effective method for different content types

### Makro-Specific Optimizations

- **Session Management**: Uses consistent sessions for related requests to maintain context.
- **Dynamic Content Handling**: Special handling for JavaScript-rendered content in Makro's frontend.
- **Enhanced Resilience**: Additional retry logic and error handling for Makro-specific edge cases.

## Usage

### Basic Usage

```python
from marketplace_scraper.src.marketplaces.makro import MakroScraper
from marketplace_scraper.src.common.proxy_client import SmartProxyClient
from marketplace_scraper.src.storage.repository import MarketplaceDataRepository

# Initialize components
proxy_client = SmartProxyClient(...)
storage_client = MarketplaceDataRepository(...)

# Initialize Makro scraper
makro_scraper = MakroScraper(
    proxy_client=proxy_client,
    storage_client=storage_client,
    request_interval=2.5
)

# Discover products in a category
products = await makro_scraper.discover_products(category="electronics", limit=20)

# Get product details
product_data = await makro_scraper.extract_product_details(products[0])

# Search for products
search_results = await makro_scraper.search_products(keyword="smartphone", limit=10)

# Get daily deals
deals = await makro_scraper.extract_daily_deals()
```

### Integration with Scheduler

The Makro scraper integrates with the main controller's scheduling system with the following pre-configured jobs:

- **makro-product-refresh**: Refreshes product data every 5 hours
- **makro-daily-deals**: Extracts daily deals three times per day
- **makro-category-discovery**: Discovers products in popular categories once per day
- **makro-search-monitoring**: Monitors search results for popular keywords twice per weekday

## Performance Metrics

The scraper tracks detailed performance metrics including:

- Template vs. raw HTML extraction success rates
- Request success rates and errors
- Load shedding detection events
- Processing time per extraction type

This data is available through the `get_hybrid_performance_report()` method.

## Error Handling

The scraper implements comprehensive error handling for:

- Network errors with exponential backoff
- Load shedding detection and adaptation
- Template extraction failures with fallback strategies
- Malformed responses
- Session management

## Maintenance Notes

When updating the Makro scraper, consider:

1. **Template Compatibility**: If Makro's website structure changes, run the `test_template_compatibility()` method to find the best matching templates.
2. **Selector Updates**: Key CSS selectors used for waiting and extraction may need periodic updates.
3. **API Endpoints**: The scraper also uses some API endpoints that may change over time.

## License

Part of the Fluxori SaaS platform. All rights reserved.
