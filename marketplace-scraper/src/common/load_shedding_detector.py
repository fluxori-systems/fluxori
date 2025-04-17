"""
Load shedding detection and adaptation system.

This module provides tools for detecting South African power outages (load shedding),
adapting scraping behavior during outages, implementing resilient caching and retries,
and optimizing for variable network conditions.
"""

import time
import logging
import json
import os
import requests
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Tuple
import threading
import aiohttp
import asyncio


class LoadSheddingStatus:
    """Enumeration of load shedding statuses."""
    UNKNOWN = "unknown"
    NO_LOAD_SHEDDING = "no_load_shedding"
    POSSIBLE_LOAD_SHEDDING = "possible_load_shedding"
    CONFIRMED_LOAD_SHEDDING = "confirmed_load_shedding"


class LoadSheddingDetector:
    """Detector for South African load shedding conditions.
    
    This class provides mechanisms for detecting load shedding (power outages)
    in South Africa, using both network behavior analysis and external APIs.
    
    Features:
    - Failure pattern analysis to detect network degradation
    - Integration with EskomSePush API for load shedding information
    - Historical load shedding schedule tracking
    - Probabilistic prediction of future load shedding
    """
    
    # EskomSePush API details
    ESP_API_URL = "https://developer.sepush.co.za/business/2.0"
    
    def __init__(self, 
                esp_api_key: Optional[str] = None,
                failure_threshold: int = 5,
                window_size: int = 20,
                check_interval: int = 300,  # 5 minutes
                areas: List[str] = None):
        """Initialize the load shedding detector.
        
        Args:
            esp_api_key: EskomSePush API key (optional)
            failure_threshold: Consecutive failures to trigger detection
            window_size: Size of the rolling window for pattern analysis
            check_interval: Interval in seconds between ESP API checks
            areas: List of area IDs to monitor (e.g., "capetown-8-fourwaysjunction")
        """
        self.esp_api_key = esp_api_key
        self.failure_threshold = failure_threshold
        self.window_size = window_size
        self.check_interval = check_interval
        self.areas = areas or []
        
        # State tracking
        self.failure_times = []
        self.failure_urls = []
        self.status = LoadSheddingStatus.UNKNOWN
        self.last_check_time = 0
        
        # External API data
        self.load_shedding_stage = 0  # 0 = No load shedding
        self.area_schedules = {}  # area_id -> schedule
        self.next_outage_time = None
        
        # Setup logging
        self.logger = logging.getLogger("load-shedding-detector")
        self._setup_logging()
        
        # Start background thread for periodic checks if API key is provided
        if self.esp_api_key:
            self.stop_thread = False
            self.thread = threading.Thread(target=self._background_check, daemon=True)
            self.thread.start()
    
    def _setup_logging(self):
        """Set up structured logging for the detector."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def record_failure(self, url: str) -> bool:
        """Record a request failure and check if load shedding is detected.
        
        Args:
            url: URL that failed
            
        Returns:
            True if load shedding is detected, False otherwise
        """
        now = time.time()
        self.failure_times.append(now)
        self.failure_urls.append(url)
        
        # Keep only the most recent failures in our window
        if len(self.failure_times) > self.window_size:
            self.failure_times = self.failure_times[-self.window_size:]
            self.failure_urls = self.failure_urls[-self.window_size:]
        
        # If we have enough failures, check the pattern
        if len(self.failure_times) >= self.failure_threshold:
            # Analyze timing pattern
            intervals = [self.failure_times[i] - self.failure_times[i-1] 
                        for i in range(1, len(self.failure_times))]
            
            # Criteria for load shedding pattern:
            # 1. Multiple failures in short succession
            # 2. Failures across different URLs (not just one site having issues)
            
            # Check if failures occurred within a short timeframe
            rapid_failures = all(interval < 10.0 for interval in intervals[-self.failure_threshold+1:])
            
            # Check if failures are across different URLs
            unique_urls = len(set(self.failure_urls[-self.failure_threshold:]))
            diverse_failures = unique_urls >= 2
            
            if rapid_failures and diverse_failures:
                if self.status != LoadSheddingStatus.CONFIRMED_LOAD_SHEDDING:
                    self.status = LoadSheddingStatus.POSSIBLE_LOAD_SHEDDING
                    self.logger.warning(
                        f"Possible load shedding detected based on {len(self.failure_times)} failures "
                        f"with {unique_urls} unique URLs"
                    )
                return True
        
        return False
    
    def reset(self) -> None:
        """Reset the detector state."""
        self.failure_times = []
        self.failure_urls = []
        if self.status != LoadSheddingStatus.CONFIRMED_LOAD_SHEDDING:
            self.status = LoadSheddingStatus.UNKNOWN
            self.logger.info("Load shedding detector reset")
    
    async def check_esp_api(self) -> Dict[str, Any]:
        """Check EskomSePush API for load shedding status.
        
        Returns:
            API response data
            
        Raises:
            ValueError: If ESP API key is not configured
            Exception: If API request fails
        """
        if not self.esp_api_key:
            raise ValueError("EskomSePush API key not configured")
            
        now = time.time()
        # Only check if enough time has passed since last check
        if now - self.last_check_time < self.check_interval:
            self.logger.debug("Skipping ESP API check due to interval limit")
            return {"source": "cache", "data": {
                "status": self.load_shedding_stage,
                "next_stages": []
            }}
            
        self.last_check_time = now
        
        headers = {
            "Token": self.esp_api_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ESP_API_URL}/status", headers=headers) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    # Extract and store relevant information
                    self.load_shedding_stage = data.get("status", {}).get("eskom", {}).get("stage", 0)
                    
                    # Update status based on API information
                    if self.load_shedding_stage > 0:
                        self.status = LoadSheddingStatus.CONFIRMED_LOAD_SHEDDING
                        self.logger.warning(f"Load shedding confirmed via ESP API: Stage {self.load_shedding_stage}")
                    else:
                        self.status = LoadSheddingStatus.NO_LOAD_SHEDDING
                        self.logger.info("No load shedding currently active according to ESP API")
                    
                    return {
                        "source": "api",
                        "data": data
                    }
                    
        except Exception as e:
            self.logger.error(f"Error checking ESP API: {str(e)}")
            # Don't change status if API check fails
            raise
    
    async def check_area_schedule(self, area_id: str) -> Dict[str, Any]:
        """Check load shedding schedule for a specific area.
        
        Args:
            area_id: Area ID to check
            
        Returns:
            Schedule information
            
        Raises:
            ValueError: If ESP API key is not configured
            Exception: If API request fails
        """
        if not self.esp_api_key:
            raise ValueError("EskomSePush API key not configured")
            
        headers = {
            "Token": self.esp_api_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ESP_API_URL}/area?id={area_id}", headers=headers) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    # Store schedule for this area
                    self.area_schedules[area_id] = data
                    
                    # Calculate next outage time
                    events = data.get("events", [])
                    if events:
                        # Find the next event
                        now = datetime.now()
                        future_events = [
                            event for event in events
                            if datetime.fromisoformat(event.get("start", "").replace("Z", "+00:00")) > now
                        ]
                        
                        if future_events:
                            next_event = min(future_events, key=lambda e: datetime.fromisoformat(e.get("start", "").replace("Z", "+00:00")))
                            self.next_outage_time = datetime.fromisoformat(next_event["start"].replace("Z", "+00:00"))
                            self.logger.info(f"Next load shedding event for {area_id}: {self.next_outage_time}")
                    
                    return data
                    
        except Exception as e:
            self.logger.error(f"Error checking area schedule: {str(e)}")
            raise
    
    def is_load_shedding_active(self) -> bool:
        """Check if load shedding is currently active.
        
        Returns:
            True if load shedding is active, False otherwise
        """
        # Check internal detection first
        if self.status == LoadSheddingStatus.CONFIRMED_LOAD_SHEDDING:
            return True
            
        # If we have ESP API data, use that
        if self.load_shedding_stage > 0:
            return True
            
        # If we have detected possible load shedding based on network patterns
        if self.status == LoadSheddingStatus.POSSIBLE_LOAD_SHEDDING and len(self.failure_times) >= self.failure_threshold:
            # Check how recent the failures are
            now = time.time()
            most_recent = max(self.failure_times)
            # If the most recent failure was within the last 10 minutes
            if now - most_recent < 600:
                return True
        
        return False
    
    def is_outage_expected_soon(self, minutes: int = 30) -> bool:
        """Check if an outage is expected in the near future.
        
        Args:
            minutes: Number of minutes to look ahead
            
        Returns:
            True if outage is expected soon, False otherwise
        """
        if not self.next_outage_time:
            return False
            
        now = datetime.now()
        time_until_outage = (self.next_outage_time - now).total_seconds() / 60
        
        return 0 <= time_until_outage <= minutes
    
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
            "threshold": self.failure_threshold,
            "status": self.status,
            "failure_intervals": [self.failure_times[i] - self.failure_times[i-1] 
                                for i in range(1, len(self.failure_times))] if len(self.failure_times) > 1 else []
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get current load shedding status information.
        
        Returns:
            Dictionary with status information
        """
        return {
            "status": self.status,
            "load_shedding_stage": self.load_shedding_stage,
            "is_active": self.is_load_shedding_active(),
            "next_outage": self.next_outage_time.isoformat() if self.next_outage_time else None,
            "outage_soon": self.is_outage_expected_soon(),
            "detection_info": self.get_failure_pattern(),
            "areas_monitored": self.areas,
            "esp_api_enabled": bool(self.esp_api_key)
        }
    
    def _background_check(self) -> None:
        """Background thread for periodic ESP API checks."""
        while not self.stop_thread:
            try:
                # Create a new event loop for the thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # Check load shedding status
                result = loop.run_until_complete(self.check_esp_api())
                
                # If we have areas configured, check their schedules
                if self.areas and result["source"] != "cache":  # Only check on fresh API calls
                    for area_id in self.areas:
                        try:
                            loop.run_until_complete(self.check_area_schedule(area_id))
                        except Exception:
                            pass
                
                # Clean up the loop
                loop.close()
            except Exception as e:
                self.logger.error(f"Error in background check thread: {str(e)}")
            
            # Sleep before next check
            time.sleep(self.check_interval)
    
    def stop(self) -> None:
        """Stop the background thread."""
        self.stop_thread = True
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(1.0)  # Wait up to 1 second for thread to terminate


