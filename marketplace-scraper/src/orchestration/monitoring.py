"""
Monitoring tools for marketplace data collection.

This module provides monitoring and observability tools for marketplace data collection,
including logging, metrics, and alerting integrations with Google Cloud services.
"""

import json
import logging
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

try:
    from google.cloud import monitoring_v3
except ImportError:
    # Mock class for development without Google Cloud
    class monitoring_v3:
        class MetricServiceClient:
            def __init__(self):
                pass


class ScraperMonitoring:
    """Monitoring tools for marketplace scrapers.
    
    This class provides tools for monitoring scraper performance, health,
    and alerting for issues like load shedding detection, all optimized for
    South African market conditions.
    """
    
    def __init__(self, 
                 project_id: str,
                 metric_prefix: str = "marketplace_scraper"):
        """Initialize the monitoring tools.
        
        Args:
            project_id: Google Cloud project ID
            metric_prefix: Prefix for custom metrics
        """
        self.project_id = project_id
        self.metric_prefix = metric_prefix
        
        # Initialize metrics client
        try:
            self.metrics_client = monitoring_v3.MetricServiceClient()
            self.project_path = f"projects/{project_id}"
        except (ImportError, NameError):
            self.metrics_client = None
            self.project_path = None
            
        # Set up logging
        self.logger = logging.getLogger("scraper-monitoring")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        # Initialize metric tracking
        self.metrics = {
            "requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "products_scraped": 0,
            "products_saved": 0,
            "search_queries": 0,
            "api_quota_used": 0,
            "api_quota_percent": 0,
            "task_count": 0,
            "task_success": 0,
            "task_failure": 0,
            "load_shedding_detected": 0
        }
        
        self.last_upload_time = datetime.now()
        self.upload_interval = timedelta(minutes=5)
        
        # Performance tracking
        self.response_times = []
        self.extraction_times = []
        self.storage_times = []
        
    def track_request(self, 
                    marketplace: str, 
                    success: bool, 
                    response_time: float) -> None:
        """Track a web request.
        
        Args:
            marketplace: Marketplace name
            success: Whether the request was successful
            response_time: Response time in seconds
        """
        self.metrics["requests"] += 1
        
        if success:
            self.metrics["successful_requests"] += 1
        else:
            self.metrics["failed_requests"] += 1
            
        self.response_times.append(response_time)
        
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_product_scraped(self, 
                            marketplace: str, 
                            product_id: str,
                            extraction_time: float) -> None:
        """Track a product being scraped.
        
        Args:
            marketplace: Marketplace name
            product_id: Product ID
            extraction_time: Extraction time in seconds
        """
        self.metrics["products_scraped"] += 1
        self.extraction_times.append(extraction_time)
        
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_product_saved(self, 
                          marketplace: str, 
                          product_id: str,
                          storage_time: float) -> None:
        """Track a product being saved to storage.
        
        Args:
            marketplace: Marketplace name
            product_id: Product ID
            storage_time: Storage operation time in seconds
        """
        self.metrics["products_saved"] += 1
        self.storage_times.append(storage_time)
        
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_search_query(self, 
                         marketplace: str, 
                         keyword: str) -> None:
        """Track a search query.
        
        Args:
            marketplace: Marketplace name
            keyword: Search keyword
        """
        self.metrics["search_queries"] += 1
        
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_api_quota(self, 
                      usage: int, 
                      limit: int) -> None:
        """Track API quota usage.
        
        Args:
            usage: Current usage count
            limit: Total quota limit
        """
        self.metrics["api_quota_used"] = usage
        self.metrics["api_quota_percent"] = (usage / limit) * 100 if limit > 0 else 0
        
        # Alert on high quota usage
        if self.metrics["api_quota_percent"] > 80:
            self.logger.warning(f"API quota usage high: {self.metrics['api_quota_percent']:.2f}%")
            
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_task(self, 
                 task_type: str, 
                 marketplace: str, 
                 success: bool) -> None:
        """Track a task execution.
        
        Args:
            task_type: Type of task
            marketplace: Marketplace name
            success: Whether the task was successful
        """
        self.metrics["task_count"] += 1
        
        if success:
            self.metrics["task_success"] += 1
        else:
            self.metrics["task_failure"] += 1
            
        # Check if we should upload metrics
        self._check_upload_metrics()
        
    def track_load_shedding(self, detected: bool) -> None:
        """Track load shedding detection.
        
        Args:
            detected: Whether load shedding was detected
        """
        if detected:
            self.metrics["load_shedding_detected"] += 1
            self.logger.warning("Load shedding detected")
            
        # Always upload metrics when load shedding is detected
        if detected:
            self._upload_metrics()
            
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics.
        
        Returns:
            Dictionary with performance statistics
        """
        stats = {}
        
        # Calculate response time stats
        if self.response_times:
            stats["response_time"] = {
                "avg": sum(self.response_times) / len(self.response_times),
                "min": min(self.response_times),
                "max": max(self.response_times),
                "count": len(self.response_times)
            }
            
        # Calculate extraction time stats
        if self.extraction_times:
            stats["extraction_time"] = {
                "avg": sum(self.extraction_times) / len(self.extraction_times),
                "min": min(self.extraction_times),
                "max": max(self.extraction_times),
                "count": len(self.extraction_times)
            }
            
        # Calculate storage time stats
        if self.storage_times:
            stats["storage_time"] = {
                "avg": sum(self.storage_times) / len(self.storage_times),
                "min": min(self.storage_times),
                "max": max(self.storage_times),
                "count": len(self.storage_times)
            }
            
        # Add other metrics
        stats["metrics"] = self.metrics.copy()
        
        return stats
        
    def _check_upload_metrics(self) -> None:
        """Check if we should upload metrics."""
        now = datetime.now()
        if now - self.last_upload_time > self.upload_interval:
            self._upload_metrics()
            
    def _upload_metrics(self) -> None:
        """Upload metrics to Google Cloud Monitoring."""
        if not self.metrics_client:
            self.logger.info("Metrics client not available, skipping upload")
            return
            
        try:
            self.logger.info("Uploading metrics to Google Cloud Monitoring")
            
            # In a real implementation, this would upload custom metrics to Cloud Monitoring
            # For now, we just log the metrics
            self.logger.info(f"Metrics: {json.dumps(self.metrics)}")
            
            # Get performance stats
            perf_stats = self.get_performance_stats()
            self.logger.info(f"Performance stats: {json.dumps(perf_stats)}")
            
            # Reset counters for next interval
            self.response_times = []
            self.extraction_times = []
            self.storage_times = []
            
            # Update last upload time
            self.last_upload_time = datetime.now()
            
        except Exception as e:
            self.logger.error(f"Error uploading metrics: {str(e)}")
            
    def create_dashboard(self) -> None:
        """Create a Cloud Monitoring dashboard for the scraper."""
        if not self.metrics_client:
            self.logger.info("Metrics client not available, cannot create dashboard")
            return
            
        try:
            self.logger.info("Creating dashboard would be implemented here")
            # In a real implementation, this would create a Cloud Monitoring dashboard
            
        except Exception as e:
            self.logger.error(f"Error creating dashboard: {str(e)}")
            
    def setup_alerts(self) -> None:
        """Set up alerting policies for the scraper."""
        if not self.metrics_client:
            self.logger.info("Metrics client not available, cannot set up alerts")
            return
            
        try:
            self.logger.info("Setting up alerts would be implemented here")
            # In a real implementation, this would set up alerting policies:
            # - High API quota usage (>80%)
            # - High failure rate (>20%)
            # - Load shedding detection
            # - Inactive scraper (no requests for >1 hour)
            
        except Exception as e:
            self.logger.error(f"Error setting up alerts: {str(e)}")