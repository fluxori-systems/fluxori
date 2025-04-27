# Buck.cheap Historical Price Data Scraper

This module provides a specialized scraper for Buck.cheap, a website that tracks historical pricing data for major South African retailers including Takealot, Makro, Checkers, Woolworths, and Pick n Pay.

## Overview

The Buck.cheap scraper extends our marketplace data collection framework to include historical price data that would otherwise take months to collect directly. This provides valuable context for our real-time scraping data, giving us years of pricing trends from day one.

## Features

- Extract detailed product information from Buck.cheap
- Collect historical price data going back 2+ years
- Identify price change events with dates
- Download and process CSV price history files
- Match products with our marketplace scrapers' data
- Analyze price trends and patterns
- Implement respectful scraping practices with conservative rate limiting

## Supported Retailers

The scraper can extract data for products from the following South African retailers:

- Takealot
- Makro
- Pick n Pay
- Checkers
- Woolworths
- Game
- Dis-Chem
- Clicks
- Incredible Connection

## Integration

The Buck.cheap scraper integrates with our existing marketplace scrapers through the product matching system, which allows us to:

1. Find corresponding Buck.cheap products for items in our product catalog
2. Enrich our real-time data with historical pricing information
3. Provide more comprehensive price history to our users

## Ethical Scraping

This scraper implements conservative rate limiting (7 seconds between requests) and includes a clear user-agent for identification. It focuses only on products relevant to our marketplace catalog and is designed to be respectful of Buck.cheap's resources.

## Usage Examples

### Basic Product Search

```python
# Initialize scraper
scraper = BuckCheapScraper(proxy_client, storage_client)

# Search for products
results = await scraper.search_products("samsung tv")

# Print results
for product in results["results"]:
    print(f"{product['title']} - {product.get('price', 'N/A')} ZAR")
```

### Extract Product with Price History

```python
# Extract product details including price history
product_url = "https://buck.cheap/takealot/PLID12345678-samsung-tv"
product_data = await scraper.extract_product_details(product_url)

# Access price history
if "price_history" in product_data:
    for point in product_data["price_history"]:
        print(f"{point['date']}: R{point.get('price', 'N/A')}")
```

### Match with Marketplace Product

```python
# Match a Takealot product with Buck.cheap data
takealot_product = {
    "product_id": "12345678",
    "title": "Samsung 55\" Crystal UHD 4K Smart TV",
    "url": "https://www.takealot.com/samsung-55-crystal-uhd-4k-smart-tv/PLID12345678"
}

match_result = await scraper.match_with_marketplace_product("takealot", takealot_product)

if match_result["matched"]:
    print(f"Found match with confidence: {match_result['confidence']}%")
    print(f"Price history spans: {match_result['price_history_stats']['date_range']}")
```

### Analyze Price Trends

```python
# Analyze price trends for a product
analysis = await scraper.analyze_price_trends("https://buck.cheap/takealot/PLID12345678-samsung-tv")

print(f"Overall trend: {analysis['overall_trend']['direction']}")
print(f"Total change: {analysis['overall_trend']['total_percentage']}%")
print(f"Maximum price drop: R{analysis['max_price_drop']['amount']} ({analysis['max_price_drop']['percentage']}%)")
```

## Data Structure

The scraper extracts and stores the following data:

- Basic product information (title, description, images)
- Retailer details (name, URL)
- Current pricing information
- Historical price change events with dates
- Stock status history
- Price change patterns and trends

## Dependencies

- SmartProxy client for web requests
- BeautifulSoup for HTML parsing
- Firestore repository for data storage
- Regular expressions for data extraction
