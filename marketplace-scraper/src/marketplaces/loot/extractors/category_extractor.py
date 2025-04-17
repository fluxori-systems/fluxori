"""
Category extractor for Loot marketplace.

This module provides functions for extracting category data from Loot's
category pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs


def extract_category_details(html_content: str, category_url: str) -> Dict[str, Any]:
    """Extract category details from Loot category page HTML.
    
    Args:
        html_content: HTML content of the category page
        category_url: URL of the category page
        
    Returns:
        Category data dictionary
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Initialize category data
    category_data = {
        "url": category_url
    }
    
    # Extract category ID from URL
    category_id = _extract_category_id(category_url)
    if category_id:
        category_data["category_id"] = category_id
    else:
        # Fallback to using the full path
        parsed_url = urlparse(category_url)
        category_data["category_id"] = parsed_url.path.strip('/')
    
    # Extract category name
    category_name = _extract_category_name(soup)
    if category_name:
        category_data["name"] = category_name
    
    # Extract category description
    category_description = _extract_category_description(soup)
    if category_description:
        category_data["description"] = category_description
    
    # Extract parent and child categories
    _extract_category_hierarchy(soup, category_data)
    
    # Extract category filters/facets
    _extract_category_filters(soup, category_data)
    
    # Extract total products count
    _extract_product_count(soup, category_data)
    
    return category_data


def _extract_category_id(category_url: str) -> Optional[str]:
    """Extract category ID from URL.
    
    Args:
        category_url: Category URL
        
    Returns:
        Category ID or None if not found
    """
    # Extract from URL pattern: /category/[name]-[id]
    category_match = re.search(r'/category/([^/]+)(?:/|$)', category_url)
    if category_match:
        return category_match.group(1)
        
    # Fallback to generic path extraction
    parsed_url = urlparse(category_url)
    path_parts = parsed_url.path.strip('/').split('/')
    
    if len(path_parts) >= 2 and path_parts[0] == 'category':
        return path_parts[1]
        
    return None


def _extract_category_name(soup: BeautifulSoup) -> Optional[str]:
    """Extract category name from HTML.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        Category name or None if not found
    """
    # Try category title
    category_title = soup.select_one(".category-title, h1")
    if category_title:
        return category_title.text.strip()
    
    # Try last breadcrumb
    breadcrumbs = soup.select(".breadcrumbs a")
    if breadcrumbs:
        return breadcrumbs[-1].text.strip()
    
    return None


def _extract_category_description(soup: BeautifulSoup) -> Optional[str]:
    """Extract category description from HTML.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        Category description or None if not found
    """
    # Try category description
    description = soup.select_one(".category-description")
    if description:
        return description.text.strip()
    
    return None


def _extract_category_hierarchy(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract category hierarchy (parent and child categories).
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    # Extract breadcrumb for parent categories
    breadcrumbs = soup.select(".breadcrumbs a")
    
    if breadcrumbs:
        parent_categories = []
        for i, crumb in enumerate(breadcrumbs):
            # Skip "Home" and current category (last)
            if i == 0 or i == len(breadcrumbs) - 1:
                continue
                
            category_name = crumb.text.strip()
            category_url = crumb.get('href', '')
            
            if category_name and category_url:
                parent_category = {
                    "name": category_name,
                    "url": category_url if category_url.startswith('http') else f"https://www.loot.co.za{category_url}"
                }
                
                # Try to extract ID
                category_id_match = re.search(r'/category/([^/]+)(?:/|$)', category_url)
                if category_id_match:
                    parent_category["id"] = category_id_match.group(1)
                
                parent_categories.append(parent_category)
        
        if parent_categories:
            category_data["parent_categories"] = parent_categories
    
    # Extract subcategories
    subcategories = []
    
    # Look for subcategory sections
    subcategory_containers = soup.select(".subcategories, .category-children")
    
    for container in subcategory_containers:
        subcategory_links = container.select("a")
        
        for link in subcategory_links:
            subcategory_name = link.text.strip()
            subcategory_url = link.get('href', '')
            
            if subcategory_name and subcategory_url:
                subcategory = {
                    "name": subcategory_name,
                    "url": subcategory_url if subcategory_url.startswith('http') else f"https://www.loot.co.za{subcategory_url}"
                }
                
                # Try to extract ID
                subcategory_id_match = re.search(r'/category/([^/]+)(?:/|$)', subcategory_url)
                if subcategory_id_match:
                    subcategory["id"] = subcategory_id_match.group(1)
                
                subcategories.append(subcategory)
    
    if subcategories:
        category_data["subcategories"] = subcategories


def _extract_category_filters(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract category filters/facets.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    filters = {}
    
    # Look for filter groups
    filter_groups = soup.select(".filter-group, .facet-group")
    
    for group in filter_groups:
        # Extract filter group name
        group_name_elem = group.select_one(".filter-group-name, .facet-title")
        if not group_name_elem:
            continue
            
        group_name = group_name_elem.text.strip()
        
        # Extract filter options
        options = []
        option_elements = group.select(".filter-option, .facet-value")
        
        for option in option_elements:
            option_name = option.text.strip()
            option_url = option.get('href', '')
            option_count = None
            
            # Extract count if available
            count_elem = option.select_one(".filter-count, .facet-count")
            if count_elem:
                count_match = re.search(r'(\d+)', count_elem.text.strip())
                if count_match:
                    try:
                        option_count = int(count_match.group(1))
                    except ValueError:
                        pass
            
            if option_name:
                option_data = {
                    "name": option_name
                }
                
                if option_url:
                    option_data["url"] = option_url if option_url.startswith('http') else f"https://www.loot.co.za{option_url}"
                    
                if option_count is not None:
                    option_data["count"] = option_count
                    
                options.append(option_data)
        
        if options:
            filters[group_name] = options
    
    if filters:
        category_data["filters"] = filters


def _extract_product_count(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract total products count.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    # Look for product count element
    count_element = soup.select_one(".results-count, .product-count")
    if count_element:
        count_text = count_element.text.strip()
        count_match = re.search(r'(\d+)', count_text)
        if count_match:
            try:
                category_data["product_count"] = int(count_match.group(1))
            except ValueError:
                pass