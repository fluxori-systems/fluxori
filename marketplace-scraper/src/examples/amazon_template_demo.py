#!/usr/bin/env python3
"""
Amazon South Africa Scraper Demo for Fluxori Marketplace Data Collection

This script demonstrates the Amazon South Africa scraper with SmartProxy templates,
showcasing the advanced features of the marketplace data collection framework for the
South African market.

Features demonstrated:
- Product extraction using Amazon-specific templates
- Search results with geo-targeting for South Africa
- Price monitoring with historical tracking
- Reviews extraction
- Bestseller discovery
- Template performance metrics
- Load shedding resilience
- Competitive intelligence capabilities

Usage:
    python amazon_template_demo.py [--no-output-files] [--in-memory-storage]
"""

import asyncio
import argparse
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add the parent directory to the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the required modules
from common.proxy_client import SmartProxyClient, LoadSheddingDetectedError
from marketplaces.amazon.amazon_scraper import AmazonSAScraper
from storage.repository import MarketplaceDataRepository, FirestoreRepository
from common.load_shedding_detector import LoadSheddingDetector


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('amazon_scraper_demo.log')
    ]
)

logger = logging.getLogger('amazon-template-demo')


async def run_amazon_template_demo(in_memory_storage: bool = False, 
                                save_output_files: bool = True) -> Dict[str, Any]:
    """Run the Amazon South Africa template demo.
    
    Args:
        in_memory_storage: Whether to use in-memory storage instead of Firestore
        save_output_files: Whether to save output files to disk
        
    Returns:
        Dictionary with demo results
    """
    logger.info("Starting Amazon South Africa scraper demo with SmartProxy templates")
    
    # Initialize SmartProxy client with South African IP configuration
    proxy_client = SmartProxyClient(
        # Using default auth token for demo
        region="ZA",  # South Africa region
        load_shedding_detection_threshold=3,
        enable_quota_circuit_breaker=True
    )
    
    # Initialize storage repository
    storage_client = MarketplaceDataRepository(in_memory=in_memory_storage)
    
    # Initialize the Amazon scraper with template support
    amazon_scraper = AmazonSAScraper(
        proxy_client=proxy_client,
        storage_client=storage_client,
        request_interval=2.0  # 2 second delay between requests for South African rate limits
    )
    
    # Initialize results dictionary
    results = {
        "product_extraction": {},
        "search_functionality": {},
        "reviews_extraction": {},
        "pricing_monitoring": {},
        "bestsellers_extraction": {},
        "competitive_intelligence": {},
        "load_shedding_resilience": {},
        "template_performance": {}
    }
    
    try:
        # Start the demo
        async with proxy_client:
            # Run each demonstration component
            results["product_extraction"] = await demo_product_extraction(amazon_scraper)
            results["search_functionality"] = await demo_search_functionality(amazon_scraper)
            results["reviews_extraction"] = await demo_reviews_extraction(amazon_scraper)
            results["pricing_monitoring"] = await demo_pricing_monitoring(amazon_scraper)
            results["bestsellers_extraction"] = await demo_bestsellers(amazon_scraper)
            results["competitive_intelligence"] = await demo_competitive_intelligence(amazon_scraper)
            results["load_shedding_resilience"] = await demo_load_shedding_resilience(amazon_scraper)
            
            # Get overall template performance
            results["template_performance"] = amazon_scraper.get_template_statistics()
            
            # Get storage summary
            results["storage_summary"] = storage_client.get_data_summary()
            
            # Display collected data summary
            display_data_summary(storage_client)
            
            # Save results to file if requested
            if save_output_files:
                save_results_to_file(results, "amazon_sa_demo_results.json")
                logger.info("Results saved to amazon_sa_demo_results.json")
            
            return results
    
    except Exception as e:
        logger.error(f"Demo failed: {str(e)}")
        return {"error": str(e)}
    finally:
        logger.info("Amazon South Africa scraper demo completed")


