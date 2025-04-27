"""
Common extractors for marketplace data collection.

This package provides base extractor classes and utilities that can be extended
by marketplace-specific implementations.
"""

from .search_ranking_extractor import SearchRankingExtractor

__all__ = ["SearchRankingExtractor"]