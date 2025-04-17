#!/usr/bin/env python3
"""
Takealot Template Scraping Demonstration.

This script demonstrates the enhanced Takealot scraper with template-based extraction,
intelligent fallback to traditional HTML scraping, and advanced features for
competitive intelligence and product discovery.
"""

import asyncio
import json
import logging
import os
import sys
import random
from datetime import datetime
from typing import Dict, Any, List

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import relevant modules
from common.proxy_client import SmartProxyClient
from marketplaces.takealot.takealot_scraper import TakealotScraper
from storage.repository import MarketplaceDataRepository, FirestoreRepository


# Setup logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

logger = logging.getLogger("takealot-template-demo")


async def test_template_compatibility() -> Dict[str, Any]:
    """Run template compatibility test for Takealot."""
    async with SmartProxyClient() as proxy_client:
        storage_client = FirestoreRepository()
        
        # Initialize Takealot scraper
        scraper = TakealotScraper(proxy_client, storage_client)
        
        # Run template compatibility test
        compatibility_results = await scraper.test_template_compatibility()
        
        return compatibility_results


async def scrape_with_hybrid_approach() -> Dict[str, Any]:
    """Demonstrate hybrid scraping approach for product details, search, and categories."""
    async with SmartProxyClient() as proxy_client:
        storage_client = FirestoreRepository()
        
        # Initialize Takealot scraper
        scraper = TakealotScraper(proxy_client, storage_client)
        
        # First, let's test template compatibility to find the best templates
        await scraper.test_template_compatibility()
        
        # Demonstration tasks
        results = {
            "product_details": None,
            "search_results": None,
            "daily_deals": None
        }
        
        # 1. Extract product details using hybrid approach
        product_url = "https://www.takealot.com/samsung-galaxy-a54-5g-dual-sim-8gb-ram-256gb-awesome-graphite/PLID73868797"
        logger.info(f"Extracting product details from {product_url}")
        product_data = await scraper.extract_product_details(product_url)
        results["product_details"] = {
            "url": product_url,
            "success": bool(product_data),
            "extraction_method": "template" if product_data and product_data.get("_template_extracted") else "raw_html"
        }
        
        # 2. Search for products using hybrid approach
        search_keyword = "headphones wireless"
        logger.info(f"Searching for '{search_keyword}'")
        search_results = await scraper.search_products(search_keyword, page=1, limit=10)
        results["search_results"] = {
            "keyword": search_keyword,
            "success": bool(search_results and search_results.get("results")),
            "result_count": search_results.get("result_count", 0) if search_results else 0,
            "extraction_method": search_results.get("extraction_method", "raw_html") if search_results else "failed"
        }
        
        # 3. Extract daily deals using hybrid approach
        logger.info("Extracting daily deals")
        deals = await scraper.extract_daily_deals()
        results["daily_deals"] = {
            "success": bool(deals),
            "deal_count": len(deals) if deals else 0
        }
        
        # Get performance report
        performance_report = scraper.get_hybrid_performance_report()
        results["performance_report"] = performance_report
        
        return results


async def demonstrate_product_discovery() -> Dict[str, Any]:
    """Demonstrate product discovery features."""
    async with SmartProxyClient() as proxy_client:
        storage_client = FirestoreRepository()
        
        # Initialize Takealot scraper
        scraper = TakealotScraper(proxy_client, storage_client)
        
        # Demonstration tasks
        results = {
            "category_discovery": None,
            "search_discovery": None,
            "total_products_found": 0
        }
        
        # 1. Discover products by category
        category_slug = "electronics/computers/laptops"
        logger.info(f"Discovering products from category: {category_slug}")
        category_products = await scraper.discover_products_by_category(
            category_slug=category_slug,
            max_pages=2  # Limit to 2 pages for demo
        )
        
        # Store results
        results["category_discovery"] = {
            "category": category_slug,
            "products_found": len(category_products),
            "sample_products": category_products[:3] if category_products else []
        }
        
        # 2. Discover products by search
        search_term = "smartphone 5g"
        logger.info(f"Discovering products by search: {search_term}")
        search_products = await scraper.discover_products_by_search(
            keyword=search_term,
            max_pages=2  # Limit to 2 pages for demo
        )
        
        # Store results
        results["search_discovery"] = {
            "search_term": search_term,
            "products_found": len(search_products),
            "sample_products": search_products[:3] if search_products else []
        }
        
        # Calculate total
        results["total_products_found"] = len(category_products) + len(search_products)
        
        return results


