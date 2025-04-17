"""
Product extractor for Makro marketplace.

This module provides functions for extracting product details from Makro's product pages.
"""

import re
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from urllib.parse import urljoin


def extract_product_details(html_content: str, product_url: str) -> Dict[str, Any]:
    """Extract detailed product information from Makro product page HTML.
    
    Args:
        html_content: HTML content of the product page
        product_url: URL of the product page
        
    Returns:
        Dictionary containing product details
    """
    product_data = {
        "url": product_url,
        "timestamp": datetime.now().isoformat(),
        "extraction_method": "raw_html"
    }
    
    # Extract product ID from URL
    if "/p/" in product_url:
        parts = product_url.split("/p/")
        if len(parts) > 1:
            product_id = parts[1].split("?")[0].split("#")[0]
            product_data["product_id"] = product_id
    
    # Try to extract structured JSON data (typically in a script tag)
    json_ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_content, re.DOTALL)
    if json_ld_match:
        try:
            json_ld_data = json.loads(json_ld_match.group(1))
            if isinstance(json_ld_data, dict):
                # Handle single product JSON-LD
                product_data.update(_extract_from_json_ld(json_ld_data))
            elif isinstance(json_ld_data, list):
                # Handle array of JSON-LD (find the product one)
                for item in json_ld_data:
                    if isinstance(item, dict) and item.get("@type") == "Product":
                        product_data.update(_extract_from_json_ld(item))
                        break
        except (json.JSONDecodeError, ValueError) as e:
            pass  # Continue with regular HTML extraction if JSON parsing fails
    
    # Try to extract product data from structured data in window.__INITIAL_STATE__
    initial_state_match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});', html_content, re.DOTALL)
    if initial_state_match:
        try:
            initial_state = json.loads(initial_state_match.group(1))
            if "product" in initial_state and isinstance(initial_state["product"], dict):
                product_state = initial_state["product"]
                product_data.update(_extract_from_initial_state(product_state))
        except (json.JSONDecodeError, ValueError) as e:
            pass  # Continue with regular HTML extraction if JSON parsing fails
    
    # Extract data directly from HTML if needed
    # Title (if not already extracted from structured data)
    if "title" not in product_data:
        title_match = re.search(r'<h1[^>]*class="[^"]*product-name[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
        if title_match:
            product_data["title"] = title_match.group(1).strip()
    
    # Price (if not already extracted from structured data)
    if "price" not in product_data:
        price_match = re.search(r'<div[^>]*class="[^"]*price[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if price_match:
            price_html = price_match.group(1)
            price_value_match = re.search(r'R\s*([\d\s,.]+)', price_html)
            if price_value_match:
                price_str = price_value_match.group(1).replace(" ", "").replace(",", "")
                try:
                    price_value = float(price_str)
                    product_data["price"] = {
                        "current": price_value,
                        "currency": "ZAR"
                    }
                except ValueError:
                    pass
    
    # Brand (if not already extracted from structured data)
    if "brand" not in product_data:
        brand_match = re.search(r'<div[^>]*class="[^"]*brand-name[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if brand_match:
            product_data["brand"] = brand_match.group(1).strip()
    
    # SKU (if not already extracted from structured data)
    if "sku" not in product_data:
        sku_match = re.search(r'<div[^>]*class="[^"]*product-code[^"]*"[^>]*>[^<]*?(\d+)[^<]*?</div>', html_content, re.DOTALL)
        if sku_match:
            product_data["sku"] = sku_match.group(1).strip()
    
    # Description (if not already extracted from structured data)
    if "description" not in product_data:
        description_match = re.search(r'<div[^>]*class="[^"]*product-description[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if description_match:
            # Clean up HTML tags
            description = description_match.group(1)
            description = re.sub(r'<[^>]*>', ' ', description)
            description = re.sub(r'\s+', ' ', description).strip()
            product_data["description"] = description
    
    # Images (if not already extracted from structured data)
    if "images" not in product_data:
        product_data["images"] = _extract_images_from_html(html_content, product_url)
    
    # Extract specifications if not already present
    if "specifications" not in product_data:
        product_data["specifications"] = _extract_specifications_from_html(html_content)
    
    # Extract stock availability
    if "availability" not in product_data:
        availability_match = re.search(r'<div[^>]*class="[^"]*stock-info[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if availability_match:
            availability_text = availability_match.group(1).strip().lower()
            product_data["availability"] = "in_stock" if "in stock" in availability_text else "out_of_stock"
    
    # Extract rating
    if "rating" not in product_data:
        rating_match = re.search(r'<div[^>]*class="[^"]*rating[^"]*"[^>]*data-rating="([^"]+)"', html_content)
        if rating_match:
            try:
                rating_value = float(rating_match.group(1))
                review_count_match = re.search(r'<div[^>]*class="[^"]*review-count[^"]*"[^>]*>\((\d+)\)</div>', html_content)
                review_count = int(review_count_match.group(1)) if review_count_match else 0
                
                product_data["rating"] = {
                    "average": rating_value,
                    "count": review_count
                }
            except ValueError:
                pass
    
    # Extract categories if not already present
    if "categories" not in product_data:
        breadcrumb_match = re.search(r'<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</ol>', html_content, re.DOTALL)
        if breadcrumb_match:
            breadcrumb_html = breadcrumb_match.group(1)
            category_items = re.findall(r'<li[^>]*>(.*?)</li>', breadcrumb_html, re.DOTALL)
            
            categories = []
            for item in category_items:
                # Skip the home link and the current product
                if 'home' in item.lower() or 'product-name' in item:
                    continue
                
                # Extract category name
                category_name_match = re.search(r'>(.*?)</a>', item)
                if category_name_match:
                    category_name = category_name_match.group(1).strip()
                    categories.append(category_name)
            
            if categories:
                product_data["categories"] = categories
    
    # Extract variant information
    variants = _extract_variants_from_html(html_content)
    if variants:
        product_data["variants"] = variants
    
    # Extract seller information
    seller_info = _extract_seller_info_from_html(html_content)
    if seller_info:
        product_data["seller"] = seller_info
    
    # Extract delivery information
    delivery_info = _extract_delivery_info_from_html(html_content)
    if delivery_info:
        product_data["delivery"] = delivery_info
    
    return product_data


def _extract_from_json_ld(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """Extract product data from JSON-LD structured data.
    
    Args:
        json_ld: JSON-LD data from the page
        
    Returns:
        Extracted product data
    """
    product_data = {}
    
    # Basic product info
    if "name" in json_ld:
        product_data["title"] = json_ld["name"]
    
    if "description" in json_ld:
        product_data["description"] = json_ld["description"]
    
    # Brand info
    if "brand" in json_ld:
        if isinstance(json_ld["brand"], dict) and "name" in json_ld["brand"]:
            product_data["brand"] = json_ld["brand"]["name"]
        elif isinstance(json_ld["brand"], str):
            product_data["brand"] = json_ld["brand"]
    
    # SKU and product identifiers
    if "sku" in json_ld:
        product_data["sku"] = json_ld["sku"]
    
    if "mpn" in json_ld:
        product_data["mpn"] = json_ld["mpn"]
    
    if "gtin13" in json_ld:
        product_data["gtin"] = json_ld["gtin13"]
    
    # Price information
    if "offers" in json_ld:
        offers = json_ld["offers"]
        if isinstance(offers, dict):
            price_data = {
                "currency": offers.get("priceCurrency", "ZAR")
            }
            
            if "price" in offers:
                try:
                    price_data["current"] = float(offers["price"])
                except (ValueError, TypeError):
                    pass
            
            if "availability" in offers:
                availability_url = offers["availability"]
                if "InStock" in availability_url:
                    product_data["availability"] = "in_stock"
                elif "OutOfStock" in availability_url:
                    product_data["availability"] = "out_of_stock"
            
            product_data["price"] = price_data
    
    # Images
    if "image" in json_ld:
        if isinstance(json_ld["image"], str):
            product_data["images"] = [json_ld["image"]]
        elif isinstance(json_ld["image"], list):
            product_data["images"] = json_ld["image"]
    
    # Ratings
    if "aggregateRating" in json_ld:
        rating = json_ld["aggregateRating"]
        rating_data = {}
        
        if "ratingValue" in rating:
            try:
                rating_data["average"] = float(rating["ratingValue"])
            except (ValueError, TypeError):
                pass
        
        if "reviewCount" in rating:
            try:
                rating_data["count"] = int(rating["reviewCount"])
            except (ValueError, TypeError):
                pass
        
        if rating_data:
            product_data["rating"] = rating_data
    
    return product_data


def _extract_from_initial_state(product_state: Dict[str, Any]) -> Dict[str, Any]:
    """Extract product data from window.__INITIAL_STATE__ JSON.
    
    Args:
        product_state: Product data from __INITIAL_STATE__
        
    Returns:
        Extracted product data
    """
    product_data = {}
    
    # Extract product details
    if "details" in product_state and isinstance(product_state["details"], dict):
        details = product_state["details"]
        
        # Basic product info
        if "name" in details:
            product_data["title"] = details["name"]
        
        if "description" in details:
            product_data["description"] = details["description"]
        
        if "brandName" in details:
            product_data["brand"] = details["brandName"]
        
        if "code" in details:
            product_data["sku"] = details["code"]
        
        # Price information
        if "price" in details:
            price_obj = details["price"]
            price_data = {
                "currency": "ZAR"
            }
            
            if "value" in price_obj:
                try:
                    price_data["current"] = float(price_obj["value"])
                except (ValueError, TypeError):
                    pass
            
            if "was" in price_obj:
                try:
                    price_data["was"] = float(price_obj["was"])
                except (ValueError, TypeError):
                    pass
            
            product_data["price"] = price_data
        
        # Availability
        if "stock" in details:
            stock_info = details["stock"]
            if isinstance(stock_info, dict) and "status" in stock_info:
                stock_status = stock_info["status"].lower()
                if "in stock" in stock_status:
                    product_data["availability"] = "in_stock"
                else:
                    product_data["availability"] = "out_of_stock"
    
    # Extract images
    if "images" in product_state and isinstance(product_state["images"], list):
        images_list = []
        for image in product_state["images"]:
            if isinstance(image, dict) and "url" in image:
                images_list.append(image["url"])
        
        if images_list:
            product_data["images"] = images_list
    
    # Extract specifications
    if "specifications" in product_state and isinstance(product_state["specifications"], list):
        specs = {}
        for spec in product_state["specifications"]:
            if isinstance(spec, dict) and "name" in spec and "value" in spec:
                specs[spec["name"]] = spec["value"]
        
        if specs:
            product_data["specifications"] = specs
    
    # Extract categories
    if "categories" in product_state and isinstance(product_state["categories"], list):
        categories = []
        for category in product_state["categories"]:
            if isinstance(category, dict) and "name" in category:
                categories.append(category["name"])
        
        if categories:
            product_data["categories"] = categories
    
    # Extract ratings
    if "ratings" in product_state and isinstance(product_state["ratings"], dict):
        ratings = product_state["ratings"]
        rating_data = {}
        
        if "average" in ratings:
            try:
                rating_data["average"] = float(ratings["average"])
            except (ValueError, TypeError):
                pass
        
        if "count" in ratings:
            try:
                rating_data["count"] = int(ratings["count"])
            except (ValueError, TypeError):
                pass
        
        if rating_data:
            product_data["rating"] = rating_data
    
    return product_data


def _extract_images_from_html(html_content: str, base_url: str) -> List[str]:
    """Extract product images from HTML content.
    
    Args:
        html_content: HTML content of the product page
        base_url: Base URL for resolving relative image URLs
        
    Returns:
        List of image URLs
    """
    images = []
    
    # Try to find image gallery container
    gallery_match = re.search(r'<div[^>]*class="[^"]*product-gallery[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if gallery_match:
        gallery_html = gallery_match.group(1)
        # Extract image sources
        img_matches = re.findall(r'<img[^>]*src="([^"]+)"', gallery_html)
        for img_src in img_matches:
            # Skip thumbnail and placeholder images
            if "thumbnail" in img_src or "placeholder" in img_src:
                continue
            # Make absolute URL if needed
            if not img_src.startswith(('http://', 'https://')):
                img_src = urljoin(base_url, img_src)
            images.append(img_src)
    
    # If no gallery found, try to find product image
    if not images:
        main_image_match = re.search(r'<img[^>]*class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"', html_content)
        if main_image_match:
            img_src = main_image_match.group(1)
            if not img_src.startswith(('http://', 'https://')):
                img_src = urljoin(base_url, img_src)
            images.append(img_src)
    
    # Try to find data-src attributes (for lazy-loaded images)
    if not images:
        data_src_matches = re.findall(r'<img[^>]*data-src="([^"]+)"[^>]*class="[^"]*product[^"]*"', html_content)
        for img_src in data_src_matches:
            if not img_src.startswith(('http://', 'https://')):
                img_src = urljoin(base_url, img_src)
            images.append(img_src)
    
    return images


def _extract_specifications_from_html(html_content: str) -> Dict[str, str]:
    """Extract product specifications from HTML content.
    
    Args:
        html_content: HTML content of the product page
        
    Returns:
        Dictionary of specification key-value pairs
    """
    specs = {}
    
    # Look for specifications table
    specs_section_match = re.search(r'<section[^>]*class="[^"]*product-specifications[^"]*"[^>]*>(.*?)</section>', html_content, re.DOTALL)
    if specs_section_match:
        specs_html = specs_section_match.group(1)
        
        # Extract rows from specifications table
        row_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', specs_html, re.DOTALL)
        for row in row_matches:
            # Extract header and data cells
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)
            if len(cells) >= 2:
                header = re.sub(r'<[^>]*>', '', cells[0]).strip()
                value = re.sub(r'<[^>]*>', '', cells[1]).strip()
                if header and value:
                    specs[header] = value
    
    # If no table found, look for specification lists
    if not specs:
        specs_list_match = re.search(r'<div[^>]*class="[^"]*specification-list[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if specs_list_match:
            specs_html = specs_list_match.group(1)
            
            # Extract list items
            item_matches = re.findall(r'<div[^>]*class="[^"]*spec-item[^"]*"[^>]*>(.*?)</div>', specs_html, re.DOTALL)
            for item in item_matches:
                # Extract label and value
                label_match = re.search(r'<span[^>]*class="[^"]*spec-label[^"]*"[^>]*>(.*?)</span>', item, re.DOTALL)
                value_match = re.search(r'<span[^>]*class="[^"]*spec-value[^"]*"[^>]*>(.*?)</span>', item, re.DOTALL)
                
                if label_match and value_match:
                    label = re.sub(r'<[^>]*>', '', label_match.group(1)).strip()
                    value = re.sub(r'<[^>]*>', '', value_match.group(1)).strip()
                    if label and value:
                        specs[label] = value
    
    return specs


def _extract_variants_from_html(html_content: str) -> List[Dict[str, Any]]:
    """Extract product variants from HTML content.
    
    Args:
        html_content: HTML content of the product page
        
    Returns:
        List of variant dictionaries
    """
    variants = []
    
    # Look for variant selectors
    variant_section_match = re.search(r'<div[^>]*class="[^"]*variant-selector[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if variant_section_match:
        variant_html = variant_section_match.group(1)
        
        # Try to extract structured variant data from script tag
        variant_data_match = re.search(r'data-variants="([^"]+)"', variant_html)
        if variant_data_match:
            try:
                # The data is often HTML-escaped JSON
                variant_data_json = variant_data_match.group(1).replace('&quot;', '"')
                variant_data = json.loads(variant_data_json)
                
                if isinstance(variant_data, list):
                    for variant in variant_data:
                        if isinstance(variant, dict):
                            variant_item = {}
                            
                            if "sku" in variant:
                                variant_item["sku"] = variant["sku"]
                            
                            if "attributes" in variant and isinstance(variant["attributes"], dict):
                                variant_item["attributes"] = variant["attributes"]
                            
                            if "price" in variant:
                                try:
                                    variant_item["price"] = float(variant["price"])
                                except (ValueError, TypeError):
                                    pass
                            
                            if "available" in variant:
                                variant_item["available"] = bool(variant["available"])
                            
                            if variant_item:
                                variants.append(variant_item)
            except (json.JSONDecodeError, ValueError):
                pass  # Fall back to HTML parsing if JSON extraction fails
        
        # If no structured data, extract variant options from HTML
        if not variants:
            # Look for variant option groups
            option_group_matches = re.findall(r'<div[^>]*class="[^"]*variant-options[^"]*"[^>]*>(.*?)</div>', variant_html, re.DOTALL)
            
            for group in option_group_matches:
                option_name_match = re.search(r'<label[^>]*>(.*?)</label>', group, re.DOTALL)
                option_name = option_name_match.group(1).strip() if option_name_match else "Option"
                
                # Extract individual options
                option_matches = re.findall(r'<button[^>]*data-value="([^"]+)"[^>]*>(.*?)</button>', group, re.DOTALL)
                
                for option_value, option_label in option_matches:
                    # Clean up option label (remove HTML tags)
                    option_label = re.sub(r'<[^>]*>', '', option_label).strip()
                    
                    variants.append({
                        "name": option_name,
                        "value": option_value,
                        "label": option_label
                    })
    
    return variants


def _extract_seller_info_from_html(html_content: str) -> Optional[Dict[str, Any]]:
    """Extract seller information from HTML content.
    
    Args:
        html_content: HTML content of the product page
        
    Returns:
        Dictionary with seller information or None if not found
    """
    seller_info = {}
    
    # Look for seller information section
    seller_section_match = re.search(r'<div[^>]*class="[^"]*seller-info[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if seller_section_match:
        seller_html = seller_section_match.group(1)
        
        # Extract seller name
        seller_name_match = re.search(r'<span[^>]*class="[^"]*seller-name[^"]*"[^>]*>(.*?)</span>', seller_html, re.DOTALL)
        if seller_name_match:
            seller_info["name"] = seller_name_match.group(1).strip()
        
        # If no explicit seller name, check if it's sold by Makro
        if "name" not in seller_info and "sold by makro" in seller_html.lower():
            seller_info["name"] = "Makro"
        
        # Extract seller rating
        seller_rating_match = re.search(r'<div[^>]*class="[^"]*seller-rating[^"]*"[^>]*>(.*?)</div>', seller_html, re.DOTALL)
        if seller_rating_match:
            rating_html = seller_rating_match.group(1)
            rating_value_match = re.search(r'(\d+\.?\d*)\s*/\s*5', rating_html)
            
            if rating_value_match:
                try:
                    seller_info["rating"] = float(rating_value_match.group(1))
                except ValueError:
                    pass
    
    # If no explicit seller section, assume sold by Makro
    if not seller_info:
        seller_info["name"] = "Makro"
    
    return seller_info if seller_info else None


def _extract_delivery_info_from_html(html_content: str) -> Optional[Dict[str, Any]]:
    """Extract delivery information from HTML content.
    
    Args:
        html_content: HTML content of the product page
        
    Returns:
        Dictionary with delivery information or None if not found
    """
    delivery_info = {}
    
    # Look for delivery information section
    delivery_section_match = re.search(r'<div[^>]*class="[^"]*delivery-info[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if delivery_section_match:
        delivery_html = delivery_section_match.group(1)
        
        # Extract delivery options
        delivery_options = []
        
        # Standard delivery
        standard_match = re.search(r'<div[^>]*class="[^"]*standard-delivery[^"]*"[^>]*>(.*?)</div>', delivery_html, re.DOTALL)
        if standard_match:
            standard_html = standard_match.group(1)
            
            # Try to extract delivery time
            time_match = re.search(r'(\d+-\d+\s+(?:day|week)s)', standard_html, re.IGNORECASE)
            delivery_time = time_match.group(1) if time_match else None
            
            # Try to extract delivery cost
            cost_match = re.search(r'R\s*([\d\s,.]+)', standard_html)
            delivery_cost = None
            if cost_match:
                try:
                    cost_str = cost_match.group(1).replace(" ", "").replace(",", "")
                    delivery_cost = float(cost_str)
                except ValueError:
                    pass
            
            standard_option = {
                "type": "Standard",
                "time": delivery_time
            }
            
            if delivery_cost is not None:
                standard_option["cost"] = delivery_cost
            
            delivery_options.append(standard_option)
        
        # Express delivery
        express_match = re.search(r'<div[^>]*class="[^"]*express-delivery[^"]*"[^>]*>(.*?)</div>', delivery_html, re.DOTALL)
        if express_match:
            express_html = express_match.group(1)
            
            # Try to extract delivery time
            time_match = re.search(r'(\d+-\d+\s+(?:day|week)s)', express_html, re.IGNORECASE)
            delivery_time = time_match.group(1) if time_match else None
            
            # Try to extract delivery cost
            cost_match = re.search(r'R\s*([\d\s,.]+)', express_html)
            delivery_cost = None
            if cost_match:
                try:
                    cost_str = cost_match.group(1).replace(" ", "").replace(",", "")
                    delivery_cost = float(cost_str)
                except ValueError:
                    pass
            
            express_option = {
                "type": "Express",
                "time": delivery_time
            }
            
            if delivery_cost is not None:
                express_option["cost"] = delivery_cost
            
            delivery_options.append(express_option)
        
        # Check for click & collect option
        if "click & collect" in delivery_html.lower() or "click and collect" in delivery_html.lower():
            collect_option = {
                "type": "Click & Collect"
            }
            
            # Try to extract collection time
            time_match = re.search(r'ready in (\d+-\d+\s+(?:day|hour)s)', delivery_html, re.IGNORECASE)
            if time_match:
                collect_option["time"] = time_match.group(1)
            
            delivery_options.append(collect_option)
        
        if delivery_options:
            delivery_info["options"] = delivery_options
    
    return delivery_info if delivery_info else None