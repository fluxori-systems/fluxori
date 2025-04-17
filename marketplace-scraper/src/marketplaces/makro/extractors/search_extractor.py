"""
Search extractor for Makro marketplace.

This module provides functions for extracting search results and suggestions from Makro's search pages.
"""

import re
import json
from typing import Dict, Any, List
from datetime import datetime
from urllib.parse import urljoin


def extract_search_results(html_content: str, keyword: str, page: int = 1) -> Dict[str, Any]:
    """Extract search results from Makro search page HTML.
    
    Args:
        html_content: HTML content of the search page
        keyword: Search keyword used
        page: Page number
        
    Returns:
        Dictionary containing search results and metadata
    """
    search_data = {
        "keyword": keyword,
        "page": page,
        "timestamp": datetime.now().isoformat(),
        "results": [],
        "result_count": 0,
        "total_pages": 1,
        "extraction_method": "raw_html"
    }
    
    # Try to extract structured search data from window.__INITIAL_STATE__
    initial_state_match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});', html_content, re.DOTALL)
    if initial_state_match:
        try:
            initial_state = json.loads(initial_state_match.group(1))
            if "search" in initial_state and isinstance(initial_state["search"], dict):
                search_state = initial_state["search"]
                search_data.update(_extract_from_search_state(search_state))
        except (json.JSONDecodeError, ValueError) as e:
            pass  # Continue with regular HTML extraction if JSON parsing fails
    
    # If no results extracted from structured data, extract from HTML
    if not search_data["results"]:
        # Find all product cards in the search results
        product_cards = re.findall(r'<div[^>]*class="[^"]*product-card[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', html_content, re.DOTALL)
        
        position = 1
        for card in product_cards:
            product = _extract_product_from_card(card, position)
            if product:
                search_data["results"].append(product)
                position += 1
        
        # Extract pagination information
        pagination_match = re.search(r'<nav[^>]*class="[^"]*pagination[^"]*"[^>]*>(.*?)</nav>', html_content, re.DOTALL)
        if pagination_match:
            pagination_html = pagination_match.group(1)
            
            # Extract total pages
            last_page_match = re.search(r'data-page="(\d+)"[^>]*aria-label="Last Page"', pagination_html)
            if last_page_match:
                try:
                    search_data["total_pages"] = int(last_page_match.group(1))
                except ValueError:
                    pass
            else:
                # Try to find the highest page number
                page_numbers = re.findall(r'data-page="(\d+)"', pagination_html)
                if page_numbers:
                    try:
                        search_data["total_pages"] = max(int(p) for p in page_numbers)
                    except ValueError:
                        pass
        
        # Extract total result count
        result_count_match = re.search(r'<span[^>]*class="[^"]*result-count[^"]*"[^>]*>(\d+)[^<]*?</span>', html_content)
        if result_count_match:
            try:
                search_data["result_count"] = int(result_count_match.group(1))
            except ValueError:
                pass
        else:
            search_data["result_count"] = len(search_data["results"])
    
    return search_data


