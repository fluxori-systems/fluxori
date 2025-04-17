"""
Search results extractor for Bob Shop marketplace.

This module provides specialized functions for extracting search results and
suggestions from Bob Shop search pages using HTML parsing.
"""

import re
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin
from datetime import datetime


def extract_search_results(html_content: str, keyword: str, page: int = 1) -> Dict[str, Any]:
    """Extract search results from Bob Shop search page HTML.
    
    Args:
        html_content: Raw HTML content of the search page
        keyword: Search keyword used
        page: Page number of search results
        
    Returns:
        Dictionary containing search results and metadata
    """
    # Initialize search results structure
    search_data = {
        "keyword": keyword,
        "page": page,
        "timestamp": datetime.now().isoformat(),
        "results": [],
        "result_count": 0,
        "total_pages": 1,
        "extraction_method": "html"
    }
    
    # Extract total results count
    total_results_match = re.search(r'<p[^>]*class="[^"]*results-count[^"]*"[^>]*>.*?(\d+).*?results', html_content, re.DOTALL)
    if total_results_match:
        try:
            total_results = int(total_results_match.group(1))
            search_data["total_results"] = total_results
        except ValueError:
            pass
    
    # Extract pagination information
    pagination_match = re.search(r'<nav[^>]*class="[^"]*pagination[^"]*"[^>]*>(.*?)</nav>', html_content, re.DOTALL)
    if pagination_match:
        pagination_content = pagination_match.group(1)
        
        # Extract total pages
        page_numbers = re.findall(r'<a[^>]*class="[^"]*pagination__link[^"]*"[^>]*>(\d+)</a>', pagination_content)
        if page_numbers:
            try:
                search_data["total_pages"] = max(int(p) for p in page_numbers)
            except ValueError:
                pass
    
    # Extract product cards
    product_cards = []
    
    # First look for grid layout
    grid_match = re.search(r'<ul[^>]*class="[^"]*product-grid[^"]*"[^>]*>(.*?)</ul>', html_content, re.DOTALL)
    if grid_match:
        grid_content = grid_match.group(1)
        card_matches = re.findall(r'<li[^>]*class="[^"]*grid__item[^"]*"[^>]*>(.*?)</li>', grid_content, re.DOTALL)
        product_cards.extend(card_matches)
    
    # Process each product card
    position = 1
    for card_html in product_cards:
        product = extract_product_from_card(card_html, position)
        if product:
            search_data["results"].append(product)
            position += 1
    
    # Update result count
    search_data["result_count"] = len(search_data["results"])
    
    return search_data


