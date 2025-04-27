"""
Schema definition for keyword ranking tracking.

This module defines the schema for storing and retrieving keyword ranking data
across multiple marketplaces.
"""

from typing import Dict, List, Any, Optional, Union, TypedDict
from datetime import datetime


class ProductRankingEntry(TypedDict, total=False):
    """Type definition for a single product ranking entry."""
    product_id: str
    url: str
    title: str
    price: float
    currency: str
    position: int
    page: int
    image_url: Optional[str]
    sponsored: Optional[bool]
    badge: Optional[str]
    seller_count: Optional[int]
    seller_names: Optional[List[str]]
    changed_position: Optional[int]  # +2 = moved up 2 spots, -3 = moved down 3 spots
    previous_position: Optional[int]
    first_seen_date: Optional[str]
    seller_confidence: Optional[float]  # Confidence score for seller count (0.0-1.0)


class KeywordRankingHistoryEntry(TypedDict, total=False):
    """Type definition for a historical keyword ranking snapshot."""
    date: str
    marketplace: str
    keyword: str
    total_results: int
    top_positions: List[ProductRankingEntry]
    ranking_distribution: Dict[str, int]  # E.g., {"page1": 10, "page2": 20, ...}
    average_price: float
    price_range: Dict[str, float]  # {"min": 100, "max": 200}
    sponsored_count: int
    competitive_density: float  # Average number of sellers per product
    opportunity_score: Optional[float]  # 0-100 score based on competition and demand


class KeywordRankingSchema(TypedDict, total=False):
    """Schema for keyword ranking data."""
    keyword_id: str  # Unique identifier (marketplace_keyword)
    marketplace: str
    keyword: str
    last_updated: str
    created_at: str
    update_count: int
    current_results: int
    trend: str  # "up", "down", "stable"
    tracking_enabled: bool
    priority: int  # 1-10, higher is more important
    refresh_frequency: int  # Hours between refreshes
    last_opportunity_score: float  # 0-100
    top_ranked_products: List[ProductRankingEntry]
    seller_density: float  # Average sellers per product in top 20
    competitive_index: float  # 0-10 rating of competition level
    history: List[KeywordRankingHistoryEntry]
    categories: List[str]
    related_keywords: List[str]
    tags: List[str]