def _extract_from_search_state(search_state: Dict[str, Any]) -> Dict[str, Any]:
    """Extract search data from window.__INITIAL_STATE__.search JSON.
    
    Args:
        search_state: Search data from __INITIAL_STATE__
        
    Returns:
        Extracted search data
    """
    search_data = {
        "results": []
    }
    
    # Extract pagination information
    if "pagination" in search_state and isinstance(search_state["pagination"], dict):
        pagination = search_state["pagination"]
        
        if "totalPages" in pagination:
            try:
                search_data["total_pages"] = int(pagination["totalPages"])
            except (ValueError, TypeError):
                pass
        
        if "totalResults" in pagination:
            try:
                search_data["result_count"] = int(pagination["totalResults"])
            except (ValueError, TypeError):
                pass
    
    # Extract product results
    if "results" in search_state and isinstance(search_state["results"], list):
        position = 1
        for product in search_state["results"]:
            if not isinstance(product, dict):
                continue
            
            product_data = {}
            
            # Basic product info
            if "code" in product:
                product_data["product_id"] = product["code"]
            
            if "name" in product:
                product_data["title"] = product["name"]
            
            if "brandName" in product:
                product_data["brand"] = product["brandName"]
            
            # URL
            if "url" in product:
                product_data["url"] = product["url"]
                if not product_data["url"].startswith(('http://', 'https://')):
                    product_data["url"] = urljoin("https://www.makro.co.za", product_data["url"])
            elif "code" in product:
                product_data["url"] = f"https://www.makro.co.za/p/{product['code']}"
            
            # Price information
            if "price" in product and isinstance(product["price"], dict):
                price_obj = product["price"]
                
                if "value" in price_obj:
                    try:
                        product_data["price"] = float(price_obj["value"])
                    except (ValueError, TypeError):
                        pass
                
                product_data["currency"] = "ZAR"
                
                if "was" in price_obj:
                    try:
                        product_data["was_price"] = float(price_obj["was"])
                    except (ValueError, TypeError):
                        pass
                
                if "discount" in price_obj:
                    try:
                        product_data["discount_percentage"] = float(price_obj["discount"])
                    except (ValueError, TypeError):
                        pass
            
            # Image
            if "images" in product and isinstance(product["images"], list) and product["images"]:
                img_obj = product["images"][0]
                if isinstance(img_obj, dict) and "url" in img_obj:
                    product_data["image"] = img_obj["url"]
            elif "image" in product:
                if isinstance(product["image"], dict) and "url" in product["image"]:
                    product_data["image"] = product["image"]["url"]
                elif isinstance(product["image"], str):
                    product_data["image"] = product["image"]
            
            # Ratings
            if "rating" in product and isinstance(product["rating"], dict):
                rating_obj = product["rating"]
                
                if "average" in rating_obj:
                    try:
                        product_data["rating"] = float(rating_obj["average"])
                    except (ValueError, TypeError):
                        pass
                
                if "count" in rating_obj:
                    try:
                        product_data["review_count"] = int(rating_obj["count"])
                    except (ValueError, TypeError):
                        pass
            
            # Availability
            if "stock" in product and isinstance(product["stock"], dict) and "status" in product["stock"]:
                stock_status = product["stock"]["status"].lower()
                product_data["availability"] = "in_stock" if "in stock" in stock_status else "out_of_stock"
            
            # Add result position
            product_data["position"] = position
            position += 1
            
            search_data["results"].append(product_data)
    
    return search_data


