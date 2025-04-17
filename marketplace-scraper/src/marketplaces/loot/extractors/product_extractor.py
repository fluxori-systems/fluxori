"""
Product extractor for Loot marketplace.

This module provides functions for extracting product data from Loot's
product detail pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def extract_product_details(html_content: str, product_url: str) -> Dict[str, Any]:
    """Extract product details from Loot product page HTML.
    
    Args:
        html_content: HTML content of the product page
        product_url: URL of the product page
        
    Returns:
        Product data dictionary
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Create product data dictionary
    product_data = {
        "marketplace": "loot",
        "url": product_url
    }
    
    # Extract product ID from URL
    product_id = _extract_product_id(product_url)
    if product_id:
        product_data["product_id"] = product_id
    else:
        # No product ID found, cannot proceed
        return {}
    
    # Extract basic product info
    _extract_basic_info(soup, product_data)
    
    # Extract pricing information
    _extract_pricing(soup, product_data)
    
    # Extract images
    _extract_images(soup, product_data)
    
    # Extract specifications
    _extract_specifications(soup, product_data)
    
    # Extract brand
    _extract_brand(soup, product_data)
    
    # Extract categories
    _extract_categories(soup, product_data)
    
    # Extract seller
    _extract_seller(soup, product_data)
    
    # Extract ratings and reviews
    _extract_ratings(soup, product_data)
    
    # Extract variant info
    _extract_variants(soup, product_data)
    
    # Extract stock status
    _extract_stock_status(soup, product_data)
    
    # Extract shipping info
    _extract_shipping_info(soup, product_data)
    
    # Extract promotions
    _extract_promotions(soup, product_data)
    
    return product_data


def _extract_product_id(product_url: str) -> Optional[str]:
    """Extract product ID from URL.
    
    Args:
        product_url: Product URL
        
    Returns:
        Product ID or None if not found
    """
    # Extract from URL pattern: /product/[title]/[id]
    match = re.search(r'/product/[^/]+/([a-z0-9-]+)$', product_url)
    if match:
        return match.group(1)
        
    return None


def _extract_basic_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract basic product information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract title
    title_element = soup.select_one(".product-title h1")
    if title_element:
        product_data["title"] = title_element.text.strip()
    
    # Extract description
    description_element = soup.select_one(".product-description")
    if description_element:
        product_data["description"] = description_element.text.strip()


