"""
Base scraper implementation for marketplace data collection.

This module provides the foundation for all marketplace scrapers with shared
functionality for fetching, extracting, and storing data with a focus on
South African market conditions.
"""

import asyncio
import logging
import re
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Set, Tuple
from urllib.parse import urlparse, urljoin

# Import local modules
from ..common.proxy_client import SmartProxyClient
from ..storage.repository import MarketplaceDataRepository


class NetworkError(Exception):
    """Exception raised for network-related issues."""
    pass


class LoadSheddingDetectedError(Exception):
    """Exception raised when load shedding is detected."""
    pass


class MarketplaceScraper(ABC):
    """Abstract base class for marketplace scrapers.
    
    This class provides common functionality for all marketplace scrapers,
    including:
    
    - Page fetching with SmartProxy integration
    - Robots.txt compliance checking
    - Data extraction with error handling
    - Storage integration with Firestore
    - Rate limiting and courtesy delays
    - Load shedding detection and adaptation
    - Monitoring and logging
    """
    
    def __init__(self, 
                 proxy_client: SmartProxyClient, 
                 storage_client: MarketplaceDataRepository,
                 marketplace_name: str,
                 base_url: str,
                 request_interval: float = 1.0,
                 respect_robots: bool = True,
                 user_agent: str = "Fluxori_Marketplace_Intelligence/1.0",
                 template_support: bool = False,
                 compatible_templates: Optional[List[str]] = None):
        """Initialize the marketplace scraper.
        
        Args:
            proxy_client: SmartProxy client for web requests
            storage_client: Repository client for data storage
            marketplace_name: Name of the marketplace (e.g., "takealot")
            base_url: Base URL of the marketplace
            request_interval: Minimum interval between requests (in seconds)
            respect_robots: Whether to respect robots.txt directives
            user_agent: User agent to identify as
            template_support: Whether this marketplace supports SmartProxy templates
            compatible_templates: List of compatible templates for this marketplace
        """
        self.proxy_client = proxy_client
        self.storage_client = storage_client
        self.marketplace_name = marketplace_name
        self.base_url = base_url
        self.request_interval = request_interval
        self.respect_robots = respect_robots
        self.user_agent = user_agent
        self.template_support = template_support
        self.compatible_templates = compatible_templates or []
        
        # Setup logging
        self.logger = logging.getLogger(f"{marketplace_name}-scraper")
        self._setup_logging()
        
        # State tracking
        self.last_request_time = 0
        self.robots_directives = {}
        self.robots_checked = False
        self.disallowed_paths = set()
        self.crawl_delay = None
        
        # Network status tracking
        self.consecutive_failures = 0
        self.max_consecutive_failures = 5  # Consider load shedding after this many failures
        self.network_status = "normal"  # normal, degraded, or loadShedding
        
        # Statistics
        self.requests_made = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.start_time = datetime.now()
        
        # Template performance tracking
        self.template_performance = {
            "attempted": 0,
            "successful": 0,
            "failed": 0,
            "fallback_to_raw": 0,
            "template_success_by_type": {}
        }
        
    def _setup_logging(self):
        """Set up structured logging."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    async def check_robots_txt(self) -> bool:
        """Check and parse robots.txt for scraping permissions.
        
        Returns:
            True if robots.txt was successfully parsed, False otherwise
        """
        if not self.respect_robots:
            self.logger.warning("Robots.txt checking is disabled")
            return False
            
        if self.robots_checked:
            return True
            
        robots_url = urljoin(self.base_url, "/robots.txt")
        
        try:
            # Use SmartProxy without JS rendering for robots.txt
            response = await self.proxy_client.scrape_sync(
                url=robots_url,
                headless=None,  # No need for JS rendering
                custom_headers={"User-Agent": self.user_agent}
            )
            
            if "content" not in response:
                self.logger.warning(f"Failed to fetch robots.txt: {response}")
                return False
                
            robots_content = response["content"]
            
            # Parse robots.txt
            self._parse_robots_txt(robots_content)
            self.robots_checked = True
            return True
            
        except Exception as e:
            self.logger.error(f"Error fetching robots.txt: {str(e)}")
            return False
            
    def _parse_robots_txt(self, content: str) -> None:
        """Parse robots.txt content for directives.
        
        Args:
            content: robots.txt file content
        """
        current_agent = None
        applicable_rules = []
        
        for line in content.split('\n'):
            line = line.strip().lower()
            
            if not line or line.startswith('#'):
                continue
                
            if line.startswith('user-agent:'):
                agent = line.split(':', 1)[1].strip()
                current_agent = agent
                
                # If this section applies to us
                if agent == '*' or self.user_agent.lower().find(agent) != -1:
                    applicable_rules.append(current_agent)
                    
            elif line.startswith('disallow:') and current_agent in applicable_rules:
                path = line.split(':', 1)[1].strip()
                if path:
                    self.disallowed_paths.add(path)
                    
            elif line.startswith('crawl-delay:') and current_agent in applicable_rules:
                try:
                    delay = float(line.split(':', 1)[1].strip())
                    # Only set crawl delay if it's larger than our default
                    if not self.crawl_delay or delay > self.crawl_delay:
                        self.crawl_delay = delay
                except ValueError:
                    pass
                    
        self.logger.info(f"Parsed robots.txt: {len(self.disallowed_paths)} disallowed paths, crawl delay: {self.crawl_delay or 'None'}")
        
    def is_allowed(self, url: str) -> bool:
        """Check if a URL is allowed to be scraped based on robots.txt.
        
        Args:
            url: URL to check
            
        Returns:
            True if allowed, False if disallowed
        """
        if not self.respect_robots:
            return True
            
        parsed_url = urlparse(url)
        path = parsed_url.path
        
        for disallowed in self.disallowed_paths:
            if disallowed == '/' or path.startswith(disallowed):
                self.logger.warning(f"URL {url} is disallowed by robots.txt")
                return False
                
        return True
        
    async def fetch_page(self, 
                        url: str, 
                        use_js: bool = True,
                        selector_to_wait: Optional[str] = None,
                        session_id: Optional[str] = None,
                        retries: int = 3,
                        template: Optional[str] = None,
                        template_params: Optional[Dict[str, Any]] = None,
                        try_templates_first: bool = False) -> Dict[str, Any]:
        """Fetch a page with proper rate limiting and error handling.
        
        Args:
            url: URL to fetch
            use_js: Whether to use JavaScript rendering
            selector_to_wait: CSS selector to wait for before considering page loaded
            session_id: Session ID for IP consistency
            retries: Number of retry attempts
            template: Template name to use (overrides try_templates_first)
            template_params: Template-specific parameters
            try_templates_first: Whether to attempt template-based extraction first
            
        Returns:
            Page content and metadata
            
        Raises:
            NetworkError: If page couldn't be fetched after retries
            LoadSheddingDetectedError: If load shedding is detected
        """
        # Ensure robots.txt is checked
        if not self.robots_checked:
            await self.check_robots_txt()
            
        # Check if URL is allowed
        if not self.is_allowed(url):
            raise ValueError(f"URL {url} is disallowed by robots.txt")
            
        # Apply rate limiting
        await self._apply_rate_limiting()
        
        # Prepare common request parameters
        custom_headers = {"User-Agent": self.user_agent}
        headless = "html" if use_js else None
        wait_params = {}
        
        if selector_to_wait:
            wait_params = {"wait_selector": selector_to_wait}
            
        # Update request tracking
        self.requests_made += 1
        self.last_request_time = time.time()
        
        # Determine whether to use templates
        use_template = False
        selected_template = None
        
        if template:
            # Explicit template specified
            use_template = True
            selected_template = template
        elif try_templates_first and self.template_support and self.compatible_templates:
            # Try using a compatible template
            use_template = True
            
            # For now, use the first compatible template
            # In a more advanced implementation, this could select based on URL pattern or context
            selected_template = self.compatible_templates[0]
        
        try:
            # Attempt to fetch with template if applicable
            if use_template:
                self.logger.info(f"Fetching {url} with template {selected_template}")
                self.template_performance["attempted"] += 1
                
                # Initialize tracking for this template type if needed
                if selected_template not in self.template_performance["template_success_by_type"]:
                    self.template_performance["template_success_by_type"][selected_template] = {
                        "attempts": 0, 
                        "successes": 0, 
                        "failures": 0
                    }
                
                self.template_performance["template_success_by_type"][selected_template]["attempts"] += 1
                
                try:
                    response = await self.proxy_client.scrape_with_template(
                        url=url,
                        template=selected_template,
                        template_params=template_params,
                        geo=None,  # Use default from client
                        device_type="desktop",
                        session_id=session_id,
                        retries=retries
                    )
                    
                    # Check if we got structured data or at least content
                    if "parsed_content" in response or "content" in response:
                        self.successful_requests += 1
                        self.consecutive_failures = 0  # Reset failure counter
                        self.template_performance["successful"] += 1
                        self.template_performance["template_success_by_type"][selected_template]["successes"] += 1
                        
                        # Update network status if it was degraded
                        if self.network_status != "normal":
                            self.logger.info("Network connection restored")
                            self.network_status = "normal"
                        
                        return response
                    else:
                        # Template request succeeded but didn't return useful data
                        self.logger.warning(f"Template {selected_template} succeeded but returned no useful data")
                        self.template_performance["failed"] += 1
                        self.template_performance["template_success_by_type"][selected_template]["failures"] += 1
                        
                        # Fall back to raw HTML scraping if this is a template-first request
                        if try_templates_first:
                            self.logger.info("Falling back to raw HTML scraping")
                            self.template_performance["fallback_to_raw"] += 1
                            # Continue to raw HTML scraping below
                        else:
                            # Return the empty response
                            return response
                            
                except Exception as e:
                    # Template request failed
                    self.logger.warning(f"Template request failed: {str(e)}")
                    self.template_performance["failed"] += 1
                    self.template_performance["template_success_by_type"][selected_template]["failures"] += 1
                    
                    # Fall back to raw HTML scraping if this is a template-first request
                    if try_templates_first:
                        self.logger.info("Falling back to raw HTML scraping after template error")
                        self.template_performance["fallback_to_raw"] += 1
                        # Continue to raw HTML scraping below
                    else:
                        # Re-raise the exception
                        raise
            
            # Raw HTML scraping (either as primary method or fallback)
            if not use_template or try_templates_first:
                response = await self.proxy_client.scrape_sync(
                    url=url,
                    headless=headless,
                    session_id=session_id,
                    custom_headers=custom_headers,
                    retries=retries,
                    **wait_params
                )
                
                self.successful_requests += 1
                self.consecutive_failures = 0  # Reset failure counter
                
                # Update network status if it was degraded
                if self.network_status != "normal":
                    self.logger.info("Network connection restored")
                    self.network_status = "normal"
                
                return response
            
        except Exception as e:
            self.failed_requests += 1
            self.consecutive_failures += 1
            
            # Check for load shedding
            if self.consecutive_failures >= self.max_consecutive_failures:
                self.network_status = "loadShedding"
                self.logger.warning(f"Possible load shedding detected after {self.consecutive_failures} consecutive failures")
                raise LoadSheddingDetectedError(f"Possible load shedding detected: {str(e)}")
            else:
                self.network_status = "degraded"
                self.logger.error(f"Failed to fetch {url}: {str(e)}")
                raise NetworkError(f"Failed to fetch {url}: {str(e)}")
                
    async def _apply_rate_limiting(self) -> None:
        """Apply rate limiting between requests."""
        # Determine appropriate delay
        delay = self.request_interval
        if self.crawl_delay and self.crawl_delay > delay:
            delay = self.crawl_delay
            
        # Calculate time since last request
        elapsed = time.time() - self.last_request_time
        
        # Add network status-based delays
        if self.network_status == "degraded":
            delay *= 2  # Double delay on degraded network
        elif self.network_status == "loadShedding":
            delay *= 5  # Much longer delay during load shedding
            
        if elapsed < delay:
            wait_time = delay - elapsed
            self.logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            await asyncio.sleep(wait_time)
            
    async def extract_data(self, content: Dict[str, Any], extractor_type: str) -> Dict[str, Any]:
        """Extract structured data from page content.
        
        Args:
            content: Page content from fetch_page
            extractor_type: Type of extraction to perform
            
        Returns:
            Extracted data
            
        Raises:
            ValueError: If invalid extractor_type is provided
            Exception: For extraction failures
        """
        if "content" not in content or not content["content"]:
            raise ValueError("No content provided for extraction")
            
        # Delegate to specific extractor method
        extractor_method = getattr(self, f"_extract_{extractor_type}", None)
        if not extractor_method:
            raise ValueError(f"Unsupported extractor type: {extractor_type}")
            
        try:
            data = await extractor_method(content["content"], content.get("url", ""))
            return data
        except Exception as e:
            self.logger.error(f"Data extraction failed for {extractor_type}: {str(e)}")
            raise
            
    async def save_data(self, data: Dict[str, Any], entity_type: str) -> str:
        """Save extracted data to storage.
        
        Args:
            data: Data to save
            entity_type: Type of entity (product, price, search, etc.)
            
        Returns:
            ID of the saved entity
            
        Raises:
            Exception: If storage operation fails
        """
        try:
            # Add metadata
            data.update({
                "marketplace": self.marketplace_name,
                "last_updated": datetime.now().isoformat(),
                "scraper_version": "1.0" 
            })
            
            # Delegate to appropriate storage method
            if entity_type == "product":
                return await self.storage_client.save_product(data)
            elif entity_type == "price":
                return await self.storage_client.save_price_point(data)
            elif entity_type == "search":
                return await self.storage_client.save_search_results(data)
            elif entity_type == "category":
                return await self.storage_client.save_category(data)
            else:
                raise ValueError(f"Unsupported entity type: {entity_type}")
                
        except Exception as e:
            self.logger.error(f"Failed to save {entity_type} data: {str(e)}")
            raise
            
    async def test_template_compatibility(self, url: str, templates_to_test: List[str] = None) -> Dict[str, Any]:
        """Test compatibility of various templates with this marketplace.
        
        This method tests different templates on a given URL to determine which ones
        work best for this marketplace, facilitating automated template selection.
        
        Args:
            url: URL to test
            templates_to_test: List of templates to test (default: use proxy client's templates)
            
        Returns:
            Compatibility report with effectiveness metrics
        """
        self.logger.info(f"Testing template compatibility for {self.marketplace_name} using URL: {url}")
        
        # Proxy this to the SmartProxy client
        result = await self.proxy_client.test_template_compatibility(
            url=url,
            marketplace_type=self.marketplace_name,
            templates_to_test=templates_to_test
        )
        
        # Update compatible_templates based on results if we found good matches
        if result["best_template"] and not self.compatible_templates:
            self.compatible_templates = [result["best_template"]]
            self.template_support = True
            self.logger.info(f"Automatically set compatible template: {result['best_template']}")
        
        # Return the full test results
        return result
    
    def get_template_performance(self) -> Dict[str, Any]:
        """Get template performance statistics.
        
        Returns:
            Dictionary with template performance statistics
        """
        if not self.template_support:
            return {"template_support": False}
        
        # Calculate success rates
        template_stats = {}
        for template, stats in self.template_performance["template_success_by_type"].items():
            if stats["attempts"] > 0:
                success_rate = (stats["successes"] / stats["attempts"]) * 100
                template_stats[template] = {
                    "attempts": stats["attempts"],
                    "successes": stats["successes"],
                    "failures": stats["failures"],
                    "success_rate": success_rate
                }
        
        # Overall stats
        attempts = self.template_performance["attempted"]
        overall_success_rate = 0
        if attempts > 0:
            overall_success_rate = (self.template_performance["successful"] / attempts) * 100
        
        return {
            "template_support": self.template_support,
            "compatible_templates": self.compatible_templates,
            "attempts": attempts,
            "successful": self.template_performance["successful"],
            "failed": self.template_performance["failed"],
            "fallback_to_raw": self.template_performance["fallback_to_raw"],
            "overall_success_rate": overall_success_rate,
            "template_stats": template_stats
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get scraper statistics.
        
        Returns:
            Dictionary of statistics
        """
        runtime = datetime.now() - self.start_time
        stats = {
            "marketplace": self.marketplace_name,
            "runtime_seconds": runtime.total_seconds(),
            "requests_made": self.requests_made,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": (self.successful_requests / self.requests_made * 100) if self.requests_made > 0 else 0,
            "network_status": self.network_status,
            "consecutive_failures": self.consecutive_failures
        }
        
        # Add template stats if template support is enabled
        if self.template_support:
            stats["template_performance"] = self.get_template_performance()
            
        return stats
        
    @abstractmethod
    async def discover_products(self, category: Optional[str] = None, page: int = 1, limit: int = 50) -> List[str]:
        """Discover products from the marketplace.
        
        Args:
            category: Category to discover products from
            page: Page number for pagination
            limit: Maximum number of products to return
            
        Returns:
            List of product URLs or IDs
        """
        pass
        
    @abstractmethod
    async def extract_product_details(self, product_id_or_url: str) -> Dict[str, Any]:
        """Extract detailed product information.
        
        Args:
            product_id_or_url: Product ID or URL
            
        Returns:
            Product details dictionary
        """
        pass
        
    @abstractmethod
    async def search_products(self, keyword: str, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Search for products using a keyword.
        
        Args:
            keyword: Search keyword
            page: Page number for pagination
            limit: Maximum number of products to return
            
        Returns:
            Search results with products and metadata
        """
        pass