async def demonstrate_competitive_intelligence() -> Dict[str, Any]:
    """Demonstrate competitive intelligence features."""
    async with SmartProxyClient() as proxy_client:
        storage_client = FirestoreRepository()
        
        # Initialize Takealot scraper
        scraper = TakealotScraper(proxy_client, storage_client)
        
        # Demonstration tasks
        results = {
            "competitor_discovery": None,
            "price_history": None
        }
        
        # 1. Find competitors for a product
        product_url = "https://www.takealot.com/samsung-galaxy-a54-5g-dual-sim-8gb-ram-256gb-awesome-graphite/PLID73868797"
        logger.info(f"Finding competitors for product: {product_url}")
        competitors = await scraper.discover_competitors_by_product(product_url)
        
        # Store results
        results["competitor_discovery"] = {
            "product_url": product_url,
            "competitors_found": len(competitors),
            "top_competitors": competitors[:5] if competitors else []
        }
        
        # 2. Extract price history
        logger.info(f"Extracting price history for product: {product_url}")
        price_history = await scraper.extract_product_pricing_history(
            product_id_or_url=product_url,
            days_back=30  # Get 30 days of history
        )
        
        # Store results
        results["price_history"] = {
            "product_url": product_url,
            "days_of_history": price_history.get("history_days", 0),
            "current_price": price_history.get("current_price", 0),
            "min_price": price_history.get("min_price", 0),
            "max_price": price_history.get("max_price", 0),
            "avg_price": price_history.get("avg_price", 0),
            "price_points": len(price_history.get("price_history", [])),
            "promotions": price_history.get("promotion_history", [])
        }
        
        return results


async def demonstrate_resilience_features() -> Dict[str, Any]:
    """Demonstrate load shedding resilience and circuit breaker features."""
    async with SmartProxyClient() as proxy_client:
        # Improve detection threshold for demo
        proxy_client.load_shedding_detection_threshold = 2
        
        storage_client = FirestoreRepository()
        
        # Initialize Takealot scraper
        scraper = TakealotScraper(proxy_client, storage_client)
        
        # Network status report
        results = {
            "normal_operation": None,
            "load_shedding_simulation": None,
            "circuit_breaker": None
        }
        
        # 1. Normal operation
        try:
            logger.info("Testing normal network operation")
            product_url = "https://www.takealot.com/samsung-galaxy-a54-5g-dual-sim-8gb-ram-256gb-awesome-graphite/PLID73868797"
            product_data = await scraper.extract_product_details(product_url)
            
            results["normal_operation"] = {
                "status": "success",
                "network_status": proxy_client.network_status,
                "consecutive_failures": proxy_client.consecutive_failures
            }
        except Exception as e:
            results["normal_operation"] = {
                "status": "failure",
                "error": str(e)
            }
            
        # 2. Load shedding simulation (simulated by setting consecutive failures manually)
        try:
            logger.info("Simulating load shedding condition")
            # Simulate consecutive failures to trigger load shedding detection
            proxy_client.consecutive_failures = proxy_client.load_shedding_detection_threshold + 1
            proxy_client.load_shedding_detection.check_failure()
            
            # Try to perform an operation during "load shedding"
            search_results = await scraper.search_products("test", page=1, limit=5)
            
            results["load_shedding_simulation"] = {
                "detected": proxy_client.network_status == "loadShedding",
                "status": "continued operation with resilience",
                "network_status": proxy_client.network_status,
                "consecutive_failures": proxy_client.consecutive_failures
            }
        except Exception as e:
            results["load_shedding_simulation"] = {
                "detected": proxy_client.network_status == "loadShedding",
                "status": "failure",
                "error": str(e)
            }
        
        # Reset network status
        proxy_client.network_status = "normal"
        proxy_client.consecutive_failures = 0
        proxy_client.load_shedding_detection.reset()
        
        # 3. Circuit breaker simulation
        try:
            logger.info("Simulating quota circuit breaker")
            # Save current values
            original_request_count = proxy_client.request_count
            original_monthly_quota = proxy_client.monthly_quota
            
            # Configure to trigger circuit breaker
            proxy_client.request_count = int(proxy_client.monthly_quota * proxy_client.emergency_quota_threshold) + 1
            
            # Check quota which should trip the circuit breaker
            quota_ok = proxy_client.check_quota()
            
            results["circuit_breaker"] = {
                "tripped": proxy_client.circuit_breaker_tripped,
                "quota_check_result": quota_ok,
                "usage_percentage": (proxy_client.request_count / proxy_client.monthly_quota) * 100
            }
            
            # Restore original values
            proxy_client.request_count = original_request_count
            proxy_client.circuit_breaker_tripped = False
            
        except Exception as e:
            results["circuit_breaker"] = {
                "status": "error",
                "error": str(e)
            }
            
        return results


