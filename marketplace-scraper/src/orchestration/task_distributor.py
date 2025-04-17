"""
Task distributor for marketplace data collection.

This module provides a Pub/Sub-based task distributor for marketplace data collection,
allowing distributed execution of scraping tasks.
"""

import json
import logging
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

try:
    from google.cloud import pubsub_v1
except ImportError:
    # Mock classes for development without GCP
    class pubsub_v1:
        class PublisherClient:
            def __init__(self):
                pass
                
            def topic_path(self, project_id, topic_id):
                return f"projects/{project_id}/topics/{topic_id}"
                
            def publish(self, topic_path, data):
                return "mock-message-id"


class TaskDistributor:
    """Pub/Sub-based task distributor for marketplace data collection.
    
    This class publishes scraping tasks to Pub/Sub topics for distributed execution,
    with optimizations for South African market conditions.
    """
    
    def __init__(self, 
                 project_id: str,
                 task_topic: str = "marketplace-scraper-tasks"):
        """Initialize the task distributor.
        
        Args:
            project_id: Google Cloud project ID
            task_topic: Pub/Sub topic name for tasks
        """
        self.project_id = project_id
        self.task_topic = task_topic
        
        # Initialize Pub/Sub publisher client
        self.publisher = pubsub_v1.PublisherClient()
        self.topic_path = self.publisher.topic_path(project_id, task_topic)
        
        # Set up logging
        self.logger = logging.getLogger("task-distributor")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        # Stats
        self.tasks_published = 0
        
    def publish_task(self, 
                   task_type: str, 
                   marketplace: str, 
                   params: Dict[str, Any],
                   priority: int = 1) -> str:
        """Publish a task to Pub/Sub.
        
        Args:
            task_type: Type of task
            marketplace: Marketplace name
            params: Task parameters
            priority: Task priority (1-10, higher is more important)
            
        Returns:
            Message ID
        """
        # Create task message
        task = {
            "type": task_type,
            "marketplace": marketplace,
            "params": params,
            "priority": priority,
            "published_at": datetime.now().isoformat()
        }
        
        # Convert to JSON and encode
        message_data = json.dumps(task).encode("utf-8")
        
        # Publish to Pub/Sub
        message_id = self.publisher.publish(
            self.topic_path,
            message_data,
            task_type=task_type,
            marketplace=marketplace,
            priority=str(priority)
        ).result()
        
        self.tasks_published += 1
        self.logger.info(f"Published task {task_type} for {marketplace} (ID: {message_id})")
        
        return message_id
        
    def publish_product_discovery_task(self, 
                                     marketplace: str, 
                                     category: Optional[str] = None, 
                                     page: int = 1, 
                                     limit: int = 50,
                                     priority: int = 1) -> str:
        """Publish a product discovery task.
        
        Args:
            marketplace: Marketplace name
            category: Category path or ID (optional)
            page: Page number
            limit: Maximum products to discover
            priority: Task priority
            
        Returns:
            Message ID
        """
        params = {
            "category": category,
            "page": page,
            "limit": limit
        }
        
        return self.publish_task(
            task_type="discover_products",
            marketplace=marketplace,
            params=params,
            priority=priority
        )
        
    def publish_product_extraction_task(self, 
                                      marketplace: str, 
                                      product_id_or_url: str,
                                      priority: int = 1) -> str:
        """Publish a product extraction task.
        
        Args:
            marketplace: Marketplace name
            product_id_or_url: Product ID or URL
            priority: Task priority
            
        Returns:
            Message ID
        """
        params = {}
        
        # Determine if it's an ID or URL
        if product_id_or_url.startswith("http"):
            params["url"] = product_id_or_url
        else:
            params["product_id"] = product_id_or_url
        
        return self.publish_task(
            task_type="extract_product",
            marketplace=marketplace,
            params=params,
            priority=priority
        )
        
    def publish_search_task(self, 
                          marketplace: str, 
                          keyword: str, 
                          page: int = 1, 
                          limit: int = 50,
                          priority: int = 1) -> str:
        """Publish a search task.
        
        Args:
            marketplace: Marketplace name
            keyword: Search keyword
            page: Page number
            limit: Maximum results to return
            priority: Task priority
            
        Returns:
            Message ID
        """
        params = {
            "keyword": keyword,
            "page": page,
            "limit": limit
        }
        
        return self.publish_task(
            task_type="search",
            marketplace=marketplace,
            params=params,
            priority=priority
        )
        
    def publish_category_extraction_task(self, 
                                       marketplace: str, 
                                       category_id_or_url: str,
                                       priority: int = 1) -> str:
        """Publish a category extraction task.
        
        Args:
            marketplace: Marketplace name
            category_id_or_url: Category ID or URL
            priority: Task priority
            
        Returns:
            Message ID
        """
        params = {}
        
        # Determine if it's an ID or URL
        if category_id_or_url.startswith("http"):
            params["url"] = category_id_or_url
        else:
            params["category_id"] = category_id_or_url
        
        return self.publish_task(
            task_type="extract_category",
            marketplace=marketplace,
            params=params,
            priority=priority
        )
        
    def publish_suggestions_task(self, 
                               marketplace: str, 
                               prefix: str,
                               priority: int = 1) -> str:
        """Publish a search suggestions task.
        
        Args:
            marketplace: Marketplace name
            prefix: Search prefix
            priority: Task priority
            
        Returns:
            Message ID
        """
        params = {
            "prefix": prefix
        }
        
        return self.publish_task(
            task_type="extract_suggestions",
            marketplace=marketplace,
            params=params,
            priority=priority
        )
        
    def publish_daily_deals_task(self, 
                               marketplace: str,
                               priority: int = 2) -> str:
        """Publish a daily deals extraction task.
        
        Args:
            marketplace: Marketplace name
            priority: Task priority
            
        Returns:
            Message ID
        """
        return self.publish_task(
            task_type="extract_daily_deals",
            marketplace=marketplace,
            params={},
            priority=priority
        )