class LoadSheddingAdapter:
    """Adaptation system for load shedding conditions.
    
    This class provides mechanisms for adapting scraping behavior during
    load shedding, including:
    
    - Resilient caching to reduce request needs
    - Adaptive retry strategies
    - Request prioritization during outages
    - Resource conservation during power constraints
    """
    
    def __init__(self, detector: LoadSheddingDetector, cache_dir: Optional[str] = None):
        """Initialize the adaptation system.
        
        Args:
            detector: Load shedding detector instance
            cache_dir: Directory for cache storage
        """
        self.detector = detector
        self.cache_dir = cache_dir
        self.cache = {}  # In-memory cache
        
        # Adaptation parameters
        self.retry_multiplier = 2.0  # Multiply retries during load shedding
        self.backoff_multiplier = 1.5  # Multiply backoff factor during load shedding
        self.timeout_multiplier = 2.0  # Multiply timeouts during load shedding
        
        # Setup logging
        self.logger = logging.getLogger("load-shedding-adapter")
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        # Create cache directory if specified
        if self.cache_dir and not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)
    
    def get_adapted_parameters(self, 
                             base_retries: int = 3,
                             base_backoff: float = 1.5,
                             base_timeout: int = 60) -> Dict[str, Any]:
        """Get adapted request parameters based on current conditions.
        
        Args:
            base_retries: Base number of retries
            base_backoff: Base backoff factor
            base_timeout: Base timeout in seconds
            
        Returns:
            Dictionary of adapted parameters
        """
        # Check if load shedding is active
        if self.detector.is_load_shedding_active():
            self.logger.info("Adapting request parameters for load shedding conditions")
            
            retries = int(base_retries * self.retry_multiplier)
            backoff = base_backoff * self.backoff_multiplier
            timeout = int(base_timeout * self.timeout_multiplier)
            
            return {
                "retries": retries,
                "backoff_factor": backoff,
                "timeout": timeout,
                "adapted": True,
                "condition": "load_shedding"
            }
        
        # Check if outage is expected soon
        elif self.detector.is_outage_expected_soon(minutes=15):
            self.logger.info("Adapting request parameters for imminent load shedding")
            
            # More modest adaptations for imminent outage
            retries = int(base_retries * 1.5)
            backoff = base_backoff * 1.2
            timeout = int(base_timeout * 1.5)
            
            return {
                "retries": retries,
                "backoff_factor": backoff,
                "timeout": timeout,
                "adapted": True,
                "condition": "imminent_outage"
            }
        
        # Normal conditions
        return {
            "retries": base_retries,
            "backoff_factor": base_backoff,
            "timeout": base_timeout,
            "adapted": False,
            "condition": "normal"
        }
    
    def get_cache_key(self, url: str, params: Dict[str, Any] = None) -> str:
        """Generate a cache key for a request.
        
        Args:
            url: Request URL
            params: Request parameters
            
        Returns:
            Cache key string
        """
        if params:
            param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
            return f"{url}?{param_str}"
        return url
    
    def get_from_cache(self, 
                     cache_key: str, 
                     max_age: int = 3600) -> Optional[Dict[str, Any]]:
        """Get data from cache if available and not expired.
        
        Args:
            cache_key: Cache key to look up
            max_age: Maximum age in seconds
            
        Returns:
            Cached data or None if not found/expired
        """
        # Check in-memory cache first
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            age = time.time() - entry["timestamp"]
            
            # Adjust max age during load shedding
            adjusted_max_age = max_age
            if self.detector.is_load_shedding_active():
                adjusted_max_age *= 2  # Double cache lifetime during load shedding
                
            if age <= adjusted_max_age:
                self.logger.debug(f"Cache hit for {cache_key} (age: {age:.1f}s)")
                return entry["data"]
        
        # Check persistent cache if configured
        if self.cache_dir:
            cache_file = os.path.join(self.cache_dir, self._hash_key(cache_key) + ".json")
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        entry = json.load(f)
                        
                    age = time.time() - entry["timestamp"]
                    adjusted_max_age = max_age
                    if self.detector.is_load_shedding_active():
                        adjusted_max_age *= 2
                        
                    if age <= adjusted_max_age:
                        # Update in-memory cache
                        self.cache[cache_key] = entry
                        self.logger.debug(f"Persistent cache hit for {cache_key} (age: {age:.1f}s)")
                        return entry["data"]
                except Exception as e:
                    self.logger.error(f"Error reading from cache: {str(e)}")
        
        return None
    
    def save_to_cache(self, 
                    cache_key: str, 
                    data: Dict[str, Any],
                    persist: bool = True) -> None:
        """Save data to cache.
        
        Args:
            cache_key: Cache key
            data: Data to cache
            persist: Whether to save to persistent cache
        """
        entry = {
            "timestamp": time.time(),
            "data": data
        }
        
        # Update in-memory cache
        self.cache[cache_key] = entry
        
        # Update persistent cache if configured
        if persist and self.cache_dir:
            try:
                cache_file = os.path.join(self.cache_dir, self._hash_key(cache_key) + ".json")
                with open(cache_file, 'w') as f:
                    json.dump(entry, f)
                    
                self.logger.debug(f"Saved to persistent cache: {cache_key}")
            except Exception as e:
                self.logger.error(f"Error saving to cache: {str(e)}")
    
    def _hash_key(self, key: str) -> str:
        """Create a safe filename from a cache key.
        
        Args:
            key: Cache key
            
        Returns:
            Safe filename string
        """
        import hashlib
        return hashlib.md5(key.encode()).hexdigest()
    
    def clear_cache(self, older_than: Optional[int] = None) -> int:
        """Clear cache entries.
        
        Args:
            older_than: Clear entries older than this many seconds (None for all)
            
        Returns:
            Number of entries cleared
        """
        count = 0
        now = time.time()
        
        # Clear in-memory cache
        if older_than is not None:
            keys_to_remove = [
                k for k, v in self.cache.items()
                if now - v["timestamp"] > older_than
            ]
        else:
            keys_to_remove = list(self.cache.keys())
            
        for key in keys_to_remove:
            del self.cache[key]
            count += 1
            
        # Clear persistent cache if configured
        if self.cache_dir and os.path.exists(self.cache_dir):
            for filename in os.listdir(self.cache_dir):
                if not filename.endswith(".json"):
                    continue
                    
                file_path = os.path.join(self.cache_dir, filename)
                
                if older_than is not None:
                    try:
                        with open(file_path, 'r') as f:
                            entry = json.load(f)
                            if now - entry["timestamp"] > older_than:
                                os.remove(file_path)
                                count += 1
                    except Exception:
                        # If we can't read the file, remove it
                        os.remove(file_path)
                        count += 1
                else:
                    os.remove(file_path)
                    count += 1
                    
        return count
    
    def record_failure(self, url: str) -> bool:
        """Record a request failure and propagate to detector.
        
        Args:
            url: URL that failed
            
        Returns:
            True if load shedding is detected, False otherwise
        """
        return self.detector.record_failure(url)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current adaptation status.
        
        Returns:
            Dictionary with status information
        """
        # Get cache stats
        cache_count = len(self.cache)
        persistent_count = 0
        
        if self.cache_dir and os.path.exists(self.cache_dir):
            persistent_count = len([f for f in os.listdir(self.cache_dir) if f.endswith(".json")])
        
        return {
            "load_shedding_status": self.detector.get_status(),
            "adaptation_parameters": {
                "retry_multiplier": self.retry_multiplier,
                "backoff_multiplier": self.backoff_multiplier,
                "timeout_multiplier": self.timeout_multiplier
            },
            "cache_stats": {
                "in_memory_entries": cache_count,
                "persistent_entries": persistent_count,
                "cache_enabled": True,
                "persistent_cache_enabled": bool(self.cache_dir)
            },
            "example_adaptation": self.get_adapted_parameters()
        }