def save_results_to_file(data: Dict[str, Any], filename: str) -> None:
    """Save results to JSON file."""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    logger.info(f"Results saved to {filename}")


async def main() -> None:
    """Main function to run the demonstration."""
    # 1. Test template compatibility
    logger.info("=== Testing Template Compatibility ===")
    compatibility_results = await test_template_compatibility()
    save_results_to_file(compatibility_results, "takealot_template_compatibility.json")
    
    # 2. Demonstrate hybrid approach
    logger.info("=== Demonstrating Hybrid Scraping Approach ===")
    hybrid_results = await scrape_with_hybrid_approach()
    save_results_to_file(hybrid_results, "takealot_hybrid_results.json")
    
    # 3. Demonstrate product discovery
    logger.info("=== Demonstrating Product Discovery ===")
    discovery_results = await demonstrate_product_discovery()
    save_results_to_file(discovery_results, "takealot_product_discovery.json")
    
    # 4. Demonstrate competitive intelligence
    logger.info("=== Demonstrating Competitive Intelligence ===")
    competitive_results = await demonstrate_competitive_intelligence()
    save_results_to_file(competitive_results, "takealot_competitive_intelligence.json")
    
    # 5. Demonstrate resilience features
    logger.info("=== Demonstrating Resilience Features ===")
    resilience_results = await demonstrate_resilience_features()
    save_results_to_file(resilience_results, "takealot_resilience_features.json")
    
    # Print summary
    logger.info("=== Summary ===")
    if hybrid_results["performance_report"]["overall"]["total_extractions"] > 0:
        template_rate = hybrid_results["performance_report"]["overall"]["template_success_rate"]
        logger.info(f"Template success rate: {template_rate:.2f}%")
        logger.info(f"Templates used: {hybrid_results['performance_report']['compatible_templates']}")
    
    logger.info(f"Total products discovered: {discovery_results['total_products_found']}")
    logger.info(f"Competitors found: {competitive_results['competitor_discovery']['competitors_found']}")
    logger.info(f"Load shedding detection: {'Successful' if resilience_results['load_shedding_simulation']['detected'] else 'Failed'}")
    logger.info(f"Circuit breaker: {'Tripped' if resilience_results['circuit_breaker']['tripped'] else 'Not tripped'}")
    
    logger.info("Demonstration completed!")


if __name__ == "__main__":
    """Run the main function."""
    asyncio.run(main())