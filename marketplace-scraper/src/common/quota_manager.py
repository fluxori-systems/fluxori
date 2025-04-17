"""
Quota management system for SmartProxy API usage.

This module provides a comprehensive system for tracking, distributing, and
optimizing usage of the SmartProxy API quota, preventing overages while
ensuring critical scraping operations can be completed.
"""

import time
import logging
import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Tuple
from enum import Enum, auto


class QuotaExceededError(Exception):
    """Exception raised when the SmartProxy API quota has been exceeded."""
    pass


class QuotaPriority(Enum):
    """Priority levels for quota usage."""
    CRITICAL = auto()  # Must-have operations (e.g., monitoring competitor prices)
    HIGH = auto()      # Important operations (e.g., product detail updates)
    MEDIUM = auto()    # Standard operations (e.g., category browsing)
    LOW = auto()       # Nice-to-have operations (e.g., additional search results)
    BACKGROUND = auto() # Background/maintenance operations


class QuotaManager:
    """Manager for SmartProxy API quota.
    
    This class provides comprehensive quota management for the SmartProxy API,
    including:
    
    - Daily and monthly quota tracking and limiting
    - Quota distribution across task types
    - Priority-based quota allocation
    - Circuit breaker pattern for emergency quota protection
    - Persistent storage of quota usage
    - Predictive quota modeling
    """
    
    def __init__(self, 
                monthly_quota: int = 82000,
                daily_quota: int = 2700,  # ~82k/30 days
                emergency_threshold: float = 0.95,
                warning_threshold: float = 0.80,
                persist_path: Optional[str] = None,
                circuit_breaker_enabled: bool = True):
        """Initialize the quota manager.
        
        Args:
            monthly_quota: Monthly request quota limit
            daily_quota: Daily request quota limit
            emergency_threshold: Emergency threshold percentage (0.0-1.0)
            warning_threshold: Warning threshold percentage (0.0-1.0)
            persist_path: Path to persist quota data (optional)
            circuit_breaker_enabled: Whether to enable circuit breaker
        """
        self.monthly_quota = monthly_quota
        self.daily_quota = daily_quota
        self.emergency_threshold = emergency_threshold
        self.warning_threshold = warning_threshold
        self.persist_path = persist_path
        self.circuit_breaker_enabled = circuit_breaker_enabled
        
        # Usage tracking
        self.request_count = 0
        self.daily_request_count = 0
        
        # Time tracking
        self.current_month = datetime.now().month
        self.current_day = datetime.now().day
        self.last_reset_time = datetime.now()
        
        # Priority allocation (percentage of quota for each priority)
        self.priority_allocation = {
            QuotaPriority.CRITICAL: 0.40,  # 40% of quota for critical tasks
            QuotaPriority.HIGH: 0.30,      # 30% of quota for high-priority tasks
            QuotaPriority.MEDIUM: 0.20,    # 20% of quota for medium-priority tasks
            QuotaPriority.LOW: 0.05,       # 5% of quota for low-priority tasks
            QuotaPriority.BACKGROUND: 0.05 # 5% of quota for background tasks
        }
        
        # Priority usage tracking
        self.priority_usage = {
            QuotaPriority.CRITICAL: 0,
            QuotaPriority.HIGH: 0,
            QuotaPriority.MEDIUM: 0,
            QuotaPriority.LOW: 0,
            QuotaPriority.BACKGROUND: 0
        }
        
        # Category allocation and tracking
        self.category_allocation = {}  # category -> percentage
        self.category_usage = {}       # category -> count
        
        # Circuit breaker
        self.circuit_breaker_tripped = False
        self.circuit_breaker_trip_time = None
        self.circuit_breaker_reset_duration = 3 * 3600  # 3 hours in seconds
        
        # Setup logging
        self.logger = logging.getLogger("quota-manager")
        self._setup_logging()
        
        # Load persistent data if available
        if self.persist_path and os.path.exists(self.persist_path):
            self._load_state()
    
    def _setup_logging(self):
        """Set up structured logging for the quota manager."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def _load_state(self) -> None:
        """Load quota state from persistent storage."""
        try:
            with open(self.persist_path, 'r') as f:
                data = json.load(f)
                
            # Validate data structure
            if not all(key in data for key in ["request_count", "daily_request_count", 
                                              "current_month", "current_day"]):
                self.logger.warning("Invalid quota state file, using defaults")
                return
                
            # Only load data if it's from the current month
            if data["current_month"] == datetime.now().month:
                self.request_count = data["request_count"]
                
                # Only load daily data if it's from the current day
                if data["current_day"] == datetime.now().day:
                    self.daily_request_count = data["daily_request_count"]
                
                # Load priority usage if available
                if "priority_usage" in data:
                    for priority_name, count in data["priority_usage"].items():
                        try:
                            priority = QuotaPriority[priority_name]
                            self.priority_usage[priority] = count
                        except KeyError:
                            pass
                
                # Load category usage if available
                if "category_usage" in data:
                    self.category_usage = data["category_usage"]
                    
                self.logger.info(f"Loaded quota state: {self.request_count}/{self.monthly_quota} monthly, {self.daily_request_count}/{self.daily_quota} daily")
            else:
                self.logger.info("Quota state from different month, using fresh counters")
                
        except Exception as e:
            self.logger.error(f"Error loading quota state: {str(e)}")
    
    def _save_state(self) -> None:
        """Save quota state to persistent storage."""
        if not self.persist_path:
            return
            
        try:
            # Convert priority usage enum keys to strings
            priority_usage_str = {
                priority.name: count
                for priority, count in self.priority_usage.items()
            }
            
            data = {
                "request_count": self.request_count,
                "daily_request_count": self.daily_request_count,
                "current_month": self.current_month,
                "current_day": self.current_day,
                "priority_usage": priority_usage_str,
                "category_usage": self.category_usage,
                "last_updated": datetime.now().isoformat()
            }
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)
            
            with open(self.persist_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Error saving quota state: {str(e)}")
    
    def reset_if_needed(self) -> None:
        """Reset quota counters if month or day has changed."""
        current_month = datetime.now().month
        current_day = datetime.now().day
        
        if current_month != self.current_month:
            self.logger.info(f"New month detected, resetting monthly quota counter. Previous: {self.current_month}, Current: {current_month}")
            self.request_count = 0
            self.current_month = current_month
            
            # Reset priority usage
            for priority in self.priority_usage:
                self.priority_usage[priority] = 0
                
            # Reset category usage
            self.category_usage = {}
            
            # Reset the circuit breaker if it was tripped
            if self.circuit_breaker_tripped:
                self.circuit_breaker_tripped = False
                self.logger.info("Circuit breaker reset due to new month")
        
        if current_day != self.current_day:
            self.logger.info(f"New day detected, resetting daily quota counter. Previous: {self.current_day}, Current: {current_day}")
            self.daily_request_count = 0
            self.current_day = current_day
            
        # Save state after any resets
        if current_month != self.current_month or current_day != self.current_day:
            self._save_state()
    
    def check_quota(self, 
                   priority: QuotaPriority = QuotaPriority.MEDIUM, 
                   category: Optional[str] = None) -> bool:
        """Check if a request is allowed within quota limits.
        
        Args:
            priority: Priority level of the request
            category: Optional category for the request
            
        Returns:
            True if request is allowed, False if quota exceeded
        """
        self.reset_if_needed()
        
        # If circuit breaker is tripped, reject all non-critical requests
        if self.circuit_breaker_enabled and self.circuit_breaker_tripped:
            if priority != QuotaPriority.CRITICAL:
                trip_duration = time.time() - self.circuit_breaker_trip_time
                # Reset after configured duration
                if trip_duration > self.circuit_breaker_reset_duration:
                    self.logger.warning(f"Circuit breaker reset after {trip_duration/3600:.1f} hours")
                    self.circuit_breaker_tripped = False
                else:
                    self.logger.warning(
                        f"Circuit breaker is tripped ({trip_duration/60:.1f} minutes), "
                        f"rejecting {priority.name} request"
                    )
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
        
        # Check priority allocation
        priority_limit = int(self.monthly_quota * self.priority_allocation[priority])
        if self.priority_usage[priority] >= priority_limit and priority != QuotaPriority.CRITICAL:
            self.logger.warning(
                f"Priority quota exceeded for {priority.name}: "
                f"{self.priority_usage[priority]}/{priority_limit}"
            )
            # Only enforce priority quota if we're over the warning threshold
            if monthly_quota_percentage >= self.warning_threshold * 100:
                return False
        
        # Check category allocation if applicable
        if category and category in self.category_allocation:
            category_limit = int(self.monthly_quota * self.category_allocation[category])
            category_usage = self.category_usage.get(category, 0)
            
            if category_usage >= category_limit:
                self.logger.warning(
                    f"Category quota exceeded for {category}: "
                    f"{category_usage}/{category_limit}"
                )
                # Only enforce category quota if we're over the warning threshold
                if monthly_quota_percentage >= self.warning_threshold * 100:
                    return False
        
        # Emergency circuit breaker
        if (self.circuit_breaker_enabled and 
            monthly_quota_percentage >= self.emergency_threshold * 100 and
            priority != QuotaPriority.CRITICAL):
            self.logger.critical(
                f"Emergency quota threshold exceeded: {monthly_quota_percentage:.1f}% >= {self.emergency_threshold * 100}%, "
                f"tripping circuit breaker for non-critical requests"
            )
            self.circuit_breaker_tripped = True
            self.circuit_breaker_trip_time = time.time()
            return False
        
        # Warning threshold
        if monthly_quota_percentage >= self.warning_threshold * 100:
            self.logger.warning(
                f"Quota warning threshold exceeded: {monthly_quota_percentage:.1f}% >= {self.warning_threshold * 100}%"
            )
        
        return True
    
    def record_usage(self, 
                    count: int = 1, 
                    priority: QuotaPriority = QuotaPriority.MEDIUM,
                    category: Optional[str] = None) -> None:
        """Record API usage.
        
        Args:
            count: Number of requests to record
            priority: Priority level of the requests
            category: Optional category for the requests
        """
        self.reset_if_needed()
        
        # Update counters
        self.request_count += count
        self.daily_request_count += count
        
        # Update priority usage
        self.priority_usage[priority] = self.priority_usage.get(priority, 0) + count
        
        # Update category usage if applicable
        if category:
            self.category_usage[category] = self.category_usage.get(category, 0) + count
        
        # Log usage
        if count > 1:
            self.logger.info(
                f"Recorded {count} requests (priority: {priority.name}, category: {category}): "
                f"monthly: {self.request_count}/{self.monthly_quota}, "
                f"daily: {self.daily_request_count}/{self.daily_quota}"
            )
        
        # Periodically save state
        if random.random() < 0.1:  # 10% chance to save on each usage
            self._save_state()
    
    def set_category_allocation(self, category: str, percentage: float) -> None:
        """Set quota allocation for a category.
        
        Args:
            category: Category name
            percentage: Percentage of quota to allocate (0.0-1.0)
        """
        self.category_allocation[category] = percentage
        self.logger.info(f"Set {category} quota allocation to {percentage:.1%}")
    
    def set_priority_allocation(self, priority: QuotaPriority, percentage: float) -> None:
        """Set quota allocation for a priority level.
        
        Args:
            priority: Priority level
            percentage: Percentage of quota to allocate (0.0-1.0)
        """
        self.priority_allocation[priority] = percentage
        self.logger.info(f"Set {priority.name} quota allocation to {percentage:.1%}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current quota status.
        
        Returns:
            Dictionary with quota status details
        """
        self.reset_if_needed()
        
        # Calculate remaining days in month
        now = datetime.now()
        month_end = datetime(now.year, now.month, 1) + timedelta(days=32)
        month_end = month_end.replace(day=1) - timedelta(days=1)
        days_remaining = (month_end - now).days + 1
        
        # Calculate daily budget for rest of month
        remaining_quota = self.monthly_quota - self.request_count
        daily_budget = remaining_quota / max(1, days_remaining)
        
        return {
            "monthly_quota": {
                "request_count": self.request_count,
                "total_quota": self.monthly_quota,
                "remaining": self.monthly_quota - self.request_count,
                "usage_percentage": (self.request_count / self.monthly_quota) * 100,
                "days_remaining": days_remaining,
                "daily_budget": daily_budget
            },
            "daily_quota": {
                "request_count": self.daily_request_count,
                "total_quota": self.daily_quota,
                "remaining": self.daily_quota - self.daily_request_count,
                "usage_percentage": (self.daily_request_count / self.daily_quota) * 100
            },
            "priority_usage": {
                priority.name: {
                    "usage": usage,
                    "allocation": self.priority_allocation[priority],
                    "limit": int(self.monthly_quota * self.priority_allocation[priority]),
                    "usage_percentage": (usage / (self.monthly_quota * self.priority_allocation[priority])) * 100
                }
                for priority, usage in self.priority_usage.items()
            },
            "category_usage": {
                category: {
                    "usage": usage,
                    "allocation": self.category_allocation.get(category, "dynamic"),
                    "limit": int(self.monthly_quota * self.category_allocation[category]) 
                            if category in self.category_allocation else None,
                    "usage_percentage": (usage / (self.monthly_quota * self.category_allocation[category])) * 100
                            if category in self.category_allocation else None
                }
                for category, usage in self.category_usage.items()
            },
            "circuit_breaker": {
                "enabled": self.circuit_breaker_enabled,
                "tripped": self.circuit_breaker_tripped,
                "trip_time": datetime.fromtimestamp(self.circuit_breaker_trip_time).isoformat() 
                             if self.circuit_breaker_trip_time else None,
                "trip_duration_minutes": (time.time() - self.circuit_breaker_trip_time) / 60
                                         if self.circuit_breaker_trip_time else None,
                "reset_duration_hours": self.circuit_breaker_reset_duration / 3600
            },
            "thresholds": {
                "emergency": self.emergency_threshold,
                "warning": self.warning_threshold
            }
        }


