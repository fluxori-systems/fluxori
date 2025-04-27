"""
Makro-specific search ranking extractor.

This module provides specialized functionality for extracting search ranking data
from Makro search results, including seller counting and opportunity scoring.
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup

from ....common.extractors.search_ranking_extractor import SearchRankingExtractor


class MakroSearchRankingExtractor(SearchRankingExtractor):
    """Makro-specific implementation of search ranking extractor.
    
    This class provides specialized extraction methods for Makro's search results,
    with specific handling of Makro's marketplace seller model and search result format.
    """
    
    def __init__(self):
        """Initialize the Makro search ranking extractor."""
        super().__init__(marketplace_name="makro")
        
        # Adjust weights based on Makro's marketplace characteristics
        self.scoring_weights = {
            "competition": 0.20,      # Standard weight for competition
            "demand": 0.25,           # Higher weight for demand on Makro
            "price_point": 0.25,      # Higher weight for price (Makro is price-sensitive)
            "rating": 0.10,           # Lower weight for ratings (less prominent on Makro)
            "trend": 0.10,            # Standard weight for trend
            "seasonality": 0.05,      # Standard weight for seasonality
            "marketplace_specific": 0.05  # Lower weight for marketplace-specific
        }
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results from Makro search page.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Try to find result count in text (typical format: "X Products found")
        result_count_text = None
        
        # Try main result count element
        result_count_element = soup.select_one('.results-count')
        if result_count_element:
            result_count_text = result_count_element.text.strip()
            
        # Alternative locations
        if not result_count_text:
            result_count_element = soup.select_one('.page-title-wrapper .base')
            if result_count_element:
                result_count_text = result_count_element.text.strip()
                
        # Extract the count using regex
        if result_count_text:
            match = re.search(r'(\d{1,3}(?:,\d{3})*|\d+)', result_count_text)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    return int(count_str)
                except ValueError:
                    pass
        
        # Try to extract from initial state data (Makro often has this)
        script_tags = soup.select('script[type="text/x-magento-init"]')
        for script in script_tags:
            try:
                data = json.loads(script.string)
                if data and "*.block-products-list" in data:
                    init_data = data["*.block-products-list"].get("productListToolbarForm", {})
                    if "totalProducts" in init_data:
                        return int(init_data["totalProducts"])
            except (json.JSONDecodeError, ValueError, TypeError, KeyError):
                pass
                
        # Try extracting from JSON-LD
        script_elements = soup.select('script[type="application/ld+json"]')
        for script in script_elements:
            try:
                json_data = json.loads(script.string)
                if isinstance(json_data, dict) and json_data.get("@type") == "ItemList":
                    if "numberOfItems" in json_data:
                        return int(json_data["numberOfItems"])
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Fallback to counting the product items
        product_items = soup.select('.product-item')
        return len(product_items)
    
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from Makro search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        # Try to extract products from Magento structure
        products = []
        
        # Find all product items
        product_items = soup.select('.product-item')
        
        for idx, item in enumerate(product_items):
            product = {}
            
            # Extract product URL and ID
            link_element = item.select_one('.product-item-link')
            if link_element and link_element.get('href'):
                product_url = link_element['href']
                product["url"] = product_url
                
                # Try to extract product ID
                product_id_match = re.search(r'product/(\d+)', product_url)
                if product_id_match:
                    product["product_id"] = product_id_match.group(1)
            
            # Extract title
            if link_element:
                product["title"] = link_element.text.strip()
            
            # Extract price
            price_element = item.select_one('.price')
            if price_element:
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
            
            # Check for special price or old price
            special_price_element = item.select_one('.special-price .price')
            old_price_element = item.select_one('.old-price .price')
            
            if special_price_element and old_price_element:
                special_price_text = special_price_element.text.strip()
                old_price_text = old_price_element.text.strip()
                
                # Extract special price
                special_match = re.search(r'R\s*(\d+[,.]?\d*)', special_price_text)
                old_match = re.search(r'R\s*(\d+[,.]?\d*)', old_price_text)
                
                if special_match and old_match:
                    try:
                        special_price = float(special_match.group(1).replace(',', '.'))
                        old_price = float(old_match.group(1).replace(',', '.'))
                        
                        product["price"] = special_price
                        product["original_price"] = old_price
                        product["on_sale"] = True
                    except ValueError:
                        pass
            
            # Extract image
            img_element = item.select_one('.product-image-photo')
            if img_element and img_element.get('src'):
                product["image_url"] = img_element['src']
            
            # Extract rating if available
            rating_element = item.select_one('.rating-summary')
            if rating_element:
                rating_value_element = rating_element.select_one('.rating-result')
                if rating_value_element and 'title' in rating_value_element.attrs:
                    rating_title = rating_value_element['title']
                    rating_match = re.search(r'(\d+(\.\d+)?)%', rating_title)
                    if rating_match:
                        try:
                            # Convert percentage to 5-star scale
                            percentage = float(rating_match.group(1))
                            product["rating"] = round((percentage / 100) * 5, 1)
                        except ValueError:
                            pass
                
                # Try to extract review count
                review_count_element = item.select_one('.reviews-actions .action.view')
                if review_count_element:
                    review_text = review_count_element.text.strip()
                    review_match = re.search(r'(\d+)', review_text)
                    if review_match:
                        try:
                            product["review_count"] = int(review_match.group(1))
                        except ValueError:
                            pass
            
            # Check for stock status
            stock_element = item.select_one('.stock')
            if stock_element:
                stock_text = stock_element.text.strip().lower()
                product["in_stock"] = "in stock" in stock_text
            else:
                # Default to in stock if no indicator
                product["in_stock"] = True
            
            # Check for badges or labels
            promo_element = item.select_one('.label-promotion')
            if promo_element:
                product["badge"] = promo_element.text.strip()
                
            # Check for flags like "Makro choice" or "special"
            flag_element = item.select_one('.product-flag')
            if flag_element:
                product["flag"] = flag_element.text.strip()
                
            # Check if sponsored
            if self._detect_sponsored_result(product, item):
                product["sponsored"] = True
            
            # Add to products list
            products.append(product)
        
        return products
    
    def _extract_seller_count(self, 
                            product: Dict[str, Any], 
                            soup: BeautifulSoup) -> int:
        """Extract seller count for a Makro product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        # Makro sometimes has marketplace sellers but doesn't show them on search results
        # We'll use indicators to estimate seller count
        
        # If we have access to the product item HTML
        if isinstance(soup, BeautifulSoup) or (hasattr(soup, 'select_one') and callable(soup.select_one)):
            # Look for marketplace seller indicators
            seller_element = soup.select_one('.product-seller, .sold-by')
            if seller_element:
                seller_text = seller_element.text.strip().lower()
                
                # Non-Makro seller
                if "sold by" in seller_text and "makro" not in seller_text:
                    return 1  # Third-party seller
                
                # Multiple sellers would have text like "5 sellers"
                multiple_match = re.search(r'(\d+)\s+sellers', seller_text)
                if multiple_match:
                    return int(multiple_match.group(1))
        
        # If we have badge data
        if "flag" in product:
            flag = product["flag"].lower() if isinstance(product["flag"], str) else ""
            
            # "Makro choice" often means they've selected from multiple sellers
            if "makro choice" in flag:
                return 2  # Likely a curated product with multiple potential sellers
                
        # Default for Makro (primarily their own products)
        return 1
    
    def _detect_sponsored_result(self, 
                               product: Dict[str, Any], 
                               soup: BeautifulSoup) -> bool:
        """Detect if a product is a sponsored result on Makro.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if sponsored
        """
        # Check for sponsored/promoted indicators
        if isinstance(soup, BeautifulSoup) or (hasattr(soup, 'select_one') and callable(soup.select_one)):
            # Check for sponsored label
            sponsored_element = soup.select_one('.sponsored-label, .promoted-product')
            if sponsored_element:
                return True
            
            # Check for Makro's highlighted products
            if soup.select_one('.product-item.highlight'):
                return True
        
        # Check badge data in product dict
        if "badge" in product:
            badge = product["badge"].lower() if isinstance(product["badge"], str) else ""
            if "featured" in badge or "promoted" in badge:
                return True
                
        return False
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for Makro.
        
        Returns:
            Products per page
        """
        # Makro typically shows 24 products per page by default
        return 24
    
    def _adjust_competitive_index(self, index: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Makro-specific adjustments to competitive index.
        
        Args:
            index: Base competitive index
            ranking_data: Ranking data
            
        Returns:
            Adjusted competitive index
        """
        # Makro has a lot of promotions which impact competitiveness
        on_sale_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                           if p.get("on_sale", False))
        
        on_sale_ratio = on_sale_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High sales ratio indicates higher competition
        if on_sale_ratio > 0.4:  # More than 40% of products on sale
            index = min(10, index * 1.2)  # Increase competition index
        
        # Look for Makro exclusive products which decrease competition
        exclusive_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                             if p.get("flag", "") and "exclusive" in p.get("flag", "").lower())
        
        exclusive_ratio = exclusive_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High exclusivity ratio indicates lower competition
        if exclusive_ratio > 0.2:  # More than 20% exclusive products
            index = max(0, index * 0.8)  # Decrease competition index
            
        return index
    
    def _adjust_price_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Makro-specific adjustments to price score.
        
        Args:
            score: Base price score
            ranking_data: Ranking data
            
        Returns:
            Adjusted price score
        """
        # Makro is very price-sensitive, so check discount depths
        sale_items = [p for p in ranking_data.get("top_ranked_products", []) 
                     if p.get("on_sale", False) and 
                     p.get("price", 0) > 0 and 
                     p.get("original_price", 0) > 0]
        
        # Calculate average discount percentage
        if sale_items:
            discounts = [(p["original_price"] - p["price"]) / p["original_price"] * 100 
                        for p in sale_items]
            avg_discount = sum(discounts) / len(discounts)
            
            # Deep discounts indicate price sensitivity
            if avg_discount > 30:  # Very deep discounts
                return max(0, score - 20)  # Major penalty
            elif avg_discount > 20:
                return max(0, score - 10)  # Moderate penalty
            elif avg_discount > 10:
                return max(0, score - 5)   # Small penalty
        
        return score
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Makro-specific adjustments to demand score.
        
        Args:
            score: Base demand score
            ranking_data: Ranking data
            
        Returns:
            Adjusted demand score
        """
        # Check stock status as indicator of demand
        out_of_stock_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                                if p.get("in_stock") is False)
        
        out_of_stock_ratio = out_of_stock_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High out-of-stock ratio can indicate high demand
        if out_of_stock_ratio > 0.3:  # More than 30% out of stock
            return min(100, score + 15)  # Significant boost
        elif out_of_stock_ratio > 0.1:  # More than 10% out of stock
            return min(100, score + 5)   # Small boost
            
        return score
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate Makro-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Makro-specific score (0-100)
        """
        # Check for Makro-specific opportunity factors
        
        # 1. Promotional activity (Makro is promotion-heavy)
        on_sale_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                           if p.get("on_sale", False))
        on_sale_ratio = on_sale_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Moderate promotional activity is ideal
        if 0.2 <= on_sale_ratio <= 0.4:
            promo_score = 80  # Ideal promotion level
        elif 0.1 <= on_sale_ratio < 0.2 or 0.4 < on_sale_ratio <= 0.5:
            promo_score = 60  # Acceptable promotion level
        elif on_sale_ratio > 0.5:
            promo_score = 30  # Too promotional
        else:
            promo_score = 40  # Too few promotions
            
        # 2. Stock availability
        in_stock_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                            if p.get("in_stock", True))
        in_stock_ratio = in_stock_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Stock availability is important for opportunity
        if in_stock_ratio > 0.9:
            stock_score = 75  # Excellent availability
        elif in_stock_ratio > 0.7:
            stock_score = 60  # Good availability
        elif in_stock_ratio > 0.5:
            stock_score = 45  # Moderate availability
        else:
            stock_score = 30  # Poor availability
            
        # 3. Makro exclusivity
        exclusive_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                             if p.get("flag", "") and "exclusive" in p.get("flag", "").lower())
        exclusive_ratio = exclusive_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Lower exclusivity is better for opportunity
        if exclusive_ratio < 0.1:
            exclusive_score = 70  # Low exclusivity = good opportunity
        elif exclusive_ratio < 0.2:
            exclusive_score = 50  # Moderate exclusivity
        else:
            exclusive_score = 30  # High exclusivity = limited opportunity
            
        # Combine scores with appropriate weights
        final_score = (promo_score * 0.4) + (stock_score * 0.4) + (exclusive_score * 0.2)
        
        return final_score