"""
Search extractor for Loot marketplace.

This module provides functions for extracting search results and search
suggestions from Loot's search pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs


def extract_search_results(html_content: str, keyword: str, page: int = 1) -> Dict[str, Any]:
    """Extract search results from Loot search page HTML.
    
    Args:
        html_content: HTML content of the search page
        keyword: Search keyword
        page: Page number
        
    Returns:
        Search results data
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Initialize search results
    search_data = {
        "keyword": keyword,
        "page": page,
        "results": [],
        "result_count": 0,
        "total_pages": 1
    }
    
    # Check for no results
    no_results = soup.select_one(".no-results-message")
    if no_results:
        return search_data
    
    # Get total results count
    total_results_element = soup.select_one(".results-count")
    if total_results_element:
        count_text = total_results_element.text.strip()
        count_match = re.search(r'(\d+)', count_text)
        if count_match:
            try:
                total_results = int(count_match.group(1))
                search_data["result_count"] = total_results
                
                # Estimate total pages (24 products per page)
                search_data["total_pages"] = (total_results + 23) // 24
            except ValueError:
                pass
    
    # Extract products
    product_items = soup.select(".product-list-item")
    results = []
    
    for position, item in enumerate(product_items, 1):
        product_data = {}
        
        # Extract title
        title_element = item.select_one(".product-title")
        if title_element:
            product_data["title"] = title_element.text.strip()
        
        # Extract URL
        link_element = item.select_one("a.product-link")
        if link_element and link_element.get('href'):
            href = link_element['href']
            if href.startswith('/'):
                product_data["url"] = f"https://www.loot.co.za{href}"
            else:
                product_data["url"] = href
                
            # Extract product ID from URL
            product_id_match = re.search(r'/product/[^/]+/([a-z0-9-]+)$', href)
            if product_id_match:
                product_data["product_id"] = product_id_match.group(1)
        
        # Extract price
        price_element = item.select_one(".product-price .current-price")
        if price_element:
            price_text = price_element.text.strip().replace('R', '').replace(',', '')
            try:
                product_data["price"] = float(price_text)
                product_data["currency"] = "ZAR"
            except ValueError:
                pass
                
        # Extract list price (original price)
        list_price_element = item.select_one(".product-price .original-price")
        if list_price_element:
            list_price_text = list_price_element.text.strip().replace('R', '').replace(',', '')
            try:
                product_data["list_price"] = float(list_price_text)
                
                # Calculate discount percentage
                if "price" in product_data and "list_price" in product_data:
                    discount = (1 - (product_data["price"] / product_data["list_price"])) * 100
                    product_data["discount_percentage"] = round(discount, 2)
            except ValueError:
                pass
        
        # Extract image
        image_element = item.select_one(".product-image img")
        if image_element and image_element.get('src'):
            product_data["image"] = image_element['src']
            
            # Convert thumbnail URL to full-size URL if needed
            product_data["image"] = re.sub(r'(_thumb|_small)\.', '.', product_data["image"])
        
        # Extract brand
        brand_element = item.select_one(".product-brand")
        if brand_element:
            product_data["brand"] = brand_element.text.strip()
        
        # Extract rating
        rating_element = item.select_one(".rating-stars")
        if rating_element:
            # Try to extract from data attribute first
            if 'data-rating' in rating_element.attrs:
                try:
                    product_data["rating"] = float(rating_element['data-rating'])
                except ValueError:
                    pass
            
            # Fallback to counting filled stars
            if "rating" not in product_data:
                filled_stars = rating_element.select(".filled-star")
                if filled_stars:
                    product_data["rating"] = len(filled_stars)
        
        # Extract review count
        review_count_element = item.select_one(".review-count")
        if review_count_element:
            review_text = review_count_element.text.strip()
            count_match = re.search(r'(\d+)', review_text)
            if count_match:
                try:
                    product_data["review_count"] = int(count_match.group(1))
                except ValueError:
                    pass
        
        # Add position
        product_data["position"] = position + ((page - 1) * 24)
        
        # Add to results if we have the minimum data
        if "product_id" in product_data and "title" in product_data:
            results.append(product_data)
    
    # Update search data
    search_data["results"] = results
    if not search_data["result_count"]:
        search_data["result_count"] = len(results)
    
    return search_data


def extract_search_suggestions(html_content: str, keyword_prefix: str) -> Dict[str, Any]:
    """Extract search suggestions from Loot autocomplete HTML/JSON.
    
    Args:
        html_content: HTML/JSON content of the autocomplete response
        keyword_prefix: Search keyword prefix
        
    Returns:
        Search suggestions data
    """
    suggestions = []
    
    # Try to parse as JSON
    try:
        data = json.loads(html_content)
        
        # Check for different JSON formats
        if "suggestions" in data:
            for suggestion in data["suggestions"]:
                if isinstance(suggestion, str):
                    suggestions.append(suggestion)
                elif isinstance(suggestion, dict) and "value" in suggestion:
                    suggestions.append(suggestion["value"])
        
        elif "results" in data:
            for result in data["results"]:
                if isinstance(result, str):
                    suggestions.append(result)
                elif isinstance(result, dict) and "text" in result:
                    suggestions.append(result["text"])
        
        # Fallback to all keys with string values
        elif not suggestions:
            for key, value in data.items():
                if isinstance(value, str):
                    suggestions.append(value)
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            suggestions.append(item)
                        elif isinstance(item, dict) and any(k in item for k in ["text", "value", "title"]):
                            for k in ["text", "value", "title"]:
                                if k in item and isinstance(item[k], str):
                                    suggestions.append(item[k])
                                    break
    
    except json.JSONDecodeError:
        # Not JSON, try extracting as HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Look for suggestion elements
        suggestion_elements = soup.select(".autocomplete-suggestion, .search-suggestion")
        if suggestion_elements:
            for element in suggestion_elements:
                suggestion_text = element.text.strip()
                if suggestion_text:
                    suggestions.append(suggestion_text)
    
    # Remove duplicates and empty suggestions
    filtered_suggestions = list(dict.fromkeys([s for s in suggestions if s]))
    
    return {
        "prefix": keyword_prefix,
        "suggestions": filtered_suggestions,
        "count": len(filtered_suggestions)
    }