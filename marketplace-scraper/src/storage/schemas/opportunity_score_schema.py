"""
Schema definition for product opportunity scoring.

This module defines the schema for storing and retrieving opportunity scores
for products across multiple marketplaces.
"""

from typing import Dict, List, Any, Optional, Union, TypedDict
from datetime import datetime


class OpportunityFactorScore(TypedDict, total=False):
    """Type definition for a single opportunity factor score."""
    factor_name: str
    score: float  # 0-100 score
    weight: float  # Relative importance (0.0-1.0)
    explanation: str
    raw_value: Union[float, int, str]
    benchmark: Optional[Union[float, int, str]]
    trend: Optional[str]  # "improving", "declining", "stable"


class HistoricalOpportunityScore(TypedDict, total=False):
    """Type definition for a historical opportunity score snapshot."""
    date: str
    total_score: float
    breakdown: Dict[str, float]  # Factor name -> score
    ranking_factors: List[Dict[str, Any]]  # List of ranking factors data
    marketplace_state: Dict[str, Any]  # Snapshot of marketplace state at the time


class OpportunityScoreSchema(TypedDict, total=False):
    """Schema for opportunity score data."""
    opportunity_id: str  # Unique identifier (marketplace_entity_id)
    marketplace: str
    entity_type: str  # "product", "keyword", "category"
    entity_id: str
    entity_name: str
    last_updated: str
    created_at: str
    update_count: int
    opportunity_score: float  # 0-100 composite score
    confidence: float  # 0.0-1.0 confidence in the score
    factor_scores: List[OpportunityFactorScore]
    score_breakdown: Dict[str, float]  # Factor category -> score
    history: List[HistoricalOpportunityScore]
    recommendations: List[Dict[str, Any]]
    comparison: Dict[str, Any]  # Comparison to marketplace average
    tags: List[str]
    custom_factors: Dict[str, Any]  # Custom scoring factors
    
    # For products
    competitive_density: Optional[float]
    price_competitiveness: Optional[float]
    demand_indicator: Optional[float]
    
    # For keywords
    search_volume: Optional[int]
    result_count: Optional[int]
    commercial_intent: Optional[float]
    
    # For categories
    product_count: Optional[int]
    seller_count: Optional[int]
    price_range: Optional[Dict[str, float]]