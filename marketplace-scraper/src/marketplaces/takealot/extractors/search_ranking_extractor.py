"""
Takealot-specific search ranking extractor.

This module provides specialized functionality for extracting search ranking data
from Takealot search results, including seller counting and opportunity scoring.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup

from ....common.extractors.search_ranking_extractor import SearchRankingExtractor


class TakealotSearchRankingExtractor(SearchRankingExtractor):
    """Takealot-specific implementation of search ranking extractor.
    
    This class provides specialized extraction methods for Takealot's search results,
    with specific handling of Takealot's marketplace seller model and search result format.
    """
    
    def __init__(self):
        """Initialize the Takealot search ranking extractor."""
        super().__init__(marketplace_name="takealot")
        
        # Adjust weights based on Takealot's marketplace characteristics
        self.scoring_weights = {
            "competition": 0.35,      # Higher weight on competition for Takealot
            "demand": 0.20,           # Standard weight for demand
            "price_point": 0.20,      # Higher weight for price on Takealot
            "rating": 0.10,           # Lower weight for ratings
            "trend": 0.10,            # Standard weight for trend
            "seasonality": 0.02,      # Lower weight for seasonality
            "marketplace_specific": 0.03  # Lower weight for marketplace-specific
        }
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results from Takealot search page.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Find result count element
        result_count_element = soup.select_one('.search-count')
        if result_count_element:
            count_text = result_count_element.text.strip()
            
            # Extract count using regex
            count_match = re.search(r'(\d{1,3}(?:,\d{3})*|\d+)', count_text)
            if count_match:
                count_str = count_match.group(1).replace(',', '')
                try:
                    return int(count_str)
                except ValueError:
                    pass
        
        # Fallback - count product cards
        product_cards = soup.select('.product-card')
        return len(product_cards)
    
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from Takealot search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        # Find product cards
        product_cards = soup.select('.product-card')
        
        results = []
        for card in product_cards:
            product = {}
            
            # Extract product ID and URL
            product_ref = card.get('data-ref', '')
            if product_ref:
                product["url"] = f"https://www.takealot.com{product_ref}"
                
                # Extract product ID from URL
                plid_match = re.search(r'PLID(\d+)', product_ref)
                if plid_match:
                    product["product_id"] = plid_match.group(1)
            
            # Extract title
            title_element = card.select_one('.product-title')
            if title_element:
                product["title"] = title_element.text.strip()
            
            # Extract image
            image_element = card.select_one('.product-image img')
            if image_element and image_element.get('src'):
                # Convert thumbnail URL to full-size URL
                src = image_element['src']
                src = re.sub(r'[_-]\d+x\d+', '', src)
                product["image_url"] = src
            
            # Extract price
            price_element = card.select_one('.currency-module_currency_29IIm .amount')
            if price_element:
                price_text = price_element.text.strip().replace('R', '').replace(',', '')
                try:
                    product["price"] = float(price_text)
                    product["currency"] = "ZAR"
                except ValueError:
                    pass
            
            # Extract rating
            rating_element = card.select_one('.star-rating-module_star-rating_2XDgZ')
            if rating_element:
                rating_text = rating_element.text.strip().split('/')[0]
                try:
                    product["rating"] = float(rating_text)
                except ValueError:
                    pass
                
                # Extract review count
                review_count_element = card.select_one('.star-rating-module_star-rating_2XDgZ .review-count')
                if review_count_element:
                    review_text = review_count_element.text.strip().replace('(', '').replace(')', '')
                    try:
                        product["review_count"] = int(review_text)
                    except ValueError:
                        pass
            
            # Check if product is sponsored
            sponsored_element = card.select_one('.sponsored-wrapper')
            if sponsored_element:
                product["sponsored"] = True
            
            # Extract badges
            badge_element = card.select_one('.badges-module_badge_3o1o2')
            if badge_element:
                product["badge"] = badge_element.text.strip()
            
            # Extract brand
            brand_element = card.select_one('.product-card-module_merchant_2NxG5')
            if brand_element:
                product["brand"] = brand_element.text.strip()
            
            # Add to results
            results.append(product)
        
        return results
    
    def _extract_seller_count(self, 
                            product: Dict[str, Any], 
                            soup: BeautifulSoup) -> int:
        """Extract seller count for a Takealot product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        # Takealot doesn't show seller count directly on search results
        # We'll use some heuristics to estimate it based on marketplace badges
        
        # If the product has a "Marketplace" badge, it likely has multiple sellers
        if product.get("badge") and "marketplace" in product.get("badge", "").lower():
            return 3  # Estimate: average of 2-4 sellers for marketplace products
        
        # If the product has a "Daily Deal" badge, it often has limited sellers
        if product.get("badge") and "deal" in product.get("badge", "").lower():
            return 1  # Most daily deals have just Takealot as seller
            
        # If a product has a merchant badge, check if it's Takealot or a third party
        if "brand" in product:
            brand = product["brand"].lower()
            if "takealot" in brand:
                return 1  # Just Takealot as seller
            else:
                return 2  # Estimate: the merchant plus occasionally Takealot itself
        
        # Default seller count for Takealot products
        return 1  # Conservative estimate
    
    def _detect_sponsored_result(self, 
                               product: Dict[str, Any], 
                               soup: BeautifulSoup) -> bool:
        """Detect if a product is a sponsored result on Takealot.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if sponsored
        """
        # Takealot explicitly marks sponsored products
        return product.get("sponsored", False)
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for Takealot.
        
        Returns:
            Products per page
        """
        # Takealot typically shows 24 products per page
        return 24
    
    def _adjust_competitive_index(self, index: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Takealot-specific adjustments to competitive index.
        
        Args:
            index: Base competitive index
            ranking_data: Ranking data
            
        Returns:
            Adjusted competitive index
        """
        # Takealot is generally more competitive than other SA marketplaces
        # so we slightly increase the competitive index
        return min(10, index * 1.1)
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Takealot-specific adjustments to demand score.
        
        Args:
            score: Base demand score
            ranking_data: Ranking data
            
        Returns:
            Adjusted demand score
        """
        # Takealot has higher overall traffic, so adjust thresholds
        result_count = ranking_data.get("current_results", 0)
        
        # For very high result counts, reduce score slightly (more saturated)
        if result_count > 5000:
            return max(0, score - 10)
        
        return score
    
    def _adjust_price_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Takealot-specific adjustments to price score.
        
        Args:
            score: Base price score
            ranking_data: Ranking data
            
        Returns:
            Adjusted price score
        """
        # Check for Daily Deals, which affect price competitiveness
        daily_deal_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                              if p.get("badge") and "deal" in p.get("badge", "").lower())
        
        # If there are many daily deals, pricing opportunity is lower
        if daily_deal_count > 3:
            return max(0, score - 15)
        
        return score
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate Takealot-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Marketplace-specific score (0-100)
        """
        # Check for Takealot-specific opportunities
        
        # 1. Daily Deals prevalence
        daily_deal_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                              if p.get("badge") and "deal" in p.get("badge", "").lower())
        daily_deal_ratio = daily_deal_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # If there are very few daily deals, it could indicate opportunity for promotion
        if daily_deal_ratio < 0.05:
            daily_deal_score = 70  # Good opportunity
        elif daily_deal_ratio < 0.2:
            daily_deal_score = 50  # Moderate opportunity
        else:
            daily_deal_score = 30  # Low opportunity (saturated with deals)
        
        # 2. Takealot vs Marketplace seller split
        takealot_products = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                               if "brand" in p and "takealot" in p["brand"].lower())
        takealot_ratio = takealot_products / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # More Takealot-sold products indicate better opportunity for marketplace sellers
        if takealot_ratio > 0.7:
            seller_score = 80  # Excellent opportunity for marketplace sellers
        elif takealot_ratio > 0.5:
            seller_score = 65  # Good opportunity
        elif takealot_ratio > 0.3:
            seller_score = 50  # Moderate opportunity
        else:
            seller_score = 35  # Already dominated by marketplace sellers
        
        # Combine scores
        return (daily_deal_score * 0.4) + (seller_score * 0.6)