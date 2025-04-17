"""
SmartProxy Web Scraping API client for South African marketplace data collection.

This module provides a client for interacting with SmartProxy's Web Scraping API,
with specific optimizations for South African IP access, quota management, and
resilience features for load shedding conditions. Enhanced with template support,
browser actions framework, session management, and advanced request capabilities.
"""

import aiohttp
import asyncio
import json
import logging
import time
import random
import uuid
import os
import re
import datetime
from typing import Dict, Any, Optional, List, Union, Literal, Tuple, Callable
from datetime import datetime
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


class QuotaExceededError(Exception):
    """Exception raised when the SmartProxy API quota has been exceeded."""
    pass


class SessionExpiredError(Exception):
    """Exception raised when a session has expired."""
    pass


class LoadSheddingDetectedError(Exception):
    """Exception raised when load shedding is detected."""
    pass


class BrowserActionError(Exception):
    """Exception raised when a browser action fails."""
    pass


class SmartProxyClient:
    """Client for SmartProxy Web Scraping API with South African market focus.
    
    This client provides methods for synchronous, asynchronous, and batch scraping
    using SmartProxy's Web Scraping API Advanced features. It includes features 
    specifically designed for the South African market, such as:
    
    - South African geo-targeting for accurate market data
    - Load shedding resilience with comprehensive retry mechanisms
    - Quota management for optimal API usage with circuit breaking
    - Session management for consistent IP usage across related requests
    - Browser actions framework for complex interactions
    - Support for specialized marketplace templates
    - User-agent and request randomization for natural patterns
    - Detailed logging and monitoring
    """
    
    # Available Amazon templates
    AMAZON_TEMPLATES = {
        "product": "amazon_product",
        "pricing": "amazon_pricing",
        "reviews": "amazon_reviews",
        "search": "amazon_search",
        "sellers": "amazon_sellers",
        "bestsellers": "amazon_bestsellers"
    }
    
    # Generic templates that might work with other marketplaces
    GENERIC_TEMPLATES = {
        "amazon": "amazon",
        "ecommerce": "ecommerce_product"
    }
    
    # Common user agents for randomization
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edge/120.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    ]
    
    # Common device types
    DEVICE_TYPES = ["desktop", "mobile", "tablet"]
    
    # Response codes and their meanings
    RESPONSE_CODES = {
        200: "Success",
        204: "No content",
        400: "Bad request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not found",
        429: "Too many requests",
        500: "Server error",
        524: "Timeout error",
        613: "SmartProxy internal error"
    }
    
    def __init__(self, 
                 auth_token: str = "VTAwMDAyNjAwNTY6UFdfMTYwYjliMDg0NzQ5NzU4Y2FiZjVmOTAyOTRkYTM4M2Vi",
                 base_url: str = "https://scraper-api.smartproxy.com/v2",
                 monthly_quota: int = 82000,
                 daily_quota: int = 2700,  # ~82k/30 days
                 region: str = "ZA",
                 emergency_quota_threshold: float = 0.95,
                 warn_quota_threshold: float = 0.80,
                 load_shedding_detection_threshold: int = 5,
                 session_max_lifetime: int = 600,  # 10 minutes
                 enable_quota_circuit_breaker: bool = True):
        """Initialize SmartProxy client.
        
        Args:
            auth_token: Basic authentication token
            base_url: SmartProxy API base URL
            monthly_quota: Monthly request quota limit
            daily_quota: Daily request quota limit (for even distribution)
            region: Default geographic region (ZA for South Africa)
            emergency_quota_threshold: Emergency threshold for circuit breaker (0.0-1.0)
            warn_quota_threshold: Warning threshold for quota (0.0-1.0)
            load_shedding_detection_threshold: Consecutive failures to consider load shedding
            session_max_lifetime: Maximum session lifetime in seconds
            enable_quota_circuit_breaker: Whether to enable quota circuit breaker
        """
        self.auth_token = auth_token
        self.base_url = base_url
        self.monthly_quota = monthly_quota
        self.daily_quota = daily_quota
        self.region = region
        self.emergency_quota_threshold = emergency_quota_threshold
        self.warn_quota_threshold = warn_quota_threshold
        self.load_shedding_detection_threshold = load_shedding_detection_threshold
        self.session_max_lifetime = session_max_lifetime
        self.enable_quota_circuit_breaker = enable_quota_circuit_breaker
        
        # Session management
        self.session = None
        self.active_sessions = {}  # session_id -> {created_at, last_used, request_count, category}
        
        # Request tracking
        self.request_count = 0
        self.daily_request_count = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.consecutive_failures = 0
        self.current_month = datetime.now().month
        self.current_day = datetime.now().day
        
        # State tracking
        self.circuit_breaker_tripped = False
        self.circuit_breaker_trip_time = None
        self.network_status = "normal"  # normal, degraded, loadShedding
        
        # Template performance tracking
        self.template_performance = {
            "success_rates": {},
            "response_times": {},
            "parsing_results": {}
        }
        
        # Setup logging
        self.logger = logging.getLogger("smartproxy-client")
        self._setup_logging()
        
        # Browser Actions Framework
        self.browser_action_templates = self._initialize_browser_action_templates()
        
        # Initialize load shedding detector
        self.load_shedding_detection = _LoadSheddingDetector(
            threshold=load_shedding_detection_threshold,
            logger=self.logger
        )
    
    def _setup_logging(self):
        """Set up structured logging for the client."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def _initialize_browser_action_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize browser action templates.
        
        Returns:
            Dictionary of named browser action templates
        """
        return {
            "scroll_to_bottom": [
                {"action": "scroll", "value": "document.body.scrollHeight"}
            ],
            "infinite_scroll": [
                {"action": "scroll", "value": "document.body.scrollHeight"},
                {"action": "wait", "value": 1000},
                {"action": "scroll", "value": "document.body.scrollHeight + 100"},
                {"action": "wait", "value": 1000},
                {"action": "scroll", "value": "document.body.scrollHeight + 200"}
            ],
            "click_next_page": [
                {"action": "click", "selector": ".pagination .next a"}
            ],
            "accept_cookies": [
                {"action": "click", "selector": "[data-testid='cookie-accept-all']", "optional": True}
            ],
            "close_popup": [
                {"action": "click", "selector": ".modal-close", "optional": True}
            ],
            "add_to_cart": [
                {"action": "click", "selector": ".add-to-cart-button"}
            ],
            "capture_network_requests": [
                {"action": "set_capture_network", "value": "xhr"}
            ],
            "login_form": [
                {"action": "input", "selector": "[name='username']", "value": "{username}"},
                {"action": "input", "selector": "[name='password']", "value": "{password}"},
                {"action": "click", "selector": "[type='submit']"}
            ]
        }
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
            self.session = None
    
    #
    # ===== Session Management =====
    #
    
    def create_session_id(self, category: Optional[str] = None) -> str:
        """Create a new session ID.
        
        Args:
            category: Optional category for the session (e.g., 'search', 'product')
            
        Returns:
            New session ID
        """
        session_id = f"fluxori_{uuid.uuid4().hex[:12]}"
        
        # Register the session
        self.active_sessions[session_id] = {
            "created_at": time.time(),
            "last_used": time.time(),
            "request_count": 0,
            "category": category
        }
        
        self.logger.info(f"Created new session: {session_id} (category: {category})")
        return session_id
    
    def get_session_for_category(self, category: str) -> str:
        """Get or create a session ID for a specific category.
        
        This helps group related requests (like product searches in a category)
        under the same IP address for consistency.
        
        Args:
            category: Category to get a session for
            
        Returns:
            Session ID for the category
        """
        # Look for an existing valid session for this category
        for session_id, data in self.active_sessions.items():
            if (data["category"] == category and 
                time.time() - data["created_at"] < self.session_max_lifetime and
                data["request_count"] < 100):  # Avoid overusing a session
                
                return session_id
        
        # Create a new session if none found
        return self.create_session_id(category)
    
    def update_session_usage(self, session_id: str) -> None:
        """Update session usage tracking.
        
        Args:
            session_id: Session ID to update
        """
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["last_used"] = time.time()
            self.active_sessions[session_id]["request_count"] += 1
    
    def clean_expired_sessions(self) -> None:
        """Clean up expired sessions."""
        now = time.time()
        expired_sessions = [
            sid for sid, data in self.active_sessions.items()
            if now - data["created_at"] > self.session_max_lifetime
        ]
        
        for sid in expired_sessions:
            self.logger.info(f"Cleaning expired session: {sid} (lifetime: {now - self.active_sessions[sid]['created_at']:.1f}s)")
            del self.active_sessions[sid]
    
    def is_session_valid(self, session_id: str) -> bool:
        """Check if a session is valid.
        
        Args:
            session_id: Session ID to check
            
        Returns:
            True if the session is valid, False otherwise
        """
        if session_id not in self.active_sessions:
            return False
        
        session_data = self.active_sessions[session_id]
        now = time.time()
        
        # Check if session is expired
        if now - session_data["created_at"] > self.session_max_lifetime:
            return False
        
        return True
    
    #
    # ===== Quota Management =====
    #
    
    def reset_quota_if_needed(self) -> None:
        """Reset quota counters if month or day has changed."""
        current_month = datetime.now().month
        current_day = datetime.now().day
        
        if current_month != self.current_month:
            self.logger.info(f"New month detected, resetting monthly quota counter. Previous: {self.current_month}, Current: {current_month}")
            self.request_count = 0
            self.current_month = current_month
            
            # Reset the circuit breaker if it was tripped
            if self.circuit_breaker_tripped:
                self.circuit_breaker_tripped = False
                self.logger.info("Circuit breaker reset due to new month")
        
        if current_day != self.current_day:
            self.logger.info(f"New day detected, resetting daily quota counter. Previous: {self.current_day}, Current: {current_day}")
            self.daily_request_count = 0
            self.current_day = current_day
    
    def check_quota(self) -> bool:
        """Check if we're within our monthly and daily quota.
        
        Returns:
            True if within quota, False if exceeded
        """
        self.reset_quota_if_needed()
        
        # If circuit breaker is tripped, fail immediately
        if self.circuit_breaker_tripped and self.enable_quota_circuit_breaker:
            trip_duration = time.time() - self.circuit_breaker_trip_time
            # Reset after 3 hours
            if trip_duration > 10800:  # 3 hours in seconds
                self.logger.warning(f"Circuit breaker reset after {trip_duration/3600:.1f} hours")
                self.circuit_breaker_tripped = False
            else:
                self.logger.warning(f"Circuit breaker is tripped, rejecting request ({trip_duration/60:.1f} minutes since trip)")
                return False
        
        # Check monthly quota
        monthly_quota_percentage = (self.request_count / self.monthly_quota) * 100
        if monthly_quota_percentage >= 100:
            self.logger.error(f"Monthly quota exceeded: {self.request_count}/{self.monthly_quota} ({monthly_quota_percentage:.1f}%)")
            return False
        
        # Check daily quota
        daily_quota_percentage = (self.daily_request_count / self.daily_quota) * 100
        if daily_quota_percentage >= 100:
            self.logger.error(f"Daily quota exceeded: {self.daily_request_count}/{self.daily_quota} ({daily_quota_percentage:.1f}%)")
            return False
        
        # Emergency circuit breaker
        if (self.enable_quota_circuit_breaker and 
            monthly_quota_percentage >= self.emergency_quota_threshold * 100):
            self.logger.critical(
                f"Emergency quota threshold exceeded: {monthly_quota_percentage:.1f}% >= {self.emergency_quota_threshold * 100}%, "
                f"tripping circuit breaker"
            )
            self.circuit_breaker_tripped = True
            self.circuit_breaker_trip_time = time.time()
            return False
        
        # Warning threshold
        if monthly_quota_percentage >= self.warn_quota_threshold * 100:
            self.logger.warning(
                f"Quota warning threshold exceeded: {monthly_quota_percentage:.1f}% >= {self.warn_quota_threshold * 100}%"
            )
        
        return True
    
    #
    # ===== Core Scraping Methods =====
    #
    
    async def scrape_sync(self, 
                          url: str, 
                          geo: str = None,
                          device_type: str = "desktop",
                          headless: str = "html",
                          session_id: Optional[str] = None,
                          custom_headers: Optional[Dict[str, str]] = None,
                          custom_cookies: Optional[Dict[str, str]] = None,
                          template: Optional[str] = None,
                          template_params: Optional[Dict[str, Any]] = None,
                          browser_actions: Optional[List[Dict[str, Any]]] = None,
                          capture_network: Optional[str] = None,
                          retries: int = 3,
                          backoff_factor: float = 1.5,
                          timeout: int = 60,
                          randomize_user_agent: bool = True) -> Dict[str, Any]:
        """Perform synchronous scraping request.
        
        Args:
            url: Target URL to scrape
            geo: Geographic location (default: ZA for South Africa)
            device_type: Device type (desktop/mobile)
            headless: Rendering mode (html for JS rendering, None for no JS)
            session_id: Session ID for maintaining IP consistency
            custom_headers: Custom headers to send with the request
            custom_cookies: Custom cookies to send with the request
            template: Template name to use for extraction
            template_params: Template-specific parameters
            browser_actions: List of browser actions to perform
            capture_network: Type of network requests to capture (xhr, fetch, document, etc)
            retries: Number of retry attempts on failure
            backoff_factor: Exponential backoff factor between retries
            timeout: Request timeout in seconds
            randomize_user_agent: Whether to randomize the user agent
            
        Returns:
            API response as dictionary
            
        Raises:
            QuotaExceededError: If monthly quota is exceeded
            SessionExpiredError: If session has expired
            aiohttp.ClientError: If request fails after all retries
        """
        start_time = time.time()
        
        # Normalize geo parameter
        if not geo:
            geo = self.region
            
        # Validate session if provided
        if session_id and not self.is_session_valid(session_id):
            raise SessionExpiredError(f"Session {session_id} has expired or is invalid")
        
        # Build base payload
        payload = self._build_payload(
            url=url,
            geo=geo,
            device_type=device_type,
            headless=headless,
            session_id=session_id,
            custom_headers=self._prepare_headers(custom_headers, randomize_user_agent),
            custom_cookies=custom_cookies
        )
        
        # Add template if provided
        if template:
            payload["template"] = template
            
            # Add template params if provided
            if template_params:
                # Set template-specific parameters
                for key, value in template_params.items():
                    payload[key] = value
        
        # Add browser actions if provided
        if browser_actions:
            payload["browser_actions"] = browser_actions
        
        # Add network request capture if requested
        if capture_network:
            payload["capture_network"] = capture_network
        
        # Make request
        response = await self._make_request_with_retries(
            f"{self.base_url}/scrape", 
            payload=payload,
            method="POST",
            retries=retries,
            backoff_factor=backoff_factor,
            timeout=timeout
        )
        
        # Update session usage
        if session_id:
            self.update_session_usage(session_id)
        
        # Track template performance if used
        if template:
            self._track_template_performance(template, response, start_time)
        
        # Report on elapsed time for monitoring
        elapsed_time = time.time() - start_time
        self.logger.debug(f"Request completed in {elapsed_time:.2f}s: {url}")
        
        return response
    
    async def scrape_with_template(self,
                                 url: str,
                                 template: str,
                                 template_params: Optional[Dict[str, Any]] = None,
                                 geo: str = None,
                                 device_type: str = "desktop",
                                 session_id: Optional[str] = None,
                                 retries: int = 3,
                                 timeout: int = 60) -> Dict[str, Any]:
        """Perform template-based scraping request.
        
        This method is optimized for template-based extraction from marketplaces.
        
        Args:
            url: Target URL to scrape
            template: Template name to use (e.g. "amazon_product")
            template_params: Template-specific parameters
            geo: Geographic location (default: ZA for South Africa)
            device_type: Device type (desktop/mobile)
            session_id: Session ID for maintaining IP consistency
            retries: Number of retry attempts on failure
            timeout: Request timeout in seconds
            
        Returns:
            API response as dictionary with parsed_content if available
            
        Raises:
            QuotaExceededError: If monthly quota is exceeded
            ValueError: If invalid template is provided
        """
        if not geo:
            geo = self.region
            
        # Validate template
        if template not in self.AMAZON_TEMPLATES.values() and template not in self.GENERIC_TEMPLATES.values():
            self.logger.warning(f"Using custom template: {template}")
        
        # Create headers specific to template-based requests
        custom_headers = {
            "User-Agent": random.choice(self.USER_AGENTS)
        }
        
        return await self.scrape_sync(
            url=url,
            geo=geo,
            device_type=device_type,
            headless="html",  # Always use JS rendering for templates
            session_id=session_id,
            custom_headers=custom_headers,
            template=template,
            template_params=template_params,
            retries=retries,
            timeout=timeout,
            randomize_user_agent=False  # Already randomized above
        )
    
    async def scrape_with_browser_actions(self, 
                                       url: str,
                                       actions: List[Dict[str, Any]],
                                       geo: str = None,
                                       device_type: str = "desktop",
                                       session_id: Optional[str] = None,
                                       custom_headers: Optional[Dict[str, str]] = None,
                                       custom_cookies: Optional[Dict[str, str]] = None,
                                       capture_network: Optional[str] = None,
                                       wait_for_navigation: bool = True,
                                       retries: int = 3,
                                       timeout: int = 90) -> Dict[str, Any]:
        """Perform scraping with complex browser actions.
        
        This method provides advanced browser automation capabilities through
        SmartProxy's browser actions feature.
        
        Args:
            url: Target URL to scrape
            actions: List of browser action objects
            geo: Geographic location (default: ZA for South Africa)
            device_type: Device type (desktop/mobile)
            session_id: Session ID for maintaining IP consistency
            custom_headers: Custom headers to send with the request
            custom_cookies: Custom cookies to send with the request
            capture_network: Type of network requests to capture (xhr, fetch, document)
            wait_for_navigation: Whether to wait for navigation after actions
            retries: Number of retry attempts on failure
            timeout: Request timeout in seconds (longer for complex actions)
            
        Returns:
            API response as dictionary
            
        Raises:
            QuotaExceededError: If monthly quota is exceeded
            BrowserActionError: If browser actions fail
        """
        if not geo:
            geo = self.region
            
        # Add automatic waiting for navigation if requested
        actual_actions = list(actions)  # Make a copy
        if wait_for_navigation:
            actual_actions.append({"action": "wait_for_navigation"})
        
        return await self.scrape_sync(
            url=url,
            geo=geo,
            device_type=device_type,
            headless="html",  # Always use JS rendering for browser actions
            session_id=session_id,
            custom_headers=custom_headers,
            custom_cookies=custom_cookies,
            browser_actions=actual_actions,
            capture_network=capture_network,
            retries=retries,
            timeout=timeout  # Longer timeout for actions
        )
    
    async def scrape_with_action_template(self,
                                       url: str,
                                       action_template: str,
                                       template_params: Optional[Dict[str, Any]] = None,
                                       geo: str = None,
                                       device_type: str = "desktop",
                                       session_id: Optional[str] = None,
                                       retries: int = 3,
                                       timeout: int = 90) -> Dict[str, Any]:
        """Perform scraping with a predefined browser action template.
        
        This method makes it easy to use common browser action patterns without
        having to define the actions each time.
        
        Args:
            url: Target URL to scrape
            action_template: Name of the predefined action template
            template_params: Parameters to fill in action template placeholders
            geo: Geographic location (default: ZA for South Africa)
            device_type: Device type (desktop/mobile)
            session_id: Session ID for maintaining IP consistency
            retries: Number of retry attempts on failure
            timeout: Request timeout in seconds
            
        Returns:
            API response as dictionary
            
        Raises:
            QuotaExceededError: If monthly quota is exceeded
            ValueError: If invalid action template is provided
        """
        if action_template not in self.browser_action_templates:
            raise ValueError(f"Unknown action template: {action_template}")
        
        # Get the action template
        actions = self.browser_action_templates[action_template]
        
        # Fill in template parameters if provided
        if template_params:
            actions = self._apply_template_params(actions, template_params)
        
        return await self.scrape_with_browser_actions(
            url=url,
            actions=actions,
            geo=geo,
            device_type=device_type,
            session_id=session_id,
            retries=retries,
            timeout=timeout
        )
    
    async def scrape_async(self, 
                          url: str, 
                          geo: str = None,
                          device_type: str = "desktop",
                          headless: str = "html",
                          session_id: Optional[str] = None,
                          custom_headers: Optional[Dict[str, str]] = None,
                          custom_cookies: Optional[Dict[str, str]] = None,
                          browser_actions: Optional[List[Dict[str, Any]]] = None,
                          template: Optional[str] = None,
                          template_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create asynchronous scraping task.
        
        Args:
            Same as scrape_sync
            
        Returns:
            Task ID and status information
        """
        if not geo:
            geo = self.region
            
        payload = self._build_payload(
            url=url,
            geo=geo,
            device_type=device_type,
            headless=headless,
            session_id=session_id,
            custom_headers=custom_headers,
            custom_cookies=custom_cookies
        )
        
        # Add template if provided
        if template:
            payload["template"] = template
            
            # Add template params if provided
            if template_params:
                for key, value in template_params.items():
                    payload[key] = value
        
        # Add browser actions if provided
        if browser_actions:
            payload["browser_actions"] = browser_actions
        
        return await self._make_request(f"{self.base_url}/task", payload)
    
    async def scrape_batch(self, 
                          urls: List[str], 
                          geo: str = None,
                          device_type: str = "desktop",
                          headless: str = "html",
                          session_id: Optional[str] = None,
                          custom_headers: Optional[Dict[str, str]] = None,
                          custom_cookies: Optional[Dict[str, str]] = None,
                          template: Optional[str] = None) -> Dict[str, Any]:
        """Create batch scraping task.
        
        Args:
            urls: List of URLs to scrape
            Other args same as scrape_sync
            
        Returns:
            Batch task ID and status information
        """
        if not geo:
            geo = self.region
            
        payloads = [
            self._build_payload(
                url=url,
                geo=geo,
                device_type=device_type,
                headless=headless,
                session_id=f"{session_id}_{i}" if session_id else None,
                custom_headers=custom_headers,
                custom_cookies=custom_cookies,
                template=template
            )
            for i, url in enumerate(urls)
        ]
        
        return await self._make_request(f"{self.base_url}/task/batch", {"tasks": payloads})
    
    async def get_task_result(self, task_id: str) -> Dict[str, Any]:
        """Get result of an asynchronous task.
        
        Args:
            task_id: Task ID from scrape_async
            
        Returns:
            Task result
        """
        return await self._make_request(f"{self.base_url}/task/{task_id}", method="GET")
    
    async def get_batch_results(self, batch_id: str) -> Dict[str, Any]:
        """Get results of a batch task.
        
        Args:
            batch_id: Batch ID from scrape_batch
            
        Returns:
            Batch results
        """
        return await self._make_request(f"{self.base_url}/task/batch/{batch_id}", method="GET")
    
    async def wait_for_task_completion(self, 
                                     task_id: str, 
                                     interval: int = 2, 
                                     max_attempts: int = 30) -> Dict[str, Any]:
        """Wait for an asynchronous task to complete.
        
        Args:
            task_id: Task ID to check
            interval: Polling interval in seconds
            max_attempts: Maximum number of polling attempts
            
        Returns:
            Task result when complete
            
        Raises:
            TimeoutError: If task doesn't complete within max_attempts
        """
        for attempt in range(max_attempts):
            result = await self.get_task_result(task_id)
            status = result.get("status")
            
            if status == "done":
                return result
            elif status == "failed":
                raise Exception(f"Task failed: {result.get('error')}")
            
            # Still in progress, wait and retry
            await asyncio.sleep(interval)
        
        raise TimeoutError(f"Task {task_id} did not complete within allowed time")
    
    async def wait_for_batch_completion(self, 
                                      batch_id: str, 
                                      interval: int = 5, 
                                      max_attempts: int = 60) -> Dict[str, Any]:
        """Wait for a batch task to complete.
        
        Args:
            batch_id: Batch ID to check
            interval: Polling interval in seconds
            max_attempts: Maximum number of polling attempts
            
        Returns:
            Batch results when complete
            
        Raises:
            TimeoutError: If batch doesn't complete within max_attempts
        """
        for attempt in range(max_attempts):
            result = await self.get_batch_results(batch_id)
            statuses = [task.get("status") for task in result.get("tasks", [])]
            
            # Check if all tasks are done or failed
            if all(status in ["done", "failed"] for status in statuses):
                return result
            
            # Still in progress, wait and retry
            await asyncio.sleep(interval)
        
        raise TimeoutError(f"Batch {batch_id} did not complete within allowed time")
    
    #
    # ===== Specialized Marketplace Methods =====
    #
    
    async def scrape_amazon_product(self,
                                  asin: str,
                                  marketplace: str = "amazon.co.za",
                                  geo: str = None,
                                  include_reviews: bool = False,
                                  session_id: Optional[str] = None) -> Dict[str, Any]:
        """Scrape Amazon product details using specialized template.
        
        Args:
            asin: Amazon ASIN (product ID)
            marketplace: Amazon marketplace domain
            geo: Geographic location
            include_reviews: Whether to include reviews in response
            session_id: Session ID for maintaining IP consistency
            
        Returns:
            Structured product data from Amazon
        """
        # Build the URL
        url = f"https://{marketplace}/dp/{asin}"
        
        # Template parameters
        template_params = {
            "asin": asin,
            "parse_reviews": "true" if include_reviews else "false"
        }
        
        return await self.scrape_with_template(
            url=url,
            template=self.AMAZON_TEMPLATES["product"],
            template_params=template_params,
            geo=geo,
            session_id=session_id
        )
    
    async def scrape_amazon_search(self,
                                 keyword: str,
                                 marketplace: str = "amazon.co.za",
                                 geo: str = None,
                                 page: int = 1,
                                 session_id: Optional[str] = None) -> Dict[str, Any]:
        """Scrape Amazon search results using specialized template.
        
        Args:
            keyword: Search keyword
            marketplace: Amazon marketplace domain
            geo: Geographic location
            page: Page number
            session_id: Session ID for maintaining IP consistency
            
        Returns:
            Structured search results from Amazon
        """
        # Build the URL
        url = f"https://{marketplace}/s?k={keyword}&page={page}"
        
        # Template parameters
        template_params = {
            "keyword": keyword,
            "page": str(page)
        }
        
        return await self.scrape_with_template(
            url=url,
            template=self.AMAZON_TEMPLATES["search"],
            template_params=template_params,
            geo=geo,
            session_id=session_id
        )
    
    #
    # ===== Helper Methods =====
    #
    
    def _build_payload(self, 
                      url: str,
                      geo: str = "ZA",
                      device_type: str = "desktop",
                      headless: str = "html",
                      session_id: Optional[str] = None,
                      custom_headers: Optional[Dict[str, str]] = None,
                      custom_cookies: Optional[Dict[str, str]] = None,
                      template: Optional[str] = None) -> Dict[str, Any]:
        """Build request payload.
        
        Args:
            Same as scrape methods
            
        Returns:
            Request payload dictionary
        """
        payload = {
            "url": url,
            "geo": geo,
            "device_type": device_type
        }
        
        if headless:
            payload["headless"] = headless
            
        if session_id:
            payload["session_id"] = session_id
            
        if custom_headers:
            payload["headers"] = custom_headers
            
        if custom_cookies:
            payload["cookies"] = custom_cookies
            
        if template:
            payload["template"] = template
            
        return payload
    
    async def _make_request(self, 
                           endpoint: str, 
                           payload: Dict[str, Any] = None, 
                           method: str = "POST",
                           timeout: int = 60) -> Dict[str, Any]:
        """Make API request.
        
        Args:
            endpoint: API endpoint
            payload: Request payload
            method: HTTP method
            timeout: Request timeout in seconds
            
        Returns:
            API response
            
        Raises:
            QuotaExceededError: If monthly quota is exceeded
            aiohttp.ClientError: For other request failures
        """
        if not self.session:
            self.session = aiohttp.ClientSession()
            
        # Check if we're within quota
        if method == "POST" and not endpoint.endswith(("task_id", "batch_id")):
            if not self.check_quota():
                raise QuotaExceededError(f"SmartProxy quota exceeded: Monthly: {self.request_count}/{self.monthly_quota}, Daily: {self.daily_request_count}/{self.daily_quota}")
            
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.auth_token}"
        }
        
        try:
            if method == "POST":
                async with self.session.post(
                    endpoint, 
                    json=payload, 
                    headers=headers,
                    timeout=timeout
                ) as response:
                    # Increment counter for POST requests that count against quota
                    if not endpoint.endswith(("task_id", "batch_id")):  # Don't count status checks
                        request_urls = 1
                        if payload and "tasks" in payload:
                            request_urls = len(payload["tasks"])
                            
                        self.request_count += request_urls
                        self.daily_request_count += request_urls
                        self.logger.info(
                            f"SmartProxy request: {endpoint} "
                            f"(monthly: {self.request_count}/{self.monthly_quota}, "
                            f"daily: {self.daily_request_count}/{self.daily_quota})"
                        )
                    
                    response_data = await response.json()
                    
                    if response.status >= 400:
                        self.failed_requests += 1
                        self.consecutive_failures += 1
                        self.logger.error(f"SmartProxy request failed: {response.status} - {response_data}")
                        
                        # Check if this might be load shedding
                        if self.load_shedding_detection.check_failure():
                            self.network_status = "loadShedding"
                            self.logger.warning("Possible load shedding detected based on failure pattern")
                        else:
                            self.network_status = "degraded"
                            
                        response.raise_for_status()
                    else:
                        self.successful_requests += 1
                        self.consecutive_failures = 0  # Reset on success
                        
                        # Reset network status if it was degraded
                        if self.network_status != "normal":
                            self.logger.info("Network connection restored")
                            self.network_status = "normal"
                            self.load_shedding_detection.reset()
                            
                    return response_data
            else:
                async with self.session.get(
                    endpoint, 
                    headers=headers,
                    timeout=timeout
                ) as response:
                    response_data = await response.json()
                    
                    if response.status >= 400:
                        self.logger.error(f"SmartProxy request failed: {response.status} - {response_data}")
                        response.raise_for_status()
                        
                    return response_data
        except asyncio.TimeoutError:
            self.logger.error(f"SmartProxy request timed out after {timeout}s: {endpoint}")
            self.failed_requests += 1
            self.consecutive_failures += 1
            
            # Check if this might be load shedding
            if self.load_shedding_detection.check_failure():
                self.network_status = "loadShedding"
                self.logger.warning("Possible load shedding detected based on timeout pattern")
            else:
                self.network_status = "degraded"
                
            raise
        except Exception as e:
            self.logger.error(f"SmartProxy request failed: {str(e)}")
            self.failed_requests += 1
            self.consecutive_failures += 1
            
            # Check if this might be load shedding
            if self.load_shedding_detection.check_failure():
                self.network_status = "loadShedding"
                self.logger.warning("Possible load shedding detected based on error pattern")
            else:
                self.network_status = "degraded"
                
            raise
            
    async def _make_request_with_retries(self,
                                        endpoint: str,
                                        payload: Dict[str, Any],
                                        method: str = "POST",
                                        retries: int = 3,
                                        backoff_factor: float = 1.5,
                                        timeout: int = 60) -> Dict[str, Any]:
        """Make API request with retry logic for resilience.
        
        Implements exponential backoff for retries to handle temporary failures,
        network issues, and load shedding scenarios. Adds smart jitter to prevent
        thundering herd problems.
        
        Args:
            endpoint: API endpoint
            payload: Request payload
            method: HTTP method
            retries: Number of retry attempts
            backoff_factor: Exponential backoff factor
            timeout: Request timeout in seconds
            
        Returns:
            API response
            
        Raises:
            QuotaExceededError: If quota is exceeded
            Exception: If all retries fail
        """
        last_exception = None
        
        # If we detect load shedding, adjust retry strategy
        if self.network_status == "loadShedding":
            # Double retries and use more aggressive backoff
            retries = retries * 2
            backoff_factor = backoff_factor * 1.5
            self.logger.info(f"Load shedding mode active: increased retries to {retries}, backoff factor to {backoff_factor}")
        
        for attempt in range(retries + 1):  # +1 for initial attempt
            try:
                return await self._make_request(endpoint, payload, method, timeout)
            except QuotaExceededError:
                # Don't retry quota errors
                raise
            except Exception as e:
                last_exception = e
                if attempt < retries:
                    # Calculate backoff time with jitter
                    backoff_time = backoff_factor ** attempt + (random.random() * 0.5)
                    
                    # Add extra delay in load shedding mode
                    if self.network_status == "loadShedding":
                        # Add larger random component during load shedding
                        backoff_time += random.uniform(3, 10)
                    
                    self.logger.warning(
                        f"Request failed (attempt {attempt+1}/{retries+1}), "
                        f"retrying in {backoff_time:.2f}s: {str(e)}"
                    )
                    await asyncio.sleep(backoff_time)
                else:
                    self.logger.error(f"All {retries+1} attempts failed")
        
        # If we get here, all retries failed
        raise last_exception or Exception("Request failed with unknown error")
    
    def _prepare_headers(self, 
                        custom_headers: Optional[Dict[str, str]] = None,
                        randomize_user_agent: bool = True) -> Dict[str, str]:
        """Prepare headers for the request, optionally randomizing user agent.
        
        Args:
            custom_headers: Custom headers provided by the caller
            randomize_user_agent: Whether to add/replace with a random user agent
            
        Returns:
            Prepared headers dictionary
        """
        headers = custom_headers or {}
        
        if randomize_user_agent:
            headers["User-Agent"] = random.choice(self.USER_AGENTS)
            
        return headers
    
    def _track_template_performance(self, 
                                  template: str, 
                                  response: Dict[str, Any],
                                  start_time: float) -> None:
        """Track performance metrics for template usage.
        
        Args:
            template: The template used
            response: The response from the API
            start_time: Start time of the request
        """
        elapsed_time = time.time() - start_time
        
        # Initialize template tracking if needed
        if template not in self.template_performance["success_rates"]:
            self.template_performance["success_rates"][template] = {"success": 0, "failure": 0}
            self.template_performance["response_times"][template] = []
            self.template_performance["parsing_results"][template] = {"success": 0, "failure": 0}
        
        # Update success rate
        success = "content" in response or "parsed_content" in response
        if success:
            self.template_performance["success_rates"][template]["success"] += 1
        else:
            self.template_performance["success_rates"][template]["failure"] += 1
        
        # Update response time
        self.template_performance["response_times"][template].append(elapsed_time)
        
        # Update parsing results if template returns structured data
        if "parsed_content" in response:
            self.template_performance["parsing_results"][template]["success"] += 1
        else:
            self.template_performance["parsing_results"][template]["failure"] += 1
    
    def _apply_template_params(self, 
                            actions: List[Dict[str, Any]], 
                            params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply template parameters to browser actions.
        
        Args:
            actions: List of browser action objects
            params: Parameter values to substitute
            
        Returns:
            Actions with parameters substituted
        """
        result = []
        
        for action in actions:
            new_action = action.copy()
            
            # Check if value needs parameter substitution
            if "value" in new_action and isinstance(new_action["value"], str):
                for param_name, param_value in params.items():
                    placeholder = f"{{{param_name}}}"
                    if placeholder in new_action["value"]:
                        new_action["value"] = new_action["value"].replace(placeholder, str(param_value))
            
            result.append(new_action)
            
        return result
    
    #
    # ===== Browser Actions Framework Methods =====
    #
    
    def create_browser_action(self, action_type: str, **kwargs) -> Dict[str, Any]:
        """Create a browser action object.
        
        This is a helper method to create properly formatted browser actions.
        
        Args:
            action_type: Type of action (click, scroll, input, wait, etc.)
            **kwargs: Action-specific parameters
            
        Returns:
            Browser action object
        """
        action = {"action": action_type}
        
        if action_type == "click":
            # Click action requires a selector
            if "selector" not in kwargs:
                raise ValueError("Click action requires a selector")
            action["selector"] = kwargs["selector"]
            
            # Optional parameters
            if "optional" in kwargs:
                action["optional"] = kwargs["optional"]
                
        elif action_type == "scroll":
            # Scroll action requires a value or selector
            if "value" in kwargs:
                action["value"] = kwargs["value"]
            elif "selector" in kwargs:
                action["selector"] = kwargs["selector"]
            else:
                raise ValueError("Scroll action requires a value or selector")
                
        elif action_type == "input":
            # Input action requires a selector and value
            if "selector" not in kwargs:
                raise ValueError("Input action requires a selector")
            if "value" not in kwargs:
                raise ValueError("Input action requires a value")
                
            action["selector"] = kwargs["selector"]
            action["value"] = kwargs["value"]
            
        elif action_type == "wait":
            # Wait action requires a value (milliseconds)
            if "value" not in kwargs:
                raise ValueError("Wait action requires a value in milliseconds")
            action["value"] = kwargs["value"]
            
        elif action_type == "wait_for_selector":
            # Wait for selector action requires a selector
            if "selector" not in kwargs:
                raise ValueError("Wait for selector action requires a selector")
            action["selector"] = kwargs["selector"]
            
            # Optional timeout
            if "timeout" in kwargs:
                action["timeout"] = kwargs["timeout"]
                
        elif action_type == "set_capture_network":
            # Set capture network requires a value
            if "value" not in kwargs:
                raise ValueError("Set capture network action requires a value")
            action["value"] = kwargs["value"]
            
        elif action_type == "wait_for_navigation":
            # Optional timeout
            if "timeout" in kwargs:
                action["timeout"] = kwargs["timeout"]
        
        # Add other action-specific validations as needed
        
        return action
    
    def add_browser_action_template(self, name: str, actions: List[Dict[str, Any]]) -> None:
        """Add a new browser action template.
        
        Args:
            name: Template name
            actions: List of browser action objects
        """
        self.browser_action_templates[name] = actions
        self.logger.info(f"Added browser action template: {name} with {len(actions)} actions")
    
    #
    # ===== Status and Statistics Methods =====
    #
    
    async def scrape_amazon_reviews(self,
                                 asin: str,
                                 marketplace: str = "amazon.co.za",
                                 geo: str = None,
                                 page: int = 1,
                                 session_id: Optional[str] = None) -> Dict[str, Any]:
        """Scrape Amazon product reviews using specialized template.
        
        Args:
            asin: Amazon ASIN (product ID)
            marketplace: Amazon marketplace domain
            geo: Geographic location
            page: Page number
            session_id: Session ID for maintaining IP consistency
            
        Returns:
            Structured review data from Amazon
        """
        # Build the URL
        url = f"https://{marketplace}/product-reviews/{asin}?pageNumber={page}"
        
        # Template parameters
        template_params = {
            "asin": asin,
            "page": str(page)
        }
        
        return await self.scrape_with_template(
            url=url,
            template=self.AMAZON_TEMPLATES["reviews"],
            template_params=template_params,
            geo=geo,
            session_id=session_id
        )
    
    async def scrape_amazon_pricing(self,
                                  asin: str,
                                  marketplace: str = "amazon.co.za",
                                  geo: str = None,
                                  session_id: Optional[str] = None) -> Dict[str, Any]:
        """Scrape Amazon product pricing using specialized template.
        
        Args:
            asin: Amazon ASIN (product ID)
            marketplace: Amazon marketplace domain
            geo: Geographic location
            session_id: Session ID for maintaining IP consistency
            
        Returns:
            Structured pricing data from Amazon
        """
        # Build the URL
        url = f"https://{marketplace}/dp/{asin}"
        
        # Template parameters
        template_params = {
            "asin": asin,
            "parse_offers": "true"
        }
        
        return await self.scrape_with_template(
            url=url,
            template=self.AMAZON_TEMPLATES["pricing"],
            template_params=template_params,
            geo=geo,
            session_id=session_id
        )
    
    async def scrape_amazon_bestsellers(self,
                                      category_url: str,
                                      marketplace: str = "amazon.co.za",
                                      geo: str = None,
                                      page: int = 1,
                                      session_id: Optional[str] = None) -> Dict[str, Any]:
        """Scrape Amazon bestsellers using specialized template.
        
        Args:
            category_url: URL to bestsellers category
            marketplace: Amazon marketplace domain
            geo: Geographic location
            page: Page number
            session_id: Session ID for maintaining IP consistency
            
        Returns:
            Structured bestseller data from Amazon
        """
        # Ensure the URL is a bestsellers URL
        if "bestsellers" not in category_url:
            category_url = f"https://{marketplace}/gp/bestsellers/"
        
        # Template parameters
        template_params = {
            "page": str(page)
        }
        
        return await self.scrape_with_template(
            url=category_url,
            template=self.AMAZON_TEMPLATES["bestsellers"],
            template_params=template_params,
            geo=geo,
            session_id=session_id
        )
    
    async def scrape_with_hybrid_approach(self,
                                       url: str,
                                       templates: List[str],
                                       template_params: Optional[Dict[str, Any]] = None,
                                       geo: str = None,
                                       session_id: Optional[str] = None,
                                       fallback_to_raw: bool = True) -> Dict[str, Any]:
        """Scrape using multiple templates and select the best result.
        
        This method attempts scraping with multiple templates and selects the best
        result based on response quality. If all templates fail and fallback_to_raw
        is True, it will fall back to raw HTML scraping.
        
        Args:
            url: Target URL to scrape
            templates: List of templates to try
            template_params: Template parameters
            geo: Geographic location
            session_id: Session ID
            fallback_to_raw: Whether to fall back to raw HTML if templates fail
            
        Returns:
            Best result from any template or raw HTML
        """
        results = []
        
        # Try each template
        for template in templates:
            try:
                result = await self.scrape_with_template(
                    url=url,
                    template=template,
                    template_params=template_params,
                    geo=geo,
                    session_id=session_id
                )
                
                # Check if template returned parsed content
                if "parsed_content" in result:
                    # This template provided structured data, use it
                    self.logger.info(f"Template {template} provided structured data")
                    return result
                
                # Otherwise, store the result for later comparison
                results.append((template, result))
                
            except Exception as e:
                self.logger.warning(f"Template {template} failed: {str(e)}")
        
        # If we have results but none had parsed_content, return the first successful one
        if results:
            self.logger.info(f"Using template {results[0][0]} without structured data")
            return results[0][1]
        
        # If fallback is enabled and all templates failed, try raw HTML
        if fallback_to_raw:
            self.logger.info(f"Falling back to raw HTML scraping")
            return await self.scrape_sync(
                url=url,
                geo=geo,
                headless="html",
                session_id=session_id
            )
        
        # If we get here, all attempts failed
        raise ValueError(f"All scraping attempts failed for URL: {url}")
    
    async def test_template_compatibility(self,
                                        url: str,
                                        marketplace_type: str,
                                        templates_to_test: List[str] = None,
                                        geo: str = None,
                                        session_id: Optional[str] = None) -> Dict[str, Any]:
        """Test compatibility of various templates with a marketplace.
        
        Args:
            url: URL to test
            marketplace_type: Type of marketplace (e.g., "amazon", "takealot")
            templates_to_test: List of templates to test (defaults to all)
            geo: Geographic location
            session_id: Session ID
            
        Returns:
            Comparison report of template effectiveness
        """
        if not templates_to_test:
            # Use all templates if not specified
            templates_to_test = list(self.AMAZON_TEMPLATES.values()) + list(self.GENERIC_TEMPLATES.values())
        
        results = {}
        
        # Try each template
        for template in templates_to_test:
            try:
                start_time = time.time()
                
                result = await self.scrape_with_template(
                    url=url,
                    template=template,
                    geo=geo,
                    session_id=session_id
                )
                
                elapsed_time = time.time() - start_time
                
                # Analyze the result
                has_parsed_content = "parsed_content" in result
                has_raw_content = "content" in result
                
                results[template] = {
                    "success": True,
                    "has_parsed_content": has_parsed_content,
                    "has_raw_content": has_raw_content,
                    "response_time": elapsed_time,
                    "content_length": len(result.get("content", "")) if has_raw_content else 0,
                    "parsed_fields": len(result.get("parsed_content", {}).keys()) if has_parsed_content else 0
                }
                
            except Exception as e:
                results[template] = {
                    "success": False,
                    "error": str(e)
                }
        
        # Also test raw HTML for comparison
        try:
            start_time = time.time()
            
            raw_result = await self.scrape_sync(
                url=url,
                geo=geo,
                headless="html",
                session_id=session_id
            )
            
            elapsed_time = time.time() - start_time
            
            results["raw_html"] = {
                "success": "content" in raw_result,
                "has_parsed_content": False,
                "has_raw_content": "content" in raw_result,
                "response_time": elapsed_time,
                "content_length": len(raw_result.get("content", "")) if "content" in raw_result else 0
            }
            
        except Exception as e:
            results["raw_html"] = {
                "success": False,
                "error": str(e)
            }
        
        # Generate summary
        successful_templates = [t for t in results if results[t]["success"]]
        structured_data_templates = [t for t in results if results[t].get("has_parsed_content", False)]
        
        summary = {
            "url": url,
            "marketplace_type": marketplace_type,
            "templates_tested": len(templates_to_test) + 1,  # +1 for raw_html
            "successful_templates": len(successful_templates),
            "structured_data_templates": len(structured_data_templates),
            "best_template": max(successful_templates, key=lambda t: results[t].get("parsed_fields", 0), default=None),
            "fastest_template": min(successful_templates, key=lambda t: results[t].get("response_time", float("inf")), default=None),
            "detailed_results": results
        }
        
        self.logger.info(f"Template compatibility test completed for {url}")
        return summary
    
    def get_template_performance(self) -> Dict[str, Any]:
        """Get template performance statistics.
        
        Returns:
            Dictionary with template performance statistics
        """
        performance = {}
        
        # Process each template's performance data
        for template in self.template_performance["success_rates"]:
            success_data = self.template_performance["success_rates"][template]
            parsing_data = self.template_performance["parsing_results"][template]
            response_times = self.template_performance["response_times"][template]
            
            total_requests = success_data["success"] + success_data["failure"]
            total_parsing = parsing_data["success"] + parsing_data["failure"]
            
            performance[template] = {
                "success_rate": (success_data["success"] / total_requests * 100) if total_requests > 0 else 0,
                "parsing_success_rate": (parsing_data["success"] / total_parsing * 100) if total_parsing > 0 else 0,
                "average_response_time": sum(response_times) / len(response_times) if response_times else 0,
                "total_requests": total_requests,
                "successful_requests": success_data["success"],
                "structured_data_responses": parsing_data["success"]
            }
        
        return performance
    
    async def get_quota_status(self) -> Dict[str, Any]:
        """Get current quota usage status.
        
        Returns:
            Dictionary with quota statistics
        """
        self.reset_quota_if_needed()
        
        return {
            "monthly_quota": {
                "request_count": self.request_count,
                "total_quota": self.monthly_quota,
                "remaining": self.monthly_quota - self.request_count,
                "usage_percentage": (self.request_count / self.monthly_quota) * 100 if self.monthly_quota > 0 else 0,
            },
            "daily_quota": {
                "request_count": self.daily_request_count,
                "total_quota": self.daily_quota,
                "remaining": self.daily_quota - self.daily_request_count,
                "usage_percentage": (self.daily_request_count / self.daily_quota) * 100 if self.daily_quota > 0 else 0,
            },
            "request_stats": {
                "successful_requests": self.successful_requests,
                "failed_requests": self.failed_requests,
                "success_rate": (self.successful_requests / (self.successful_requests + self.failed_requests) * 100) 
                                if (self.successful_requests + self.failed_requests) > 0 else 0
            },
            "current_month": self.current_month,
            "current_day": self.current_day,
            "network_status": self.network_status,
            "circuit_breaker": {
                "tripped": self.circuit_breaker_tripped,
                "trip_time": self.circuit_breaker_trip_time,
                "trip_duration": time.time() - self.circuit_breaker_trip_time if self.circuit_breaker_tripped else None,
                "enabled": self.enable_quota_circuit_breaker
            },
            "session_stats": {
                "active_sessions": len(self.active_sessions),
                "sessions_by_category": self._count_sessions_by_category()
            },
            "template_performance": self.get_template_performance()
        }
    
    def _count_sessions_by_category(self) -> Dict[str, int]:
        """Count active sessions by category.
        
        Returns:
            Dictionary of category -> count
        """
        categories = {}
        for data in self.active_sessions.values():
            category = data["category"] or "uncategorized"
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    def get_network_status(self) -> Dict[str, Any]:
        """Get current network status information.
        
        Returns:
            Dictionary with network status details
        """
        return {
            "status": self.network_status,
            "consecutive_failures": self.consecutive_failures,
            "load_shedding_detection": {
                "active": self.network_status == "loadShedding",
                "threshold": self.load_shedding_detection_threshold,
                "failure_pattern": self.load_shedding_detection.get_failure_pattern()
            }
        }
    
    def get_sessions_info(self) -> Dict[str, Any]:
        """Get information about active sessions.
        
        Returns:
            Dictionary with session information
        """
        # Clean expired sessions first
        self.clean_expired_sessions()
        
        now = time.time()
        sessions_info = {}
        
        for session_id, data in self.active_sessions.items():
            sessions_info[session_id] = {
                "category": data["category"],
                "created_at": datetime.fromtimestamp(data["created_at"]).isoformat(),
                "last_used": datetime.fromtimestamp(data["last_used"]).isoformat(),
                "idle_time": now - data["last_used"],
                "lifetime": now - data["created_at"],
                "request_count": data["request_count"],
                "is_valid": self.is_session_valid(session_id),
                "remaining_lifetime": max(0, self.session_max_lifetime - (now - data["created_at"]))
            }
            
        return {
            "active_sessions": len(sessions_info),
            "session_max_lifetime": self.session_max_lifetime,
            "sessions": sessions_info
        }


class _LoadSheddingDetector:
    """Helper class for detecting South African load shedding patterns.
    
    This class analyzes the pattern of failures to detect load shedding conditions,
    which are characterized by clustered failures with specific timing patterns.
    """
    
    def __init__(self, threshold: int = 5, window_size: int = 20, logger=None):
        """Initialize the load shedding detector.
        
        Args:
            threshold: Number of consecutive failures to trigger detection
            window_size: Size of the rolling window for pattern analysis
            logger: Logger for debug information
        """
        self.threshold = threshold
        self.window_size = window_size
        self.failure_times = []
        self.logger = logger or logging.getLogger("load-shedding-detector")
    
    def check_failure(self) -> bool:
        """Record a failure and check if load shedding is detected.
        
        Returns:
            True if load shedding is detected, False otherwise
        """
        now = time.time()
        self.failure_times.append(now)
        
        # Keep only the most recent failures in our window
        if len(self.failure_times) > self.window_size:
            self.failure_times = self.failure_times[-self.window_size:]
        
        # If we have enough failures, check the pattern
        if len(self.failure_times) >= self.threshold:
            # Basic threshold check
            is_load_shedding = True
            
            # Advanced pattern analysis could be implemented here
            # For example, checking if failures are clustered in a way
            # that matches known load shedding schedules
            
            if is_load_shedding:
                self.logger.warning(f"Load shedding detected based on {len(self.failure_times)} failures")
                return True
        
        return False
    
    def reset(self) -> None:
        """Reset the detector when network returns to normal."""
        self.failure_times = []
    
    def get_failure_pattern(self) -> Dict[str, Any]:
        """Get information about the current failure pattern.
        
        Returns:
            Dictionary with failure pattern details
        """
        if not self.failure_times:
            return {"failures": 0}
            
        now = time.time()
        return {
            "failures": len(self.failure_times),
            "first_failure": now - self.failure_times[0],
            "last_failure": now - self.failure_times[-1],
            "threshold": self.threshold,
            "failure_intervals": [self.failure_times[i] - self.failure_times[i-1] for i in range(1, len(self.failure_times))] if len(self.failure_times) > 1 else []
        }