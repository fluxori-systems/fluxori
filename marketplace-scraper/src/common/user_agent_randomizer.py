"""
User agent randomization and request pattern variation.

This module provides tools for rotating user agent strings, varying request timings,
and implementing CAPTCHA avoidance techniques to make scraping requests appear more
natural and avoid detection.
"""

import random
import time
from typing import Dict, Any, List, Optional, Callable, Tuple
from datetime import datetime, timedelta
import logging


class UserAgentRandomizer:
    """Randomizer for user agent strings and request patterns.
    
    This class provides tools for creating natural-looking request patterns:
    - Rotating between common user agent strings
    - Varying request timing with natural patterns
    - Implementing browser fingerprint diversity
    - Following best practices for CAPTCHA avoidance
    """
    
    # Comprehensive list of modern user agents with appropriate version distribution
    DESKTOP_USER_AGENTS = [
        # Chrome with varying versions (most popular browser)
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

        # Firefox with varying versions
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",

        # Safari
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",

        # Edge
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edge/120.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Edge/119.0.0.0",
    ]
    
    MOBILE_USER_AGENTS = [
        # iOS
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        
        # Android
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
    ]
    
    # South African mobile carriers for more authentic local traffic
    SA_CARRIERS = [
        "Vodacom",
        "MTN",
        "Cell C",
        "Telkom",
        "Rain"
    ]
    
    def __init__(self, 
                 rotate_frequency: float = 0.3,
                 use_mobile_chance: float = 0.2,
                 sa_specific: bool = True,
                 time_variation: float = 0.5):
        """Initialize the user agent randomizer.
        
        Args:
            rotate_frequency: Frequency of rotation (0.0-1.0, higher = more frequent)
            use_mobile_chance: Probability of using mobile user agents (0.0-1.0)
            sa_specific: Whether to add South African specific indicators
            time_variation: Amount of timing variation (0.0-1.0, higher = more variation)
        """
        self.rotate_frequency = rotate_frequency
        self.use_mobile_chance = use_mobile_chance
        self.sa_specific = sa_specific
        self.time_variation = time_variation
        
        # Track used user agents
        self.last_user_agent = None
        self.request_count = 0
        
        # Set up logging
        self.logger = logging.getLogger("user-agent-randomizer")
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def get_random_user_agent(self) -> str:
        """Get a random user agent string.
        
        Returns:
            Random user agent string
        """
        # Decide whether to use mobile or desktop
        use_mobile = random.random() < self.use_mobile_chance
        
        user_agents = self.MOBILE_USER_AGENTS if use_mobile else self.DESKTOP_USER_AGENTS
        
        # Don't use the same user agent twice in a row if possible
        if len(user_agents) > 1 and self.last_user_agent in user_agents:
            remaining_agents = [ua for ua in user_agents if ua != self.last_user_agent]
            user_agent = random.choice(remaining_agents)
        else:
            user_agent = random.choice(user_agents)
        
        self.last_user_agent = user_agent
        return user_agent
    
    def should_rotate_user_agent(self) -> bool:
        """Determine if user agent should be rotated based on frequency.
        
        Returns:
            True if user agent should be rotated, False otherwise
        """
        self.request_count += 1
        
        # Always rotate on first request
        if self.request_count == 1:
            return True
            
        # Use probabilistic rotation
        return random.random() < self.rotate_frequency
    
    def get_next_user_agent(self) -> str:
        """Get the next user agent based on rotation policy.
        
        Returns:
            User agent string
        """
        if self.should_rotate_user_agent():
            user_agent = self.get_random_user_agent()
            self.logger.debug(f"Rotated user agent: {user_agent}")
            return user_agent
            
        return self.last_user_agent or self.get_random_user_agent()
    
    def create_headers(self, 
                     additional_headers: Optional[Dict[str, str]] = None,
                     force_mobile: bool = False,
                     force_desktop: bool = False) -> Dict[str, str]:
        """Create a complete set of headers with randomized user agent.
        
        Args:
            additional_headers: Additional headers to include
            force_mobile: Force use of mobile user agent
            force_desktop: Force use of desktop user agent
            
        Returns:
            Complete headers dictionary
        """
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
        }
        
        # Get appropriate user agent
        if force_mobile:
            user_agent = random.choice(self.MOBILE_USER_AGENTS)
        elif force_desktop:
            user_agent = random.choice(self.DESKTOP_USER_AGENTS)
        else:
            user_agent = self.get_next_user_agent()
            
        headers["User-Agent"] = user_agent
        
        # Add South African carrier info for mobile
        if self.sa_specific and "Mobile" in user_agent and random.random() < 0.8:
            carrier = random.choice(self.SA_CARRIERS)
            if "Android" in user_agent:
                headers["X-Requested-With"] = "com.android.browser"
                if random.random() < 0.5:
                    headers["X-Wap-Profile"] = f"http://wap.{carrier.lower().replace(' ', '')}.co.za/profile.xml"
            if random.random() < 0.3:
                headers["Via"] = f"1.1 {carrier.lower().replace(' ', '')}-za-gprs (Google-Proxy)"
        
        # Add additional headers if provided
        if additional_headers:
            headers.update(additional_headers)
            
        return headers
    
    def get_delay(self, base_delay: float = 1.0) -> float:
        """Get a naturalistic delay value.
        
        Args:
            base_delay: Base delay in seconds
            
        Returns:
            Actual delay to use
        """
        # No variation means fixed delay
        if self.time_variation == 0:
            return base_delay
            
        # Apply randomization based on configured variation
        variation_amount = base_delay * self.time_variation
        
        # Use triangular distribution for more natural timing
        return random.triangular(
            base_delay - variation_amount * 0.8,  # Lower bound
            base_delay + variation_amount * 1.2,  # Upper bound
            base_delay  # Mode (most common value)
        )
    
    def get_request_pattern(self, 
                           min_requests: int = 3, 
                           max_requests: int = 8,
                           base_delay: float = 2.0) -> List[float]:
        """Generate a natural-looking sequence of request timings.
        
        This simulates human browsing patterns with variable delays.
        
        Args:
            min_requests: Minimum number of requests in sequence
            max_requests: Maximum number of requests in sequence
            base_delay: Base delay between requests in seconds
            
        Returns:
            List of delays to use between requests
        """
        # Determine number of requests in this "session"
        num_requests = random.randint(min_requests, max_requests)
        
        # Generate delay pattern
        delays = []
        for i in range(num_requests):
            # Longer pauses sometimes occur when people read content
            if random.random() < 0.2:  # 20% chance of a longer pause
                delay = self.get_delay(base_delay * random.uniform(2.0, 4.0))
            else:
                delay = self.get_delay(base_delay)
                
            delays.append(delay)
            
        return delays
    
    def natural_delay(self, base_delay: float = 1.0) -> None:
        """Sleep for a naturalistic delay period.
        
        Args:
            base_delay: Base delay in seconds
        """
        delay = self.get_delay(base_delay)
        time.sleep(delay)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get randomizer statistics.
        
        Returns:
            Dictionary with statistics
        """
        return {
            "request_count": self.request_count,
            "current_user_agent": self.last_user_agent,
            "rotation_frequency": self.rotate_frequency,
            "mobile_chance": self.use_mobile_chance,
            "sa_specific": self.sa_specific,
            "time_variation": self.time_variation
        }