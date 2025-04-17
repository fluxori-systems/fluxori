"""
Takealot extractors for the marketplace scraper.

This package provides specialized extractors for Takealot's website.
"""

from .product_extractor import extract_product_details
from .search_extractor import extract_search_results, extract_search_suggestions
from .category_extractor import extract_category_details

__all__ = [
    'extract_product_details',
    'extract_search_results',
    'extract_search_suggestions',
    'extract_category_details'
]