def extract_product_from_card(card_html: str, position: int) -> Optional[Dict[str, Any]]:
    """Extract product information from a single search result card.
    
    Args:
        card_html: HTML of a single product card
        position: Position in search results (1-based)
        
    Returns:
        Dictionary with product information or None if extraction fails
    """
    # Basic product data
    product = {
        "position": position,
        "currency": "ZAR"
    }
    
    # Extract product URL and ID
    url_match = re.search(r'<a[^>]*href="(/products/[^"]+)"[^>]*class="[^"]*product-card[^"]*"', card_html)
    if url_match:
        product_path = url_match.group(1)
        product["url"] = f"https://www.bobshop.co.za{product_path}"
        
        # Extract product ID/handle from URL
        product_handle = product_path.split("/")[-1].split("?")[0]
        product["product_id"] = product_handle
    else:
        return None  # No product URL found, can't proceed
    
    # Extract product title
    title_match = re.search(r'<h3[^>]*class="[^"]*product-card__title[^"]*"[^>]*>(.*?)</h3>', card_html, re.DOTALL)
    if title_match:
        title = re.sub(r'<[^>]*>', '', title_match.group(1)).strip()
        product["title"] = title
    
    # Extract product price
    price_match = re.search(r'<span[^>]*class="[^"]*price-item--regular[^"]*"[^>]*>(.*?)</span>', card_html, re.DOTALL)
    if price_match:
        price_text = price_match.group(1).strip()
        # Extract numeric price
        price_value = re.sub(r'[^\d.]', '', price_text)
        try:
            product["price"] = float(price_value)
        except ValueError:
            product["price"] = 0.0
    
    # Check for sale price
    sale_price_match = re.search(r'<span[^>]*class="[^"]*price-item--sale[^"]*"[^>]*>(.*?)</span>', card_html, re.DOTALL)
    if sale_price_match:
        sale_price_text = sale_price_match.group(1).strip()
        # Extract numeric price
        sale_price_value = re.sub(r'[^\d.]', '', sale_price_text)
        try:
            product["price"] = float(sale_price_value)
            product["on_sale"] = True
        except ValueError:
            pass
    
    # Extract product image
    image_match = re.search(r'<img[^>]*class="[^"]*product-card__image[^"]*"[^>]*src="([^"]*)"', card_html)
    if image_match:
        product["image"] = image_match.group(1)
    
    # Extract vendor/brand
    vendor_match = re.search(r'<div[^>]*class="[^"]*product-card__vendor[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL)
    if vendor_match:
        vendor = re.sub(r'<[^>]*>', '', vendor_match.group(1)).strip()
        product["brand"] = vendor
    
    # Check for availability
    if "sold out" in card_html.lower() or re.search(r'<span[^>]*class="[^"]*sold-out[^"]*"', card_html):
        product["availability"] = "out_of_stock"
    else:
        product["availability"] = "in_stock"
    
    # Check for ratings
    rating_match = re.search(r'<span[^>]*class="[^"]*rating[^"]*"[^>]*>(\d+\.\d+)</span>', card_html)
    review_count_match = re.search(r'<span[^>]*class="[^"]*rating-count[^"]*"[^>]*>\((\d+)\)</span>', card_html)
    
    if rating_match:
        try:
            product["rating"] = float(rating_match.group(1))
        except ValueError:
            pass
    
    if review_count_match:
        try:
            product["review_count"] = int(review_count_match.group(1))
        except ValueError:
            pass
    
    return product


def extract_search_suggestions(json_content: str, keyword_prefix: str) -> Dict[str, Any]:
    """Extract search suggestions from Bob Shop's autocomplete API response.
    
    Args:
        json_content: JSON response from the suggestions API
        keyword_prefix: Search prefix that triggered suggestions
        
    Returns:
        Dictionary containing search suggestions
    """
    # Initialize suggestions structure
    suggestions_data = {
        "prefix": keyword_prefix,
        "timestamp": datetime.now().isoformat(),
        "suggestions": []
    }
    
    try:
        # Try to parse JSON content
        response_data = json.loads(json_content)
        
        # Extract suggestions
        if "suggestions" in response_data and isinstance(response_data["suggestions"], list):
            for item in response_data["suggestions"]:
                if isinstance(item, dict) and "term" in item:
                    suggestions_data["suggestions"].append({
                        "text": item["term"],
                        "count": item.get("count", 0)
                    })
        
        # Extract product recommendations if present
        if "products" in response_data and isinstance(response_data["products"], list):
            product_suggestions = []
            for product in response_data["products"]:
                if isinstance(product, dict):
                    product_suggestion = {
                        "text": product.get("title", ""),
                        "type": "product",
                        "url": product.get("url", ""),
                        "image": product.get("image", ""),
                        "price": product.get("price", 0)
                    }
                    product_suggestions.append(product_suggestion)
            
            if product_suggestions:
                suggestions_data["product_suggestions"] = product_suggestions
    except json.JSONDecodeError:
        # If not valid JSON, try to extract from HTML
        suggestion_matches = re.findall(r'<li[^>]*class="[^"]*predictive-search__item[^"]*"[^>]*>(.*?)</li>', json_content, re.DOTALL)
        for match in suggestion_matches:
            term_match = re.search(r'<span[^>]*>(.*?)</span>', match, re.DOTALL)
            if term_match:
                term = re.sub(r'<[^>]*>', '', term_match.group(1)).strip()
                if term:
                    suggestions_data["suggestions"].append({
                        "text": term
                    })
    
    return suggestions_data