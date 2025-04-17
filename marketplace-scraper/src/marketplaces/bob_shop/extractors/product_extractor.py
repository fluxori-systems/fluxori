"""
Product detail extractor for Bob Shop marketplace.

This module provides specialized functions for extracting product details from
Bob Shop product pages using HTML parsing when template-based extraction fails.
"""

import re
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin
from datetime import datetime


def extract_product_details(html_content: str, product_url: str) -> Dict[str, Any]:
    """Extract product details from Bob Shop product page HTML.
    
    Args:
        html_content: Raw HTML content of the product page
        product_url: URL of the product page
        
    Returns:
        Dictionary containing structured product information
    """
    # Initialize product data structure
    product_data = {
        "url": product_url,
        "timestamp": datetime.now().isoformat(),
        "marketplace": "bob_shop",
    }
    
    # Extract product ID and handle from URL
    if "/products/" in product_url:
        parts = product_url.split("/products/")
        if len(parts) > 1:
            product_handle = parts[1].split("?")[0].split("#")[0]
            product_data["product_id"] = product_handle
            product_data["handle"] = product_handle
    
    # Try to extract structured JSON data first (most reliable method)
    structured_data = extract_structured_data(html_content)
    if structured_data:
        # Merge structured data with our data structure
        product_data.update(structured_data)
    
    # Extract title if not found in structured data
    if "title" not in product_data or not product_data["title"]:
        product_data["title"] = extract_title(html_content)
    
    # Extract price if not found in structured data
    if "price" not in product_data or not product_data["price"]:
        price_data = extract_price(html_content)
        if price_data:
            product_data["price"] = price_data
    
    # Extract images if not found in structured data
    if "images" not in product_data or not product_data["images"]:
        product_data["images"] = extract_images(html_content, product_url)
    
    # Extract description if not found in structured data
    if "description" not in product_data or not product_data["description"]:
        product_data["description"] = extract_description(html_content)
    
    # Extract specifications if not found in structured data
    if "specifications" not in product_data or not product_data["specifications"]:
        product_data["specifications"] = extract_specifications(html_content)
    
    # Extract brand if not found in structured data
    if "brand" not in product_data or not product_data["brand"]:
        product_data["brand"] = extract_brand(html_content)
    
    # Extract availability if not found in structured data
    if "availability" not in product_data or not product_data["availability"]:
        product_data["availability"] = extract_availability(html_content)
    
    # Extract seller information
    product_data["seller"] = extract_seller_info(html_content, product_url)
    
    # Extract variants
    product_data["variants"] = extract_variants(html_content)
    
    # Extract breadcrumbs for category path
    breadcrumbs = extract_breadcrumbs(html_content)
    if breadcrumbs:
        product_data["breadcrumbs"] = breadcrumbs
        # Extract categories from breadcrumbs
        if "categories" not in product_data or not product_data["categories"]:
            product_data["categories"] = [crumb["text"] for crumb in breadcrumbs[1:]]  # Skip first (home)
    
    # Extract ratings
    rating_data = extract_ratings(html_content)
    if rating_data:
        product_data["rating"] = rating_data
    
    return product_data


