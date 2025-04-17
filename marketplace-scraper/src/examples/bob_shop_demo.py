"""
Bob Shop scraper demonstration script.

This script demonstrates how to use the Bob Shop scraper to extract
product information, search results, and category data.
"""

import asyncio
import logging
import json
import os
from datetime import datetime

# Import scraper components
from ..common.proxy_client import SmartProxyClient
from ..storage.repository import MarketplaceDataRepository
from ..marketplaces.bob_shop import BobShopScraper


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('bob-shop-demo')


async def run_demo():
    """Run a demonstration of the Bob Shop scraper."""
    logger.info("Starting Bob Shop scraper demonstration")
    
    # Initialize SmartProxy client
    # In a real implementation, API keys would be loaded from environment or config
    proxy_client = SmartProxyClient(
        api_key=os.environ.get('SMARTPROXY_API_KEY', 'demo_key'),
        country="ZA",  # South Africa
        proxy_type="residential"
    )
    
    # Initialize storage repository
    # In a real implementation, this would connect to Firestore
    storage_client = MarketplaceDataRepository()
    
    # Initialize Bob Shop scraper
    scraper = BobShopScraper(
        proxy_client=proxy_client,
        storage_client=storage_client,
        request_interval=2.0
    )
    
    # Create output directory for demo results
    os.makedirs('demo_results', exist_ok=True)
    
    try:
        # Step 1: Test template compatibility
        logger.info("Testing template compatibility for Bob Shop...")
        template_results = await scraper.test_template_compatibility()
        
        # Save template compatibility results
        with open('demo_results/bob_shop_template_compatibility.json', 'w') as f:
            json.dump(template_results, f, indent=2)
        
        logger.info(f"Found {len(scraper.compatible_templates)} compatible templates")
        
        # Step 2: Extract product details
        logger.info("Extracting product details...")
        product_url = "https://www.bobshop.co.za/products/samsung-galaxy-s21-5g"
        product_details = await scraper.extract_product_details(product_url)
        
        # Save product details
        with open('demo_results/bob_shop_product.json', 'w') as f:
            json.dump(product_details, f, indent=2)
        
        logger.info(f"Extracted product details for {product_details.get('title', 'Unknown Product')}")
        
        # Step 3: Search for products
        logger.info("Searching for products...")
        search_results = await scraper.search_products("smartphone", page=1, limit=10)
        
        # Save search results
        with open('demo_results/bob_shop_search.json', 'w') as f:
            json.dump(search_results, f, indent=2)
        
        logger.info(f"Found {search_results.get('result_count', 0)} products in search")
        
        # Step 4: Extract category details
        logger.info("Extracting category details...")
        category_url = "https://www.bobshop.co.za/collections/electronics"
        category_details = await scraper.extract_category(category_url)
        
        # Save category details
        with open('demo_results/bob_shop_category.json', 'w') as f:
            json.dump(category_details, f, indent=2)
        
        logger.info(f"Extracted details for category {category_details.get('title', 'Unknown Category')}")
        
        # Step 5: Extract deals
        logger.info("Extracting deals...")
        deals = await scraper.extract_deals()
        
        # Save deals
        with open('demo_results/bob_shop_deals.json', 'w') as f:
            json.dump(deals, f, indent=2)
        
        logger.info(f"Extracted {len(deals)} deals")
        
        # Step 6: Discover products by category
        logger.info("Discovering products in category...")
        category_products = await scraper.discover_products_by_category("electronics", max_pages=2)
        
        # Save category products
        with open('demo_results/bob_shop_category_products.json', 'w') as f:
            json.dump(category_products, f, indent=2)
        
        logger.info(f"Discovered {len(category_products)} products in category")
        
        # Step 7: Discover products by search
        logger.info("Discovering products by search...")
        search_products = await scraper.discover_products_by_search("laptop", max_pages=2)
        
        # Save search products
        with open('demo_results/bob_shop_search_products.json', 'w') as f:
            json.dump(search_products, f, indent=2)
        
        logger.info(f"Discovered {len(search_products)} products by search")
        
        # Step 8: Get performance report
        performance_report = scraper.get_hybrid_performance_report()
        
        # Save performance report
        with open('demo_results/bob_shop_performance.json', 'w') as f:
            json.dump(performance_report, f, indent=2)
        
        logger.info("Scraper demonstration completed successfully!")
        logger.info(f"Template extraction success rate: {performance_report['overall']['template_success_rate']:.2f}%")
    
    except Exception as e:
        logger.error(f"Error during scraper demonstration: {str(e)}")
        raise
    finally:
        # Clean up resources
        await proxy_client.close()


if __name__ == "__main__":
    asyncio.run(run_demo())