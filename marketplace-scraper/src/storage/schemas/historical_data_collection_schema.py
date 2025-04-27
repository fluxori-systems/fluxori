"""
Schema definition for historical data collection tracking.

This module defines the schema for tracking historical data collection progress
from Buck.cheap and other historical data sources.
"""

from typing import Dict, List, Any, Optional, Union, TypedDict
from datetime import datetime


class HistoricalDataProductEntry(TypedDict, total=False):
    """Type definition for a single product's historical data collection status."""
    product_id: str
    marketplace: str
    title: str
    source_marketplace: str
    url: str
    collection_status: str  # "pending", "in_progress", "complete", "failed"
    last_attempted: str
    last_collected: Optional[str]
    completion_percentage: float  # 0-100
    data_points_collected: int
    earliest_data_point: Optional[str]
    latest_data_point: Optional[str]
    collection_attempts: int
    error_count: int
    last_error: Optional[str]
    priority: int  # 1-10, higher is more important
    tags: List[str]
    metadata: Dict[str, Any]


class HistoricalDataCategoryEntry(TypedDict, total=False):
    """Type definition for a category's historical data collection status."""
    category_id: str
    marketplace: str
    category_name: str
    source_marketplace: str
    url: Optional[str]
    products_total: int
    products_pending: int
    products_in_progress: int
    products_complete: int
    products_failed: int
    completion_percentage: float  # 0-100
    last_updated: str
    priority: int  # 1-10, higher is more important
    is_active: bool
    tags: List[str]
    metadata: Dict[str, Any]


class HistoricalDataSourceEntry(TypedDict, total=False):
    """Type definition for a historical data source's collection status."""
    source_id: str
    source_name: str
    target_marketplaces: List[str]
    is_active: bool
    allocation_percentage: float  # 0-100
    initial_allocation_percentage: float  # 0-100
    target_allocation_percentage: float  # 0-100
    current_phase: str  # "initial", "collection", "verification", "complete"
    phase_start_date: str
    categories_total: int
    categories_pending: int
    categories_in_progress: int
    categories_complete: int
    categories_failed: int
    products_total: int
    products_pending: int
    products_in_progress: int
    products_complete: int
    products_failed: int
    completion_percentage: float  # 0-100
    last_updated: str
    estimated_completion_date: Optional[str]
    collection_rate: Optional[float]  # Products per hour
    quota_usage: Dict[str, int]  # Daily quota usage history
    daily_collection_stats: List[Dict[str, Any]]  # Daily collection statistics