def extract_structured_data(html_content: str) -> Dict[str, Any]:
    """Extract structured JSON-LD or microdata from the HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Dictionary of extracted structured data or empty dict
    """
    # Try to extract JSON-LD
    json_ld_match = re.search(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html_content, re.DOTALL)
    if json_ld_match:
        try:
            json_data = json.loads(json_ld_match.group(1))
            # Handle array of JSON-LD objects
            if isinstance(json_data, list):
                # Look for Product schema
                for item in json_data:
                    if item.get("@type") == "Product":
                        json_data = item
                        break
            
            # If it's a Product schema
            if json_data.get("@type") == "Product":
                result = {}
                
                # Extract basic product info
                result["title"] = json_data.get("name", "")
                
                # Extract description
                result["description"] = json_data.get("description", "")
                
                # Extract brand
                if "brand" in json_data:
                    if isinstance(json_data["brand"], dict):
                        result["brand"] = json_data["brand"].get("name", "")
                    else:
                        result["brand"] = str(json_data["brand"])
                
                # Extract images
                if "image" in json_data:
                    if isinstance(json_data["image"], list):
                        result["images"] = json_data["image"]
                    else:
                        result["images"] = [json_data["image"]]
                
                # Extract price
                if "offers" in json_data:
                    offers = json_data["offers"]
                    
                    # Handle single offer
                    if isinstance(offers, dict):
                        result["price"] = {
                            "current": float(offers.get("price", 0)),
                            "currency": offers.get("priceCurrency", "ZAR"),
                            "availability": "in_stock" if offers.get("availability", "").endswith("InStock") else "out_of_stock"
                        }
                    
                    # Handle multiple offers
                    elif isinstance(offers, list) and offers:
                        # Use the first offer for now
                        first_offer = offers[0]
                        result["price"] = {
                            "current": float(first_offer.get("price", 0)),
                            "currency": first_offer.get("priceCurrency", "ZAR"),
                            "availability": "in_stock" if first_offer.get("availability", "").endswith("InStock") else "out_of_stock"
                        }
                
                # Extract specifications
                if "additionalProperty" in json_data and isinstance(json_data["additionalProperty"], list):
                    specs = {}
                    for prop in json_data["additionalProperty"]:
                        if isinstance(prop, dict) and "name" in prop and "value" in prop:
                            specs[prop["name"]] = prop["value"]
                    if specs:
                        result["specifications"] = specs
                
                # Extract ratings
                if "aggregateRating" in json_data:
                    agg_rating = json_data["aggregateRating"]
                    result["rating"] = {
                        "average": float(agg_rating.get("ratingValue", 0)),
                        "count": int(agg_rating.get("reviewCount", 0)),
                        "scale": 5  # Assuming 5-star scale
                    }
                
                return result
                
        except json.JSONDecodeError:
            pass  # Failed to parse JSON-LD
    
    # No structured data found
    return {}


def extract_title(html_content: str) -> str:
    """Extract product title from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Product title string
    """
    # Look for product title in product detail section
    title_match = re.search(r'<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
    if title_match:
        # Clean up HTML entities and whitespace
        title = re.sub(r'<[^>]*>', '', title_match.group(1))
        title = re.sub(r'\s+', ' ', title).strip()
        return title
    
    # Fallback: try meta title
    meta_title_match = re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]*)"', html_content)
    if meta_title_match:
        return meta_title_match.group(1)
    
    # Second fallback: document title
    doc_title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.DOTALL)
    if doc_title_match:
        # Remove site name if present
        title = doc_title_match.group(1)
        title = re.sub(r'\s*\|.*$', '', title)  # Remove "| Bob Shop" suffix
        return title.strip()
    
    return ""


def extract_price(html_content: str) -> Dict[str, Any]:
    """Extract price information from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Dictionary with price details
    """
    price_data = {
        "current": 0.0,
        "currency": "ZAR"
    }
    
    # Look for current price
    current_price_match = re.search(r'<span[^>]*class="[^"]*price-item--regular[^"]*"[^>]*[^>]*>([^<]*)</span>', html_content)
    if current_price_match:
        price_text = current_price_match.group(1).strip()
        # Extract numeric value
        price_value = re.sub(r'[^\d.]', '', price_text)
        try:
            price_data["current"] = float(price_value)
        except ValueError:
            pass
    
    # Look for sale price
    sale_price_match = re.search(r'<span[^>]*class="[^"]*price-item--sale[^"]*"[^>]*>([^<]*)</span>', html_content)
    if sale_price_match:
        price_text = sale_price_match.group(1).strip()
        # Extract numeric value
        price_value = re.sub(r'[^\d.]', '', price_text)
        try:
            price_data["current"] = float(price_value)
            # Original price becomes the compare_at price
            if "current" in price_data and price_data["current"] > 0:
                price_data["compare_at"] = price_data["current"]
        except ValueError:
            pass
    
    # Look for currency
    currency_match = re.search(r'<meta[^>]*property="og:price:currency"[^>]*content="([^"]*)"', html_content)
    if currency_match:
        price_data["currency"] = currency_match.group(1)
    
    return price_data


