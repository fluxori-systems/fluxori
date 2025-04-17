"""
Test script for the Makro scraper implementation.

This script tests the basic functionality of the Makro scraper.
"""

import asyncio
import json
from marketplace_scraper.src.marketplaces.makro import MakroScraper
from marketplace_scraper.src.common.proxy_client import SmartProxyClient
from marketplace_scraper.src.storage.repository import MarketplaceDataRepository

async def test_makro_scraper():
    """Test the Makro scraper implementation."""
    print("Initializing test components...")
    
    # Initialize components
    proxy_client = SmartProxyClient(
        auth_token="dummy_token",
        base_url="https://scraper-api.smartproxy.com/v2",
        monthly_quota=10000,
        quota_manager=None
    )
    
    storage_client = MarketplaceDataRepository(
        project_id="test-project",
        cache_enabled=True,
        cache_ttl=3600
    )
    
    # Initialize Makro scraper
    makro_scraper = MakroScraper(
        proxy_client=proxy_client,
        storage_client=storage_client,
        request_interval=2.5
    )
    
    # Test template compatibility
    print("\nTesting template compatibility...")
    compatibility = await makro_scraper.test_template_compatibility()
    print(f"Compatible templates: {compatibility['compatible_templates']}")
    
    # Test product discovery
    print("\nTesting product discovery...")
    products = await makro_scraper.discover_products(category="electronics", limit=5)
    print(f"Discovered {len(products)} products")
    for i, product_url in enumerate(products[:3]):
        print(f"  Product {i+1}: {product_url}")
    
    # Test search functionality
    print("\nTesting search functionality...")
    search_results = await makro_scraper.search_products(keyword="smartphone", limit=5)
    print(f"Found {len(search_results['results'])} search results")
    for i, result in enumerate(search_results['results'][:3]):
        print(f"  Result {i+1}: {result['title']} - {result.get('price', 0)}")
    
    # Test category extraction
    print("\nTesting category extraction...")
    category_data = await makro_scraper.extract_category("electronics")
    print(f"Category name: {category_data.get('name', 'Unknown')}")
    subcategories = category_data.get('subcategories', [])
    print(f"Found {len(subcategories)} subcategories")
    for i, subcategory in enumerate(subcategories[:3]):
        print(f"  Subcategory {i+1}: {subcategory.get('name', 'Unknown')}")
    
    # Test daily deals extraction
    print("\nTesting daily deals extraction...")
    deals = await makro_scraper.extract_daily_deals()
    print(f"Found {len(deals)} daily deals")
    for i, deal in enumerate(deals[:3]):
        print(f"  Deal {i+1}: {deal.get('title', 'Unknown')} - {deal.get('price', {}).get('current', 0)}")
    
    # Get performance report
    print("\nPerformance report:")
    performance = makro_scraper.get_hybrid_performance_report()
    print(f"Template success rate: {performance['overall']['template_success_rate']:.2f}%")
    print(f"Total extractions: {performance['overall']['total_extractions']}")
    
    # Clean up
    await proxy_client.__aexit__(None, None, None)
    print("\nTest completed successfully!")

if __name__ == "__main__":
    # Run the test
    asyncio.run(test_makro_scraper())