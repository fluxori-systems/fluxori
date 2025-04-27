"""
Amazon-specific search ranking extractor.

This module provides specialized functionality for extracting search ranking data
from Amazon search results, including seller counting and opportunity scoring.
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup, Tag

from ....common.extractors.search_ranking_extractor import SearchRankingExtractor


class AmazonSearchRankingExtractor(SearchRankingExtractor):
    """Amazon-specific implementation of search ranking extractor.
    
    This class provides specialized extraction methods for Amazon's search results,
    with specific handling of Amazon's marketplace seller model and search result format.
    """
    
    def __init__(self):
        """Initialize the Amazon search ranking extractor."""
        super().__init__(marketplace_name="amazon")
        
        # Adjust weights based on Amazon's marketplace characteristics
        self.scoring_weights = {
            "competition": 0.30,      # Standard weight for competition
            "demand": 0.25,           # Higher weight for demand on Amazon
            "price_point": 0.15,      # Standard weight for price
            "rating": 0.15,           # Standard weight for ratings
            "trend": 0.05,            # Lower weight for trend (Amazon changes fast)
            "seasonality": 0.02,      # Lower weight for seasonality
            "marketplace_specific": 0.08  # Higher weight for Amazon-specific factors
        }
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results from Amazon search page.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Find result count element - Amazon typically shows this as "1-48 of X results"
        result_count_text = None
        
        # Try main result count element
        result_count_element = soup.select_one('.s-result-list-title-bar .s-result-list-headline')
        if result_count_element:
            result_count_text = result_count_element.text.strip()
            
        # Try alternative location
        if not result_count_text:
            result_count_element = soup.select_one('.s-search-results-info-bar .s-count')
            if result_count_element:
                result_count_text = result_count_element.text.strip()
                
        # Try to extract "of X results" pattern
        if result_count_text:
            match = re.search(r'of\s+([0-9,]+)', result_count_text)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    return int(count_str)
                except ValueError:
                    pass
        
        # Fall back to counting results
        product_cards = soup.select('.s-result-item.s-asin')
        return len(product_cards)
    
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from Amazon search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        # Amazon products are in s-result-item divs with data-asin attribute
        result_items = soup.select('.s-result-item[data-asin]')
        results = []
        
        for idx, item in enumerate(result_items):
            # Skip empty ASINs or sponsored brand sections
            asin = item.get('data-asin')
            if not asin or asin == "":
                continue
                
            # Skip non-product items like editorial recommendations
            if "AdHolder" in item.get('class', []):
                continue
                
            product = {
                "product_id": asin,
                "url": f"https://www.amazon.com/dp/{asin}"
            }
            
            # Extract title
            title_element = item.select_one('.a-text-normal[data-a-color="secondary"]') or \
                            item.select_one('.a-link-normal .a-text-normal') or \
                            item.select_one('h2 .a-link-normal')
            if title_element:
                product["title"] = title_element.text.strip()
            
            # Extract price
            price_element = item.select_one('.a-price .a-offscreen')
            if price_element:
                price_text = price_element.text.strip()
                # Remove currency symbol and thousands separators
                price_text = re.sub(r'[^\d.]', '', price_text.replace(',', ''))
                try:
                    product["price"] = float(price_text)
                    product["currency"] = "ZAR"  # Amazon.co.za shows prices in ZAR
                except ValueError:
                    pass
            
            # Extract image
            img_element = item.select_one('.s-image')
            if img_element and img_element.get('src'):
                product["image_url"] = img_element['src']
            
            # Extract rating
            rating_element = item.select_one('.a-icon-star-small .a-icon-alt') or \
                            item.select_one('.a-icon-star .a-icon-alt')
            if rating_element:
                rating_text = rating_element.text.strip()
                rating_match = re.search(r'(\d+(\.\d+)?)', rating_text)
                if rating_match:
                    try:
                        product["rating"] = float(rating_match.group(1))
                    except ValueError:
                        pass
            
            # Extract review count
            review_element = item.select_one('.a-size-small .a-link-normal')
            if review_element:
                review_text = review_element.text.strip()
                review_match = re.search(r'(\d+[,]?\d*)', review_text)
                if review_match:
                    try:
                        product["review_count"] = int(review_match.group(1).replace(',', ''))
                    except ValueError:
                        pass
            
            # Extract badges like "Amazon's Choice" or "Best Seller"
            badge_element = item.select_one('.a-badge')
            if badge_element:
                badge_text_element = badge_element.select_one('.a-badge-text')
                if badge_text_element:
                    product["badge"] = badge_text_element.text.strip()
            
            # Extract Amazon Prime eligibility
            prime_element = item.select_one('.s-prime .a-icon-prime')
            if prime_element:
                product["prime_eligible"] = True
            
            # Check if sponsored
            sponsored = self._detect_sponsored_result(product, item)
            if sponsored:
                product["sponsored"] = True
            
            # Add to results
            results.append(product)
        
        return results
    
    def _extract_seller_count(self, 
                           product: Dict[str, Any], 
                           soup: BeautifulSoup) -> int:
        """Extract seller count for an Amazon product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        # Amazon doesn't show seller count directly on search results
        # We'll use some heuristics and look for seller hints
        
        # If we have a full product card, look for seller/vendor info
        if isinstance(soup, Tag) and soup.name == 'div' and 'data-asin' in soup.attrs:
            # Try to find "ships from and sold by" or "sold by" text
            seller_element = soup.select_one('.s-merchant-info')
            if seller_element:
                seller_text = seller_element.text.strip().lower()
                
                # Multiple sellers indication
                if "other sellers" in seller_text or "more buying choices" in seller_text:
                    # Extract the number if possible
                    count_match = re.search(r'(\d+)', seller_text)
                    if count_match:
                        return int(count_match.group(1)) + 1  # +1 for the primary seller
                    return 3  # Default assumption if multiple but no count
                
                # Fulfilled by Amazon but sold by third party
                if "fulfilled by amazon" in seller_text and "amazon" not in seller_text[:15]:
                    return 2  # Assume at least the listed seller + possibly Amazon
                
                # Sold directly by Amazon
                if "sold by amazon" in seller_text or "ships from and sold by amazon" in seller_text:
                    return 1  # Just Amazon
                
            # Default for items with no clear indicator
            return 1
        
        # For product data objects, we'll rely on badge data
        if "badge" in product:
            badge = product["badge"].lower() if isinstance(product["badge"], str) else ""
            if "choice" in badge or "best seller" in badge:
                # Amazon's Choice products often have multiple sellers
                return 3
            
        # Prime eligibility correlation with multiple sellers
        if product.get("prime_eligible", False):
            return 2  # Prime items often have at least Amazon + third party seller
            
        # Default assumption
        return 1
    
    def _detect_sponsored_result(self, 
                              product: Dict[str, Any], 
                              soup: BeautifulSoup) -> bool:
        """Detect if a product is a sponsored result on Amazon.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if sponsored
        """
        # Look for sponsored badge on product card
        if isinstance(soup, Tag):
            # Amazon shows 'Sponsored' label in search results
            sponsored_elements = soup.select('.s-sponsored-label-info-icon, .s-label-popover-hover span')
            for element in sponsored_elements:
                if element.text.lower().strip() == 'sponsored':
                    return True
                    
            # Alternative selector for newer Amazon layouts
            if soup.select_one('.puis-sponsored-label-text'):
                return True
        
        return False
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for Amazon.
        
        Returns:
            Products per page
        """
        # Amazon typically shows 16-48 products per page depending on view settings
        # We'll use 24 as a reasonable average
        return 24
    
    def _adjust_competitive_index(self, index: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Amazon-specific adjustments to competitive index.
        
        Args:
            index: Base competitive index
            ranking_data: Ranking data
            
        Returns:
            Adjusted competitive index
        """
        # Sponsored product count affects competition
        sponsored_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                             if p.get("sponsored", False))
        
        # High sponsored count indicates high competition
        sponsored_ratio = sponsored_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Adjust competition index based on sponsored ratio
        if sponsored_ratio > 0.3:  # If more than 30% of products are sponsored
            index = min(10, index * 1.3)  # Increase competition index significantly
        elif sponsored_ratio > 0.15:  # If more than 15% are sponsored
            index = min(10, index * 1.15)  # Moderate increase
            
        # Check for Amazon's Choice products which indicate competitive categories
        has_amazon_choice = any(p.get("badge", "") == "Amazon's Choice" 
                              for p in ranking_data.get("top_ranked_products", []))
        if has_amazon_choice:
            index = min(10, index + 1)  # Add 1 point to index
            
        return index
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Amazon-specific adjustments to demand score.
        
        Args:
            score: Base demand score
            ranking_data: Ranking data
            
        Returns:
            Adjusted demand score
        """
        # Check for review counts as a proxy for demand
        review_counts = [p.get("review_count", 0) for p in ranking_data.get("top_ranked_products", []) 
                        if p.get("review_count", 0) > 0]
        
        if review_counts:
            avg_reviews = sum(review_counts) / len(review_counts)
            
            # High reviews indicate strong demand
            if avg_reviews > 500:
                score = min(100, score + 10)  # Significant boost
            elif avg_reviews > 100:
                score = min(100, score + 5)   # Moderate boost
            elif avg_reviews < 10:
                score = max(0, score - 10)    # Penalty for very low reviews
        
        # Check for Prime eligible products
        prime_products = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                            if p.get("prime_eligible", False))
        prime_ratio = prime_products / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High Prime eligibility indicates good demand
        if prime_ratio > 0.7:
            score = min(100, score + 5)
            
        return score
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate Amazon-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Amazon-specific score (0-100)
        """
        # Check for Amazon-specific opportunities
        
        # 1. Amazon Prime opportunity
        prime_eligible_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                                  if p.get("prime_eligible", False))
        prime_ratio = prime_eligible_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # More Prime products = better marketplace fit
        if prime_ratio > 0.7:
            prime_score = 80  # Excellent fit for Amazon
        elif prime_ratio > 0.5:
            prime_score = 70  # Very good fit 
        elif prime_ratio > 0.3:
            prime_score = 60  # Good fit
        elif prime_ratio > 0.1:
            prime_score = 50  # Average fit
        else:
            prime_score = 40  # Poor fit for Amazon
            
        # 2. Amazon's Choice/Best Seller presence
        has_amazon_choice = any(p.get("badge", "") == "Amazon's Choice" 
                              for p in ranking_data.get("top_ranked_products", []))
        has_best_seller = any("best seller" in p.get("badge", "").lower() 
                            for p in ranking_data.get("top_ranked_products", []))
        
        if has_amazon_choice and has_best_seller:
            badge_score = 30  # Strong badge presence = harder to compete
        elif has_amazon_choice or has_best_seller:
            badge_score = 40  # Some badge presence
        else:
            badge_score = 70  # No badges = opportunity
            
        # 3. Sponsored ads prevalence
        sponsored_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                             if p.get("sponsored", False))
        sponsored_ratio = sponsored_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # More sponsored ads = higher competition (lower opportunity)
        if sponsored_ratio > 0.3:
            sponsored_score = 30  # High sponsored ratio = difficult
        elif sponsored_ratio > 0.15:
            sponsored_score = 50  # Moderate sponsored ratio
        else:
            sponsored_score = 70  # Low sponsored ratio = opportunity
            
        # Combine scores with appropriate weights
        final_score = (prime_score * 0.4) + (badge_score * 0.3) + (sponsored_score * 0.3)
        
        return final_score