def extract_images(html_content: str, base_url: str) -> List[str]:
    """Extract product images from HTML.
    
    Args:
        html_content: Raw HTML content
        base_url: Base URL for resolving relative paths
        
    Returns:
        List of image URLs
    """
    images = []
    
    # Look for image gallery data
    gallery_match = re.search(r'data-product-media-gallery="([^"]*)"', html_content)
    if gallery_match:
        try:
            gallery_data = json.loads(gallery_match.group(1).replace('&quot;', '"'))
            if isinstance(gallery_data, list):
                for item in gallery_data:
                    if isinstance(item, dict) and "src" in item:
                        img_url = item["src"]
                        if not img_url.startswith('http'):
                            img_url = urljoin(base_url, img_url)
                        images.append(img_url)
        except json.JSONDecodeError:
            pass
    
    # If no gallery data, look for image tags
    if not images:
        # Look for product gallery images
        img_matches = re.findall(r'<img[^>]*class="[^"]*product__image[^"]*"[^>]*src="([^"]*)"', html_content)
        for img_src in img_matches:
            if not img_src.startswith('http'):
                img_src = urljoin(base_url, img_src)
            images.append(img_src)
    
    # If still no images, try the og:image tag
    if not images:
        og_img_match = re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]*)"', html_content)
        if og_img_match:
            img_src = og_img_match.group(1)
            if not img_src.startswith('http'):
                img_src = urljoin(base_url, img_src)
            images.append(img_src)
    
    return images


