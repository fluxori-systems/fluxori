"""
Marketplace integrations for the marketplace scraper.

This package provides marketplace-specific implementations of the scraper.
"""

from .takealot import TakealotScraper
from .bob_shop import BobShopScraper
from .makro import MakroScraper
from .buck_cheap import BuckCheapScraper

__all__ = ['TakealotScraper', 'BobShopScraper', 'MakroScraper', 'BuckCheapScraper']