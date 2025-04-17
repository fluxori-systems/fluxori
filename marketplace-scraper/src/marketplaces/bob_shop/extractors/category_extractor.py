"""
Category details extractor for Bob Shop marketplace.

This module provides specialized functions for extracting category details
from Bob Shop category pages using HTML parsing.
"""

import re
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin
from datetime import datetime


def extract_category_details(html_content: str, category_url: str) -> Dict[str, Any]:
    """Extract category details from Bob Shop category page HTML.
    
    Args:
        html_content: Raw HTML content of the category page
        category_url: URL of the category page
        
    Returns:
        Dictionary containing category information
    """
    # Initialize category data structure
    category_data = {
        "url": category_url,
        "timestamp": datetime.now().isoformat(),
        "subcategories": [],
        "products": []
    }
    
    # Extract category ID and handle from URL
    if "/collections/" in category_url:
        parts = category_url.split("/collections/")
        if len(parts) > 1:
            category_handle = parts[1].split("?")[0].split("#")[0]
            category_data["category_id"] = category_handle
            category_data["handle"] = category_handle
    
    # Extract category title
    title_match = re.search(r'<h1[^>]*class="[^"]*collection-header__title[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
    if title_match:
        title = re.sub(r'<[^>]*>', '', title_match.group(1)).strip()
        category_data["title"] = title
    else:
        # Fallback: try meta title
        meta_title_match = re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]*)"', html_content)
        if meta_title_match:
            category_data["title"] = meta_title_match.group(1)
    
    # Extract category description
    desc_match = re.search(r'<div[^>]*class="[^"]*collection-description[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if desc_match:
        desc = re.sub(r'<br\s*/?>|</p>|</div>|</h\d>', '\n', desc_match.group(1))
        desc = re.sub(r'<[^>]*>', '', desc)
        desc = re.sub(r'\s*\n\s*', '\n', desc)
        desc = re.sub(r'\n{3,}', '\n\n', desc)
        category_data["description"] = desc.strip()
    
    # Extract subcategories
    subcategories = extract_subcategories(html_content, category_url)
    if subcategories:
        category_data["subcategories"] = subcategories
    
    # Extract breadcrumbs to determine category path
    breadcrumbs = extract_breadcrumbs(html_content)
    if breadcrumbs:
        category_data["breadcrumbs"] = breadcrumbs
        
        # Create path from breadcrumbs (exclude the current category)
        if len(breadcrumbs) > 1:
            category_data["path"] = [crumb["text"] for crumb in breadcrumbs[:-1]]
            
            # Determine parent category if possible
            if len(breadcrumbs) > 2:
                parent_crumb = breadcrumbs[-2]
                if "url" in parent_crumb and parent_crumb["url"]:
                    parent_url = parent_crumb["url"]
                    if "/collections/" in parent_url:
                        parent_id = parent_url.split("/collections/")[-1].split("?")[0].split("#")[0]
                        category_data["parent_id"] = parent_id
    
    # Extract featured image if available
    image_match = re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]*)"', html_content)
    if image_match:
        category_data["image"] = image_match.group(1)
    
    # Extract filters
    filters = extract_filters(html_content)
    if filters:
        category_data["filters"] = filters
    
    # Extract sorting options
    sort_options = extract_sort_options(html_content)
    if sort_options:
        category_data["sort_options"] = sort_options
    
    # Extract total product count if available
    count_match = re.search(r'<span[^>]*class="[^"]*product-count[^"]*"[^>]*>(\d+)[^<]*</span>', html_content)
    if count_match:
        try:
            product_count = int(count_match.group(1))
            category_data["product_count"] = product_count
        except ValueError:
            pass
    
    # Extract pagination information
    pagination_data = extract_pagination(html_content)
    if pagination_data:
        category_data.update(pagination_data)
    
    return category_data


