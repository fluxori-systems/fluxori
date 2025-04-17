"""
Category extractor for Makro marketplace.

This module provides functions for extracting category details from Makro's category pages.
"""

import re
import json
from typing import Dict, Any, List
from datetime import datetime
from urllib.parse import urljoin, urlparse


def extract_category_details(html_content: str, category_url: str) -> Dict[str, Any]:
    """Extract category details from Makro category page HTML.
    
    Args:
        html_content: HTML content of the category page
        category_url: URL of the category page
        
    Returns:
        Dictionary containing category details
    """
    category_data = {
        "url": category_url,
        "timestamp": datetime.now().isoformat(),
        "extraction_method": "raw_html"
    }
    
    # Extract category ID from URL
    parsed_url = urlparse(category_url)
    path_parts = parsed_url.path.strip('/').split('/')
    
    if len(path_parts) > 1 and path_parts[0] == 'c':
        category_data["category_id"] = path_parts[-1]
    else:
        # Generate a category ID from the URL if not explicitly available
        category_data["category_id"] = '_'.join(path_parts)
    
    # Try to extract structured category data from window.__INITIAL_STATE__
    initial_state_match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});', html_content, re.DOTALL)
    if initial_state_match:
        try:
            initial_state = json.loads(initial_state_match.group(1))
            if "category" in initial_state and isinstance(initial_state["category"], dict):
                category_state = initial_state["category"]
                category_data.update(_extract_from_category_state(category_state))
        except (json.JSONDecodeError, ValueError) as e:
            pass  # Continue with regular HTML extraction if JSON parsing fails
    
    # If name is not already extracted, extract it from HTML
    if "name" not in category_data:
        # Extract category name from the header
        name_match = re.search(r'<h1[^>]*class="[^"]*category-name[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
        if name_match:
            category_data["name"] = name_match.group(1).strip()
        else:
            # Try to extract from breadcrumb
            breadcrumb_match = re.search(r'<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</ol>', html_content, re.DOTALL)
            if breadcrumb_match:
                breadcrumb_html = breadcrumb_match.group(1)
                breadcrumb_items = re.findall(r'<li[^>]*>(.*?)</li>', breadcrumb_html, re.DOTALL)
                
                if breadcrumb_items:
                    # Get the last breadcrumb item (current category)
                    last_item = breadcrumb_items[-1]
                    current_category_match = re.search(r'<span[^>]*>(.*?)</span>', last_item)
                    if current_category_match:
                        category_data["name"] = current_category_match.group(1).strip()
    
    # Extract breadcrumb if not already present
    if "breadcrumb" not in category_data:
        breadcrumb_match = re.search(r'<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</ol>', html_content, re.DOTALL)
        if breadcrumb_match:
            breadcrumb_html = breadcrumb_match.group(1)
            breadcrumb_items = re.findall(r'<li[^>]*>(.*?)</li>', breadcrumb_html, re.DOTALL)
            
            breadcrumb = []
            for item in breadcrumb_items:
                # Skip if it's the current category (usually doesn't have a link)
                if 'aria-current' in item:
                    continue
                
                # Extract category name and URL
                link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', item, re.DOTALL)
                if link_match:
                    link_url = link_match.group(1)
                    link_text = link_match.group(2).strip()
                    
                    if not link_url.startswith(('http://', 'https://')):
                        link_url = urljoin("https://www.makro.co.za", link_url)
                    
                    # Skip home link
                    if 'home' in link_text.lower():
                        continue
                    
                    breadcrumb.append({
                        "name": link_text,
                        "url": link_url
                    })
            
            # Add the current category to the breadcrumb
            if "name" in category_data:
                breadcrumb.append({
                    "name": category_data["name"],
                    "url": category_url
                })
            
            if breadcrumb:
                category_data["breadcrumb"] = breadcrumb
    
    # Extract subcategories if not already present
    if "subcategories" not in category_data:
        subcategories = _extract_subcategories_from_html(html_content)
        if subcategories:
            category_data["subcategories"] = subcategories
    
    # Extract filter options if not already present
    if "filters" not in category_data:
        filters = _extract_filters_from_html(html_content)
        if filters:
            category_data["filters"] = filters
    
    # Extract banner information if available
    banner = _extract_banner_from_html(html_content)
    if banner:
        category_data["banner"] = banner
    
    # Extract sorting options if not already present
    if "sort_options" not in category_data:
        sort_options = _extract_sort_options_from_html(html_content)
        if sort_options:
            category_data["sort_options"] = sort_options
    
    # Extract category description if available
    description_match = re.search(r'<div[^>]*class="[^"]*category-description[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if description_match:
        description_html = description_match.group(1)
        # Clean up HTML tags
        description = re.sub(r'<[^>]*>', ' ', description_html)
        description = re.sub(r'\s+', ' ', description).strip()
        if description:
            category_data["description"] = description
    
    return category_data


def _extract_from_category_state(category_state: Dict[str, Any]) -> Dict[str, Any]:
    """Extract category data from window.__INITIAL_STATE__.category JSON.
    
    Args:
        category_state: Category data from __INITIAL_STATE__
        
    Returns:
        Extracted category data
    """
    category_data = {}
    
    # Extract basic category info
    if "name" in category_state:
        category_data["name"] = category_state["name"]
    
    if "code" in category_state:
        category_data["category_id"] = category_state["code"]
    
    if "description" in category_state:
        category_data["description"] = category_state["description"]
    
    # Extract breadcrumb
    if "breadcrumb" in category_state and isinstance(category_state["breadcrumb"], list):
        breadcrumb = []
        for item in category_state["breadcrumb"]:
            if isinstance(item, dict) and "name" in item:
                breadcrumb_item = {
                    "name": item["name"]
                }
                
                if "url" in item:
                    breadcrumb_item["url"] = item["url"]
                    if not breadcrumb_item["url"].startswith(('http://', 'https://')):
                        breadcrumb_item["url"] = urljoin("https://www.makro.co.za", breadcrumb_item["url"])
                
                breadcrumb.append(breadcrumb_item)
        
        if breadcrumb:
            category_data["breadcrumb"] = breadcrumb
    
    # Extract subcategories
    if "subcategories" in category_state and isinstance(category_state["subcategories"], list):
        subcategories = []
        for item in category_state["subcategories"]:
            if isinstance(item, dict) and "name" in item:
                subcategory = {
                    "name": item["name"]
                }
                
                if "code" in item:
                    subcategory["id"] = item["code"]
                
                if "url" in item:
                    subcategory["url"] = item["url"]
                    if not subcategory["url"].startswith(('http://', 'https://')):
                        subcategory["url"] = urljoin("https://www.makro.co.za", subcategory["url"])
                
                if "count" in item:
                    try:
                        subcategory["product_count"] = int(item["count"])
                    except (ValueError, TypeError):
                        pass
                
                subcategories.append(subcategory)
        
        if subcategories:
            category_data["subcategories"] = subcategories
    
    # Extract filters
    if "filters" in category_state and isinstance(category_state["filters"], list):
        filters = []
        for filter_group in category_state["filters"]:
            if isinstance(filter_group, dict) and "name" in filter_group:
                filter_item = {
                    "name": filter_group["name"],
                    "options": []
                }
                
                if "code" in filter_group:
                    filter_item["code"] = filter_group["code"]
                
                if "values" in filter_group and isinstance(filter_group["values"], list):
                    for value in filter_group["values"]:
                        if isinstance(value, dict) and "name" in value:
                            option = {
                                "name": value["name"]
                            }
                            
                            if "code" in value:
                                option["code"] = value["code"]
                            
                            if "count" in value:
                                try:
                                    option["count"] = int(value["count"])
                                except (ValueError, TypeError):
                                    pass
                            
                            if "selected" in value:
                                option["selected"] = bool(value["selected"])
                            
                            filter_item["options"].append(option)
                
                if filter_item["options"]:
                    filters.append(filter_item)
        
        if filters:
            category_data["filters"] = filters
    
    # Extract sort options
    if "sortOptions" in category_state and isinstance(category_state["sortOptions"], list):
        sort_options = []
        for option in category_state["sortOptions"]:
            if isinstance(option, dict) and "name" in option:
                sort_item = {
                    "name": option["name"]
                }
                
                if "code" in option:
                    sort_item["code"] = option["code"]
                
                if "selected" in option:
                    sort_item["selected"] = bool(option["selected"])
                
                sort_options.append(sort_item)
        
        if sort_options:
            category_data["sort_options"] = sort_options
    
    # Extract category banner
    if "banner" in category_state and isinstance(category_state["banner"], dict):
        banner = {}
        
        if "image" in category_state["banner"]:
            banner["image_url"] = category_state["banner"]["image"]
        
        if "title" in category_state["banner"]:
            banner["title"] = category_state["banner"]["title"]
        
        if "description" in category_state["banner"]:
            banner["description"] = category_state["banner"]["description"]
        
        if "url" in category_state["banner"]:
            banner["target_url"] = category_state["banner"]["url"]
            if not banner["target_url"].startswith(('http://', 'https://')):
                banner["target_url"] = urljoin("https://www.makro.co.za", banner["target_url"])
        
        if banner:
            category_data["banner"] = banner
    
    return category_data


def _extract_subcategories_from_html(html_content: str) -> List[Dict[str, Any]]:
    """Extract subcategories from HTML content.
    
    Args:
        html_content: HTML content of the category page
        
    Returns:
        List of subcategory dictionaries
    """
    subcategories = []
    
    # Look for subcategory section
    subcategory_section_match = re.search(r'<div[^>]*class="[^"]*subcategory-list[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if subcategory_section_match:
        subcategory_html = subcategory_section_match.group(1)
        
        # Extract subcategory items
        subcategory_items = re.findall(r'<div[^>]*class="[^"]*subcategory-item[^"]*"[^>]*>(.*?)</div>', subcategory_html, re.DOTALL)
        
        for item in subcategory_items:
            # Extract link and name
            link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', item, re.DOTALL)
            if link_match:
                link_url = link_match.group(1)
                link_html = link_match.group(2)
                
                # Clean up HTML tags to get the name
                name_text = re.sub(r'<[^>]*>', ' ', link_html)
                name = re.sub(r'\s+', ' ', name_text).strip()
                
                subcategory = {
                    "name": name,
                    "url": urljoin("https://www.makro.co.za", link_url)
                }
                
                # Extract ID from URL if possible
                path_parts = urlparse(link_url).path.strip('/').split('/')
                if len(path_parts) > 1 and path_parts[0] == 'c':
                    subcategory["id"] = path_parts[-1]
                
                # Extract product count if available
                count_match = re.search(r'<span[^>]*class="[^"]*count[^"]*"[^>]*>\((\d+)\)</span>', item)
                if count_match:
                    try:
                        subcategory["product_count"] = int(count_match.group(1))
                    except ValueError:
                        pass
                
                subcategories.append(subcategory)
    
    return subcategories


def _extract_filters_from_html(html_content: str) -> List[Dict[str, Any]]:
    """Extract filter options from HTML content.
    
    Args:
        html_content: HTML content of the category page
        
    Returns:
        List of filter dictionaries
    """
    filters = []
    
    # Look for filter section
    filter_section_match = re.search(r'<div[^>]*class="[^"]*filter-section[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if filter_section_match:
        filter_html = filter_section_match.group(1)
        
        # Extract filter groups
        filter_groups = re.findall(r'<div[^>]*class="[^"]*filter-group[^"]*"[^>]*>(.*?)</div>\s*</div>', filter_html, re.DOTALL)
        
        for group in filter_groups:
            # Extract filter name
            name_match = re.search(r'<h3[^>]*class="[^"]*filter-name[^"]*"[^>]*>(.*?)</h3>', group, re.DOTALL)
            if not name_match:
                continue
            
            filter_name = name_match.group(1).strip()
            
            # Create filter group
            filter_group = {
                "name": filter_name,
                "options": []
            }
            
            # Extract filter options
            option_items = re.findall(r'<div[^>]*class="[^"]*filter-option[^"]*"[^>]*>(.*?)</div>', group, re.DOTALL)
            
            for option in option_items:
                # Extract option details
                checkbox_match = re.search(r'<input[^>]*id="([^"]+)"[^>]*value="([^"]+)"', option)
                if not checkbox_match:
                    continue
                
                option_id = checkbox_match.group(1)
                option_value = checkbox_match.group(2)
                
                # Extract option label
                label_match = re.search(r'<label[^>]*for="' + re.escape(option_id) + '"[^>]*>(.*?)</label>', option, re.DOTALL)
                if not label_match:
                    continue
                
                label_html = label_match.group(1)
                
                # Clean up HTML tags to get the option name
                name_text = re.sub(r'<[^>]*>', ' ', label_html)
                option_name = re.sub(r'\s+', ' ', name_text).strip()
                
                # Extract option count if available
                count_match = re.search(r'<span[^>]*class="[^"]*count[^"]*"[^>]*>\((\d+)\)</span>', option)
                
                filter_option = {
                    "name": option_name,
                    "code": option_value
                }
                
                if count_match:
                    try:
                        filter_option["count"] = int(count_match.group(1))
                    except ValueError:
                        pass
                
                # Check if option is selected
                if 'checked' in option:
                    filter_option["selected"] = True
                
                filter_group["options"].append(filter_option)
            
            if filter_group["options"]:
                filters.append(filter_group)
    
    return filters


def _extract_banner_from_html(html_content: str) -> Dict[str, Any]:
    """Extract category banner information from HTML content.
    
    Args:
        html_content: HTML content of the category page
        
    Returns:
        Dictionary with banner information or None if not found
    """
    banner = {}
    
    # Look for category banner
    banner_match = re.search(r'<div[^>]*class="[^"]*category-banner[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if banner_match:
        banner_html = banner_match.group(1)
        
        # Extract banner image
        image_match = re.search(r'<img[^>]*src="([^"]+)"', banner_html)
        if image_match:
            banner["image_url"] = image_match.group(1)
        
        # Extract banner title
        title_match = re.search(r'<h2[^>]*class="[^"]*banner-title[^"]*"[^>]*>(.*?)</h2>', banner_html, re.DOTALL)
        if title_match:
            banner["title"] = title_match.group(1).strip()
        
        # Extract banner description
        description_match = re.search(r'<p[^>]*class="[^"]*banner-description[^"]*"[^>]*>(.*?)</p>', banner_html, re.DOTALL)
        if description_match:
            description_html = description_match.group(1)
            # Clean up HTML tags
            description = re.sub(r'<[^>]*>', ' ', description_html)
            description = re.sub(r'\s+', ' ', description).strip()
            if description:
                banner["description"] = description
        
        # Extract banner link
        link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*banner-link[^"]*"', banner_html)
        if link_match:
            target_url = link_match.group(1)
            if not target_url.startswith(('http://', 'https://')):
                target_url = urljoin("https://www.makro.co.za", target_url)
            banner["target_url"] = target_url
    
    return banner if banner else None


def _extract_sort_options_from_html(html_content: str) -> List[Dict[str, Any]]:
    """Extract sorting options from HTML content.
    
    Args:
        html_content: HTML content of the category page
        
    Returns:
        List of sort option dictionaries
    """
    sort_options = []
    
    # Look for sort selector
    sort_selector_match = re.search(r'<select[^>]*class="[^"]*sort-selector[^"]*"[^>]*>(.*?)</select>', html_content, re.DOTALL)
    if sort_selector_match:
        select_html = sort_selector_match.group(1)
        
        # Extract option elements
        option_matches = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', select_html, re.DOTALL)
        
        for option_value, option_text in option_matches:
            sort_option = {
                "name": option_text.strip(),
                "code": option_value
            }
            
            # Check if this option is selected
            if re.search(r'<option[^>]*value="' + re.escape(option_value) + '"[^>]*selected', select_html):
                sort_option["selected"] = True
            
            sort_options.append(sort_option)
    
    return sort_options