async def demo_product_extraction(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate product extraction using templates.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with product extraction results
    """
    logger.info("\n=== DEMONSTRATING PRODUCT EXTRACTION ===")
    
    # Example ASINs for popular South African products
    test_asins = [
        'B09V2NX1GM',  # Samsung Galaxy smartphone
        'B09DKPVR4F',  # Apple Watch
        'B07TN1MNJ4',  # Echo Dot
    ]
    
    logger.info(f"Extracting {len(test_asins)} product details using Amazon product template")
    
    results = {
        "products": [],
        "success_count": 0,
        "failure_count": 0,
        "template_success_count": 0,
        "fallback_html_count": 0
    }
    
    for asin in test_asins:
        try:
            logger.info(f"Extracting product details for ASIN: {asin}")
            product_data = await scraper.extract_product_details(asin)
            
            # Display key product information
            logger.info(f"Successfully extracted product: {product_data.get('title')}")
            logger.info(f"  Price: {product_data.get('price')} {product_data.get('currency')}")
            logger.info(f"  Rating: {product_data.get('rating')} ({product_data.get('review_count')} reviews)")
            logger.info(f"  Extraction method: {product_data.get('extraction_method')}")
            
            # Track statistics
            results["success_count"] += 1
            if product_data.get("extraction_method") == "template":
                results["template_success_count"] += 1
            else:
                results["fallback_html_count"] += 1
                
            # Add product to results
            results["products"].append({
                "asin": asin,
                "title": product_data.get("title"),
                "price": product_data.get("price"),
                "currency": product_data.get("currency"),
                "rating": product_data.get("rating"),
                "review_count": product_data.get("review_count"),
                "extraction_method": product_data.get("extraction_method")
            })
            
            # Add a delay between requests to comply with rate limits
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error extracting product {asin}: {str(e)}")
            results["failure_count"] += 1
            results["products"].append({
                "asin": asin,
                "error": str(e)
            })
    
    logger.info(f"Product extraction completed: {results['success_count']} successes, {results['failure_count']} failures")
    logger.info(f"Template extraction: {results['template_success_count']}, HTML fallback: {results['fallback_html_count']}")
    
    return results


async def demo_search_functionality(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate search functionality with templates.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with search functionality results
    """
    logger.info("\n=== DEMONSTRATING SEARCH FUNCTIONALITY ===")
    
    # Test search terms relevant to South African market
    search_terms = [
        "load shedding solutions",
        "biltong maker",
        "rooibos tea"
    ]
    
    results = {
        "searches": [],
        "success_count": 0,
        "failure_count": 0,
        "total_products_found": 0,
        "template_success_count": 0,
        "fallback_html_count": 0
    }
    
    for term in search_terms:
        try:
            logger.info(f"Searching for: '{term}'")
            search_results = await scraper.search_products(term, limit=5)
            
            # Display search results
            result_count = len(search_results.get('results', []))
            logger.info(f"Found {result_count} results for '{term}'")
            
            # Show top 3 results
            for idx, result in enumerate(search_results.get('results', [])[:3], 1):
                logger.info(f"  #{idx}: {result.get('title')} - "
                           f"{result.get('price')} {result.get('currency')}")
            
            logger.info(f"Extraction method: {search_results.get('extraction_method')}")
            
            # Track statistics
            results["success_count"] += 1
            results["total_products_found"] += result_count
            
            if search_results.get("extraction_method") == "template":
                results["template_success_count"] += 1
            else:
                results["fallback_html_count"] += 1
                
            # Add search to results
            results["searches"].append({
                "term": term,
                "result_count": result_count,
                "extraction_method": search_results.get("extraction_method"),
                "top_results": [
                    {
                        "position": r.get("position"),
                        "title": r.get("title"),
                        "price": r.get("price"),
                        "currency": r.get("currency"),
                        "product_id": r.get("product_id")
                    }
                    for r in search_results.get('results', [])[:3]
                ]
            })
            
            # Add a delay between requests
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error searching for '{term}': {str(e)}")
            results["failure_count"] += 1
            results["searches"].append({
                "term": term,
                "error": str(e)
            })
    
    logger.info(f"Search functionality completed: {results['success_count']} successes, {results['failure_count']} failures")
    logger.info(f"Template extraction: {results['template_success_count']}, HTML fallback: {results['fallback_html_count']}")
    
    return results


async def demo_reviews_extraction(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate review extraction with templates.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with reviews extraction results
    """
    logger.info("\n=== DEMONSTRATING REVIEWS EXTRACTION ===")
    
    # Example ASIN for a product with reviews
    asin = 'B07TN1MNJ4'  # Echo Dot
    
    results = {
        "asin": asin,
        "success": False,
        "review_count": 0,
        "extraction_method": None,
        "sample_reviews": []
    }
    
    try:
        logger.info(f"Extracting reviews for ASIN: {asin}")
        reviews_data = await scraper.extract_product_reviews(asin, limit=5)
        
        # Display reviews information
        review_count = len(reviews_data.get('reviews', []))
        logger.info(f"Extracted {review_count} reviews")
        
        # Show a few reviews
        for idx, review in enumerate(reviews_data.get('reviews', [])[:3], 1):
            logger.info(f"  Review #{idx}: {review.get('rating')}★ - "
                       f"{review.get('title')}")
            
        logger.info(f"Extraction method: {reviews_data.get('extraction_method')}")
        
        # Update results
        results.update({
            "success": True,
            "review_count": review_count,
            "extraction_method": reviews_data.get("extraction_method"),
            "sample_reviews": [
                {
                    "rating": r.get("rating"),
                    "title": r.get("title"),
                    "reviewer_name": r.get("reviewer_name"),
                    "date": r.get("date")
                }
                for r in reviews_data.get('reviews', [])[:3]
            ]
        })
        
    except Exception as e:
        logger.error(f"Error extracting reviews for ASIN {asin}: {str(e)}")
        results["error"] = str(e)
    
    logger.info(f"Reviews extraction {'succeeded' if results['success'] else 'failed'}")
    
    return results


async def demo_pricing_monitoring(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate price monitoring functionality.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with pricing monitoring results
    """
    logger.info("\n=== DEMONSTRATING PRICE MONITORING ===")
    
    # Example ASINs for price monitoring
    test_asins = [
        'B09V2NX1GM',  # Samsung Galaxy smartphone
        'B09DKPVR4F',  # Apple Watch
    ]
    
    results = {
        "products": [],
        "success_count": 0,
        "failure_count": 0,
        "total_price_history_points": 0
    }
    
    for asin in test_asins:
        try:
            logger.info(f"Extracting pricing data for ASIN: {asin}")
            pricing_data = await scraper.extract_product_pricing(asin)
            
            # Display pricing information
            logger.info(f"Current price: {pricing_data.get('price')} {pricing_data.get('currency')}")
            
            discount_info = ""
            if 'list_price' in pricing_data:
                logger.info(f"List price: {pricing_data.get('list_price')} {pricing_data.get('currency')}")
                
                if 'discount_percentage' in pricing_data:
                    discount_info = f"{pricing_data.get('discount_percentage')}% discount"
                    logger.info(f"Discount: {pricing_data.get('discount_percentage')}%")
            
            logger.info(f"In stock: {pricing_data.get('in_stock')}")
            logger.info(f"Extraction method: {pricing_data.get('extraction_method')}")
            
            # Get price history
            price_history = pricing_data.get('price_history', [])
            price_history_count = len(price_history)
            if price_history_count > 0:
                logger.info(f"Price history points: {price_history_count}")
            
            # Update results
            results["success_count"] += 1
            results["total_price_history_points"] += price_history_count
            
            results["products"].append({
                "asin": asin,
                "current_price": pricing_data.get("price"),
                "currency": pricing_data.get("currency"),
                "list_price": pricing_data.get("list_price"),
                "discount_percentage": pricing_data.get("discount_percentage"),
                "in_stock": pricing_data.get("in_stock"),
                "extraction_method": pricing_data.get("extraction_method"),
                "price_history_count": price_history_count,
                "price_history": price_history[:3]  # Include first 3 price history points
            })
            
            # Add a delay between requests
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error extracting pricing data for ASIN {asin}: {str(e)}")
            results["failure_count"] += 1
            results["products"].append({
                "asin": asin,
                "error": str(e)
            })
    
    logger.info(f"Price monitoring completed: {results['success_count']} successes, {results['failure_count']} failures")
    
    return results


async def demo_bestsellers(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate bestseller extraction with templates.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with bestsellers extraction results
    """
    logger.info("\n=== DEMONSTRATING BESTSELLERS EXTRACTION ===")
    
    # Example category paths
    categories = [
        "",  # Overall bestsellers
        "electronics",  # Electronics bestsellers
    ]
    
    results = {
        "categories": [],
        "success_count": 0,
        "failure_count": 0,
        "total_products": 0
    }
    
    for category in categories:
        category_name = category if category else "overall"
        try:
            logger.info(f"Extracting bestsellers for category: {category_name}")
            bestseller_data = await scraper.extract_bestsellers(category, limit=5)
            
            # Display bestseller information
            product_count = len(bestseller_data.get('products', []))
            logger.info(f"Extracted {product_count} bestsellers in {category_name} category")
            
            # Show top 3 bestsellers
            for idx, product in enumerate(bestseller_data.get('products', [])[:3], 1):
                logger.info(f"  #{product.get('position')}: {product.get('title')} - "
                           f"{product.get('price')} {product.get('currency')}")
            
            logger.info(f"Extraction method: {bestseller_data.get('extraction_method')}")
            
            # Update results
            results["success_count"] += 1
            results["total_products"] += product_count
            
            results["categories"].append({
                "category": category_name,
                "product_count": product_count,
                "extraction_method": bestseller_data.get("extraction_method"),
                "top_products": [
                    {
                        "position": p.get("position"),
                        "title": p.get("title"),
                        "price": p.get("price"),
                        "currency": p.get("currency"),
                        "product_id": p.get("product_id")
                    }
                    for p in bestseller_data.get('products', [])[:3]
                ]
            })
            
            # Add a delay between requests
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error extracting bestsellers for category {category_name}: {str(e)}")
            results["failure_count"] += 1
            results["categories"].append({
                "category": category_name,
                "error": str(e)
            })
    
    logger.info(f"Bestsellers extraction completed: {results['success_count']} successes, {results['failure_count']} failures")
    
    return results


async def demo_competitive_intelligence(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate competitive intelligence capabilities.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with competitive intelligence results
    """
    logger.info("\n=== DEMONSTRATING COMPETITIVE INTELLIGENCE ===")
    
    # Test scenario: monitor price changes and competitor analysis for a product
    target_asin = 'B09V2NX1GM'  # Samsung Galaxy smartphone
    
    results = {
        "target_product": {},
        "competitors": [],
        "success": False
    }
    
    try:
        # First, get the target product details
        logger.info(f"Extracting target product (ASIN: {target_asin}) details")
        target_product = await scraper.extract_product_details(target_asin)
        
        if not target_product or "title" not in target_product:
            raise ValueError(f"Failed to extract target product details for ASIN {target_asin}")
        
        logger.info(f"Target product: {target_product.get('title')}")
        logger.info(f"Current price: {target_product.get('price')} {target_product.get('currency')}")
        
        # Next, search for similar products (competitors)
        search_term = target_product.get('title', '').split()[:3]  # Use first 3 words of title
        search_query = " ".join(search_term)
        
        logger.info(f"Searching for competing products with query: '{search_query}'")
        search_results = await scraper.search_products(search_query, limit=10)
        
        if not search_results or "results" not in search_results:
            raise ValueError(f"Failed to find competing products for query '{search_query}'")
        
        # Filter out the target product and get up to 3 competitors
        competitor_results = [
            r for r in search_results.get('results', [])
            if r.get('product_id') != target_asin
        ][:3]
        
        logger.info(f"Found {len(competitor_results)} competing products")
        
        # Get detailed information about each competitor
        competitor_details = []
        for competitor in competitor_results:
            competitor_asin = competitor.get('product_id')
            if not competitor_asin:
                continue
                
            logger.info(f"Analyzing competitor (ASIN: {competitor_asin})")
            
            try:
                competitor_data = await scraper.extract_product_details(competitor_asin)
                competitor_pricing = await scraper.extract_product_pricing(competitor_asin)
                
                # Calculate price difference
                target_price = target_product.get('price')
                competitor_price = competitor_data.get('price')
                
                price_difference = None
                price_difference_percentage = None
                
                if target_price is not None and competitor_price is not None:
                    price_difference = target_price - competitor_price
                    price_difference_percentage = (price_difference / target_price) * 100
                    
                    if price_difference > 0:
                        logger.info(f"Competitor is cheaper by {abs(price_difference):.2f} "
                                   f"({abs(price_difference_percentage):.1f}%)")
                    elif price_difference < 0:
                        logger.info(f"Competitor is more expensive by {abs(price_difference):.2f} "
                                   f"({abs(price_difference_percentage):.1f}%)")
                    else:
                        logger.info("Competitor has the same price")
                
                # Compare ratings
                target_rating = target_product.get('rating')
                competitor_rating = competitor_data.get('rating')
                
                rating_difference = None
                if target_rating is not None and competitor_rating is not None:
                    rating_difference = target_rating - competitor_rating
                    
                    if rating_difference > 0:
                        logger.info(f"Target product is rated higher by {rating_difference:.1f} stars")
                    elif rating_difference < 0:
                        logger.info(f"Competitor is rated higher by {abs(rating_difference):.1f} stars")
                    else:
                        logger.info("Both products have the same rating")
                
                # Save competitor details
                competitor_details.append({
                    "asin": competitor_asin,
                    "title": competitor_data.get('title'),
                    "price": competitor_price,
                    "currency": competitor_data.get('currency'),
                    "rating": competitor_rating,
                    "review_count": competitor_data.get('review_count'),
                    "in_stock": competitor_data.get('in_stock'),
                    "price_difference": price_difference,
                    "price_difference_percentage": price_difference_percentage,
                    "rating_difference": rating_difference,
                    "price_history": competitor_pricing.get('price_history', [])[:2]  # First 2 price points
                })
                
                # Add a delay between requests
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error analyzing competitor {competitor_asin}: {str(e)}")
        
        # Update results
        results.update({
            "target_product": {
                "asin": target_asin,
                "title": target_product.get('title'),
                "price": target_product.get('price'),
                "currency": target_product.get('currency'),
                "rating": target_product.get('rating'),
                "review_count": target_product.get('review_count')
            },
            "competitors": competitor_details,
            "success": True
        })
        
    except Exception as e:
        logger.error(f"Error in competitive intelligence demo: {str(e)}")
        results["error"] = str(e)
    
    logger.info(f"Competitive intelligence demonstration {'succeeded' if results['success'] else 'failed'}")
    
    return results


async def demo_load_shedding_resilience(scraper: AmazonSAScraper) -> Dict[str, Any]:
    """Demonstrate load shedding resilience capabilities.
    
    Args:
        scraper: Amazon scraper instance
        
    Returns:
        Dictionary with load shedding resilience results
    """
    logger.info("\n=== DEMONSTRATING LOAD SHEDDING RESILIENCE ===")
    
    results = {
        "simulation_successful": False,
        "recovery_successful": False,
        "retry_count": 0,
        "recovery_time_ms": 0
    }
    
    # Create a load shedding simulation
    load_shedding_detector = LoadSheddingDetector()
    
    try:
        # Simulate load shedding condition
        logger.info("Simulating load shedding condition")
        load_shedding_detector.simulate_load_shedding()
        
        # Attempt to extract data during "load shedding"
        start_time = datetime.now()
        
        try:
            # This should fail due to simulated load shedding
            await scraper.extract_product_details("B09V2NX1GM")
            logger.warning("Request succeeded despite load shedding simulation - resilience test inconclusive")
        except LoadSheddingDetectedError:
            # This is the expected outcome
            logger.info("Load shedding correctly detected - demonstrating resilience")
            results["simulation_successful"] = True
        except Exception as e:
            logger.error(f"Unexpected error during load shedding simulation: {str(e)}")
        
        # Now demonstrate recovery
        logger.info("Simulating load shedding recovery")
        load_shedding_detector.reset()
        
        retry_count = 0
        max_retries = 3
        recovery_successful = False
        
        while retry_count < max_retries and not recovery_successful:
            try:
                logger.info(f"Recovery attempt {retry_count + 1}/{max_retries}")
                await scraper.extract_product_details("B09V2NX1GM")
                recovery_successful = True
            except Exception as e:
                logger.warning(f"Recovery attempt {retry_count + 1} failed: {str(e)}")
                retry_count += 1
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
        
        end_time = datetime.now()
        recovery_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Update results
        results.update({
            "recovery_successful": recovery_successful,
            "retry_count": retry_count,
            "recovery_time_ms": recovery_time_ms
        })
        
        if recovery_successful:
            logger.info(f"Successfully recovered from simulated load shedding after {retry_count} retries")
            logger.info(f"Recovery time: {recovery_time_ms:.2f}ms")
        else:
            logger.error("Failed to recover from simulated load shedding")
        
    except Exception as e:
        logger.error(f"Error in load shedding resilience demo: {str(e)}")
        results["error"] = str(e)
    
    logger.info("Load shedding resilience demonstration completed")
    
    return results


def display_data_summary(storage_client: MarketplaceDataRepository) -> None:
    """Display summary of collected data.
    
    Args:
        storage_client: Storage repository instance
    """
    logger.info("\n=== DATA COLLECTION SUMMARY ===")
    
    # Get summary from storage client
    summary = storage_client.get_data_summary()
    
    logger.info(f"Products collected: {summary.get('product_count', 0)}")
    logger.info(f"Price points collected: {summary.get('price_point_count', 0)}")
    logger.info(f"Search results collected: {summary.get('search_results_count', 0)}")
    logger.info(f"Reviews collected: {summary.get('reviews_count', 0)}")
    logger.info(f"Bestsellers collected: {summary.get('bestsellers_count', 0)}")


def save_results_to_file(data: Dict[str, Any], filename: str) -> None:
    """Save results to JSON file.
    
    Args:
        data: Results data to save
        filename: Output filename
    """
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    logger.info(f"Results saved to {filename}")


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Amazon South Africa Scraper Demo")
    parser.add_argument("--no-output-files", action="store_true", help="Don't save output files")
    parser.add_argument("--in-memory-storage", action="store_true", help="Use in-memory storage instead of Firestore")
    args = parser.parse_args()
    
    # Run the demo
    asyncio.run(run_amazon_template_demo(
        in_memory_storage=args.in_memory_storage,
        save_output_files=not args.no_output_files
    ))