def _extract_product_from_card(card_html: str, position: int) -> Dict[str, Any]:
    """Extract product data from search result card HTML.
    
    Args:
        card_html: HTML content of the product card
        position: Position in search results
        
    Returns:
        Dictionary with product data or None if extraction failed
    """
    product_data = {
        "position": position
    }
    
    # Extract product URL and ID
    url_match = re.search(r'<a[^>]*href="(/p/[^"]+)"[^>]*>', card_html)
    if url_match:
        product_url = url_match.group(1)
        product_data["url"] = urljoin("https://www.makro.co.za", product_url)
        
        # Extract product ID from URL
        product_id_match = re.search(r'/p/([^/?#]+)', product_url)
        if product_id_match:
            product_data["product_id"] = product_id_match.group(1)
    else:
        # Return None if no URL found (can't identify the product)
        return None
    
    # Extract product title
    title_match = re.search(r'<h3[^>]*class="[^"]*product-name[^"]*"[^>]*>(.*?)</h3>', card_html, re.DOTALL)
    if title_match:
        product_data["title"] = title_match.group(1).strip()
    
    # Extract product brand
    brand_match = re.search(r'<div[^>]*class="[^"]*brand-name[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL)
    if brand_match:
        product_data["brand"] = brand_match.group(1).strip()
    
    # Extract product price
    price_match = re.search(r'<div[^>]*class="[^"]*price[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL)
    if price_match:
        price_html = price_match.group(1)
        price_value_match = re.search(r'R\s*([\d\s,.]+)', price_html)
        if price_value_match:
            price_str = price_value_match.group(1).replace(" ", "").replace(",", "")
            try:
                product_data["price"] = float(price_str)
                product_data["currency"] = "ZAR"
            except ValueError:
                pass
    
    # Extract was price if available
    was_price_match = re.search(r'<div[^>]*class="[^"]*was-price[^"]*"[^>]*>.*?R\s*([\d\s,.]+).*?</div>', card_html, re.DOTALL)
    if was_price_match:
        was_price_str = was_price_match.group(1).replace(" ", "").replace(",", "")
        try:
            product_data["was_price"] = float(was_price_str)
        except ValueError:
            pass
    
    # Extract product image
    image_match = re.search(r'<img[^>]*src="([^"]+)"[^>]*class="[^"]*product-image[^"]*"', card_html)
    if image_match:
        product_data["image"] = image_match.group(1)
    else:
        # Try alternative image pattern
        image_match = re.search(r'<img[^>]*data-src="([^"]+)"[^>]*class="[^"]*product-image[^"]*"', card_html)
        if image_match:
            product_data["image"] = image_match.group(1)
    
    # Extract product rating
    rating_match = re.search(r'<div[^>]*class="[^"]*rating[^"]*"[^>]*data-rating="([^"]+)"', card_html)
    if rating_match:
        try:
            product_data["rating"] = float(rating_match.group(1))
        except ValueError:
            pass
    
    # Extract review count
    review_count_match = re.search(r'<div[^>]*class="[^"]*review-count[^"]*"[^>]*>\((\d+)\)</div>', card_html)
    if review_count_match:
        try:
            product_data["review_count"] = int(review_count_match.group(1))
        except ValueError:
            pass
    
    # Extract availability
    stock_match = re.search(r'<div[^>]*class="[^"]*stock-info[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL)
    if stock_match:
        stock_text = stock_match.group(1).lower()
        product_data["availability"] = "in_stock" if "in stock" in stock_text else "out_of_stock"
    
    # Extract promotion badge if available
    promo_match = re.search(r'<div[^>]*class="[^"]*promo-badge[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL)
    if promo_match:
        product_data["promotion"] = promo_match.group(1).strip()
    
    return product_data


def extract_search_suggestions(json_content: str, keyword_prefix: str) -> Dict[str, Any]:
    """Extract search suggestions from Makro autocomplete API response.
    
    Args:
        json_content: JSON content from the autocomplete API
        keyword_prefix: Search prefix used
        
    Returns:
        Dictionary containing search suggestions
    """
    suggestions_data = {
        "prefix": keyword_prefix,
        "timestamp": datetime.now().isoformat(),
        "suggestions": []
    }
    
    try:
        # Parse the JSON response
        response_data = json.loads(json_content)
        
        # Extract suggestions from the response
        if "suggestions" in response_data and isinstance(response_data["suggestions"], list):
            for suggestion in response_data["suggestions"]:
                if isinstance(suggestion, dict) and "term" in suggestion:
                    suggestion_item = {
                        "suggestion": suggestion["term"]
                    }
                    
                    # Extract category if available
                    if "category" in suggestion:
                        suggestion_item["category"] = suggestion["category"]
                    
                    # Extract type if available
                    if "type" in suggestion:
                        suggestion_item["type"] = suggestion["type"]
                    
                    suggestions_data["suggestions"].append(suggestion_item)
        
        # Extract product suggestions if available
        if "products" in response_data and isinstance(response_data["products"], list):
            for product in response_data["products"]:
                if isinstance(product, dict) and "name" in product:
                    product_suggestion = {
                        "suggestion": product["name"],
                        "type": "product"
                    }
                    
                    # Extract product ID if available
                    if "code" in product:
                        product_suggestion["product_id"] = product["code"]
                    
                    # Extract URL if available
                    if "url" in product:
                        product_suggestion["url"] = product["url"]
                        if not product_suggestion["url"].startswith(('http://', 'https://')):
                            product_suggestion["url"] = urljoin("https://www.makro.co.za", product_suggestion["url"])
                    
                    suggestions_data["suggestions"].append(product_suggestion)
        
        # Extract category suggestions if available
        if "categories" in response_data and isinstance(response_data["categories"], list):
            for category in response_data["categories"]:
                if isinstance(category, dict) and "name" in category:
                    category_suggestion = {
                        "suggestion": category["name"],
                        "type": "category"
                    }
                    
                    # Extract URL if available
                    if "url" in category:
                        category_suggestion["url"] = category["url"]
                        if not category_suggestion["url"].startswith(('http://', 'https://')):
                            category_suggestion["url"] = urljoin("https://www.makro.co.za", category_suggestion["url"])
                    
                    suggestions_data["suggestions"].append(category_suggestion)
    
    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract suggestions from HTML response
        suggestion_matches = re.findall(r'"suggestion":"([^"]+)"', json_content)
        for suggestion in suggestion_matches:
            suggestions_data["suggestions"].append({"suggestion": suggestion})
    
    return suggestions_data