class QuotaDistributor:
    """Distributes quota across different task types.
    
    This class provides a higher-level interface for distributing quota
    across different types of tasks, with support for:
    
    - Task type prioritization
    - Adaptive quota allocation based on usage patterns
    - Emergency and maintenance modes
    """
    
    def __init__(self, quota_manager: QuotaManager):
        """Initialize the quota distributor.
        
        Args:
            quota_manager: Quota manager instance
        """
        self.quota_manager = quota_manager
        self.task_priorities = {}  # task_type -> QuotaPriority
        self.task_categories = {}  # task_type -> category
        self.logger = logging.getLogger("quota-distributor")
        
        # Set up logging
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def register_task_type(self, 
                         task_type: str, 
                         priority: QuotaPriority,
                         category: Optional[str] = None) -> None:
        """Register a task type with priority and category.
        
        Args:
            task_type: Task type identifier
            priority: Priority level for this task type
            category: Optional category for this task type
        """
        self.task_priorities[task_type] = priority
        
        if category:
            self.task_categories[task_type] = category
            
        self.logger.info(f"Registered task type {task_type} with priority {priority.name} and category {category}")
    
    def check_quota(self, task_type: str) -> bool:
        """Check if a task type is allowed within quota limits.
        
        Args:
            task_type: Task type to check
            
        Returns:
            True if task is allowed, False if quota exceeded
        """
        # Get priority and category for this task type
        priority = self.task_priorities.get(task_type, QuotaPriority.MEDIUM)
        category = self.task_categories.get(task_type)
        
        return self.quota_manager.check_quota(priority, category)
    
    def record_usage(self, task_type: str, count: int = 1) -> None:
        """Record API usage for a task type.
        
        Args:
            task_type: Task type identifier
            count: Number of requests to record
        """
        # Get priority and category for this task type
        priority = self.task_priorities.get(task_type, QuotaPriority.MEDIUM)
        category = self.task_categories.get(task_type)
        
        self.quota_manager.record_usage(count, priority, category)
    
    def set_task_priority(self, task_type: str, priority: QuotaPriority) -> None:
        """Set priority for a task type.
        
        Args:
            task_type: Task type identifier
            priority: New priority level
        """
        self.task_priorities[task_type] = priority
        self.logger.info(f"Updated task type {task_type} priority to {priority.name}")
    
    def set_task_category(self, task_type: str, category: Optional[str]) -> None:
        """Set category for a task type.
        
        Args:
            task_type: Task type identifier
            category: New category
        """
        if category:
            self.task_categories[task_type] = category
        elif task_type in self.task_categories:
            del self.task_categories[task_type]
            
        self.logger.info(f"Updated task type {task_type} category to {category}")
    
    def get_task_types_by_priority(self, priority: QuotaPriority) -> List[str]:
        """Get all task types with a specific priority.
        
        Args:
            priority: Priority level to filter by
            
        Returns:
            List of task types with the specified priority
        """
        return [
            task_type 
            for task_type, task_priority in self.task_priorities.items() 
            if task_priority == priority
        ]
    
    def get_task_types_by_category(self, category: str) -> List[str]:
        """Get all task types in a specific category.
        
        Args:
            category: Category to filter by
            
        Returns:
            List of task types in the specified category
        """
        return [
            task_type 
            for task_type, task_category in self.task_categories.items() 
            if task_category == category
        ]