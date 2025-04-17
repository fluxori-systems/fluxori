"""
Buck.cheap extractors package.

This package provides extractors for Buck.cheap historical price data.
"""

from .price_history_extractor import extract_price_history
from .product_extractor import extract_product_details

__all__ = ["extract_price_history", "extract_product_details"]