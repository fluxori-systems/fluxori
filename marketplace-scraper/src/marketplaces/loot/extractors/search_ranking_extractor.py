"""
Loot-specific search ranking extractor.

This module provides specialized functionality for extracting search ranking data
from Loot search results, including seller counting and opportunity scoring.
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup

from ....common.extractors.search_ranking_extractor import SearchRankingExtractor


class LootSearchRankingExtractor(SearchRankingExtractor):
    """Loot-specific implementation of search ranking extractor.
    
    This class provides specialized extraction methods for Loot's search results,
    with specific handling of Loot's marketplace structure and search result format.
    """
    
    def __init__(self):
        """Initialize the Loot search ranking extractor."""
        super().__init__(marketplace_name="loot")
        
        # Adjust weights based on Loot's marketplace characteristics
        self.scoring_weights = {
            "competition": 0.15,      # Lower weight (mostly single seller)
            "demand": 0.25,           # Higher weight for demand
            "price_point": 0.25,      # Higher weight for price competitiveness
            "rating": 0.10,           # Lower weight for ratings (less prominent)
            "trend": 0.10,            # Standard weight for trend
            "seasonality": 0.05,      # Standard weight for seasonality
            "marketplace_specific": 0.10  # Higher weight for Loot-specific factors
        }
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results from Loot search page.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Try product count element
        count_element = soup.select_one('.product-count')
        if count_element:
            count_text = count_element.text.strip()
            # Look for number pattern
            match = re.search(r'(\d+(?:[,\.]\d+)*)', count_text)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    return int(count_str)
                except ValueError:
                    pass
        
        # Try headline text which might contain count
        heading = soup.select_one('.searchtitle h1')
        if heading:
            heading_text = heading.text.strip()
            match = re.search(r'(\d+(?:[,\.]\d+)*)\s+(?:results|items)', heading_text, re.IGNORECASE)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    return int(count_str)
                except ValueError:
                    pass
        
        # Try to extract from JSON metadata
        meta_tags = soup.select('script[type="application/ld+json"]')
        for tag in meta_tags:
            try:
                data = json.loads(tag.string)
                if isinstance(data, dict) and data.get('@type') == 'CollectionPage':
                    if 'numberOfItems' in data:
                        return int(data['numberOfItems'])
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Fallback: count product elements on page
        products = soup.select('.product')
        return len(products)
    
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from Loot search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        products = []
        
        # Find all product elements
        product_elements = soup.select('.product')
        
        for idx, product_elem in enumerate(product_elements):
            product = {}
            
            # Extract product URL and ID
            link_element = product_elem.select_one('.product-link, .product-image a')
            if link_element and link_element.get('href'):
                product_url = link_element['href']
                # Make sure it's a full URL
                if not product_url.startswith('http'):
                    product_url = f"https://www.loot.co.za{product_url}"
                product["url"] = product_url
                
                # Extract product ID from URL
                product_id_match = re.search(r'/product/([^/]+)', product_url)
                if product_id_match:
                    product["product_id"] = product_id_match.group(1)
            
            # Extract product title
            title_element = product_elem.select_one('.product-title, .product-name')
            if title_element:
                product["title"] = title_element.text.strip()
            
            # Extract price
            price_element = product_elem.select_one('.price, .product-price')
            if price_element:
                price_text = price_element.text.strip()
                # Extract numeric price
                price_match = re.search(r'R\s*(\d+(?:[,\.]\d+)*)', price_text)
                if price_match:
                    price_str = price_match.group(1).replace(',', '.')
                    try:
                        product["price"] = float(price_str)
                        product["currency"] = "ZAR"
                    except ValueError:
                        pass
            
            # Check for special price or sale
            special_price_element = product_elem.select_one('.special-price, .was-price')
            original_price_element = product_elem.select_one('.original-price, .old-price')
            
            if special_price_element and original_price_element:
                special_text = special_price_element.text.strip()
                original_text = original_price_element.text.strip()
                
                # Extract prices
                special_match = re.search(r'R\s*(\d+(?:[,\.]\d+)*)', special_text)
                original_match = re.search(r'R\s*(\d+(?:[,\.]\d+)*)', original_text)
                
                if special_match and original_match:
                    try:
                        special_price = float(special_match.group(1).replace(',', '.'))
                        original_price = float(original_match.group(1).replace(',', '.'))
                        
                        product["price"] = special_price
                        product["original_price"] = original_price
                        product["on_sale"] = True
                    except ValueError:
                        pass
            
            # Extract image
            img_element = product_elem.select_one('.product-image img')
            if img_element and img_element.get('src'):
                product["image_url"] = img_element['src']
            elif img_element and img_element.get('data-src'):
                product["image_url"] = img_element['data-src']
            
            # Extract availability/stock status
            stock_element = product_elem.select_one('.availability, .stock-status')
            if stock_element:
                stock_text = stock_element.text.strip().lower()
                product["in_stock"] = "in stock" in stock_text and "out of stock" not in stock_text
            else:
                # Default to in stock if not specified
                product["in_stock"] = True
            
            # Extract author for books (Loot specializes in books)
            author_element = product_elem.select_one('.author, .product-author')
            if author_element:
                product["author"] = author_element.text.strip()
            
            # Extract format/binding for books
            format_element = product_elem.select_one('.format, .binding')
            if format_element:
                product["format"] = format_element.text.strip()
            
            # Extract estimated delivery date if available
            delivery_element = product_elem.select_one('.delivery-estimate, .estimated-delivery')
            if delivery_element:
                product["estimated_delivery"] = delivery_element.text.strip()
            
            # Check for badges/labels
            badge_element = product_elem.select_one('.badge, .product-badge')
            if badge_element:
                product["badge"] = badge_element.text.strip()
            
            # Check if it's a featured/promoted product
            if self._detect_sponsored_result(product, product_elem):
                product["sponsored"] = True
            
            # Add to products list
            products.append(product)
        
        return products
    
    def _extract_seller_count(self, 
                            product: Dict[str, Any], 
                            soup: BeautifulSoup) -> int:
        """Extract seller count for a Loot product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        # Loot is primarily a single-seller marketplace
        # They sometimes have marketplace sellers but don't prominently display this on search results
        
        # Try to find seller information if available
        if isinstance(soup, BeautifulSoup) or (hasattr(soup, 'select_one') and callable(soup.select_one)):
            seller_element = soup.select_one('.seller, .vendor')
            if seller_element:
                seller_text = seller_element.text.strip().lower()
                
                # Check if it's a third-party seller
                if "sold by" in seller_text and "loot" not in seller_text:
                    return 1  # Single third-party seller
                
                # Check for marketplace indication
                if "marketplace seller" in seller_text:
                    return 1  # Single marketplace seller
        
        # For most products, Loot is the seller
        return 1
    
    def _detect_sponsored_result(self, 
                               product: Dict[str, Any], 
                               soup: BeautifulSoup) -> bool:
        """Detect if a product is a featured/sponsored result on Loot.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if featured/sponsored
        """
        # Look for featured/sponsored indicators
        if isinstance(soup, BeautifulSoup) or (hasattr(soup, 'select_one') and callable(soup.select_one)):
            # Check for featured or sponsored labels
            featured_element = soup.select_one('.featured, .sponsored, .promoted')
            if featured_element:
                return True
                
            # Check for highlight classes
            if 'highlight' in soup.get('class', []) or 'featured-product' in soup.get('class', []):
                return True
        
        # Check badge data in product
        if "badge" in product:
            badge = product["badge"].lower() if isinstance(product["badge"], str) else ""
            if "featured" in badge or "sponsored" in badge or "bestseller" in badge:
                return True
        
        return False
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for Loot.
        
        Returns:
            Products per page
        """
        # Loot typically shows 20 products per page
        return 20
    
    def _adjust_competitive_index(self, index: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Loot-specific adjustments to competitive index.
        
        Args:
            index: Base competitive index
            ranking_data: Ranking data
            
        Returns:
            Adjusted competitive index
        """
        # Books have lower competition on Loot than electronics
        # Detect product categories by looking at titles and formats
        book_count = 0
        electronics_count = 0
        
        for product in ranking_data.get("top_ranked_products", []):
            title = product.get("title", "").lower()
            format_info = product.get("format", "").lower()
            
            # Check for book indicators
            if "author" in product or "book" in format_info or "paperback" in format_info or "hardcover" in format_info:
                book_count += 1
            
            # Check for electronics indicators
            elif any(term in title for term in ["phone", "laptop", "tablet", "tv", "camera", "headphone"]):
                electronics_count += 1
        
        # Adjust competition index based on category prevalence
        total_products = len(ranking_data.get("top_ranked_products", []))
        if total_products > 0:
            book_ratio = book_count / total_products
            electronics_ratio = electronics_count / total_products
            
            # Books have less competition on Loot (their specialty)
            if book_ratio > 0.7:  # Mostly books
                index = max(0, index * 0.7)  # Reduce competition index
            
            # Electronics have more competition
            elif electronics_ratio > 0.7:  # Mostly electronics
                index = min(10, index * 1.3)  # Increase competition index
                
        return index
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Loot-specific adjustments to demand score.
        
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
        
        # High out-of-stock ratio indicates high demand
        if out_of_stock_ratio > 0.3:  # More than 30% out of stock
            return min(100, score + 15)  # Significant boost
        elif out_of_stock_ratio > 0.1:  # More than 10% out of stock
            return min(100, score + 5)   # Small boost
            
        # Check for estimated delivery as indicator of popularity
        quick_delivery_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                                 if p.get("estimated_delivery", "").lower().find("day") != -1 and 
                                 (p.get("estimated_delivery", "").find("1") != -1 or 
                                  p.get("estimated_delivery", "").find("2") != -1))
        
        quick_delivery_ratio = quick_delivery_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # High quick delivery ratio indicates good stock and logistics
        if quick_delivery_ratio > 0.5:  # More than 50% quick delivery
            return min(100, score + 10)  # Boost for good availability
        
        return score
    
    def _adjust_price_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply Loot-specific adjustments to price score.
        
        Args:
            score: Base price score
            ranking_data: Ranking data
            
        Returns:
            Adjusted price score
        """
        # Loot is competitive on book pricing but less so on electronics
        # Detect book category specifically
        book_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                        if "author" in p or 
                        (p.get("format", "").lower() in ["paperback", "hardcover", "book"]))
        
        book_ratio = book_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # For book-heavy searches, price competition is higher on Loot
        if book_ratio > 0.7:  # Mostly books
            return max(0, score - 15)  # Apply significant penalty (more competition)
            
        # Check discount levels
        sale_items = [p for p in ranking_data.get("top_ranked_products", []) 
                     if p.get("on_sale", False) and 
                     p.get("price", 0) > 0 and 
                     p.get("original_price", 0) > 0]
        
        if sale_items:
            discounts = [(p["original_price"] - p["price"]) / p["original_price"] * 100 for p in sale_items]
            avg_discount = sum(discounts) / len(discounts)
            
            # Deep discounts indicate more price competition
            if avg_discount > 25:  # Very deep discounts
                return max(0, score - 10)  # Apply penalty
        
        return score
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate Loot-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Loot-specific score (0-100)
        """
        # Loot is strong in books but weaker in electronics
        
        # 1. Book Category Opportunity
        book_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                        if "author" in p or 
                        (p.get("format", "").lower() in ["paperback", "hardcover", "book"]))
        
        book_ratio = book_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Score based on book focus
        if book_ratio > 0.8:
            book_score = 80  # Very high book focus = strong opportunity on Loot
        elif book_ratio > 0.5:
            book_score = 70  # Good book focus = good opportunity
        elif book_ratio > 0.3:
            book_score = 60  # Some book focus = moderate opportunity
        elif book_ratio > 0.1:
            book_score = 50  # Low book focus = average opportunity
        else:
            book_score = 40  # Very low book focus = weaker opportunity on Loot
            
        # 2. Delivery Speed Factor
        quick_delivery_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                                 if p.get("estimated_delivery", "").lower().find("day") != -1 and 
                                 (p.get("estimated_delivery", "").find("1") != -1 or 
                                  p.get("estimated_delivery", "").find("2") != -1))
        
        quick_delivery_ratio = quick_delivery_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        # Score based on delivery speed
        if quick_delivery_ratio > 0.7:
            delivery_score = 75  # Excellent delivery = good opportunity
        elif quick_delivery_ratio > 0.5:
            delivery_score = 65  # Good delivery
        elif quick_delivery_ratio > 0.3:
            delivery_score = 55  # Decent delivery
        else:
            delivery_score = 45  # Slower delivery = more challenging
            
        # 3. Stock Availability
        in_stock_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                            if p.get("in_stock", True))
        
        in_stock_ratio = in_stock_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        
        if in_stock_ratio > 0.9:
            stock_score = 70  # Excellent availability
        elif in_stock_ratio > 0.7:
            stock_score = 60  # Good availability
        elif in_stock_ratio > 0.5:
            stock_score = 50  # Moderate availability
        else:
            stock_score = 40  # Poor availability
            
        # Combine scores with appropriate weights
        # Book category is the most important factor for Loot
        final_score = (book_score * 0.5) + (delivery_score * 0.3) + (stock_score * 0.2)
        
        return final_score