"""
Bob Shop-specific search ranking extractor.

This module provides specialized functionality for extracting search ranking data
from Bob Shop search results, including seller counting and opportunity scoring.
"""

import re
import logging
import json
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup

from ....common.extractors.search_ranking_extractor import SearchRankingExtractor


class BobShopSearchRankingExtractor(SearchRankingExtractor):
    """Bob Shop-specific implementation of search ranking extractor.
    
    This class provides specialized extraction methods for Bob Shop's search results,
    adapting to the Shopify-based platform's unique structure.
    """
    
    def __init__(self):
        """Initialize the Bob Shop search ranking extractor."""
        super().__init__(marketplace_name="bob_shop")
        
        # Adjust weights based on Bob Shop's marketplace characteristics
        self.scoring_weights = {
            "competition": 0.15,      # Lower weight (Bob Shop is single seller)
            "demand": 0.30,           # Higher weight for demand
            "price_point": 0.20,      # Higher weight for price competitiveness
            "rating": 0.15,           # Standard weight for ratings
            "trend": 0.10,            # Standard weight for trend
            "seasonality": 0.05,      # Standard weight for seasonality
            "marketplace_specific": 0.05  # Lower weight (fewer specific factors)
        }
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results from Bob Shop search page.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Look for the results count element (Shopify typical pattern)
        result_count_element = soup.select_one('.filters-toolbar__product-count')
        if result_count_element:
            count_text = result_count_element.text.strip()
            # Extract numeric value
            match = re.search(r'(\d+)', count_text)
            if match:
                return int(match.group(1))
                
        # Alternative search: try page info
        count_info = soup.select_one('.grid-product-count')
        if count_info:
            count_text = count_info.text.strip()
            match = re.search(r'(\d+)\s+products', count_text, re.IGNORECASE)
            if match:
                return int(match.group(1))
                
        # Try looking for a count in JSON-LD
        script_tags = soup.select('script[type="application/ld+json"]')
        for script in script_tags:
            try:
                data = json.loads(script.string)
                if data.get('@type') == 'CollectionPage' and 'numberOfItems' in data:
                    return int(data['numberOfItems'])
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Fallback: count product elements
        product_grid = soup.select('.grid__item.grid-product')
        return len(product_grid)
    
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from Bob Shop search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        results = []
        
        # Find all product cards (Shopify structure)
        product_items = soup.select('.grid__item.grid-product')
        
        for idx, item in enumerate(product_items):
            product = {}
            
            # Extract product URL
            url_element = item.select_one('a.grid-product__link')
            if url_element and url_element.get('href'):
                product_url = url_element['href']
                # Make sure it's a full URL
                if product_url.startswith('/'):
                    product_url = f"https://www.bobshop.co.za{product_url}"
                product["url"] = product_url
                
                # Extract product ID from URL
                product_id_match = re.search(r'/products/([^/?#]+)', product_url)
                if product_id_match:
                    product["product_id"] = product_id_match.group(1)
            
            # Extract product title
            title_element = item.select_one('.grid-product__title')
            if title_element:
                product["title"] = title_element.text.strip()
            
            # Extract price
            price_element = item.select_one('.grid-product__price')
            if price_element:
                # Look for current price
                current_element = price_element.select_one('.grid-product__price--current')
                if current_element:
                    price_text = current_element.text.strip()
                else:
                    price_text = price_element.text.strip()
                
                # Extract numeric price
                price_match = re.search(r'R\s*(\d+[,.]?\d*)', price_text)
                if price_match:
                    price_str = price_match.group(1).replace(',', '.')
                    try:
                        product["price"] = float(price_str)
                        product["currency"] = "ZAR"
                    except ValueError:
                        pass
                        
                # Check for sale prices
                compare_element = price_element.select_one('.grid-product__price--original')
                if compare_element:
                    compare_text = compare_element.text.strip()
                    compare_match = re.search(r'R\s*(\d+[,.]?\d*)', compare_text)
                    if compare_match:
                        compare_str = compare_match.group(1).replace(',', '.')
                        try:
                            product["original_price"] = float(compare_str)
                            product["on_sale"] = True
                        except ValueError:
                            pass
            
            # Extract image
            image_element = item.select_one('.grid-product__image')
            if image_element and image_element.get('data-src'):
                image_url = image_element['data-src']
                # Replace image size parameters for full size
                image_url = re.sub(r'_{[^}]+}', '', image_url)
                product["image_url"] = image_url
            
            # Check for badges/tags
            badge_element = item.select_one('.grid-product__tag')
            if badge_element:
                product["badge"] = badge_element.text.strip()
            
            # Check for out of stock
            sold_out = item.select_one('.grid-product__sold-out')
            if sold_out:
                product["in_stock"] = False
            else:
                product["in_stock"] = True
            
            # Detect if it's a featured/promoted product
            if self._detect_sponsored_result(product, item):
                product["sponsored"] = True
            
            # Add to results
            results.append(product)
        
        return results
    
    def _extract_seller_count(self, 
                            product: Dict[str, Any], 
                            soup: BeautifulSoup) -> int:
        """Extract seller count for a Bob Shop product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        # Bob Shop is a single-seller marketplace (Shopify store)
        return 1
    
    def _detect_sponsored_result(self, 
                               product: Dict[str, Any], 
                               soup: BeautifulSoup) -> bool:
        """Detect if a product is a featured/promoted result on Bob Shop.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if featured/promoted
        """
        # Look for featured product indicators
        if isinstance(soup, BeautifulSoup) or (hasattr(soup, 'select') and callable(soup.select)):
            # Check for featured tags/badges
            featured_element = soup.select_one('.featured-product, .product--featured')
            if featured_element:
                return True
                
            # Check special positioning or highlighting
            if soup.select_one('.featured-collection-item'):
                return True
        
        # Check for featured badge in product data
        if "badge" in product:
            badge = product["badge"].lower() if isinstance(product["badge"], str) else ""
            if "featured" in badge or "staff pick" in badge:
                return True
        
        return False
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for Bob Shop.
        
        Returns:
            Products per page
        """
        # Bob Shop typically shows 24 products per page
        return 24
    
    def _adjust_competition_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Bob Shop-specific adjustments to competition score.
        
        Args:
            score: Base competition score
            ranking_data: Ranking data
            
        Returns:
            Adjusted competition score
        """
        # Bob Shop is a single seller marketplace, so competition is based on
        # product variety rather than seller competition
        
        # Check product variety by looking at distinct categories/types
        product_types = set()
        for product in ranking_data.get("top_ranked_products", []):
            title = product.get("title", "").lower()
            
            # Try to identify product type from title
            for type_indicator in ["shirt", "pants", "jacket", "dress", "shoes", "hat", 
                                 "accessory", "bag", "wallet", "watch"]:
                if type_indicator in title:
                    product_types.add(type_indicator)
                    break
        
        # More product types = more variety = more opportunity
        if len(product_types) >= 5:
            return min(100, score + 20)  # Significant boost for high variety
        elif len(product_types) >= 3:
            return min(100, score + 10)  # Moderate boost for good variety
        elif len(product_types) <= 1:
            return max(0, score - 10)    # Penalty for very low variety
            
        return score
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Bob Shop-specific adjustments to demand score.
        
        Args:
            score: Base demand score
            ranking_data: Ranking data
            
        Returns:
            Adjusted demand score
        """
        # Check for out of stock products which indicate high demand
        out_of_stock_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                                if p.get("in_stock") is False)
        
        out_of_stock_ratio = out_of_stock_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Out of stock can indicate high demand
        if out_of_stock_ratio > 0.3:
            return min(100, score + 15)  # Significant boost for high out of stock ratio
        elif out_of_stock_ratio > 0.1:
            return min(100, score + 5)   # Small boost for moderate out of stock ratio
            
        # Check for sale items which can indicate inventory management
        sale_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                        if p.get("on_sale") is True)
        
        sale_ratio = sale_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High sale ratio might indicate oversupply or strategic pricing
        if sale_ratio > 0.5:
            return max(0, score - 10)    # Penalty for too many items on sale
            
        return score
    
    def _adjust_price_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Bob Shop-specific adjustments to price score.
        
        Args:
            score: Base price score
            ranking_data: Ranking data
            
        Returns:
            Adjusted price score
        """
        # Check for sale items which affect price competitiveness
        sale_items = [p for p in ranking_data.get("top_ranked_products", []) 
                     if p.get("on_sale") is True and p.get("price", 0) > 0 and p.get("original_price", 0) > 0]
        
        # Calculate average discount percentage
        if sale_items:
            discounts = [(p["original_price"] - p["price"]) / p["original_price"] * 100 for p in sale_items]
            avg_discount = sum(discounts) / len(discounts)
            
            # High discounts indicate price competition
            if avg_discount > 30:
                return max(0, score - 15)  # Significant penalty for deep discounting
            elif avg_discount > 15:
                return max(0, score - 5)   # Small penalty for moderate discounting
        
        return score
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate Bob Shop-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Bob Shop-specific score (0-100)
        """
        # Check for Bob Shop-specific factors
        
        # 1. Stock availability (Bob Shop has limited inventory)
        in_stock_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                            if p.get("in_stock") is True)
        in_stock_ratio = in_stock_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Higher in-stock ratio is better
        if in_stock_ratio > 0.8:
            stock_score = 80  # Most items in stock
        elif in_stock_ratio > 0.6:
            stock_score = 65  # Good availability
        elif in_stock_ratio > 0.4:
            stock_score = 50  # Moderate availability
        else:
            stock_score = 35  # Poor availability
            
        # 2. Product variability
        # Look for variations in product types/categories
        product_types = set()
        for product in ranking_data.get("top_ranked_products", []):
            title = product.get("title", "").lower()
            
            # Try to identify product type from title
            for type_indicator in ["shirt", "pants", "jacket", "dress", "shoes", "hat", 
                                 "accessory", "bag", "wallet", "watch"]:
                if type_indicator in title:
                    product_types.add(type_indicator)
                    break
        
        # Score based on variety
        if len(product_types) >= 5:
            variety_score = 75  # High variety
        elif len(product_types) >= 3:
            variety_score = 60  # Good variety
        elif len(product_types) == 2:
            variety_score = 45  # Limited variety
        else:
            variety_score = 30  # Very limited variety
            
        # 3. Pricing strategy
        # Look at sale items vs regular price items
        sale_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                        if p.get("on_sale") is True)
        sale_ratio = sale_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Bob Shop often has strategic sales
        if 0.2 <= sale_ratio <= 0.4:
            pricing_score = 75  # Optimal sale mix
        elif 0.1 <= sale_ratio < 0.2 or 0.4 < sale_ratio <= 0.5:
            pricing_score = 60  # Good sale mix
        elif sale_ratio > 0.5:
            pricing_score = 40  # Too many sales
        else:
            pricing_score = 50  # Few sales
            
        # Combine scores with appropriate weights
        final_score = (stock_score * 0.4) + (variety_score * 0.35) + (pricing_score * 0.25)
        
        return final_score