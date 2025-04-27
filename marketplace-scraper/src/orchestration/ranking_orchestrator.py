"""
Ranking orchestrator for keyword research and competitor tracking.

This module provides a central orchestrator for keyword research, ranking tracking,
and competitor monitoring with credit system integration.
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Callable

# Local imports
from ..common import MarketplaceScraper
from ..common.alert_integration import AlertIntegration
from ..common.credit_integration import KeywordResearchCreditManager
from .task_scheduler import TaskScheduler

# Set up logging
logger = logging.getLogger(__name__)

class RankingOrchestrator:
    """
    Orchestrates keyword research and ranking tracking across marketplaces.
    
    This class integrates with the credit system and alert system to:
    1. Manage keyword research across multiple marketplaces
    2. Track keyword rankings over time
    3. Process competitor alerts based on ranking changes
    4. Optimize credit usage with caching and priority scheduling
    """
    
    def __init__(self, 
                task_scheduler: TaskScheduler, 
                credit_manager: Optional[KeywordResearchCreditManager] = None,
                alert_integration: Optional[AlertIntegration] = None):
        """
        Initialize the ranking orchestrator.
        
        Args:
            task_scheduler: Task scheduler for marketplace scraping
            credit_manager: Optional credit system manager
            alert_integration: Optional alert system integration
        """
        self.task_scheduler = task_scheduler
        self.credit_manager = credit_manager
        self.alert_integration = alert_integration
        
        # Task tracking
        self.research_tasks = {}  # Map of operation_id to task_ids
        self.keyword_cache = {}   # Simple in-memory cache
        self.cache_ttl = 7 * 24 * 60 * 60  # 7 days in seconds
        
    async def research_keywords(self, 
                              organization_id: str,
                              keywords: List[str],
                              marketplaces: List[str],
                              include_seo_metrics: bool = False,
                              max_pages_to_scan: int = 3,
                              priority: int = 5,
                              operation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Schedule keyword research across multiple marketplaces.
        
        Args:
            organization_id: Organization ID
            keywords: List of keywords to research
            marketplaces: List of marketplaces to search
            include_seo_metrics: Whether to include SEO metrics
            max_pages_to_scan: Maximum number of pages to scan
            priority: Task priority (1-10)
            operation_id: Optional operation ID for tracking
            
        Returns:
            Dictionary with operation details including task IDs
        """
        # Generate operation ID if not provided
        if not operation_id:
            operation_id = str(uuid.uuid4())
            
        # Generate a unique request ID for this batch
        request_id = f"req_{int(time.time())}_{organization_id}_{len(keywords)}"
        
        # Reserve credits if credit manager is available
        reservation_id = None
        estimated_cost = 0
        
        if self.credit_manager:
            try:
                logger.info(f"Reserving credits for keyword research: {len(keywords)} keywords across {len(marketplaces)} marketplaces")
                reservation = self.credit_manager.reserve_research_credits(
                    organization_id=organization_id,
                    operation_type="basic_research",
                    operation_id=operation_id,
                    marketplaces=marketplaces,
                    keywords=keywords,
                    include_seo_metrics=include_seo_metrics,
                    max_pages_to_scan=max_pages_to_scan,
                    additional_metadata={
                        "request_id": request_id,
                        "priority": priority,
                        "requested_at": datetime.now().isoformat()
                    }
                )
                
                if reservation and reservation.get("hasCredits", False):
                    reservation_id = reservation.get("reservationId")
                    estimated_cost = reservation.get("estimatedCost", 0)
                    logger.info(f"Reserved credits for operation {operation_id}: {reservation_id}")
                else:
                    reason = reservation.get("reason", "Unknown reason") if reservation else "Credit reservation failed"
                    logger.warning(f"Failed to reserve credits: {reason}")
                    return {
                        "success": False,
                        "message": f"Failed to reserve credits: {reason}",
                        "operation_id": operation_id,
                        "request_id": request_id
                    }
            except Exception as e:
                logger.error(f"Error reserving credits: {str(e)}")
                # Continue without credit reservation
        
        # Check cache for existing results
        cached_results = []
        keywords_to_research = []
        
        for keyword in keywords:
            cache_key = self._get_cache_key(keyword, marketplaces)
            cached = self.keyword_cache.get(cache_key)
            
            if cached and time.time() - cached["timestamp"] < self.cache_ttl:
                logger.info(f"Using cached result for {keyword}")
                cached_results.append(cached["result"])
            else:
                keywords_to_research.append(keyword)
        
        # Schedule tasks for keywords that need research
        task_ids = []
        
        for keyword in keywords_to_research:
            for marketplace in marketplaces:
                # Prepare task parameters
                params = {
                    "keyword": keyword,
                    "max_pages": max_pages_to_scan,
                    "include_seo_metrics": include_seo_metrics,
                    "organization_id": organization_id,
                    "operation_id": operation_id,
                    "request_id": request_id
                }
                
                if reservation_id:
                    params["credit_reservation_id"] = reservation_id
                
                # Schedule task
                task_id = await self.task_scheduler.schedule_task(
                    task_type="track_keyword_ranking",
                    marketplace=marketplace,
                    params=params,
                    priority=priority
                )
                
                task_ids.append(task_id)
        
        # Store task IDs for tracking
        self.research_tasks[operation_id] = task_ids
        
        # Return operation details
        return {
            "success": True,
            "operation_id": operation_id,
            "request_id": request_id,
            "total_keywords": len(keywords),
            "cached_keywords": len(cached_results),
            "tasks_scheduled": len(task_ids),
            "task_ids": task_ids,
            "marketplaces": marketplaces,
            "estimated_cost": estimated_cost,
            "reservation_id": reservation_id
        }
        
    async def process_competitor_alerts(self,
                                      marketplace: str,
                                      keyword_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process competitor alerts based on keyword research results.
        
        Args:
            marketplace: Marketplace name
            keyword_result: Keyword research result
            
        Returns:
            Dictionary with alert processing results
        """
        if not self.alert_integration:
            logger.warning("Alert integration not available, skipping alert processing")
            return {
                "success": False,
                "message": "Alert integration not available"
            }
            
        try:
            # Extract key information from result
            keyword = keyword_result.get("keyword")
            rankings = keyword_result.get("rankings", [])
            
            if not keyword:
                return {
                    "success": False,
                    "message": "Invalid keyword result: keyword missing"
                }
                
            # Process alerts
            logger.info(f"Processing competitor alerts for {keyword} in {marketplace}")
            alert_result = await self.alert_integration.process_ranking_data(
                marketplace=marketplace,
                keyword=keyword,
                rankings=rankings
            )
            
            return {
                "success": True,
                "alerts_generated": alert_result.get("alerts_generated", 0),
                "alerts": alert_result.get("alerts", [])
            }
        except Exception as e:
            logger.error(f"Error processing competitor alerts: {str(e)}")
            return {
                "success": False,
                "message": f"Error processing alerts: {str(e)}"
            }
            
    async def handle_task_completion(self,
                                   task_id: str,
                                   task_type: str,
                                   params: Dict[str, Any],
                                   result: Optional[Dict[str, Any]],
                                   success: bool) -> None:
        """
        Handle task completion and update tracking.
        
        Args:
            task_id: Task ID
            task_type: Type of task
            params: Task parameters
            result: Task result
            success: Whether the task completed successfully
        """
        # Skip if result is None
        if not result:
            return
            
        # Extract operation information
        operation_id = params.get("operation_id")
        keyword = params.get("keyword")
        marketplace = result.get("marketplace")
        
        if not keyword or not marketplace:
            return
            
        # Update cache if result is successful
        if success and task_type == "track_keyword_ranking":
            cache_key = self._get_cache_key(keyword, [marketplace])
            self.keyword_cache[cache_key] = {
                "timestamp": time.time(),
                "result": result
            }
            
        # Check if this was the last task for the operation
        if operation_id and operation_id in self.research_tasks:
            task_ids = self.research_tasks[operation_id]
            task_ids.remove(task_id)
            
            if not task_ids:
                # All tasks completed, clean up
                del self.research_tasks[operation_id]
                
                # Record final credit usage
                if self.credit_manager:
                    reservation_id = params.get("credit_reservation_id")
                    organization_id = params.get("organization_id")
                    
                    if reservation_id and organization_id:
                        self.credit_manager.record_research_usage(
                            organization_id=organization_id,
                            operation_type="basic_research",
                            reservation_id=reservation_id,
                            success=True,
                            additional_metadata={
                                "operation_id": operation_id,
                                "completed_at": datetime.now().isoformat(),
                                "task_count": len(task_ids) + 1,
                                "keywords_processed": 1  # Would be accumulated in a real implementation
                            }
                        )
                        
    def _get_cache_key(self, keyword: str, marketplaces: List[str]) -> str:
        """
        Generate a cache key for a keyword and marketplaces.
        
        Args:
            keyword: Keyword
            marketplaces: List of marketplaces
            
        Returns:
            Cache key string
        """
        return f"{keyword.lower()}:{','.join(sorted(marketplaces))}"