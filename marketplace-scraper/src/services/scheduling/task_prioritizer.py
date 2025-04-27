"""
Task prioritization and scheduling logic for marketplace scraping.

This module optimizes task scheduling based on available quota and task priority,
ensuring that the most important data is collected within quota constraints.
"""

import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple, Union
import heapq
import math

from ...common.quota_manager import QuotaManager, QuotaPriority, QuotaDistributor


class TaskPrioritizer:
    """Task scheduling and prioritization for marketplace scraping.
    
    This class optimizes the scheduling of scraping tasks based on priority,
    available quota, and data freshness requirements, ensuring efficient use 
    of the available SmartProxy API quota.
    """
    
    def __init__(self, 
                 quota_distributor: QuotaDistributor,
                 config: Dict[str, Any]):
        """Initialize the task prioritizer.
        
        Args:
            quota_distributor: Quota distributor for checking/recording quota usage
            config: Configuration dictionary with scheduling parameters
        """
        self.quota_distributor = quota_distributor
        self.config = config
        self.logger = logging.getLogger("task-prioritizer")
        
        # Task tracking
        self._last_execution = {}  # task_id -> last execution timestamp
        self._execution_count = {}  # task_id -> count
        self._priority_override = {}  # task_id -> priority override
        self._frequency_override = {}  # task_id -> frequency override (hours)
        
        # Set up logging
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    def is_task_due(self, 
                   task_id: str, 
                   task_type: str,
                   category: str = "default",
                   importance: str = "normal") -> bool:
        """Check if a task is due for execution.
        
        Args:
            task_id: Unique task identifier
            task_type: Type of task (e.g., "keyword_ranking", "product_details")
            category: Task category (e.g., "high_demand", "price_sensitive")
            importance: Task importance ("high", "normal", "low")
            
        Returns:
            True if the task is due for execution, False otherwise
        """
        # Get last execution time
        last_execution = self._last_execution.get(task_id)
        
        # If never executed, it's due
        if last_execution is None:
            return True
        
        # Get the appropriate refresh frequency
        frequency_hours = self._get_refresh_frequency(task_type, category, importance)
        
        # Check if a frequency override exists for this task
        if task_id in self._frequency_override:
            frequency_hours = self._frequency_override[task_id]
            
        # Check if the frequency interval has passed since last execution
        now = datetime.now()
        time_since_last = (now - last_execution).total_seconds() / 3600  # hours
        
        return time_since_last >= frequency_hours
    
    def record_execution(self, task_id: str, task_type: str) -> None:
        """Record the execution of a task.
        
        Args:
            task_id: Unique task identifier
            task_type: Type of task
        """
        self._last_execution[task_id] = datetime.now()
        self._execution_count[task_id] = self._execution_count.get(task_id, 0) + 1
        
        # Record quota usage based on task type
        self.quota_distributor.record_usage(task_type)
        
        self.logger.debug(f"Recorded execution of {task_id} (type: {task_type})")
    
    def is_quota_available(self, task_type: str) -> bool:
        """Check if quota is available for a task type.
        
        Args:
            task_type: Type of task
            
        Returns:
            True if quota is available, False otherwise
        """
        return self.quota_distributor.check_quota(task_type)
    
    def prioritize_tasks(self, 
                        tasks: List[Dict[str, Any]],
                        limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Prioritize tasks for execution.
        
        Args:
            tasks: List of tasks to prioritize
            limit: Maximum number of tasks to return
            
        Returns:
            List of prioritized tasks
        """
        # Calculate priority score for each task
        task_scores = []
        for task in tasks:
            task_id = task.get("id")
            task_type = task.get("type")
            category = task.get("category", "default")
            importance = task.get("importance", "normal")
            
            # Skip if quota not available for this task type
            if not self.is_quota_available(task_type):
                continue
                
            # Get base task priority (higher values = higher priority)
            base_priority = self._get_base_priority(task_type, category, importance)
            
            # Apply priority override if exists
            priority_override = self._priority_override.get(task_id)
            if priority_override is not None:
                base_priority = priority_override
            
            # Calculate recency factor (time since last execution)
            last_execution = self._last_execution.get(task_id)
            if last_execution:
                hours_since_last = (datetime.now() - last_execution).total_seconds() / 3600
                frequency_hours = self._get_refresh_frequency(task_type, category, importance)
                
                # Apply frequency override if exists
                if task_id in self._frequency_override:
                    frequency_hours = self._frequency_override[task_id]
                
                # Calculate recency factor (0.0-2.0)
                # 0.0 means just run, 1.0 means exactly at refresh interval, 2.0 means way overdue
                recency_factor = min(2.0, hours_since_last / frequency_hours)
            else:
                # Never run before, maximum priority
                recency_factor = 2.0
                
            # Calculate execution count factor (0.9-1.1)
            # Slightly favor tasks that have been run less often
            execution_count = self._execution_count.get(task_id, 0)
            count_factor = 1.1 - min(0.2, execution_count / 100)
            
            # Calculate final priority score
            # Higher scores = higher priority
            priority_score = base_priority * recency_factor * count_factor
            
            # Add to priority queue (negative for max-heap behavior)
            heapq.heappush(task_scores, (-priority_score, task))
            
        # Extract prioritized tasks
        prioritized_tasks = []
        remaining = limit or len(task_scores)
        
        while task_scores and remaining > 0:
            _, task = heapq.heappop(task_scores)
            prioritized_tasks.append(task)
            remaining -= 1
            
        return prioritized_tasks
    
    def set_priority_override(self, task_id: str, priority: float) -> None:
        """Set a priority override for a specific task.
        
        Args:
            task_id: Unique task identifier
            priority: Priority value (higher = higher priority)
        """
        self._priority_override[task_id] = priority
        self.logger.info(f"Set priority override for {task_id}: {priority}")
    
    def set_frequency_override(self, task_id: str, hours: float) -> None:
        """Set a frequency override for a specific task.
        
        Args:
            task_id: Unique task identifier
            hours: Frequency in hours
        """
        self._frequency_override[task_id] = hours
        self.logger.info(f"Set frequency override for {task_id}: {hours} hours")
    
    def clear_overrides(self, task_id: str) -> None:
        """Clear all overrides for a specific task.
        
        Args:
            task_id: Unique task identifier
        """
        self._priority_override.pop(task_id, None)
        self._frequency_override.pop(task_id, None)
        self.logger.info(f"Cleared overrides for {task_id}")
    
    def get_task_statistics(self) -> Dict[str, Any]:
        """Get statistics about scheduled tasks.
        
        Returns:
            Dictionary with task statistics
        """
        total_tasks = len(self._last_execution)
        executed_in_last_24h = sum(
            1 for ts in self._last_execution.values()
            if (datetime.now() - ts).total_seconds() < 86400
        )
        
        # Calculate average execution interval
        execution_intervals = {}
        for task_id, last_time in self._last_execution.items():
            execution_count = self._execution_count.get(task_id, 1)
            if execution_count > 1:
                # Estimate average interval based on count and last execution
                first_execution = last_time - timedelta(hours=24 * 30)  # assume 30 days
                interval_hours = (last_time - first_execution).total_seconds() / 3600 / (execution_count - 1)
                execution_intervals[task_id] = interval_hours
        
        avg_interval = (
            sum(execution_intervals.values()) / len(execution_intervals)
            if execution_intervals else 0
        )
        
        return {
            "total_tracked_tasks": total_tasks,
            "executed_last_24h": executed_in_last_24h,
            "average_execution_interval_hours": avg_interval,
            "execution_counts": {
                "min": min(self._execution_count.values()) if self._execution_count else 0,
                "max": max(self._execution_count.values()) if self._execution_count else 0,
                "avg": (
                    sum(self._execution_count.values()) / len(self._execution_count)
                    if self._execution_count else 0
                )
            },
            "priority_overrides": len(self._priority_override),
            "frequency_overrides": len(self._frequency_override),
            "overdue_tasks": sum(
                1 for task_id in self._last_execution
                if self._is_overdue(task_id)
            )
        }
    
    def _get_refresh_frequency(self, 
                              task_type: str, 
                              category: str = "default",
                              importance: str = "normal") -> float:
        """Get the refresh frequency for a task type.
        
        Args:
            task_type: Type of task (e.g., "keyword_ranking", "product_details")
            category: Task category (e.g., "high_demand", "price_sensitive")
            importance: Task importance ("high", "normal", "low")
            
        Returns:
            Refresh frequency in hours
        """
        # Handle task type specific frequencies from config
        task_config = self.config.get("task_scheduling", {}).get(task_type, {})
        
        # Special cases based on task type and category
        if task_type == "keyword_ranking":
            if importance == "high":
                return task_config.get("high_value_frequency_hours", 12)
            else:
                return task_config.get("tracking_frequency_hours", 24)
                
        elif task_type == "product_details":
            if category == "high_demand":
                return task_config.get("high_demand_frequency_hours", 12)
            elif category == "price_watch":
                return task_config.get("price_watch_frequency_hours", 6)
            else:
                return task_config.get("refresh_frequency_hours", 48)
                
        elif task_type == "daily_deals":
            return task_config.get("refresh_frequency_hours", 4)
            
        elif task_type == "category_scanning":
            return task_config.get("refresh_frequency_hours", 72)
            
        elif task_type == "opportunity_scoring":
            return task_config.get("recalculation_frequency_hours", 48)
            
        # Default based on importance
        if importance == "high":
            return 12
        elif importance == "low":
            return 72
        else:  # normal
            return 24
    
    def _get_base_priority(self, 
                          task_type: str, 
                          category: str = "default",
                          importance: str = "normal") -> float:
        """Get the base priority for a task type.
        
        Args:
            task_type: Type of task
            category: Task category
            importance: Task importance
            
        Returns:
            Base priority value (higher = higher priority)
        """
        # Base priority by task type (1-10)
        base_by_type = {
            "keyword_ranking": 7,
            "product_details": 8,
            "daily_deals": 9,
            "category_scanning": 5,
            "opportunity_scoring": 7,
            "price_updates": 9,
            "search_suggestions": 4,
            "discovery": 3
        }
        
        # Get base priority, default to 5
        base = base_by_type.get(task_type, 5)
        
        # Adjust by importance
        if importance == "high":
            base += 2
        elif importance == "low":
            base -= 2
            
        # Adjust by category
        if category == "high_demand":
            base += 1
        elif category == "price_watch":
            base += 1
        elif category == "clearance":
            base -= 1
            
        # Ensure within bounds
        return max(1, min(10, base))
    
    def _is_overdue(self, task_id: str) -> bool:
        """Check if a task is significantly overdue.
        
        Args:
            task_id: Unique task identifier
            
        Returns:
            True if task is significantly overdue, False otherwise
        """
        last_execution = self._last_execution.get(task_id)
        if not last_execution:
            return False
            
        # Get estimated task type and properties from task_id
        parts = task_id.split("_")
        if len(parts) >= 2:
            task_type = parts[0]
            
            # Get refresh frequency
            frequency_hours = self._get_refresh_frequency(task_type)
            
            # Apply frequency override if exists
            if task_id in self._frequency_override:
                frequency_hours = self._frequency_override[task_id]
                
            # Check if the task is overdue by 2x its normal frequency
            hours_since_last = (datetime.now() - last_execution).total_seconds() / 3600
            return hours_since_last >= (frequency_hours * 2)
            
        return False


class QuotaEfficiencyOptimizer:
    """Optimizes quota usage efficiency for marketplace scraping.
    
    This class provides tools for maximizing the data collected per API request,
    ensuring efficient use of the SmartProxy quota.
    """
    
    def __init__(self, quota_manager: QuotaManager):
        """Initialize the quota efficiency optimizer.
        
        Args:
            quota_manager: Quota manager instance
        """
        self.quota_manager = quota_manager
        self.logger = logging.getLogger("quota-optimizer")
        
        # Tracking metrics
        self.data_points_collected = 0
        self.requests_used = 0
        self.efficiency_by_marketplace = {}  # marketplace -> efficiency score
        self.efficiency_by_task_type = {}  # task_type -> efficiency score
        
        # Set up logging
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    def record_data_collection(self, 
                              marketplace: str, 
                              task_type: str,
                              requests_used: int, 
                              data_points: int) -> float:
        """Record data collection efficiency.
        
        Args:
            marketplace: Marketplace name
            task_type: Type of task
            requests_used: Number of API requests used
            data_points: Number of data points collected
            
        Returns:
            Efficiency score (data points per request)
        """
        # Skip if no requests were used
        if requests_used <= 0:
            return 0.0
            
        # Calculate efficiency
        efficiency = data_points / requests_used
        
        # Update tracking metrics
        self.data_points_collected += data_points
        self.requests_used += requests_used
        
        # Update marketplace efficiency
        if marketplace not in self.efficiency_by_marketplace:
            self.efficiency_by_marketplace[marketplace] = {
                "data_points": 0,
                "requests": 0
            }
            
        self.efficiency_by_marketplace[marketplace]["data_points"] += data_points
        self.efficiency_by_marketplace[marketplace]["requests"] += requests_used
        
        # Update task type efficiency
        if task_type not in self.efficiency_by_task_type:
            self.efficiency_by_task_type[task_type] = {
                "data_points": 0,
                "requests": 0
            }
            
        self.efficiency_by_task_type[task_type]["data_points"] += data_points
        self.efficiency_by_task_type[task_type]["requests"] += requests_used
        
        self.logger.debug(
            f"Recorded efficiency for {marketplace} {task_type}: "
            f"{efficiency:.2f} data points per request "
            f"({data_points} points / {requests_used} requests)"
        )
        
        return efficiency
    
    def get_efficiency_score(self) -> float:
        """Get the overall efficiency score.
        
        Returns:
            Overall efficiency score (data points per request)
        """
        if self.requests_used <= 0:
            return 0.0
            
        return self.data_points_collected / self.requests_used
    
    def get_efficiency_by_marketplace(self) -> Dict[str, float]:
        """Get efficiency scores by marketplace.
        
        Returns:
            Dictionary mapping marketplace to efficiency score
        """
        result = {}
        
        for marketplace, data in self.efficiency_by_marketplace.items():
            if data["requests"] > 0:
                result[marketplace] = data["data_points"] / data["requests"]
            else:
                result[marketplace] = 0.0
                
        return result
    
    def get_efficiency_by_task_type(self) -> Dict[str, float]:
        """Get efficiency scores by task type.
        
        Returns:
            Dictionary mapping task type to efficiency score
        """
        result = {}
        
        for task_type, data in self.efficiency_by_task_type.items():
            if data["requests"] > 0:
                result[task_type] = data["data_points"] / data["requests"]
            else:
                result[task_type] = 0.0
                
        return result
    
    def get_recommendations(self) -> List[Dict[str, Any]]:
        """Get recommendations for improving quota efficiency.
        
        Returns:
            List of recommendation objects
        """
        recommendations = []
        
        # Calculate average efficiency
        avg_efficiency = self.get_efficiency_score()
        if avg_efficiency <= 0:
            return []
            
        # Check marketplace efficiency
        marketplace_efficiency = self.get_efficiency_by_marketplace()
        for marketplace, efficiency in marketplace_efficiency.items():
            # If efficiency is significantly below average
            if efficiency < (avg_efficiency * 0.7) and self.efficiency_by_marketplace[marketplace]["requests"] > 10:
                recommendations.append({
                    "type": "marketplace_efficiency",
                    "marketplace": marketplace,
                    "efficiency": efficiency,
                    "avg_efficiency": avg_efficiency,
                    "recommendation": f"Optimize {marketplace} scraping for better data efficiency",
                    "impact": "medium"
                })
                
        # Check task type efficiency
        task_type_efficiency = self.get_efficiency_by_task_type()
        for task_type, efficiency in task_type_efficiency.items():
            # If efficiency is significantly below average
            if efficiency < (avg_efficiency * 0.7) and self.efficiency_by_task_type[task_type]["requests"] > 10:
                recommendations.append({
                    "type": "task_type_efficiency",
                    "task_type": task_type,
                    "efficiency": efficiency,
                    "avg_efficiency": avg_efficiency,
                    "recommendation": f"Optimize {task_type} tasks for better data efficiency",
                    "impact": "medium"
                })
                
        # Check overall quota usage from quota manager
        quota_status = self.quota_manager.get_status()
        monthly_usage_pct = quota_status.get("monthly_quota", {}).get("usage_percentage", 0)
        daily_usage_pct = quota_status.get("daily_quota", {}).get("usage_percentage", 0)
        
        # If we're using quota too quickly
        if monthly_usage_pct > 60 and daily_usage_pct > 90:
            recommendations.append({
                "type": "quota_usage",
                "monthly_usage": monthly_usage_pct,
                "daily_usage": daily_usage_pct,
                "recommendation": "Daily quota usage is high, consider reducing task frequency",
                "impact": "high"
            })
            
        return recommendations