def extract_description(html_content: str) -> str:
    """Extract product description from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Description string
    """
    # Look for product description in dedicated section
    desc_match = re.search(r'<div[^>]*class="[^"]*product-description[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if desc_match:
        # Clean up HTML but preserve basic formatting
        desc = desc_match.group(1)
        # Replace some tags with newlines for readability
        desc = re.sub(r'<br\s*/?>|</p>|</div>|</h\d>', '\n', desc)
        # Remove all remaining HTML tags
        desc = re.sub(r'<[^>]*>', '', desc)
        # Clean up whitespace
        desc = re.sub(r'\s*\n\s*', '\n', desc)
        desc = re.sub(r'\n{3,}', '\n\n', desc)
        return desc.strip()
    
    # Fallback: try meta description
    meta_desc_match = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', html_content)
    if meta_desc_match:
        return meta_desc_match.group(1)
    
    return ""


def extract_specifications(html_content: str) -> Dict[str, str]:
    """Extract product specifications from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Dictionary of specifications
    """
    specs = {}
    
    # Look for specification tables
    spec_section_match = re.search(r'<div[^>]*class="[^"]*product-specs[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if spec_section_match:
        spec_section = spec_section_match.group(1)
        
        # Look for table rows
        row_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', spec_section, re.DOTALL)
        for row in row_matches:
            # Extract name from th cell
            name_match = re.search(r'<th[^>]*>(.*?)</th>', row, re.DOTALL)
            # Extract value from td cell
            value_match = re.search(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
            
            if name_match and value_match:
                name = re.sub(r'<[^>]*>', '', name_match.group(1)).strip()
                value = re.sub(r'<[^>]*>', '', value_match.group(1)).strip()
                if name and value:
                    specs[name] = value
    
    # If no table found, try looking for definition lists
    if not specs:
        dl_match = re.search(r'<dl[^>]*class="[^"]*product-details[^"]*"[^>]*>(.*?)</dl>', html_content, re.DOTALL)
        if dl_match:
            dl_content = dl_match.group(1)
            
            # Get all dt/dd pairs
            dt_matches = re.findall(r'<dt[^>]*>(.*?)</dt>\s*<dd[^>]*>(.*?)</dd>', dl_content, re.DOTALL)
            for dt, dd in dt_matches:
                name = re.sub(r'<[^>]*>', '', dt).strip()
                value = re.sub(r'<[^>]*>', '', dd).strip()
                if name and value:
                    specs[name] = value
    
    return specs


def extract_brand(html_content: str) -> str:
    """Extract product brand from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Brand name string
    """
    # Look for brand in meta tags
    brand_meta_match = re.search(r'<meta[^>]*property="product:brand"[^>]*content="([^"]*)"', html_content)
    if brand_meta_match:
        return brand_meta_match.group(1)
    
    # Look for brand in vendor section
    vendor_match = re.search(r'<div[^>]*class="[^"]*product-vendor[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if vendor_match:
        vendor = re.sub(r'<[^>]*>', '', vendor_match.group(1)).strip()
        return vendor
    
    # Look for brand in specs
    specs = extract_specifications(html_content)
    if "Brand" in specs:
        return specs["Brand"]
    
    return ""


def extract_availability(html_content: str) -> str:
    """Extract product availability from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Availability status string
    """
    # Look for in-stock or out-of-stock indicators
    if re.search(r'<button[^>]*disabled[^>]*class="[^"]*add-to-cart[^"]*"', html_content) or \
       re.search(r'<div[^>]*class="[^"]*sold-out[^"]*"[^>]*>', html_content) or \
       re.search(r'Out of stock', html_content, re.IGNORECASE):
        return "out_of_stock"
    
    # If add-to-cart button is present and not disabled, assume in stock
    if re.search(r'<button[^>]*class="[^"]*add-to-cart[^"]*"[^>]*>', html_content) and \
       not re.search(r'<button[^>]*disabled[^>]*class="[^"]*add-to-cart[^"]*"', html_content):
        return "in_stock"
    
    # Default to in_stock if we can't determine
    return "in_stock"


def extract_seller_info(html_content: str, base_url: str) -> Dict[str, Any]:
    """Extract seller information from HTML.
    
    Args:
        html_content: Raw HTML content
        base_url: Base URL for resolving relative paths
        
    Returns:
        Dictionary with seller details
    """
    seller_info = {}
    
    # Look for seller section
    seller_section = re.search(r'<div[^>]*class="[^"]*seller-info[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if seller_section:
        section_content = seller_section.group(1)
        
        # Extract seller name
        name_match = re.search(r'<a[^>]*class="[^"]*seller-name[^"]*"[^>]*>(.*?)</a>', section_content, re.DOTALL)
        if name_match:
            seller_info["name"] = re.sub(r'<[^>]*>', '', name_match.group(1)).strip()
        
        # Extract seller URL
        url_match = re.search(r'<a[^>]*class="[^"]*seller-name[^"]*"[^>]*href="([^"]*)"', section_content)
        if url_match:
            seller_url = url_match.group(1)
            if not seller_url.startswith('http'):
                seller_url = urljoin(base_url, seller_url)
            seller_info["url"] = seller_url
        
        # Extract seller rating
        rating_match = re.search(r'<span[^>]*class="[^"]*seller-rating[^"]*"[^>]*>(.*?)</span>', section_content, re.DOTALL)
        if rating_match:
            try:
                rating_text = re.sub(r'<[^>]*>', '', rating_match.group(1)).strip()
                rating = float(re.search(r'(\d+(\.\d+)?)', rating_text).group(1))
                seller_info["rating"] = rating
            except (ValueError, AttributeError):
                pass
    
    return seller_info


def extract_variants(html_content: str) -> List[Dict[str, Any]]:
    """Extract product variants from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of variant dictionaries
    """
    variants = []
    
    # Look for variant JSON data
    variants_json_match = re.search(r'var\s+productVariants\s*=\s*(\[.*?\]);', html_content, re.DOTALL)
    if variants_json_match:
        try:
            variants_data = json.loads(variants_json_match.group(1))
            for variant in variants_data:
                if isinstance(variant, dict):
                    variant_info = {
                        "id": variant.get("id", ""),
                        "title": variant.get("title", ""),
                        "price": float(variant.get("price", 0)) / 100,  # Assuming price is in cents
                        "available": variant.get("available", False)
                    }
                    
                    # Extract options
                    if "options" in variant and isinstance(variant["options"], list):
                        variant_info["options"] = variant["options"]
                    
                    variants.append(variant_info)
        except json.JSONDecodeError:
            pass
    
    # If no JSON data found, try to extract from option selectors
    if not variants:
        # Look for option selectors
        option_matches = re.findall(r'<select[^>]*name="options\[\d+\]"[^>]*>(.*?)</select>', html_content, re.DOTALL)
        
        if option_matches:
            # At least we can extract available options
            options = []
            for option_html in option_matches:
                option_name_match = re.search(r'data-option-name="([^"]*)"', option_html)
                option_name = option_name_match.group(1) if option_name_match else ""
                
                values = []
                value_matches = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', option_html, re.DOTALL)
                for value, label in value_matches:
                    if value and not value.startswith('-'):  # Skip placeholder options
                        values.append(value)
                
                if option_name and values:
                    options.append({
                        "name": option_name,
                        "values": values
                    })
            
            if options:
                variants = [{"options": options}]
    
    return variants


def extract_breadcrumbs(html_content: str) -> List[Dict[str, str]]:
    """Extract breadcrumb navigation path.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        List of breadcrumb dictionaries with text and url
    """
    breadcrumbs = []
    
    # Look for breadcrumb navigation
    breadcrumb_section = re.search(r'<nav[^>]*class="[^"]*breadcrumbs[^"]*"[^>]*>(.*?)</nav>', html_content, re.DOTALL)
    if breadcrumb_section:
        section_content = breadcrumb_section.group(1)
        
        # Extract links
        link_matches = re.findall(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', section_content, re.DOTALL)
        for url, text in link_matches:
            clean_text = re.sub(r'<[^>]*>', '', text).strip()
            if clean_text:
                breadcrumbs.append({
                    "text": clean_text,
                    "url": url
                })
        
        # Extract current page (last breadcrumb, not a link)
        current_match = re.search(r'<span[^>]*class="[^"]*breadcrumb__current[^"]*"[^>]*>(.*?)</span>', section_content, re.DOTALL)
        if current_match:
            clean_text = re.sub(r'<[^>]*>', '', current_match.group(1)).strip()
            if clean_text:
                breadcrumbs.append({
                    "text": clean_text,
                    "url": ""  # No URL for current page
                })
    
    return breadcrumbs


def extract_ratings(html_content: str) -> Dict[str, Any]:
    """Extract product ratings from HTML.
    
    Args:
        html_content: Raw HTML content
        
    Returns:
        Dictionary with rating details
    """
    rating_data = {}
    
    # Look for rating section
    rating_section = re.search(r'<div[^>]*class="[^"]*product-ratings[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
    if rating_section:
        section_content = rating_section.group(1)
        
        # Extract average rating
        avg_match = re.search(r'<span[^>]*class="[^"]*rating-value[^"]*"[^>]*>(.*?)</span>', section_content, re.DOTALL)
        if avg_match:
            try:
                avg_text = re.sub(r'<[^>]*>', '', avg_match.group(1)).strip()
                avg_rating = float(re.search(r'(\d+(\.\d+)?)', avg_text).group(1))
                rating_data["average"] = avg_rating
            except (ValueError, AttributeError):
                pass
        
        # Extract rating count
        count_match = re.search(r'<span[^>]*class="[^"]*rating-count[^"]*"[^>]*>\((\d+)\)</span>', section_content)
        if count_match:
            try:
                rating_data["count"] = int(count_match.group(1))
            except ValueError:
                pass
    
    # If no dedicated section, try to find in review section
    if not rating_data:
        review_section = re.search(r'<div[^>]*class="[^"]*product-reviews[^"]*"[^>]*>(.*?)</div>', html_content, re.DOTALL)
        if review_section:
            section_content = review_section.group(1)
            
            # Extract average rating
            avg_match = re.search(r'(\d+(\.\d+)?)\s*out of\s*5', section_content)
            if avg_match:
                try:
                    rating_data["average"] = float(avg_match.group(1))
                except ValueError:
                    pass
            
            # Extract rating count
            count_match = re.search(r'Based on\s*(\d+)\s*reviews', section_content)
            if count_match:
                try:
                    rating_data["count"] = int(count_match.group(1))
                except ValueError:
                    pass
    
    return rating_data