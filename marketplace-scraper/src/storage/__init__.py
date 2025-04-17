"""
Storage components for the marketplace scraper.

This package provides storage-related components for the marketplace scraper.
"""

from .repository import MarketplaceDataRepository
from .schemas import (
    PRODUCT_SCHEMA,
    PRICE_SCHEMA,
    SEARCH_SCHEMA,
    SUGGESTION_SCHEMA,
    CATEGORY_SCHEMA,
    validate_product,
    validate_price,
    validate_search_results,
    validate_search_suggestions,
    validate_category
)

__all__ = [
    'MarketplaceDataRepository',
    'PRODUCT_SCHEMA',
    'PRICE_SCHEMA',
    'SEARCH_SCHEMA',
    'SUGGESTION_SCHEMA',
    'CATEGORY_SCHEMA',
    'validate_product',
    'validate_price',
    'validate_search_results',
    'validate_search_suggestions',
    'validate_category'
]