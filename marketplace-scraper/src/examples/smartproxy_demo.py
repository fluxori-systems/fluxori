"""
SmartProxy Advanced Features Demo

This script demonstrates the enhanced SmartProxy client and core scraper framework
with all the advanced features implemented in the Fluxori marketplace data collection 
system, including:

1. Browser actions framework
2. Session management
3. Quota management
4. User agent randomization
5. Load shedding detection and adaptation

The example shows how these components work together to create a robust and
efficient scraping system optimized for South African e-commerce platforms.
"""

import asyncio
import logging
import os
import json
from datetime import datetime
import argparse

# Import the enhanced components
from ..common import (
    SmartProxyClient,
    SessionManager,
    BrowserActionBuilder,
    QuotaManager, 
    QuotaPriority,
    QuotaDistributor,
    UserAgentRandomizer,
    LoadSheddingDetector,
    LoadSheddingAdapter
)


# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("smartproxy-demo")


async def main():
    """Run the SmartProxy Advanced Features Demo."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='SmartProxy Advanced Features Demo')
    parser.add_argument('--url', type=str, default='https://www.takealot.com', help='URL to scrape')
    parser.add_argument('--auth-token', type=str, 
                        default="VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi",
                        help='SmartProxy API auth token')
    args = parser.parse_args()
    
    # 1. Set up the components
    # -----------------------
    
    # Initialize quota manager
    quota_manager = QuotaManager(
        monthly_quota=82000,
        daily_quota=2700,
        persist_path="./quota_state.json"
    )
    
    # Initialize quota distributor with task types
    quota_distributor = QuotaDistributor(quota_manager)
    quota_distributor.register_task_type("product_scraping", QuotaPriority.HIGH, "products")
    quota_distributor.register_task_type("search_scraping", QuotaPriority.MEDIUM, "search")
    quota_distributor.register_task_type("category_browsing", QuotaPriority.LOW, "categories")
    
    # Initialize session manager
    session_manager = SessionManager(
        max_lifetime=600,  # 10 minutes
        max_sessions=50
    )
    
    # Initialize user agent randomizer
    user_agent_randomizer = UserAgentRandomizer(
        rotate_frequency=0.3,
        use_mobile_chance=0.2,
        sa_specific=True
    )
    
    # Initialize load shedding detector
    load_shedding_detector = LoadSheddingDetector(
        failure_threshold=5
    )
    
    # Initialize load shedding adapter
    load_shedding_adapter = LoadSheddingAdapter(
        load_shedding_detector,
        cache_dir="./cache"
    )
    
    # Initialize SmartProxy client
    smart_proxy_client = SmartProxyClient(
        auth_token=args.auth_token,
        monthly_quota=82000,
        daily_quota=2700,
        region="ZA"
    )
    
    # 2. Demo the components
    # ---------------------
    
    logger.info("=== SmartProxy Advanced Features Demo ===")
    logger.info(f"Testing with URL: {args.url}")
    
    # Check quota status
    quota_status = await smart_proxy_client.get_quota_status()
    logger.info(f"Quota Status: {quota_status['monthly_quota']['usage_percentage']:.1f}% used "
               f"({quota_status['monthly_quota']['request_count']}/{quota_status['monthly_quota']['total_quota']})")
    
    # Create a session for this task type
    category = "demo"
    session_id = session_manager.create_session(category)
    logger.info(f"Created session: {session_id}")
    
    # Check if quota allows this request
    if not quota_distributor.check_quota("category_browsing"):
        logger.error("Quota exceeded for this task type")
        return
    
    # Create randomized headers with user agent
    headers = user_agent_randomizer.create_headers()
    logger.info(f"Using user agent: {headers['User-Agent']}")
    
    # Check for load shedding and adapt parameters
    adapted_params = load_shedding_adapter.get_adapted_parameters()
    logger.info(f"Request parameters adapted: {adapted_params['adapted']} ({adapted_params['condition']})")
    
    # Create a browser action sequence using the builder
    actions = (BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-notice-button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .build()
        .to_list())
    
    # Check cache first
    cache_key = load_shedding_adapter.get_cache_key(args.url)
    cached_data = load_shedding_adapter.get_from_cache(cache_key, max_age=3600)
    
    if cached_data:
        logger.info("Using cached response")
        response = cached_data
    else:
        logger.info("Making live request")
        
        try:
            # Make the request with all our features
            response = await smart_proxy_client.scrape_sync(
                url=args.url,
                session_id=session_id,
                custom_headers=headers,
                browser_actions=actions,
                retries=adapted_params["retries"],
                backoff_factor=adapted_params["backoff_factor"],
                timeout=adapted_params["timeout"]
            )
            
            # Update session usage
            session_manager.update_session_usage(session_id)
            
            # Record quota usage
            quota_distributor.record_usage("category_browsing")
            
            # Save to cache
            load_shedding_adapter.save_to_cache(cache_key, response)
            
        except Exception as e:
            logger.error(f"Request failed: {str(e)}")
            
            # Record failure for load shedding detection
            is_load_shedding = load_shedding_adapter.record_failure(args.url)
            if is_load_shedding:
                logger.warning("Load shedding detected based on failure pattern")
                
            return
    
    # Analyze response
    logger.info(f"Response received: {len(response.get('content', '')):.1f}KB of HTML")
    if "parsed_content" in response:
        logger.info(f"Parsed content: {json.dumps(response['parsed_content'], indent=2)[:100]}...")
    
    # Show network requests if captured
    if "network_logs" in response:
        logger.info(f"Captured {len(response['network_logs'])} network requests")
        
    # Show session, quota and load shedding status
    session_info = session_manager.get_session_info(session_id)
    logger.info(f"Session info: {session_info['request_count']} requests, "
               f"{session_info['remaining_lifetime']:.1f}s remaining")
    
    quota_info = quota_distributor.quota_manager.get_status()
    logger.info(f"Updated quota: {quota_info['monthly_quota']['usage_percentage']:.1f}% used")
    
    load_shedding_status = load_shedding_adapter.detector.get_status()
    logger.info(f"Load shedding status: {load_shedding_status['status']}")
    
    logger.info("=== Demo Complete ===")


if __name__ == "__main__":
    asyncio.run(main())