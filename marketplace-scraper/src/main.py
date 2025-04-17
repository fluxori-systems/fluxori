"""
Main application entry point for the marketplace data collection framework.

This module provides the main application for running the marketplace data
collection framework locally or as a Cloud Run service, with comprehensive
features for South African market conditions including load shedding resilience,
quota management, and scheduled task distribution.
"""

import asyncio
import logging
import os
import argparse
import json
import signal
import time
import traceback
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from functools import partial

# Import Flask for Cloud Run HTTP API
try:
    from flask import Flask, request, jsonify
except ImportError:
    Flask = None
    logging.warning("Flask not available, Cloud Run service mode will not function")

# Import Google Cloud components
try:
    from google.cloud import firestore, pubsub_v1, secretmanager, monitoring_v3
    from google.cloud.monitoring_v3 import AlertPolicy, NotificationChannel
except ImportError:
    firestore = None
    pubsub_v1 = None
    secretmanager = None
    monitoring_v3 = None
    logging.warning("Google Cloud libraries not available, using mock implementations")

# Import components
from common import SmartProxyClient, LoadSheddingDetector, QuotaManager, QuotaPriority, QuotaDistributor
from storage import MarketplaceDataRepository
from marketplaces import TakealotScraper, BobShopScraper, MakroScraper, BuckCheapScraper
from orchestration import TaskScheduler, TaskDistributor, ScraperMonitoring


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("marketplace-scraper")


