"""
Search extractor for Takealot marketplace.

This module provides functions for extracting search results and suggestions
from Takealot's search pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup


def extract_search_results(html_content: str, keyword: str, page: int = 1) -> Dict[str, Any]:
    """Extract search results from Takealot search page HTML.
    
    Args:
        html_content: HTML content of the search page
        keyword: Search keyword
        page: Page number
        
    Returns:
        Search results dictionary
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Create search results dictionary
    search_data = {
        "keyword": keyword,
        "marketplace": "takealot",
        "page": page,
        "results": []
    }
    
    # Extract total result count
    _extract_total_results(soup, search_data)
    
    # Extract search results
    _extract_results(soup, search_data)
    
    # Extract result count for this page
    search_data["result_count"] = len(search_data["results"])
    
    # Extract filters
    _extract_filters(soup, search_data)
    
    # Extract suggestions
    _extract_related_suggestions(soup, search_data)
    
    return search_data


def extract_search_suggestions(response_content: str, prefix: str) -> Dict[str, Any]:
    """Extract search suggestions from Takealot autocomplete API response.
    
    Args:
        response_content: JSON response from autocomplete API
        prefix: Search prefix
        
    Returns:
        Suggestions dictionary
    """
    suggestions = []
    
    try:
        # Parse JSON response
        response_data = json.loads(response_content)
        
        # Extract suggestions from response
        if "sections" in response_data:
            for section in response_data["sections"]:
                if section.get("name") == "Suggestions":
                    for item in section.get("items", []):
                        if "name" in item:
                            suggestions.append(item["name"])
    except (json.JSONDecodeError, KeyError) as e:
        # Handle parsing errors
        pass
    
    return {
        "prefix": prefix,
        "marketplace": "takealot",
        "suggestions": suggestions,
        "count": len(suggestions)
    }


def _extract_total_results(soup: BeautifulSoup, search_data: Dict[str, Any]) -> None:
    """Extract total search result count.
    
    Args:
        soup: BeautifulSoup object
        search_data: Search data dictionary to update
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
                search_data["total_results"] = int(count_str)
            except ValueError:
                pass


def _extract_results(soup: BeautifulSoup, search_data: Dict[str, Any]) -> None:
    """Extract search result items.
    
    Args:
        soup: BeautifulSoup object
        search_data: Search data dictionary to update
    """
    # Find product cards
    product_cards = soup.select('.product-card')
    
    for i, card in enumerate(product_cards):
        result = {"position": i + 1}
        
        # Extract product ID and URL
        product_ref = card.get('data-ref', '')
        if product_ref:
            result["url"] = f"https://www.takealot.com{product_ref}"
            
            # Extract product ID from URL
            plid_match = re.search(r'PLID(\d+)', product_ref)
            if plid_match:
                result["product_id"] = plid_match.group(1)
        
        # Extract title
        title_element = card.select_one('.product-title')
        if title_element:
            result["title"] = title_element.text.strip()
        
        # Extract image
        image_element = card.select_one('.product-image img')
        if image_element and image_element.get('src'):
            # Convert thumbnail URL to full-size URL
            src = image_element['src']
            src = re.sub(r'[_-]\d+x\d+', '', src)
            result["image_url"] = src
        
        # Extract price
        price_element = card.select_one('.currency-module_currency_29IIm .amount')
        if price_element:
            price_text = price_element.text.strip().replace('R', '').replace(',', '')
            try:
                result["price"] = float(price_text)
            except ValueError:
                pass
        
        # Extract rating
        rating_element = card.select_one('.star-rating-module_star-rating_2XDgZ')
        if rating_element:
            rating_text = rating_element.text.strip().split('/')[0]
            try:
                result["rating"] = float(rating_text)
            except ValueError:
                pass
            
            # Extract review count
            review_count_element = card.select_one('.star-rating-module_star-rating_2XDgZ .review-count')
            if review_count_element:
                review_text = review_count_element.text.strip().replace('(', '').replace(')', '')
                try:
                    result["review_count"] = int(review_text)
                except ValueError:
                    pass
        
        # Check if product is sponsored
        sponsored_element = card.select_one('.sponsored-wrapper')
        if sponsored_element:
            result["sponsored"] = True
        
        # Extract badges
        badge_element = card.select_one('.badges-module_badge_3o1o2')
        if badge_element:
            result["badge"] = badge_element.text.strip()
        
        # Add result to list
        search_data["results"].append(result)


def _extract_filters(soup: BeautifulSoup, search_data: Dict[str, Any]) -> None:
    """Extract available search filters.
    
    Args:
        soup: BeautifulSoup object
        search_data: Search data dictionary to update
    """
    facets = {}
    
    # Find filter sections
    filter_sections = soup.select('.filters-module_accordion-container_2vZiX')
    
    for section in filter_sections:
        # Extract section name
        section_name_element = section.select_one('.accordion-module_title-container_1G7QV')
        if not section_name_element:
            continue
            
        section_name = section_name_element.text.strip()
        
        # Extract filter options
        filter_options = []
        option_elements = section.select('.CheckboxList_checkbox_2UCBJ')
        
        for option in option_elements:
            # Extract option name
            option_name_element = option.select_one('.CheckboxList_label_3kpFK')
            if option_name_element:
                option_name = option_name_element.text.strip()
                
                # Extract count (if available)
                count_element = option.select_one('.CheckboxList_count_Uq1de')
                if count_element:
                    count_text = count_element.text.strip().replace('(', '').replace(')', '')
                    try:
                        count = int(count_text)
                        filter_options.append({"name": option_name, "count": count})
                    except ValueError:
                        filter_options.append({"name": option_name})
                else:
                    filter_options.append({"name": option_name})
        
        if filter_options:
            facets[section_name] = filter_options
    
    if facets:
        search_data["facets"] = facets


def _extract_related_suggestions(soup: BeautifulSoup, search_data: Dict[str, Any]) -> None:
    """Extract related search suggestions.
    
    Args:
        soup: BeautifulSoup object
        search_data: Search data dictionary to update
    """
    suggestions = []
    
    # Find related search suggestions
    suggestion_elements = soup.select('.related-search-module_suggestion_1UeNj')
    
    for element in suggestion_elements:
        suggestion = element.text.strip()
        if suggestion:
            suggestions.append(suggestion)
    
    if suggestions:
        search_data["suggestions"] = suggestions