def extract_subcategories(html_content: str, base_url: str) -> List[Dict[str, Any]]:
    """Extract subcategories from category page HTML.
    
    Args:
        html_content: Raw HTML content
        base_url: Base URL for resolving relative paths
        
    Returns:
        List of subcategory dictionaries
    """
    subcategories = []
    
    # Look for subcategories section
    subcategory_section = re.search(r'<div[^>]*class="[^"]*subcategories[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if subcategory_section:
        section_content = subcategory_section.group(1)
        
        # Extract subcategory links
        link_matches = re.findall(r'<a[^>]*href="(/collections/[^"]+)"[^>]*>(.*?)</a>', section_content, re.DOTALL)
        for url_path, text in link_matches:
            # Clean up the text
            clean_text = re.sub(r'<[^>]*>', '', text).strip()
            if clean_text:
                # Extract subcategory ID from URL
                subcat_id = url_path.split("/collections/")[-1].split("?")[0].split("#")[0]
                
                subcategory = {
                    "id": subcat_id,
                    "title": clean_text,
                    "url": urljoin(base_url, url_path)
                }
                
                # Extract image if available
                img_match = re.search(rf'<a[^>]*href="{re.escape(url_path)}"[^>]*>.*?<img[^>]*src="([^"]*)"', section_content, re.DOTALL)
                if img_match:
                    subcategory["image"] = img_match.group(1)
                
                subcategories.append(subcategory)
    
    # Alternative: look for category menu
    if not subcategories:
        menu_section = re.search(r'<ul[^>]*class="[^"]*category-menu[^"]*"[^>]*>(.*?)</ul>', html_content, re.DOTALL)
        if menu_section:
            section_content = menu_section.group(1)
            
            # Extract menu items
            item_matches = re.findall(r'<li[^>]*>(.*?)</li>', section_content, re.DOTALL)
            for item in item_matches:
                link_match = re.search(r'<a[^>]*href="(/collections/[^"]+)"[^>]*>(.*?)</a>', item, re.DOTALL)
                if link_match:
                    url_path = link_match.group(1)
                    clean_text = re.sub(r'<[^>]*>', '', link_match.group(2)).strip()
                    
                    if clean_text:
                        # Extract subcategory ID from URL
                        subcat_id = url_path.split("/collections/")[-1].split("?")[0].split("#")[0]
                        
                        subcategory = {
                            "id": subcat_id,
                            "title": clean_text,
                            "url": urljoin(base_url, url_path)
                        }
                        
                        subcategories.append(subcategory)
    
    return subcategories


def extract_breadcrumbs(html_content: str) -> List[Dict[str, str]]:
    """Extract breadcrumb navigation from category page HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of breadcrumb dictionaries with text and url
    """
    breadcrumbs = []
    
    # Look for breadcrumb section
    breadcrumb_section = re.search(r'<nav[^>]*class="[^"]*breadcrumbs[^"]*"[^>]*>(.*?)</nav>', html_content, re.DOTALL)
    if breadcrumb_section:
        section_content = breadcrumb_section.group(1)
        
        # Extract links
        link_matches = re.findall(r'<a[^>]*href="([^"]*)"[^>]*>.*?<span>(.*?)</span>', section_content, re.DOTALL)
        for url, text in link_matches:
            clean_text = re.sub(r'<[^>]*>', '', text).strip()
            if clean_text:
                breadcrumbs.append({"text": clean_text, "url": url})
        
        # Extract current item (not a link)
        current_match = re.search(r'<span[^>]*class="[^"]*breadcrumbs__item[^"]*"[^>]*>.*?<span[^>]*>(.*?)</span></span>', section_content, re.DOTALL)
        if current_match:
            clean_text = re.sub(r'<[^>]*>', '', current_match.group(1)).strip()
            if clean_text:
                breadcrumbs.append({"text": clean_text, "url": ""})
    
    return breadcrumbs


def extract_filters(html_content: str) -> List[Dict[str, Any]]:
    """Extract available filters from category page HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of filter dictionaries
    """
    filters = []
    
    # Look for filter section
    filter_section = re.search(r'<div[^>]*class="[^"]*facets[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', html_content, re.DOTALL)
    if filter_section:
        section_content = filter_section.group(1)
        
        # Extract individual filter groups
        group_matches = re.findall(r'<details[^>]*class="[^"]*facets__details[^"]*"[^>]*>(.*?)</details>', section_content, re.DOTALL)
        for group_html in group_matches:
            # Extract group name
            group_name_match = re.search(r'<summary[^>]*class="[^"]*facets__summary[^"]*"[^>]*>.*?<span[^>]*>(.*?)</span>', group_html, re.DOTALL)
            if not group_name_match:
                continue
                
            group_name = re.sub(r'<[^>]*>', '', group_name_match.group(1)).strip()
            
            # Extract filter values
            values = []
            value_matches = re.findall(r'<label[^>]*class="[^"]*facets__label[^"]*"[^>]*>.*?<input[^>]*value="([^"]*)"[^>]*>.*?<span[^>]*>(.*?)</span>', group_html, re.DOTALL)
            
            for value, label in value_matches:
                # Clean up the label text
                clean_label = re.sub(r'<[^>]*>', '', label).strip()
                if clean_label:
                    # Look for count
                    count_match = re.search(r'\((\d+)\)$', clean_label)
                    count = None
                    if count_match:
                        try:
                            count = int(count_match.group(1))
                            # Remove count from label
                            clean_label = re.sub(r'\s*\(\d+\)$', '', clean_label)
                        except ValueError:
                            pass
                    
                    value_data = {
                        "value": value,
                        "label": clean_label
                    }
                    
                    if count is not None:
                        value_data["count"] = count
                    
                    values.append(value_data)
            
            if values:
                filter_data = {
                    "name": group_name,
                    "values": values
                }
                filters.append(filter_data)
    
    return filters


def extract_sort_options(html_content: str) -> List[Dict[str, str]]:
    """Extract sorting options from category page HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of sort option dictionaries
    """
    sort_options = []
    
    # Look for sort select element
    sort_select = re.search(r'<select[^>]*class="[^"]*sort-options[^"]*"[^>]*>(.*?)</select>', html_content, re.DOTALL)
    if sort_select:
        select_content = sort_select.group(1)
        
        # Extract options
        option_matches = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', select_content, re.DOTALL)
        for value, label in option_matches:
            clean_label = re.sub(r'<[^>]*>', '', label).strip()
            if clean_label and value:
                sort_options.append({
                    "value": value,
                    "label": clean_label
                })
    
    return sort_options


def extract_pagination(html_content: str) -> Dict[str, Any]:
    """Extract pagination information from category page HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Dictionary with pagination details
    """
    pagination_data = {}
    
    # Look for pagination element
    pagination_section = re.search(r'<nav[^>]*class="[^"]*pagination[^"]*"[^>]*>(.*?)</nav>', html_content, re.DOTALL)
    if pagination_section:
        section_content = pagination_section.group(1)
        
        # Extract current page
        current_page_match = re.search(r'<span[^>]*class="[^"]*pagination__current[^"]*"[^>]*>(\d+)</span>', section_content)
        if current_page_match:
            try:
                pagination_data["current_page"] = int(current_page_match.group(1))
            except ValueError:
                pass
        
        # Extract last page number (total pages)
        page_numbers = re.findall(r'<a[^>]*class="[^"]*pagination__item[^"]*"[^>]*>(\d+)</a>', section_content)
        if page_numbers:
            try:
                pagination_data["total_pages"] = max(int(p) for p in page_numbers)
            except ValueError:
                pass
        
        # Check if there's a next page
        next_page_link = re.search(r'<a[^>]*class="[^"]*pagination__next[^"]*"[^>]*>', section_content)
        pagination_data["has_next_page"] = next_page_link is not None
        
        # Check if there's a previous page
        prev_page_link = re.search(r'<a[^>]*class="[^"]*pagination__prev[^"]*"[^>]*>', section_content)
        pagination_data["has_previous_page"] = prev_page_link is not None
    
    return pagination_data