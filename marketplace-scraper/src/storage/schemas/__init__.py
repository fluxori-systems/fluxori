"""
Schema definitions for marketplace scraper.

This package provides schemas for validating and structuring marketplace data.
"""

from .product_schema import (
    PRODUCT_SCHEMA,
    PRICE_SCHEMA,
    validate_product,
    validate_price
)

from .search_schema import (
    SEARCH_SCHEMA,
    SUGGESTION_SCHEMA,
    validate_search_results,
    validate_search_suggestions
)

from .category_schema import (
    CATEGORY_SCHEMA,
    validate_category
)

__all__ = [
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