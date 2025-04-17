#!/usr/bin/env python3
"""
Test script for the Buck.cheap scraper implementation.

This script tests the Buck.cheap historical price data scraper by performing
basic operations like searching for products, extracting product details with
price history, matching with marketplace products, and analyzing price trends.
"""

import asyncio
import json
import os
import sys
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'marketplace-scraper', 'src'))

# Import components
from common import SmartProxyClient
from storage import MarketplaceDataRepository
from marketplaces import BuckCheapScraper, TakealotScraper


async def test_search():
    """Test searching for products on Buck.cheap."""
    print("\n=== Testing Buck.cheap Search ===")
    results = await scraper.search_products("samsung tv", page=1)
    
    print(f"Found {len(results['results'])} results")
    for i, product in enumerate(results['results'][:5], 1):
        print(f"{i}. {product.get('title', 'Unknown')} - Retailer: {product.get('retailer_name', 'Unknown')}")
    
    return results


async def test_product_details(product_url):
    """Test extracting product details from Buck.cheap."""
    print("\n=== Testing Buck.cheap Product Details ===")
    product = await scraper.extract_product_details(product_url)
    
    print(f"Product: {product.get('title', 'Unknown')}")
    print(f"Retailer: {product.get('retailer_name', 'Unknown')}")
    print(f"Current Price: R{product.get('price', 'N/A')}")
    
    if "price_history" in product:
        print(f"Price History Points: {len(product['price_history'])}")
        # Show first few price points
        for i, point in enumerate(product['price_history'][:3], 1):
            date = point.get('date', 'Unknown date')
            price = point.get('price', 'N/A')
            print(f"  {i}. {date}: R{price}")
    else:
        print("No price history found")
    
    return product


async def test_price_trend_analysis(product_url):
    """Test price trend analysis functionality."""
    print("\n=== Testing Price Trend Analysis ===")
    analysis = await scraper.analyze_price_trends(product_url)
    
    print(f"Product: {analysis.get('title', 'Unknown')}")
    
    if "overall_trend" in analysis:
        trend = analysis["overall_trend"]
        print(f"Overall Trend: {trend.get('direction', 'unknown')}")
        print(f"Total Change: {trend.get('total_percentage', 0):.2f}%")
        print(f"Period: {trend.get('period', {}).get('start', 'N/A')} to {trend.get('period', {}).get('end', 'N/A')}")
    
    if "max_price_drop" in analysis and analysis["max_price_drop"].get("amount", 0) > 0:
        drop = analysis["max_price_drop"]
        print(f"Max Price Drop: R{drop.get('amount', 0)} ({drop.get('percentage', 0):.2f}%) on {drop.get('date', 'N/A')}")
    
    if "patterns_detected" in analysis:
        print(f"Patterns Detected: {len(analysis['patterns_detected'])}")
        for pattern in analysis['patterns_detected']:
            print(f"  - {pattern.get('type', 'unknown')}: {pattern.get('description', 'No description')}")
    
    if "price_volatility" in analysis:
        volatility = analysis["price_volatility"]
        print(f"Price Volatility: {volatility.get('level', 'unknown')} (score: {volatility.get('score', 0):.2f})")
    
    return analysis


async def test_product_matching():
    """Test matching marketplace products with Buck.cheap data."""
    print("\n=== Testing Product Matching ===")
    
    # First get a product from Takealot
    takealot_results = await takealot_scraper.search_products("samsung tv", page=1)
    if not takealot_results.get("results"):
        print("No Takealot products found for matching test")
        return
    
    takealot_product = await takealot_scraper.extract_product_details(
        takealot_results["results"][0]["url"]
    )
    
    print(f"Takealot Product: {takealot_product.get('title', 'Unknown')}")
    print(f"Product ID: {takealot_product.get('product_id', 'Unknown')}")
    
    # Now try to match with Buck.cheap
    match_result = await scraper.match_with_marketplace_product("takealot", takealot_product)
    
    print(f"Match Found: {match_result.get('matched', False)}")
    print(f"Confidence: {match_result.get('confidence', 0)}%")
    
    if match_result.get("matched", False):
        print(f"Buck.cheap URL: {match_result.get('buck_cheap_url', 'Unknown')}")
        print(f"Price History Points: {len(match_result.get('price_history', []))}")
    
    return match_result


async def test_timeframe_history():
    """Test getting price history for a specific timeframe."""
    print("\n=== Testing Timeframe History ===")
    
    # Get a product URL from search
    search_results = await scraper.search_products("laptop", page=1)
    if not search_results.get("results"):
        print("No products found for timeframe test")
        return
    
    product_url = search_results["results"][0]["url"]
    
    # Get date 90 days ago
    from datetime import datetime, timedelta
    start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    
    timeframe_data = await scraper.get_price_history_by_timeframe(
        product_url, start_date=start_date
    )
    
    print(f"Product: {timeframe_data.get('title', 'Unknown')}")
    print(f"Filtered Price Points: {len(timeframe_data.get('price_history', []))}")
    print(f"Date Range: {timeframe_data.get('price_stats', {}).get('date_range', {})}")
    
    # Show price statistics if available
    if "price_stats" in timeframe_data:
        stats = timeframe_data["price_stats"]
        print(f"Min Price: R{stats.get('min_price', 'N/A')}")
        print(f"Max Price: R{stats.get('max_price', 'N/A')}")
        print(f"Avg Price: R{stats.get('avg_price', 'N/A')}")
    
    return timeframe_data


async def run_tests():
    """Run a series of tests for the Buck.cheap scraper."""
    try:
        # Test 1: Search for products
        search_results = await test_search()
        print("\n")
        
        if not search_results.get("results"):
            print("No search results found, skipping further tests")
            return
        
        # Get first product URL for further tests
        product_url = search_results["results"][0]["url"]
        
        # Test 2: Get product details with price history
        product = await test_product_details(product_url)
        print("\n")
        
        # Test 3: Analyze price trends
        await test_price_trend_analysis(product_url)
        print("\n")
        
        # Test 4: Match with marketplace product
        await test_product_matching()
        print("\n")
        
        # Test 5: Get price history by timeframe
        await test_timeframe_history()
        
    except Exception as e:
        print(f"Error during tests: {str(e)}")
        import traceback
        print(traceback.format_exc())


if __name__ == "__main__":
    # Initialize components
    proxy_client = SmartProxyClient()
    storage_client = MarketplaceDataRepository()
    
    # Initialize Buck.cheap scraper
    scraper = BuckCheapScraper(
        proxy_client=proxy_client,
        storage_client=storage_client,
        request_interval=7.0  # Conservative rate limiting
    )
    
    # Initialize Takealot scraper for matching tests
    takealot_scraper = TakealotScraper(
        proxy_client=proxy_client,
        storage_client=storage_client
    )
    
    # Run tests
    asyncio.run(run_tests())