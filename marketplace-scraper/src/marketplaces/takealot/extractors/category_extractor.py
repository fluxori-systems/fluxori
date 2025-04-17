"""
Category extractor for Takealot marketplace.

This module provides functions for extracting category data from Takealot's
category pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs


def extract_category_details(html_content: str, category_url: str) -> Dict[str, Any]:
    """Extract category details from Takealot category page HTML.
    
    Args:
        html_content: HTML content of the category page
        category_url: URL of the category page
        
    Returns:
        Category data dictionary
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Create category data dictionary
    category_data = {
        "marketplace": "takealot",
        "url": category_url
    }
    
    # Extract category ID from URL
    category_id = _extract_category_id(category_url)
    if category_id:
        category_data["category_id"] = category_id
    else:
        # Try to extract from metadata
        category_id = _extract_category_id_from_metadata(soup)
        if category_id:
            category_data["category_id"] = category_id
    
    # If we still don't have a category ID, generate one from the URL
    if "category_id" not in category_data:
        parsed_url = urlparse(category_url)
        path = parsed_url.path.strip('/')
        if path:
            # Create a slug-based ID
            category_data["category_id"] = f"slug_{path.replace('/', '_')}"
    
    # Extract category name and path
    _extract_category_name_and_path(soup, category_data)
    
    # Extract subcategories
    _extract_subcategories(soup, category_data)
    
    # Extract filter attributes
    _extract_filter_attributes(soup, category_data)
    
    # Extract product count
    _extract_product_count(soup, category_data)
    
    return category_data


def _extract_category_id(category_url: str) -> Optional[str]:
    """Extract category ID from URL.
    
    Args:
        category_url: Category URL
        
    Returns:
        Category ID or None if not found
    """
    # Extract ID from /Categories/ format
    cat_id_match = re.search(r'/Categories/(\d+)', category_url)
    if cat_id_match:
        return cat_id_match.group(1)
    
    # Extract ID from department= query parameter
    parsed_url = urlparse(category_url)
    query_params = parse_qs(parsed_url.query)
    
    if 'department' in query_params:
        return query_params['department'][0]
    
    return None


def _extract_category_id_from_metadata(soup: BeautifulSoup) -> Optional[str]:
    """Extract category ID from page metadata.
    
    Args:
        soup: BeautifulSoup object
        
    Returns:
        Category ID or None if not found
    """
    # Try to find category ID in metadata
    script_tags = soup.find_all('script', type='application/ld+json')
    for script in script_tags:
        try:
            json_data = json.loads(script.string)
            
            # Look for breadcrumb data
            if isinstance(json_data, dict) and json_data.get('@type') == 'BreadcrumbList':
                items = json_data.get('itemListElement', [])
                if items and len(items) > 0:
                    # Get the last breadcrumb item (current category)
                    last_item = items[-1]
                    item_url = last_item.get('item', {}).get('@id', '')
                    
                    # Extract ID from URL
                    cat_id_match = re.search(r'/Categories/(\d+)', item_url)
                    if cat_id_match:
                        return cat_id_match.group(1)
        except (json.JSONDecodeError, AttributeError):
            pass
    
    return None


def _extract_category_name_and_path(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract category name and breadcrumb path.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    breadcrumb_path = []
    breadcrumb_path_ids = []
    
    # Extract from breadcrumbs
    breadcrumbs = soup.select('.breadcrumb-module_breadcrumb-list_11SsA .breadcrumb-module_breadcrumb_3d9qH')
    
    for i, crumb in enumerate(breadcrumbs):
        # Skip first breadcrumb (usually "Home")
        if i == 0:
            continue
        
        crumb_text = crumb.text.strip()
        if crumb_text:
            breadcrumb_path.append(crumb_text)
            
            # Try to extract ID from breadcrumb URL
            breadcrumb_link = crumb.get('href', '')
            cat_id_match = re.search(r'/Categories/(\d+)', breadcrumb_link)
            if cat_id_match:
                breadcrumb_path_ids.append(cat_id_match.group(1))
            else:
                # Use slug as fallback
                path_parts = urlparse(breadcrumb_link).path.strip('/').split('/')
                if path_parts:
                    breadcrumb_path_ids.append(f"slug_{path_parts[-1]}")
    
    if breadcrumb_path:
        # Last item in breadcrumb is current category
        category_data["name"] = breadcrumb_path[-1]
        category_data["path"] = breadcrumb_path
        
        # Calculate level (depth in hierarchy)
        category_data["level"] = len(breadcrumb_path) - 1
        
        if len(breadcrumb_path) > 1:
            # Set parent ID (second last in path)
            category_data["parent_id"] = breadcrumb_path_ids[-2] if len(breadcrumb_path_ids) >= 2 else None
    else:
        # Fallback to page title
        title_element = soup.select_one('.results-heading')
        if title_element:
            category_data["name"] = title_element.text.strip()
            category_data["level"] = 0
    
    if breadcrumb_path_ids:
        category_data["path_ids"] = breadcrumb_path_ids


def _extract_subcategories(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract subcategories.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    subcategories = []
    subcategory_ids = []
    
    # Look for subcategory links in the sidebar
    subcategory_elements = soup.select('.filters-module_accordion-container_2vZiX .accordion-module_title-container_1G7QV:contains("Category") + div a')
    
    for element in subcategory_elements:
        subcategory_name = element.text.strip()
        subcategory_url = element.get('href', '')
        
        if subcategory_name:
            subcategories.append(subcategory_name)
            
            # Try to extract ID from URL
            cat_id_match = re.search(r'/Categories/(\d+)', subcategory_url)
            if cat_id_match:
                subcategory_id = cat_id_match.group(1)
                subcategory_ids.append(subcategory_id)
            else:
                # Use slug as fallback
                path_parts = urlparse(subcategory_url).path.strip('/').split('/')
                if path_parts:
                    subcategory_ids.append(f"slug_{path_parts[-1]}")
    
    if subcategories:
        category_data["subcategories"] = subcategories
        
    if subcategory_ids:
        category_data["subcategory_ids"] = subcategory_ids


def _extract_filter_attributes(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract filter attributes from category page.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
    """
    filters = []
    
    # Find filter sections (excluding Category section which we already processed)
    filter_sections = soup.select('.filters-module_accordion-container_2vZiX')
    
    for section in filter_sections:
        # Extract section name
        section_name_element = section.select_one('.accordion-module_title-container_1G7QV')
        if not section_name_element:
            continue
            
        section_name = section_name_element.text.strip()
        
        # Skip Category section (already processed)
        if section_name.lower() == 'category':
            continue
        
        # Extract filter options
        filter_values = []
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
                        filter_values.append({"name": option_name, "count": count})
                    except ValueError:
                        filter_values.append({"name": option_name})
                else:
                    filter_values.append({"name": option_name})
        
        if filter_values:
            filters.append({
                "name": section_name,
                "values": filter_values
            })
    
    if filters:
        category_data["filters"] = filters


def _extract_product_count(soup: BeautifulSoup, category_data: Dict[str, Any]) -> None:
    """Extract product count for the category.
    
    Args:
        soup: BeautifulSoup object
        category_data: Category data dictionary to update
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
                category_data["product_count"] = int(count_str)
            except ValueError:
                pass