def _extract_pricing(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract pricing information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Current price
    current_price_element = soup.select_one(".product-price .current-price")
    if current_price_element:
        price_text = current_price_element.text.strip().replace('R', '').replace(',', '')
        try:
            product_data["price"] = float(price_text)
            product_data["currency"] = "ZAR"
        except ValueError:
            pass
    
    # List price
    list_price_element = soup.select_one(".product-price .original-price")
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


def _extract_images(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product images.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    images = []
    
    # Try to find images in gallery
    image_elements = soup.select(".product-images .image-carousel img")
    for img in image_elements:
        if img.get('src'):
            src = img['src']
            # Convert thumbnail URL to full-size URL if needed
            src = re.sub(r'(_thumb|_small)\.', '.', src)
            images.append(src)
    
    # If no images found in gallery, try main product image
    if not images:
        main_image = soup.select_one(".product-image img")
        if main_image and main_image.get('src'):
            src = main_image['src']
            # Convert thumbnail URL to full-size URL if needed
            src = re.sub(r'(_thumb|_small)\.', '.', src)
            images.append(src)
    
    if images:
        product_data["images"] = images
        product_data["main_image"] = images[0]


def _extract_specifications(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product specifications.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    specs = {}
    
    # Find specification sections
    spec_sections = soup.select(".product-specs .spec-group")
    for section in spec_sections:
        # Find all specification rows
        rows = section.select(".spec-row")
        for row in rows:
            # Extract key and value
            key_elem = row.select_one(".spec-name")
            value_elem = row.select_one(".spec-value")
            
            if key_elem and value_elem:
                key = key_elem.text.strip()
                value = value_elem.text.strip()
                
                if key and value:
                    specs[key] = value
    
    # If no spec groups, try looking for table-based specs
    if not specs:
        spec_tables = soup.select(".product-details table")
        for table in spec_tables:
            rows = table.select("tr")
            for row in rows:
                cells = row.select("td")
                if len(cells) >= 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    
                    if key and value:
                        specs[key] = value
    
    if specs:
        product_data["specifications"] = specs


def _extract_brand(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product brand.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Try to find brand in specifications
    if "specifications" in product_data:
        brand_keys = ["Brand", "Publisher", "Author", "Manufacturer"]
        for key in brand_keys:
            if key in product_data["specifications"]:
                product_data["brand"] = product_data["specifications"][key]
                return
    
    # Try to find brand element
    brand_element = soup.select_one(".product-brand")
    if brand_element:
        product_data["brand"] = brand_element.text.strip()
        return
        
    # Try to find brand in breadcrumb
    breadcrumbs = soup.select(".breadcrumbs a")
    for crumb in breadcrumbs:
        href = crumb.get('href', '')
        if 'brand/' in href or 'publisher/' in href:
            product_data["brand"] = crumb.text.strip()
            return


def _extract_categories(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product categories.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    categories = []
    category_ids = []
    
    # Extract from breadcrumbs
    breadcrumbs = soup.select(".breadcrumbs a")
    for crumb in breadcrumbs[1:]:  # Skip first (Home)
        category_name = crumb.text.strip()
        href = crumb.get('href', '')
        
        # Skip brand crumbs
        if 'brand/' in href or 'publisher/' in href:
            continue
            
        if category_name and category_name.lower() != 'home':
            categories.append(category_name)
            
            # Try to extract category ID from URL
            cat_id_match = re.search(r'category/([^/]+)', href)
            if cat_id_match:
                category_ids.append(cat_id_match.group(1))
    
    if categories:
        product_data["categories"] = categories
        
    if category_ids:
        product_data["category_ids"] = category_ids


def _extract_seller(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract seller information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    seller_element = soup.select_one(".seller-info .seller-name")
    if seller_element:
        product_data["seller"] = seller_element.text.strip()
        
        # Check if it's a marketplace seller or Loot
        if product_data["seller"].lower() != "loot":
            product_data["is_marketplace"] = True
        else:
            product_data["is_marketplace"] = False


def _extract_ratings(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract ratings and reviews.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract rating score
    rating_container = soup.select_one(".rating-stars")
    if rating_container:
        # Try to extract from data attribute first
        if 'data-rating' in rating_container.attrs:
            try:
                product_data["rating"] = float(rating_container['data-rating'])
            except ValueError:
                pass
        
        # Fallback to counting filled stars
        if "rating" not in product_data:
            filled_stars = rating_container.select(".filled-star")
            if filled_stars:
                product_data["rating"] = len(filled_stars)
    
    # Extract review count
    review_count_element = soup.select_one(".review-count")
    if review_count_element:
        review_text = review_count_element.text.strip()
        count_match = re.search(r'(\d+)', review_text)
        if count_match:
            try:
                product_data["review_count"] = int(count_match.group(1))
            except ValueError:
                pass


def _extract_variants(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product variants.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    variants = []
    
    # Find variant selectors (may be dropdowns or buttons)
    variant_containers = soup.select(".product-variants .variant-group")
    if not variant_containers:
        return
        
    for container in variant_containers:
        # Extract variant type
        variant_type_element = container.select_one(".variant-type")
        if not variant_type_element:
            continue
            
        variant_type = variant_type_element.text.strip()
        
        # Extract variant options
        variant_options = container.select(".variant-option")
        
        for option in variant_options:
            variant_info = {
                "type": variant_type,
                "value": option.text.strip()
            }
            
            # Extract variant URL/ID
            option_link = option.get('href') or option.get('data-url')
            if option_link:
                variant_id_match = re.search(r'/([a-z0-9-]+)$', option_link)
                if variant_id_match:
                    variant_info["variant_id"] = variant_id_match.group(1)
            
            variants.append(variant_info)
    
    if variants:
        product_data["variants"] = variants


def _extract_stock_status(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract stock availability status.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Check for out of stock indicator
    out_of_stock = soup.select_one(".out-of-stock, .unavailable")
    if out_of_stock:
        product_data["in_stock"] = False
        return
    
    # Check for "add to cart" button (indicates in stock)
    add_to_cart = soup.select_one(".add-to-cart-button:not(.disabled)")
    if add_to_cart:
        product_data["in_stock"] = True
    
    # Try to extract stock level
    stock_level_element = soup.select_one(".stock-level")
    if stock_level_element:
        stock_text = stock_level_element.text.strip()
        
        # Extract numeric value if available
        stock_match = re.search(r'(\d+)', stock_text)
        if stock_match:
            try:
                product_data["stock_level"] = int(stock_match.group(1))
            except ValueError:
                pass


def _extract_shipping_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract shipping information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    shipping_info = {}
    
    # Check for free delivery
    free_delivery = soup.select_one(".free-delivery")
    if free_delivery:
        shipping_info["free_shipping"] = True
    
    # Extract delivery time
    delivery_element = soup.select_one(".delivery-info")
    if delivery_element:
        delivery_text = delivery_element.text.strip()
        shipping_info["delivery_time"] = delivery_text
    
    if shipping_info:
        product_data["shipping_info"] = shipping_info


def _extract_promotions(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract promotion information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Check for promotions
    promo_element = soup.select_one(".promotion-badge, .discount-label")
    if promo_element:
        promo_text = promo_element.text.strip()
        if promo_text:
            product_data["promotion"] = promo_text
        else:
            # Generic promotion label if text is empty
            product_data["promotion"] = "Special Offer"