class MarketplaceScraperController:
    """Main controller for marketplace scraper operations.
    
    This class serves as the central controller for all marketplace scraper
    operations, whether running locally for testing or in production as a
    Cloud Run service. It handles initialization of all components,
    configuration loading, task routing, quota management, and graceful
    shutdown procedures.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the marketplace scraper controller.
        
        Args:
            config_path: Path to configuration file (optional)
        """
        self.config = self._load_config(config_path)
        self.project_id = self.config.get('project_id', os.environ.get('GCP_PROJECT_ID', 'fluxori-marketplace-data'))
        self.region = self.config.get('region', os.environ.get('GCP_REGION', 'africa-south1'))
        
        # Initialize components
        self.quota_manager = self._init_quota_manager()
        self.proxy_client = self._init_proxy_client()
        self.storage_client = self._init_storage_client()
        self.scrapers = self._init_scrapers()
        self.scheduler = self._init_scheduler()
        self.distributor = self._init_distributor()
        self.monitoring = self._init_monitoring()
        self.quota_distributor = self._init_quota_distributor()
        
        # Shutdown flag
        self.shutdown_requested = False
        self.shutdown_complete = asyncio.Event()
        
        # Set up signal handlers
        self._setup_signal_handlers()
        
        logger.info(f"MarketplaceScraperController initialized (region: {self.region})")
        
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or use defaults.
        
        Args:
            config_path: Path to configuration file
            
        Returns:
            Configuration dictionary
        """
        config = {
            'project_id': os.environ.get('GCP_PROJECT_ID', 'fluxori-marketplace-data'),
            'region': os.environ.get('GCP_REGION', 'africa-south1'),
            'monthly_quota': 82000,
            'daily_quota': 2700,
            'smartproxy_auth_token': os.environ.get('SMARTPROXY_AUTH_TOKEN', 
                                                  'VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi'),
            'max_concurrent_tasks': 5,
            'load_shedding_detection': True,
            'persistence_enabled': True,
            'task_topic': 'marketplace-scraper-tasks',
            'schedule_jobs': [
                {
                    'name': 'takealot-product-refresh',
                    'cron': '0 */4 * * *',  # Every 4 hours
                    'marketplace': 'takealot',
                    'task_type': 'refresh_products',
                    'max_count': 500,
                    'priority': 'HIGH'
                },
                {
                    'name': 'takealot-daily-deals',
                    'cron': '0 9,13,17 * * *',  # Three times per day
                    'marketplace': 'takealot',
                    'task_type': 'extract_daily_deals',
                    'priority': 'HIGH'
                },
                {
                    'name': 'bobshop-product-refresh',
                    'cron': '0 */6 * * *',  # Every 6 hours
                    'marketplace': 'bob_shop',
                    'task_type': 'refresh_products',
                    'max_count': 300,
                    'priority': 'HIGH'
                },
                {
                    'name': 'bobshop-deals',
                    'cron': '0 10,16 * * *',  # Twice per day
                    'marketplace': 'bob_shop',
                    'task_type': 'extract_deals',
                    'priority': 'HIGH'
                },
                {
                    'name': 'makro-product-refresh',
                    'cron': '0 */5 * * *',  # Every 5 hours
                    'marketplace': 'makro',
                    'task_type': 'refresh_products',
                    'max_count': 400,
                    'priority': 'HIGH'
                },
                {
                    'name': 'makro-daily-deals',
                    'cron': '0 8,14,18 * * *',  # Three times per day
                    'marketplace': 'makro',
                    'task_type': 'extract_daily_deals',
                    'priority': 'HIGH'
                },
                {
                    'name': 'takealot-category-discovery',
                    'cron': '0 1 * * *',  # Once per day at 1 AM
                    'marketplace': 'takealot',
                    'task_type': 'discover_products',
                    'categories': ['electronics', 'computers', 'phones', 'home-kitchen', 'beauty'],
                    'max_per_category': 100,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'bobshop-category-discovery',
                    'cron': '0 2 * * *',  # Once per day at 2 AM
                    'marketplace': 'bob_shop',
                    'task_type': 'discover_products',
                    'categories': ['electronics', 'computers', 'phones', 'home-garden', 'fashion'],
                    'max_per_category': 100,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'makro-category-discovery',
                    'cron': '0 3 * * *',  # Once per day at 3 AM
                    'marketplace': 'makro',
                    'task_type': 'discover_products',
                    'categories': ['electronics', 'computers', 'cellular', 'home-garden', 'appliances'],
                    'max_per_category': 100,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'search-monitoring',
                    'cron': '0 10,15 * * 1-5',  # Twice per day weekdays
                    'marketplace': 'takealot',
                    'task_type': 'search',
                    'keywords': ['iphone', 'samsung', 'laptop', 'headphones', 'smart tv'],
                    'max_per_keyword': 50,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'bobshop-search-monitoring',
                    'cron': '0 11,16 * * 1-5',  # Twice per day weekdays
                    'marketplace': 'bob_shop',
                    'task_type': 'search',
                    'keywords': ['iphone', 'samsung', 'laptop', 'headphones', 'smart tv'],
                    'max_per_keyword': 50,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'makro-search-monitoring',
                    'cron': '0 12,17 * * 1-5',  # Twice per day weekdays
                    'marketplace': 'makro',
                    'task_type': 'search',
                    'keywords': ['iphone', 'samsung', 'laptop', 'headphones', 'smart tv'],
                    'max_per_keyword': 50,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'buckcheap-product-matching',
                    'cron': '0 1 * * *',  # Once per day at 1 AM
                    'marketplace': 'buck_cheap',
                    'task_type': 'match_products',
                    'max_count': 100,
                    'priority': 'MEDIUM'
                },
                {
                    'name': 'buckcheap-historical-data',
                    'cron': '0 2 * * 2,5',  # Twice per week (Tue, Fri at 2 AM)
                    'marketplace': 'buck_cheap',
                    'task_type': 'extract_price_history',
                    'max_count': 50,
                    'priority': 'LOW'
                }
            ]
        }
        
        # Load from file if provided
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    file_config = json.load(f)
                    config.update(file_config)
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration from {config_path}: {str(e)}")
        
        # Override with environment variables
        for key in config:
            env_var = f"SCRAPER_{key.upper()}"
            if env_var in os.environ:
                try:
                    # Handle different types
                    if isinstance(config[key], bool):
                        config[key] = os.environ[env_var].lower() in ('true', 'yes', '1')
                    elif isinstance(config[key], int):
                        config[key] = int(os.environ[env_var])
                    elif isinstance(config[key], float):
                        config[key] = float(os.environ[env_var])
                    elif isinstance(config[key], list):
                        # Skip complex objects
                        continue
                    else:
                        config[key] = os.environ[env_var]
                except Exception as e:
                    logger.error(f"Error parsing environment variable {env_var}: {str(e)}")
        
        return config
        
    def _init_quota_manager(self) -> QuotaManager:
        """Initialize the quota manager.
        
        Returns:
            Initialized QuotaManager
        """
        persist_path = None
        if self.config.get('persistence_enabled', True):
            persist_path = '/tmp/quota_state.json'
            
        return QuotaManager(
            monthly_quota=self.config.get('monthly_quota', 82000),
            daily_quota=self.config.get('daily_quota', 2700),
            emergency_threshold=self.config.get('emergency_threshold', 0.95),
            warning_threshold=self.config.get('warning_threshold', 0.80),
            persist_path=persist_path,
            circuit_breaker_enabled=self.config.get('circuit_breaker_enabled', True)
        )
        
    def _init_proxy_client(self) -> SmartProxyClient:
        """Initialize the SmartProxy client.
        
        Returns:
            Initialized SmartProxyClient
        """
        # Try to get token from Secret Manager in production
        auth_token = self.config.get('smartproxy_auth_token')
        
        if not auth_token and secretmanager and self.project_id:
            try:
                client = secretmanager.SecretManagerServiceClient()
                secret_name = f"projects/{self.project_id}/secrets/smartproxy-auth-token/versions/latest"
                response = client.access_secret_version(name=secret_name)
                auth_token = response.payload.data.decode('UTF-8')
                logger.info("Retrieved SmartProxy auth token from Secret Manager")
            except Exception as e:
                logger.error(f"Error retrieving SmartProxy auth token from Secret Manager: {str(e)}")
                # Fall back to environment variable or config default
                auth_token = os.environ.get('SMARTPROXY_AUTH_TOKEN', 
                                        'VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi')
        
        return SmartProxyClient(
            auth_token=auth_token,
            base_url="https://scraper-api.smartproxy.com/v2",
            monthly_quota=self.config.get('monthly_quota', 82000),
            quota_manager=self.quota_manager
        )
        
    def _init_storage_client(self) -> MarketplaceDataRepository:
        """Initialize the storage client.
        
        Returns:
            Initialized MarketplaceDataRepository
        """
        return MarketplaceDataRepository(
            project_id=self.project_id,
            cache_enabled=self.config.get('storage_cache_enabled', True),
            cache_ttl=self.config.get('storage_cache_ttl', 3600)
        )
        
    def _init_scrapers(self) -> Dict[str, Any]:
        """Initialize marketplace scrapers.
        
        Returns:
            Dictionary of initialized scrapers
        """
        load_shedding_detector = None
        if self.config.get('load_shedding_detection', True):
            load_shedding_detector = LoadSheddingDetector()
        
        scrapers = {}
        
        # Initialize Takealot scraper
        if self.config.get('enable_takealot', True):
            scrapers['takealot'] = TakealotScraper(
                self.proxy_client, 
                self.storage_client,
                request_interval=self.config.get('takealot_request_interval', 2.0)
            )
            
        # Initialize Bob Shop scraper if enabled
        if self.config.get('enable_bobshop', True):
            scrapers['bob_shop'] = BobShopScraper(
                self.proxy_client, 
                self.storage_client,
                request_interval=self.config.get('bobshop_request_interval', 2.0)
            )
            
        # Initialize Makro scraper if enabled
        if self.config.get('enable_makro', True):
            scrapers['makro'] = MakroScraper(
                self.proxy_client, 
                self.storage_client,
                request_interval=self.config.get('makro_request_interval', 2.5)
            )
            
        # Initialize Buck.cheap scraper if enabled
        if self.config.get('enable_buckcheap', True):
            scrapers['buck_cheap'] = BuckCheapScraper(
                self.proxy_client, 
                self.storage_client,
                request_interval=self.config.get('buckcheap_request_interval', 7.0)
            )
            
        logger.info(f"Initialized {len(scrapers)} scrapers: {', '.join(scrapers.keys())}")
        return scrapers
        
    def _init_scheduler(self) -> TaskScheduler:
        """Initialize the task scheduler.
        
        Returns:
            Initialized TaskScheduler
        """
        return TaskScheduler(
            self.scrapers,
            max_concurrent_tasks=self.config.get('max_concurrent_tasks', 5),
            task_interval=self.config.get('task_interval', 1.0)
        )
        
    def _init_distributor(self) -> TaskDistributor:
        """Initialize the task distributor.
        
        Returns:
            Initialized TaskDistributor
        """
        return TaskDistributor(
            project_id=self.project_id,
            task_topic=self.config.get('task_topic', 'marketplace-scraper-tasks')
        )
        
    def _init_monitoring(self) -> ScraperMonitoring:
        """Initialize the monitoring tools.
        
        Returns:
            Initialized ScraperMonitoring
        """
        return ScraperMonitoring(
            project_id=self.project_id,
            metric_prefix=self.config.get('metric_prefix', 'marketplace_scraper')
        )
        
    def _init_quota_distributor(self) -> QuotaDistributor:
        """Initialize the quota distributor.
        
        Returns:
            Initialized QuotaDistributor
        """
        distributor = QuotaDistributor(self.quota_manager)
        
        # Register task types with priorities
        distributor.register_task_type("refresh_products", QuotaPriority.HIGH, "product_details")
        distributor.register_task_type("extract_product", QuotaPriority.HIGH, "product_details")
        distributor.register_task_type("extract_daily_deals", QuotaPriority.HIGH, "daily_deals")
        distributor.register_task_type("discover_products", QuotaPriority.MEDIUM, "category_browsing")
        distributor.register_task_type("extract_category", QuotaPriority.MEDIUM, "category_browsing")
        distributor.register_task_type("search", QuotaPriority.MEDIUM, "search_monitoring")
        distributor.register_task_type("extract_suggestions", QuotaPriority.LOW, "suggestions")
        
        return distributor
        
    def _setup_signal_handlers(self) -> None:
        """Set up signal handlers for graceful shutdown."""
        # Set up signal handlers for graceful shutdown
        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, self._handle_shutdown_signal)
            
        logger.info("Signal handlers set up for graceful shutdown")
        
    def _handle_shutdown_signal(self, signum, frame) -> None:
        """Handle shutdown signals.
        
        Args:
            signum: Signal number
            frame: Stack frame
        """
        signal_name = signal.Signals(signum).name
        logger.info(f"Received {signal_name} signal, initiating graceful shutdown")
        self.shutdown_requested = True
        
        # Use asyncio to trigger shutdown in the event loop
        if hasattr(asyncio, 'get_event_loop'):
            loop = asyncio.get_event_loop()
            loop.create_task(self._graceful_shutdown())
        
    async def _graceful_shutdown(self) -> None:
        """Perform graceful shutdown procedure."""
        logger.info("Starting graceful shutdown")
        
        try:
            # Allow tasks to finish (with timeout)
            logger.info("Waiting for active tasks to complete (timeout: 30s)")
            await asyncio.wait_for(self._wait_for_tasks(), timeout=30)
        except asyncio.TimeoutError:
            logger.warning("Timeout waiting for tasks to complete")
        
        # Close clients
        logger.info("Closing SmartProxy client")
        await self.proxy_client.__aexit__(None, None, None)
        
        logger.info("Graceful shutdown complete")
        self.shutdown_complete.set()
        
    async def _wait_for_tasks(self) -> None:
        """Wait for active tasks to complete."""
        # Wait until all active tasks are complete
        while len(self.scheduler.active_tasks) > 0:
            logger.info(f"Waiting for {len(self.scheduler.active_tasks)} active tasks to complete")
            await asyncio.sleep(1)
            
    async def run_cli_command(self, args) -> None:
        """Run a command from the CLI.
        
        Args:
            args: Command line arguments
        """
        if self.shutdown_requested:
            logger.error("Shutdown requested, not starting new tasks")
            return
            
        try:
            if args.task == 'product':
                logger.info(f"Scraping product: {args.identifier}")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                    
                product_data = await self.scrapers[marketplace].extract_product_details(args.identifier)
                logger.info(f"Product data: {json.dumps(product_data, indent=2)}")
                
            elif args.task == 'search':
                logger.info(f"Searching for: {args.identifier}")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                    
                search_data = await self.scrapers[marketplace].search_products(
                    args.identifier, 
                    page=args.page, 
                    limit=args.limit
                )
                logger.info(f"Found {len(search_data['results'])} results")
                logger.info(f"Search data: {json.dumps(search_data, indent=2)}")
                
            elif args.task == 'category':
                logger.info(f"Scraping category: {args.identifier}")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                    
                category_data = await self.scrapers[marketplace].extract_category(args.identifier)
                logger.info(f"Category data: {json.dumps(category_data, indent=2)}")
                
            elif args.task == 'discover':
                logger.info(f"Discovering products from category: {args.identifier if args.identifier else 'all'}")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                    
                product_urls = await self.scrapers[marketplace].discover_products(
                    args.identifier, 
                    page=args.page, 
                    limit=args.limit
                )
                logger.info(f"Discovered {len(product_urls)} products")
                logger.info(f"Product URLs: {json.dumps(product_urls, indent=2)}")
                
            elif args.task == 'suggestions':
                logger.info(f"Getting search suggestions for: {args.identifier}")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                    
                suggestions_data = await self.scrapers[marketplace].extract_search_suggestions(args.identifier)
                logger.info(f"Found {len(suggestions_data['suggestions'])} suggestions")
                logger.info(f"Suggestions data: {json.dumps(suggestions_data, indent=2)}")
                
            elif args.task == 'dailydeals':
                logger.info("Scraping daily deals")
                marketplace = args.marketplace or 'takealot'
                if marketplace not in self.scrapers:
                    logger.error(f"Unsupported marketplace: {marketplace}")
                    return
                
                # Handle both Takealot and Bob Shop deal extraction methods
                if marketplace == 'takealot':
                    deals = await self.scrapers[marketplace].extract_daily_deals()
                elif marketplace == 'bob_shop':
                    deals = await self.scrapers[marketplace].extract_deals()
                else:
                    deals = await self.scrapers[marketplace].extract_daily_deals()
                
                logger.info(f"Found {len(deals)} daily deals")
                logger.info(f"Daily deals: {json.dumps(deals, indent=2)}")
                
            elif args.task == 'schedule':
                logger.info("Running scheduled tasks")
                await self.run_scheduled_tasks(args.duration)
                
            elif args.task == 'status':
                logger.info("Getting system status")
                await self.show_status()
                
            elif args.task == 'quota':
                logger.info("Getting quota status")
                await self.show_quota()
                
            elif args.task == 'setup':
                logger.info("Setting up scheduled jobs")
                self.setup_scheduled_jobs()
                
            else:
                logger.error(f"Unknown task: {args.task}")
                
        except Exception as e:
            logger.error(f"Error during operation: {str(e)}")
            logger.error(traceback.format_exc())
            
        finally:
            if args.task != 'schedule':
                # Get quota status
                await self.show_quota()
        
    async def run_scheduled_tasks(self, duration=30) -> Dict[str, Any]:
        """Run scheduled scraper tasks.
        
        Args:
            duration: Maximum runtime in minutes
            
        Returns:
            Dictionary with scheduler statistics
        """
        if self.shutdown_requested:
            logger.error("Shutdown requested, not starting scheduled tasks")
            return {}
            
        logger.info(f"Starting scheduled tasks (max duration: {duration} minutes)")
        
        # Schedule initial tasks based on configuration
        await self._schedule_initial_tasks()
        
        # Run the scheduler with time limit
        stats = await self.scheduler.run(max_runtime=duration * 60)  # Convert minutes to seconds
        logger.info(f"Scheduler completed with stats: {json.dumps(stats, indent=2)}")
        
        return stats
        
    async def _schedule_initial_tasks(self) -> None:
        """Schedule initial tasks based on configuration."""
        # 1. Discover products from popular categories
        popular_categories = self.config.get('popular_categories', [
            "electronics", 
            "computers", 
            "home-kitchen",
            "phones",
            "beauty"
        ])
        
        # Limit the number of tasks based on our monthly quota
        # 15% of daily quota for discovery
        daily_quota = self.config.get('daily_quota', 2700)
        discovery_quota = int(daily_quota * 0.15)
        requests_per_category = discovery_quota // len(popular_categories)
        requests_per_category = min(requests_per_category, 20)  # Cap at 20 per category
        
        for category in popular_categories:
            await self.scheduler.schedule_task(
                task_type="discover_products",
                marketplace="takealot",
                params={"category": category, "page": 1, "limit": requests_per_category},
                priority=3
            )
        
        # 2. Search for popular keywords
        # 10% of daily quota for search
        search_quota = int(daily_quota * 0.10)
        popular_keywords = self.config.get('popular_keywords', [
            "iphone", 
            "samsung", 
            "laptop", 
            "headphones", 
            "smart tv"
        ])
        
        requests_per_keyword = search_quota // len(popular_keywords)
        requests_per_keyword = min(requests_per_keyword, 20)  # Cap at 20 per keyword
        
        for keyword in popular_keywords:
            await self.scheduler.schedule_task(
                task_type="search",
                marketplace="takealot",
                params={"keyword": keyword, "page": 1, "limit": requests_per_keyword},
                priority=2
            )
        
        # 3. Get daily deals (5% of daily quota)
        await self.scheduler.schedule_task(
            task_type="extract_daily_deals",
            marketplace="takealot",
            params={},
            priority=5
        )
        
        # 4. Schedule suggestion extraction (5% of daily quota)
        suggestion_quota = int(daily_quota * 0.05)
        prefixes = ["i", "s", "l", "h"]
        
        for prefix in prefixes:
            await self.scheduler.schedule_task(
                task_type="extract_suggestions",
                marketplace="takealot",
                params={"prefix": prefix},
                priority=1
            )
            
        logger.info("Scheduled initial tasks")
        
    async def handle_task_request(self, data) -> Dict[str, Any]:
        """Handle a task request from the HTTP API.
        
        Args:
            data: Task request data
            
        Returns:
            Dictionary with task result
        """
        if self.shutdown_requested:
            return {"error": "Shutdown in progress, not accepting new tasks"}
            
        # Extract task parameters
        task_type = data.get('task_type')
        marketplace = data.get('marketplace', 'takealot')
        params = data.get('params', {})
        priority = data.get('priority', 3)
        
        if not task_type:
            return {"error": "Missing required field: task_type"}
            
        if marketplace not in self.scrapers:
            return {"error": f"Unsupported marketplace: {marketplace}"}
            
        # Check quota for this task type
        task_priority = self._get_task_priority(task_type)
        if not self.quota_manager.check_quota(task_priority):
            return {"error": "Quota exceeded, task rejected", "quota_status": self.quota_manager.get_status()}
            
        try:
            # Execute task
            scraper = self.scrapers[marketplace]
            result = await self._execute_task(scraper, task_type, params)
            
            # Record quota usage
            self.quota_manager.record_usage(1, task_priority)
            
            # Return result
            return {
                "success": True,
                "task_type": task_type,
                "marketplace": marketplace,
                "timestamp": datetime.now().isoformat(),
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error executing task {task_type} for {marketplace}: {str(e)}")
            logger.error(traceback.format_exc())
            
            return {
                "success": False,
                "task_type": task_type,
                "marketplace": marketplace,
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
            
    async def _execute_task(self, scraper, task_type, params) -> Any:
        """Execute a specific task.
        
        Args:
            scraper: Marketplace scraper to use
            task_type: Type of task
            params: Task parameters
            
        Returns:
            Task result
        """
        if task_type == 'discover_products':
            return await scraper.discover_products(
                category=params.get('category'),
                page=params.get('page', 1),
                limit=params.get('limit', 20)
            )
        elif task_type == 'extract_product' or task_type == 'refresh_product':
            return await scraper.extract_product_details(
                params.get('product_id') or params.get('url')
            )
        elif task_type == 'search':
            return await scraper.search_products(
                keyword=params.get('keyword'),
                page=params.get('page', 1),
                limit=params.get('limit', 20)
            )
        elif task_type == 'extract_category':
            return await scraper.extract_category(
                params.get('category_id') or params.get('url')
            )
        elif task_type == 'extract_suggestions':
            return await scraper.extract_search_suggestions(
                params.get('prefix')
            )
        elif task_type == 'extract_daily_deals':
            # Handle both Takealot and Bob Shop deal extraction methods
            if hasattr(scraper, 'extract_daily_deals'):
                return await scraper.extract_daily_deals()
            elif hasattr(scraper, 'extract_deals'):
                return await scraper.extract_deals()
            else:
                raise ValueError(f"Scraper {scraper.marketplace_name} doesn't support deal extraction")
        elif task_type == 'extract_deals':
            # Specific method for Bob Shop
            if hasattr(scraper, 'extract_deals'):
                return await scraper.extract_deals()
            elif hasattr(scraper, 'extract_daily_deals'):
                return await scraper.extract_daily_deals()
            else:
                raise ValueError(f"Scraper {scraper.marketplace_name} doesn't support deal extraction")
        elif task_type == 'refresh_products':
            # This is a special task that refreshes multiple products
            product_ids = params.get('product_ids', [])
            max_count = params.get('max_count', 100)
            category = params.get('category')
            
            results = []
            
            # If product IDs provided, refresh those
            if product_ids:
                for product_id in product_ids[:max_count]:
                    try:
                        result = await scraper.extract_product_details(product_id)
                        results.append({
                            "product_id": product_id,
                            "success": True,
                            "data": result
                        })
                    except Exception as e:
                        results.append({
                            "product_id": product_id,
                            "success": False,
                            "error": str(e)
                        })
            # Otherwise discover products in specified category or all categories
            elif category:
                product_urls = await scraper.discover_products(
                    category, 
                    page=1, 
                    limit=max_count
                )
                
                for url in product_urls[:max_count]:
                    try:
                        result = await scraper.extract_product_details(url)
                        results.append({
                            "url": url,
                            "success": True,
                            "data": result
                        })
                    except Exception as e:
                        results.append({
                            "url": url,
                            "success": False,
                            "error": str(e)
                        })
            else:
                # Get products from all popular categories
                popular_categories = self.config.get('popular_categories', [
                    "electronics", 
                    "computers", 
                    "home-kitchen",
                    "phones",
                    "beauty"
                ])
                
                per_category = max_count // len(popular_categories)
                
                for category in popular_categories:
                    product_urls = await scraper.discover_products(
                        category, 
                        page=1, 
                        limit=per_category
                    )
                    
                    for url in product_urls[:per_category]:
                        try:
                            result = await scraper.extract_product_details(url)
                            results.append({
                                "url": url,
                                "category": category,
                                "success": True,
                                "data": result
                            })
                        except Exception as e:
                            results.append({
                                "url": url,
                                "category": category,
                                "success": False,
                                "error": str(e)
                            })
                            
            return {
                "total": len(results),
                "successful": sum(1 for r in results if r.get('success', False)),
                "failed": sum(1 for r in results if not r.get('success', False)),
                "results": results
            }
        elif task_type == 'match_products':
                # Special task for Buck.cheap to match products with marketplace products
                # Get marketplace products to match
                marketplace_to_match = params.get('marketplace', 'takealot')
                max_count = params.get('max_count', 50)
                
                # Get marketplace scraper
                if marketplace_to_match not in self.scrapers:
                    raise ValueError(f"Unsupported marketplace for matching: {marketplace_to_match}")
                    
                marketplace_scraper = self.scrapers[marketplace_to_match]
                
                # Get recently updated products
                # In a real implementation, we would query the repository
                # Here we'll simulate by discovering some products
                product_urls = await marketplace_scraper.discover_products(
                    category=params.get('category'),
                    page=1,
                    limit=max_count
                )
                
                results = []
                for url in product_urls[:max_count]:
                    try:
                        # Get the product details
                        product_data = await marketplace_scraper.extract_product_details(url)
                        
                        # Match with Buck.cheap data
                        match_result = await scraper.match_with_marketplace_product(
                            marketplace_to_match,
                            product_data
                        )
                        
                        # Add to results
                        results.append({
                            "product_id": product_data.get("product_id", ""),
                            "title": product_data.get("title", ""),
                            "matched": match_result.get("matched", False),
                            "confidence": match_result.get("confidence", 0),
                            "price_history_points": len(match_result.get("price_history", []))
                        })
                    except Exception as e:
                        results.append({
                            "product_id": url,
                            "error": str(e),
                            "matched": False
                        })
                
                return {
                    "marketplace": marketplace_to_match,
                    "total_products": len(results),
                    "matched_products": sum(1 for r in results if r.get("matched", False)),
                    "match_rate": (sum(1 for r in results if r.get("matched", False)) / len(results)) * 100 if results else 0,
                    "results": results
                }
            elif task_type == 'extract_price_history':
                # Special task for Buck.cheap to extract detailed price history
                product_urls = params.get('product_urls', [])
                max_count = params.get('max_count', 20)
                
                if not product_urls:
                    # Search for products to analyze
                    search_results = await scraper.search_products(
                        keyword=params.get('keyword', 'laptop'),
                        page=1
                    )
                    
                    product_urls = [result["url"] for result in search_results.get("results", [])]
                
                results = []
                for url in product_urls[:max_count]:
                    try:
                        # Get product details with price history
                        product_data = await scraper.extract_product_details(url)
                        
                        # Also get price trend analysis
                        trend_analysis = await scraper.analyze_price_trends(url)
                        
                        # Add to results
                        results.append({
                            "product_id": product_data.get("product_id", ""),
                            "title": product_data.get("title", ""),
                            "retailer": product_data.get("retailer", ""),
                            "price_history_points": len(product_data.get("price_history", [])),
                            "price_trend": trend_analysis.get("overall_trend", {}).get("direction", "unknown"),
                            "price_volatility": trend_analysis.get("price_volatility", {}).get("level", "unknown")
                        })
                    except Exception as e:
                        results.append({
                            "url": url,
                            "error": str(e)
                        })
                
                return {
                    "total_products": len(results),
                    "successful_extractions": sum(1 for r in results if "error" not in r),
                    "results": results
                }
            else:
                raise ValueError(f"Unsupported task type: {task_type}")
            
    def _get_task_priority(self, task_type: str) -> QuotaPriority:
        """Get the priority for a task type.
        
        Args:
            task_type: Task type
            
        Returns:
            Priority level
        """
        # Map task types to priorities
        priority_map = {
            'extract_product': QuotaPriority.HIGH,
            'refresh_product': QuotaPriority.HIGH,
            'refresh_products': QuotaPriority.HIGH,
            'extract_daily_deals': QuotaPriority.HIGH,
            'discover_products': QuotaPriority.MEDIUM,
            'extract_category': QuotaPriority.MEDIUM,
            'search': QuotaPriority.MEDIUM,
            'extract_suggestions': QuotaPriority.LOW,
            'match_products': QuotaPriority.MEDIUM,
            'extract_price_history': QuotaPriority.LOW
        }
        
        return priority_map.get(task_type, QuotaPriority.MEDIUM)
        
    async def show_quota(self) -> None:
        """Show quota status."""
        quota_status = self.quota_manager.get_status()
        logger.info(f"Quota status: {json.dumps(quota_status, indent=2)}")
        
    async def show_status(self) -> None:
        """Show system status."""
        # Collect status from components
        status = {
            "time": datetime.now().isoformat(),
            "uptime": (datetime.now() - self.scheduler.start_time).total_seconds(),
            "quota": self.quota_manager.get_status(),
            "scheduler": {
                "active_tasks": len(self.scheduler.active_tasks),
                "completed_tasks": len(self.scheduler.completed_tasks),
                "failed_tasks": len(self.scheduler.failed_tasks),
                "queue_size": self.scheduler.task_queue.qsize(),
                "load_shedding_detected": self.scheduler.load_shedding_detected,
                "load_shedding_until": self.scheduler.load_shedding_until.isoformat() if self.scheduler.load_shedding_until else None
            }
        }
        
        # Add scraper statistics
        status["scrapers"] = {}
        for marketplace, scraper in self.scrapers.items():
            status["scrapers"][marketplace] = scraper.get_statistics()
            
        logger.info(f"System status: {json.dumps(status, indent=2)}")
        
    def setup_scheduled_jobs(self) -> None:
        """Set up scheduled jobs in Cloud Scheduler."""
        if not pubsub_v1:
            logger.error("Google Cloud Pub/Sub library not available, cannot set up scheduled jobs")
            return
            
        logger.info(f"Setting up scheduled jobs in project {self.project_id}")
        
        try:
            # Ensure the Pub/Sub topic exists
            publisher = pubsub_v1.PublisherClient()
            topic_path = publisher.topic_path(self.project_id, self.config.get('task_topic', 'marketplace-scraper-tasks'))
            
            try:
                publisher.get_topic(request={"topic": topic_path})
                logger.info(f"Topic {topic_path} already exists")
            except Exception:
                publisher.create_topic(request={"name": topic_path})
                logger.info(f"Created topic {topic_path}")
                
            # Set up Cloud Run service URL
            service_name = self.config.get('service_name', 'marketplace-scraper')
            service_url = f"https://{service_name}-{self.project_id}.a.run.app"
            
            # Import the Cloud Scheduler client library
            from google.cloud import scheduler_v1
            
            # Create a client
            client = scheduler_v1.CloudSchedulerClient()
            
            # Construct the project and location path
            parent = f"projects/{self.project_id}/locations/{self.region}"
            
            # Set up scheduled jobs from configuration
            for job_config in self.config.get('schedule_jobs', []):
                job_name = job_config.get('name')
                if not job_name:
                    logger.warning("Skipping job with no name")
                    continue
                    
                # Format job ID
                job_id = f"marketplace-scraper-{job_name}"
                job = {
                    "name": client.job_path(self.project_id, self.region, job_id),
                    "description": f"Marketplace scraper {job_name} job",
                    "schedule": job_config.get('cron', '0 */4 * * *'),
                    "time_zone": "Africa/Johannesburg",
                    "http_target": {
                        "uri": f"{service_url}/tasks/execute",
                        "http_method": scheduler_v1.HttpMethod.POST,
                        "body": json.dumps({
                            "task_type": job_config.get('task_type'),
                            "marketplace": job_config.get('marketplace', 'takealot'),
                            "params": {
                                "max_count": job_config.get('max_count', 100),
                                "categories": job_config.get('categories'),
                                "keywords": job_config.get('keywords')
                            },
                            "priority": job_config.get('priority', 'MEDIUM')
                        }).encode(),
                        "headers": {
                            "Content-Type": "application/json"
                        }
                    }
                }
                
                # Add OIDC authentication
                if self.config.get('use_service_account', True):
                    service_account = self.config.get('service_account', f"{self.project_id}@appspot.gserviceaccount.com")
                    job["http_target"]["oidc_token"] = {
                        "service_account_email": service_account,
                        "audience": service_url
                    }
                
                # Create or update the job
                try:
                    client.get_job(name=job["name"])
                    client.update_job(job=job)
                    logger.info(f"Updated scheduled job {job_id}")
                except Exception:
                    client.create_job(parent=parent, job=job)
                    logger.info(f"Created scheduled job {job_id}")
                    
            logger.info("Scheduled jobs setup complete")
                
        except Exception as e:
            logger.error(f"Error setting up scheduled jobs: {str(e)}")
            logger.error(traceback.format_exc())
            
    def setup_monitoring_dashboard(self) -> None:
        """Set up monitoring dashboard and alerts."""
        if not monitoring_v3:
            logger.error("Google Cloud Monitoring library not available, cannot set up monitoring")
            return
            
        logger.info(f"Setting up monitoring for project {self.project_id}")
        
        try:
            # Create monitoring client
            client = monitoring_v3.MetricServiceClient()
            
            # Create alerting client
            alert_client = monitoring_v3.AlertPolicyServiceClient()
            
            # Setup notification channel (email)
            notification_client = monitoring_v3.NotificationChannelServiceClient()
            
            # Format project and location paths
            project_path = f"projects/{self.project_id}"
            
            # Set up email notification channel if not exists
            notification_email = self.config.get('notification_email')
            if notification_email:
                # Check if notification channel already exists
                existing_channels = list(notification_client.list_notification_channels(name=project_path))
                email_channel = None
                
                for channel in existing_channels:
                    if channel.type == "email" and channel.labels.get("email_address") == notification_email:
                        email_channel = channel
                        break
                        
                if not email_channel:
                    # Create new email notification channel
                    notification_channel = {
                        "type": "email",
                        "display_name": "Marketplace Scraper Alerts",
                        "description": "Email notifications for marketplace scraper alerts",
                        "labels": {
                            "email_address": notification_email
                        }
                    }
                    
                    email_channel = notification_client.create_notification_channel(
                        name=project_path,
                        notification_channel=notification_channel
                    )
                    
                logger.info(f"Using email notification channel: {email_channel.name}")
                
                # Set up alert policies
                self._setup_alert_policies(alert_client, [email_channel.name])
                
            # Set up dashboard
            self.monitoring.create_dashboard()
            
            logger.info("Monitoring setup complete")
                
        except Exception as e:
            logger.error(f"Error setting up monitoring: {str(e)}")
            logger.error(traceback.format_exc())
            
    def _setup_alert_policies(self, alert_client, notification_channels):
        """Set up alert policies.
        
        Args:
            alert_client: Alert policy client
            notification_channels: List of notification channel names
        """
        # Set up quota usage alert
        project_path = f"projects/{self.project_id}"
        
        # 1. High quota usage alert (>80%)
        quota_policy = {
            "display_name": "Marketplace Scraper - High Quota Usage",
            "documentation": {
                "content": "SmartProxy API quota usage exceeded 80% of monthly allocation.",
                "mime_type": "text/markdown"
            },
            "conditions": [
                {
                    "display_name": "Quota Usage > 80%",
                    "condition_threshold": {
                        "filter": f'metric.type="custom.googleapis.com/marketplace_scraper/quota_usage" AND resource.type="global"',
                        "comparison": monitoring_v3.ComparisonType.COMPARISON_GT,
                        "threshold_value": 80.0,
                        "duration": {"seconds": 0},
                        "trigger": {
                            "count": 1
                        }
                    }
                }
            ],
            "notification_channels": notification_channels,
            "alert_strategy": {
                "notification_rate_limit": {
                    "period": {"seconds": 3600}  # One notification per hour max
                }
            }
        }
        
        # 2. High error rate alert (>20%)
        error_policy = {
            "display_name": "Marketplace Scraper - High Error Rate",
            "documentation": {
                "content": "Marketplace scraper error rate exceeded 20% over 10-minute window.",
                "mime_type": "text/markdown"
            },
            "conditions": [
                {
                    "display_name": "Error Rate > 20%",
                    "condition_threshold": {
                        "filter": f'metric.type="custom.googleapis.com/marketplace_scraper/error_rate" AND resource.type="global"',
                        "comparison": monitoring_v3.ComparisonType.COMPARISON_GT,
                        "threshold_value": 20.0,
                        "duration": {"seconds": 600},  # 10 minutes
                        "trigger": {
                            "count": 1
                        }
                    }
                }
            ],
            "notification_channels": notification_channels,
            "alert_strategy": {
                "notification_rate_limit": {
                    "period": {"seconds": 1800}  # Notification every 30 minutes max
                }
            }
        }
        
        # 3. Load shedding detected
        loadshedding_policy = {
            "display_name": "Marketplace Scraper - Load Shedding Detected",
            "documentation": {
                "content": "Load shedding detected, scraper operating in reduced functionality mode.",
                "mime_type": "text/markdown"
            },
            "conditions": [
                {
                    "display_name": "Load Shedding Detected",
                    "condition_threshold": {
                        "filter": f'metric.type="custom.googleapis.com/marketplace_scraper/loadshedding_detected" AND resource.type="global"',
                        "comparison": monitoring_v3.ComparisonType.COMPARISON_GT,
                        "threshold_value": 0.0,
                        "duration": {"seconds": 0},
                        "trigger": {
                            "count": 1
                        }
                    }
                }
            ],
            "notification_channels": notification_channels,
            "alert_strategy": {
                "notification_rate_limit": {
                    "period": {"seconds": 7200}  # Notification every 2 hours max
                }
            }
        }
        
        # 4. Scraper inactivity alert
        inactivity_policy = {
            "display_name": "Marketplace Scraper - Service Inactivity",
            "documentation": {
                "content": "Marketplace scraper has not performed any tasks for an extended period.",
                "mime_type": "text/markdown"
            },
            "conditions": [
                {
                    "display_name": "No Tasks for 6 Hours",
                    "condition_threshold": {
                        "filter": f'metric.type="custom.googleapis.com/marketplace_scraper/tasks_completed" AND resource.type="global"',
                        "comparison": monitoring_v3.ComparisonType.COMPARISON_LT,
                        "threshold_value": 1.0,
                        "duration": {"seconds": 21600},  # 6 hours
                        "trigger": {
                            "count": 1
                        }
                    }
                }
            ],
            "notification_channels": notification_channels,
            "alert_strategy": {
                "notification_rate_limit": {
                    "period": {"seconds": 21600}  # Notification every 6 hours max
                }
            }
        }
        
        # Create or update each policy
        for policy in [quota_policy, error_policy, loadshedding_policy, inactivity_policy]:
            try:
                # Check if policy already exists
                existing_policies = list(alert_client.list_alert_policies(name=project_path))
                matching_policy = None
                
                for existing in existing_policies:
                    if existing.display_name == policy["display_name"]:
                        matching_policy = existing
                        break
                        
                if matching_policy:
                    # Update existing policy
                    policy["name"] = matching_policy.name
                    alert_client.update_alert_policy(alert_policy=policy)
                    logger.info(f"Updated alert policy: {policy['display_name']}")
                else:
                    # Create new policy
                    alert_client.create_alert_policy(
                        name=project_path,
                        alert_policy=policy
                    )
                    logger.info(f"Created alert policy: {policy['display_name']}")
                    
            except Exception as e:
                logger.error(f"Error setting up alert policy {policy['display_name']}: {str(e)}")
                
    def create_flask_app(self) -> Any:
        """Create a Flask app for Cloud Run.
        
        Returns:
            Flask application
        """
        if not Flask:
            logger.error("Flask not available, cannot create Cloud Run service")
            return None
            
        app = Flask(__name__)
        
        @app.route('/health', methods=['GET'])
        def health_check():
            """Health check endpoint."""
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": self.config.get('version', '1.0.0')
            })
            
        @app.route('/status', methods=['GET'])
        async def status():
            """Status endpoint."""
            # Collect status from components
            status_data = {
                "time": datetime.now().isoformat(),
                "uptime": (datetime.now() - self.scheduler.start_time).total_seconds(),
                "quota": self.quota_manager.get_status(),
                "scheduler": {
                    "active_tasks": len(self.scheduler.active_tasks),
                    "completed_tasks": len(self.scheduler.completed_tasks),
                    "failed_tasks": len(self.scheduler.failed_tasks),
                    "queue_size": self.scheduler.task_queue.qsize() if hasattr(self.scheduler.task_queue, 'qsize') else 0,
                    "load_shedding_detected": self.scheduler.load_shedding_detected,
                    "load_shedding_until": self.scheduler.load_shedding_until.isoformat() if self.scheduler.load_shedding_until else None
                }
            }
            
            # Add scraper statistics
            status_data["scrapers"] = {}
            for marketplace, scraper in self.scrapers.items():
                status_data["scrapers"][marketplace] = scraper.get_statistics()
                
            return jsonify(status_data)
            
        @app.route('/quota', methods=['GET'])
        def quota():
            """Quota status endpoint."""
            return jsonify(self.quota_manager.get_status())
            
        @app.route('/tasks/execute', methods=['POST'])
        async def execute_task():
            """Task execution endpoint."""
            data = request.json
            if not data:
                return jsonify({"error": "Invalid JSON payload"}), 400
                
            result = await self.handle_task_request(data)
            return jsonify(result)
            
        @app.route('/tasks/schedule', methods=['POST'])
        async def schedule_tasks():
            """Schedule tasks endpoint."""
            data = request.json
            if not data:
                return jsonify({"error": "Invalid JSON payload"}), 400
                
            # Extract parameters
            duration = data.get('duration', 30)
            max_tasks = data.get('max_tasks', 100)
            
            # Schedule tasks based on specific task data or default to configuration
            if 'tasks' in data:
                for task_config in data['tasks']:
                    marketplace = task_config.get('marketplace', 'takealot')
                    task_type = task_config.get('task_type')
                    params = task_config.get('params', {})
                    priority = task_config.get('priority', 3)
                    
                    if not task_type:
                        continue
                        
                    if marketplace not in self.scrapers:
                        continue
                        
                    await self.scheduler.schedule_task(
                        task_type=task_type,
                        marketplace=marketplace,
                        params=params,
                        priority=priority
                    )
            else:
                # Use default scheduling from configuration
                await self._schedule_initial_tasks()
                
            # Run scheduler
            stats = await self.scheduler.run(max_runtime=duration * 60)
            
            return jsonify({
                "success": True,
                "stats": stats
            })
            
        @app.route('/setup/monitoring', methods=['POST'])
        def setup_monitoring():
            """Set up monitoring endpoint."""
            # Check for authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Unauthorized"}), 401
                
            # In production, validate token
            
            self.setup_monitoring_dashboard()
            
            return jsonify({
                "success": True,
                "message": "Monitoring setup initiated"
            })
            
        @app.route('/setup/scheduler', methods=['POST'])
        def setup_scheduler():
            """Set up scheduler endpoint."""
            # Check for authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Unauthorized"}), 401
                
            # In production, validate token
            
            self.setup_scheduled_jobs()
            
            return jsonify({
                "success": True,
                "message": "Scheduled jobs setup initiated"
            })
            
        @app.route('/daily-summary', methods=['GET'])
        def daily_summary():
            """Daily summary endpoint."""
            # Get quota status
            quota_status = self.quota_manager.get_status()
            
            # Get stats from monitoring
            perf_stats = self.monitoring.get_performance_stats()
            
            # Combine into summary
            summary = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "quota_status": quota_status,
                "performance": perf_stats,
                "scheduler_stats": {
                    "completed_tasks": len(self.scheduler.completed_tasks),
                    "failed_tasks": len(self.scheduler.failed_tasks),
                    "success_rate": (len(self.scheduler.completed_tasks) / 
                                  (len(self.scheduler.completed_tasks) + len(self.scheduler.failed_tasks))) * 100
                                  if (len(self.scheduler.completed_tasks) + len(self.scheduler.failed_tasks)) > 0 else 0
                }
            }
            
            return jsonify(summary)
            
        logger.info("Flask app created with all endpoints")
        return app


async def run_local_scraper(args):
    """Run the scraper locally for testing and development.
    
    Args:
        args: Command line arguments
    """
    logger.info("Starting local scraper run")
    
    # Initialize controller
    controller = MarketplaceScraperController()
    
    # Process command
    await controller.run_cli_command(args)
    
    # Graceful shutdown
    await controller._graceful_shutdown()
    

def run_cloud_run_service():
    """Run as a Cloud Run service."""
    # Check if Flask is available
    if not Flask:
        logger.error("Flask not available, cannot run as Cloud Run service")
        return
        
    # Initialize controller
    controller = MarketplaceScraperController()
    
    # Create Flask app
    app = controller.create_flask_app()
    
    if app:
        # Start Flask server
        port = int(os.environ.get('PORT', 8080))
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        logger.error("Failed to create Flask app")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Marketplace Data Collection Framework")
    parser.add_argument('--mode', choices=['local', 'service'], default='local',
                        help="Run mode: local for CLI, service for Cloud Run")
    parser.add_argument('--config', type=str, help="Path to configuration file")
    
    # Task-specific arguments
    parser.add_argument('--task', choices=['product', 'search', 'category', 'discover', 
                                         'suggestions', 'dailydeals', 'schedule',
                                         'status', 'quota', 'setup'],
                        default='schedule', help="Task to run")
    parser.add_argument('--marketplace', type=str, help="Marketplace to use (default: takealot)")
    parser.add_argument('--identifier', type=str, help="Product ID/URL, search keyword, or category ID/URL")
    parser.add_argument('--page', type=int, default=1, help="Page number for pagination")
    parser.add_argument('--limit', type=int, default=20, help="Maximum items to return")
    parser.add_argument('--duration', type=int, default=30, help="Maximum runtime in minutes for scheduled tasks")
    
    args = parser.parse_args()
    
    if args.mode == 'local':
        asyncio.run(run_local_scraper(args))
    else:
        run_cloud_run_service()


if __name__ == "__main__":
    main()