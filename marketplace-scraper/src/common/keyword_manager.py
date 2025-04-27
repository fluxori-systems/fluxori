"""
Keyword management system for marketplace ranking analysis.

This module provides a unified keyword management system for tracking
high-value keywords across marketplaces and efficiently managing keyword
rotation and scheduling.
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple

# Local imports
from ..storage.repository import Repository


class KeywordManager:
    """Manager for tracking and rotating keywords across marketplaces.
    
    This class handles the efficient tracking and rotation of keywords across
    multiple marketplaces, maximizing quota usage and ensuring high-value
    keywords are prioritized appropriately.
    """
    
    def __init__(self, 
                 storage_client: Repository, 
                 max_active_keywords: int = 1000,
                 history_retention_days: int = 90):
        """Initialize the keyword manager.
        
        Args:
            storage_client: Repository client for data storage
            max_active_keywords: Maximum number of keywords to actively track
            history_retention_days: Number of days to retain historical data
        """
        self.storage_client = storage_client
        self.max_active_keywords = max_active_keywords
        self.history_retention_days = history_retention_days
        self.logger = logging.getLogger("keyword-manager")
        
        # Tracking sets
        self._tracked_keywords = set()  # Set of marketplace_keyword strings
        self._marketplace_keywords = {}  # marketplace -> set of keywords
        self._category_keywords = {}  # category -> set of keywords
        self._priority_keywords = {}  # priority -> set of keywords
        
        # Scheduling parameters
        self.refresh_intervals = {
            10: 12,    # Priority 10: refresh every 12 hours
            9: 24,     # Priority 9: refresh every 24 hours
            8: 36,     # Priority 8: refresh every 36 hours
            7: 48,     # Priority 7: refresh every 48 hours
            6: 72,     # Priority 6: refresh every 72 hours
            5: 96,     # Priority 5: refresh every 96 hours
            4: 120,    # Priority 4: refresh every 120 hours
            3: 144,    # Priority 3: refresh every 144 hours
            2: 168,    # Priority 2: refresh every 168 hours
            1: 240     # Priority 1: refresh every 240 hours
        }
        
    async def initialize(self):
        """Initialize the keyword manager by loading active keywords from storage."""
        self.logger.info("Initializing keyword manager")
        
        # Load all active keyword tracking entries
        keywords = await self.storage_client.get_keyword_rankings(
            filters={"tracking_enabled": True}, 
            limit=self.max_active_keywords
        )
        
        # Build tracking sets
        for keyword_entry in keywords:
            marketplace = keyword_entry["marketplace"]
            keyword = keyword_entry["keyword"]
            key = f"{marketplace}_{keyword}"
            priority = keyword_entry.get("priority", 1)
            categories = keyword_entry.get("categories", [])
            
            # Add to tracking sets
            self._tracked_keywords.add(key)
            
            # Add to marketplace sets
            if marketplace not in self._marketplace_keywords:
                self._marketplace_keywords[marketplace] = set()
            self._marketplace_keywords[marketplace].add(keyword)
            
            # Add to category sets
            for category in categories:
                if category not in self._category_keywords:
                    self._category_keywords[category] = set()
                self._category_keywords[category].add(key)
            
            # Add to priority sets
            if priority not in self._priority_keywords:
                self._priority_keywords[priority] = set()
            self._priority_keywords[priority].add(key)
            
        self.logger.info(f"Loaded {len(self._tracked_keywords)} active keywords")
        
    async def get_high_value_keywords(self, 
                                     marketplace: Optional[str] = None, 
                                     limit: int = 100,
                                     min_priority: int = 1) -> List[Dict[str, Any]]:
        """Get high-value keywords for tracking.
        
        Args:
            marketplace: Optional marketplace to filter by
            limit: Maximum number of keywords to return
            min_priority: Minimum priority level (1-10)
            
        Returns:
            List of high-value keyword objects
        """
        # Build filters
        filters = {
            "tracking_enabled": True,
            "priority": {">=": min_priority}
        }
        
        if marketplace:
            filters["marketplace"] = marketplace
            
        # Get keywords from storage
        keywords = await self.storage_client.get_keyword_rankings(
            filters=filters,
            limit=limit,
            order_by="priority",
            order_direction="desc"
        )
        
        return keywords
    
    async def get_due_keywords(self, marketplace: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get keywords due for refresh based on priority and refresh frequency.
        
        Args:
            marketplace: Optional marketplace to filter by
            
        Returns:
            List of keyword objects due for refresh
        """
        now = datetime.now()
        due_keywords = []
        
        # For each priority level, get keywords due for refresh
        for priority in range(10, 0, -1):
            refresh_hours = self.refresh_intervals[priority]
            refresh_timestamp = (now - timedelta(hours=refresh_hours)).isoformat()
            
            # Build filters
            filters = {
                "tracking_enabled": True,
                "priority": priority,
                "last_updated": {"<": refresh_timestamp}
            }
            
            if marketplace:
                filters["marketplace"] = marketplace
                
            # Get keywords from storage
            keywords = await self.storage_client.get_keyword_rankings(
                filters=filters,
                limit=100,  # Limit per priority level
                order_by="last_updated",
                order_direction="asc"
            )
            
            due_keywords.extend(keywords)
            
            # If we have enough keywords, stop
            if len(due_keywords) >= 100:
                break
                
        return due_keywords[:100]  # Return at most 100 keywords
    
    async def add_keyword(self, 
                         marketplace: str, 
                         keyword: str,
                         priority: int = 5,
                         categories: List[str] = None,
                         tags: List[str] = None) -> Dict[str, Any]:
        """Add a new keyword to tracking or update an existing one.
        
        Args:
            marketplace: Marketplace name
            keyword: Keyword to track
            priority: Priority level (1-10)
            categories: Optional list of categories
            tags: Optional list of tags
            
        Returns:
            The created or updated keyword entry
        """
        # Normalize priority
        priority = max(1, min(10, priority))
        categories = categories or []
        tags = tags or []
        
        # Check if already exists
        key = f"{marketplace}_{keyword}"
        keyword_id = key
        
        existing = await self.storage_client.get_keyword_ranking(keyword_id)
        if existing:
            # Update existing keyword
            update_data = {
                "priority": priority,
                "tracking_enabled": True,
                "categories": categories,
                "tags": tags,
                "last_updated": datetime.now().isoformat()
            }
            await self.storage_client.update_keyword_ranking(keyword_id, update_data)
            
            # Get updated entry
            keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        else:
            # Create new keyword entry
            keyword_entry = {
                "keyword_id": keyword_id,
                "marketplace": marketplace,
                "keyword": keyword,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "update_count": 0,
                "tracking_enabled": True,
                "priority": priority,
                "refresh_frequency": self.refresh_intervals[priority],
                "categories": categories,
                "tags": tags,
                "history": []
            }
            
            await self.storage_client.create_keyword_ranking(keyword_entry)
        
        # Add to tracking sets if not already tracked
        if key not in self._tracked_keywords:
            self._tracked_keywords.add(key)
            
            # Add to marketplace sets
            if marketplace not in self._marketplace_keywords:
                self._marketplace_keywords[marketplace] = set()
            self._marketplace_keywords[marketplace].add(keyword)
            
            # Add to category sets
            for category in categories:
                if category not in self._category_keywords:
                    self._category_keywords[category] = set()
                self._category_keywords[category].add(key)
            
            # Add to priority sets
            if priority not in self._priority_keywords:
                self._priority_keywords[priority] = set()
            self._priority_keywords[priority].add(key)
            
        return keyword_entry
    
    async def update_keyword_priority(self, 
                                     marketplace: str, 
                                     keyword: str,
                                     new_priority: int) -> Dict[str, Any]:
        """Update the priority of a tracked keyword.
        
        Args:
            marketplace: Marketplace name
            keyword: Keyword to update
            new_priority: New priority level (1-10)
            
        Returns:
            The updated keyword entry
            
        Raises:
            ValueError: If keyword is not tracked
        """
        # Normalize priority
        new_priority = max(1, min(10, new_priority))
        
        # Check if keyword is tracked
        key = f"{marketplace}_{keyword}"
        if key not in self._tracked_keywords:
            raise ValueError(f"Keyword {keyword} for {marketplace} is not tracked")
            
        # Get current data
        keyword_id = key
        keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        if not keyword_entry:
            raise ValueError(f"Keyword {keyword} for {marketplace} not found in storage")
            
        # Get old priority
        old_priority = keyword_entry.get("priority", 1)
        
        # Update entry in storage
        update_data = {
            "priority": new_priority,
            "refresh_frequency": self.refresh_intervals[new_priority],
            "last_updated": datetime.now().isoformat()
        }
        await self.storage_client.update_keyword_ranking(keyword_id, update_data)
        
        # Update tracking sets
        if old_priority in self._priority_keywords:
            self._priority_keywords[old_priority].discard(key)
            
        if new_priority not in self._priority_keywords:
            self._priority_keywords[new_priority] = set()
        self._priority_keywords[new_priority].add(key)
        
        # Get updated entry
        return await self.storage_client.get_keyword_ranking(keyword_id)
    
    async def disable_keyword_tracking(self, 
                                      marketplace: str, 
                                      keyword: str) -> Dict[str, Any]:
        """Disable tracking for a keyword.
        
        Args:
            marketplace: Marketplace name
            keyword: Keyword to disable
            
        Returns:
            The updated keyword entry
            
        Raises:
            ValueError: If keyword is not tracked
        """
        # Check if keyword is tracked
        key = f"{marketplace}_{keyword}"
        if key not in self._tracked_keywords:
            raise ValueError(f"Keyword {keyword} for {marketplace} is not tracked")
            
        # Get current data
        keyword_id = key
        keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        if not keyword_entry:
            raise ValueError(f"Keyword {keyword} for {marketplace} not found in storage")
            
        # Update entry in storage
        update_data = {
            "tracking_enabled": False,
            "last_updated": datetime.now().isoformat()
        }
        await self.storage_client.update_keyword_ranking(keyword_id, update_data)
        
        # Remove from tracking sets
        self._tracked_keywords.discard(key)
        
        if marketplace in self._marketplace_keywords:
            self._marketplace_keywords[marketplace].discard(keyword)
            
        # Remove from category sets
        for category, keywords in self._category_keywords.items():
            keywords.discard(key)
            
        # Remove from priority sets
        for priority, keywords in self._priority_keywords.items():
            keywords.discard(key)
            
        # Get updated entry
        return await self.storage_client.get_keyword_ranking(keyword_id)
    
    async def get_related_keywords(self, 
                                  marketplace: str, 
                                  keyword: str,
                                  max_results: int = 20) -> List[Dict[str, Any]]:
        """Get related keywords for a given keyword.
        
        Args:
            marketplace: Marketplace name
            keyword: Base keyword
            max_results: Maximum number of results
            
        Returns:
            List of related keyword entries
        """
        # Get keyword entry first
        key = f"{marketplace}_{keyword}"
        keyword_id = key
        keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        
        if not keyword_entry:
            return []
            
        # Get related keywords from entry
        related_keywords = keyword_entry.get("related_keywords", [])
        
        # Return if no related keywords
        if not related_keywords:
            return []
            
        # Get entries for related keywords
        related_entries = []
        for related_keyword in related_keywords[:max_results]:
            related_key = f"{marketplace}_{related_keyword}"
            related_entry = await self.storage_client.get_keyword_ranking(related_key)
            if related_entry:
                related_entries.append(related_entry)
                
        return related_entries
        
    async def get_keywords_by_category(self, 
                                      category: str,
                                      marketplace: Optional[str] = None,
                                      limit: int = 100) -> List[Dict[str, Any]]:
        """Get keywords for a specific category.
        
        Args:
            category: Category name
            marketplace: Optional marketplace to filter by
            limit: Maximum number of results
            
        Returns:
            List of keyword entries
        """
        # Build filters
        filters = {
            "tracking_enabled": True,
            "categories": category
        }
        
        if marketplace:
            filters["marketplace"] = marketplace
            
        # Get keywords from storage
        keywords = await self.storage_client.get_keyword_rankings(
            filters=filters,
            limit=limit,
            order_by="priority",
            order_direction="desc"
        )
        
        return keywords
    
    async def get_keywords_by_marketplace(self, 
                                         marketplace: str,
                                         limit: int = 100) -> List[Dict[str, Any]]:
        """Get keywords for a specific marketplace.
        
        Args:
            marketplace: Marketplace name
            limit: Maximum number of results
            
        Returns:
            List of keyword entries
        """
        # Build filters
        filters = {
            "tracking_enabled": True,
            "marketplace": marketplace
        }
        
        # Get keywords from storage
        keywords = await self.storage_client.get_keyword_rankings(
            filters=filters,
            limit=limit,
            order_by="priority",
            order_direction="desc"
        )
        
        return keywords
    
    async def rotate_keywords(self, 
                             marketplace: str,
                             max_rotations: int = 20) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Rotate keywords for a marketplace by enabling some and disabling others.
        
        This helps ensure we stay within the maximum active keywords limit
        while still tracking a wide range of keywords over time.
        
        Args:
            marketplace: Marketplace name
            max_rotations: Maximum number of rotations to perform
            
        Returns:
            Tuple of (activated_keywords, deactivated_keywords)
        """
        # Check current active count
        current_count = len(self._tracked_keywords)
        
        # If we're at or over limit, deactivate some low-priority keywords
        to_deactivate = []
        if current_count >= self.max_active_keywords:
            # Get lowest priority keywords that haven't been updated recently
            low_priority_filters = {
                "tracking_enabled": True,
                "marketplace": marketplace,
                "priority": {"<=": 3}  # Only consider low priority keywords
            }
            
            low_priority_keywords = await self.storage_client.get_keyword_rankings(
                filters=low_priority_filters,
                limit=max_rotations,
                order_by="last_updated",
                order_direction="asc"  # Oldest first
            )
            
            # Deactivate these keywords
            for keyword_entry in low_priority_keywords:
                keyword = keyword_entry["keyword"]
                try:
                    await self.disable_keyword_tracking(marketplace, keyword)
                    to_deactivate.append(keyword_entry)
                except ValueError:
                    # Skip if already deactivated
                    pass
                    
        # Find inactive keywords to activate
        inactive_filters = {
            "tracking_enabled": False,
            "marketplace": marketplace
        }
        
        inactive_keywords = await self.storage_client.get_keyword_rankings(
            filters=inactive_filters,
            limit=max_rotations,
            order_by="priority",
            order_direction="desc"  # Highest priority first
        )
        
        # Activate these keywords
        to_activate = []
        for keyword_entry in inactive_keywords:
            # Only activate if we have room or deactivated something
            if len(self._tracked_keywords) < self.max_active_keywords or to_deactivate:
                keyword = keyword_entry["keyword"]
                priority = keyword_entry.get("priority", 5)
                categories = keyword_entry.get("categories", [])
                tags = keyword_entry.get("tags", [])
                
                # Activate the keyword
                updated_entry = await self.add_keyword(
                    marketplace, 
                    keyword, 
                    priority=priority,
                    categories=categories,
                    tags=tags
                )
                
                to_activate.append(updated_entry)
                
        return to_activate, to_deactivate
    
    async def clean_old_history(self) -> int:
        """Clean old history entries beyond retention period.
        
        Returns:
            Number of keywords with cleaned history
        """
        self.logger.info(f"Cleaning keyword history older than {self.history_retention_days} days")
        
        retention_date = (datetime.now() - timedelta(days=self.history_retention_days)).isoformat()
        cleaned_count = 0
        
        # Process in batches to avoid memory issues
        batch_size = 100
        offset = 0
        
        while True:
            # Get batch of keywords
            keywords = await self.storage_client.get_keyword_rankings(
                limit=batch_size,
                offset=offset
            )
            
            if not keywords:
                break
                
            # Update counter
            offset += len(keywords)
            
            # Process each keyword
            for keyword_entry in keywords:
                keyword_id = keyword_entry["keyword_id"]
                history = keyword_entry.get("history", [])
                
                # Filter out old entries
                new_history = [
                    entry for entry in history
                    if entry.get("date", "9999-12-31") >= retention_date
                ]
                
                # Skip if no change
                if len(new_history) == len(history):
                    continue
                    
                # Update with new history
                update_data = {
                    "history": new_history,
                    "last_updated": datetime.now().isoformat()
                }
                await self.storage_client.update_keyword_ranking(keyword_id, update_data)
                
                cleaned_count += 1
                
        self.logger.info(f"Cleaned history for {cleaned_count} keywords")
        return cleaned_count
    
    async def generate_keywords_batch(self, 
                                     marketplace: str,
                                     batch_size: int = 50,
                                     min_priority: int = 1) -> List[Dict[str, Any]]:
        """Generate a batch of keywords for processing.
        
        This creates a balanced batch with a mix of high and low priority keywords,
        optimized for efficient quota usage.
        
        Args:
            marketplace: Marketplace to generate batch for
            batch_size: Size of batch to generate
            min_priority: Minimum priority to include
            
        Returns:
            List of keyword entries to process
        """
        # Allocate slots by priority
        # Higher priorities get more slots
        priority_allocation = {
            10: int(batch_size * 0.25),  # 25% for highest priority
            9: int(batch_size * 0.15),
            8: int(batch_size * 0.15),
            7: int(batch_size * 0.10),
            6: int(batch_size * 0.10),
            5: int(batch_size * 0.10),
            4: int(batch_size * 0.05),
            3: int(batch_size * 0.05),
            2: int(batch_size * 0.025),
            1: int(batch_size * 0.025)
        }
        
        # Get due keywords for each priority level
        batch = []
        remaining_slots = batch_size
        
        for priority in range(10, min_priority - 1, -1):
            allocation = min(priority_allocation[priority], remaining_slots)
            if allocation <= 0:
                continue
                
            # Get keywords due for refresh with this priority
            filters = {
                "tracking_enabled": True,
                "priority": priority,
                "marketplace": marketplace
            }
            
            # Get oldest updated first
            keywords = await self.storage_client.get_keyword_rankings(
                filters=filters,
                limit=allocation,
                order_by="last_updated",
                order_direction="asc"
            )
            
            # Add to batch
            batch.extend(keywords)
            remaining_slots -= len(keywords)
            
            if remaining_slots <= 0:
                break
                
        # If we have remaining slots, fill with any due keywords
        if remaining_slots > 0:
            due_keywords = await self.get_due_keywords(marketplace)
            
            # Filter out keywords already in batch
            batch_keywords = {entry["keyword_id"] for entry in batch}
            due_keywords = [
                entry for entry in due_keywords
                if entry["keyword_id"] not in batch_keywords
            ]
            
            # Add to batch, up to remaining slots
            batch.extend(due_keywords[:remaining_slots])
            
        # Shuffle the batch for variety
        random.shuffle(batch)
        
        return batch
    
    async def discover_related_keywords(self, marketplace_scrapers: Dict[str, Any]) -> List[str]:
        """Discover related keywords using marketplace scrapers.
        
        Args:
            marketplace_scrapers: Dictionary of marketplace scrapers
            
        Returns:
            List of newly discovered keywords
        """
        self.logger.info("Discovering related keywords")
        
        # Get sample of tracked keywords
        sample_keywords = []
        
        # Get some keywords from each priority level
        for priority in range(10, 0, -1):
            if priority in self._priority_keywords:
                # Get keys from priority set
                priority_keys = list(self._priority_keywords[priority])
                
                # Sample up to 5 keys per priority
                sample_count = min(5, len(priority_keys))
                if sample_count > 0:
                    sampled_keys = random.sample(priority_keys, sample_count)
                    sample_keywords.extend(sampled_keys)
                    
        # Process each marketplace
        discovered_keywords = []
        
        for marketplace, scraper in marketplace_scrapers.items():
            # Filter keywords for this marketplace
            marketplace_prefix = f"{marketplace}_"
            market_keywords = [
                key.replace(marketplace_prefix, "")
                for key in sample_keywords
                if key.startswith(marketplace_prefix)
            ]
            
            # Skip if no keywords for this marketplace
            if not market_keywords:
                continue
                
            # Sample keywords for this marketplace
            sample_count = min(10, len(market_keywords))
            sampled_market_keywords = random.sample(market_keywords, sample_count)
            
            # Extract search suggestions for each keyword
            for keyword in sampled_market_keywords:
                try:
                    suggestions = await scraper.extract_search_suggestions(keyword)
                    
                    # Process suggestions
                    for suggestion in suggestions:
                        # Check if already tracked
                        suggestion_key = f"{marketplace}_{suggestion}"
                        if suggestion_key not in self._tracked_keywords:
                            # Add with lower priority
                            await self.add_keyword(
                                marketplace,
                                suggestion,
                                priority=3,  # Medium-low priority for discovered keywords
                                categories=[]  # No categories initially
                            )
                            
                            discovered_keywords.append(suggestion)
                            
                except Exception as e:
                    self.logger.error(f"Error discovering related keywords for {keyword} in {marketplace}: {str(e)}")
                    
        return discovered_keywords
"""