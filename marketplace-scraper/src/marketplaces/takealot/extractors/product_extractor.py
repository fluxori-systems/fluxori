"""
Product extractor for Takealot marketplace.

This module provides functions for extracting product data from Takealot's
product detail pages.
"""

import re
import json
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def extract_product_details(html_content: str, product_url: str) -> Dict[str, Any]:
    """Extract product details from Takealot product page HTML.
    
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
        "marketplace": "takealot",
        "url": product_url
    }
    
    # Extract product ID from URL
    product_id = _extract_product_id(product_url)
    if product_id:
        product_data["product_id"] = product_id
    else:
        # Fallback to extraction from page
        product_id_match = re.search(r'PLID(\d+)', html_content)
        if product_id_match:
            product_data["product_id"] = product_id_match.group(1)
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
    # Extract from PLID in URL
    plid_match = re.search(r'PLID(\d+)', product_url)
    if plid_match:
        return plid_match.group(1)
        
    # Extract from canonical URL format
    path_parts = urlparse(product_url).path.split('/')
    if len(path_parts) >= 3 and path_parts[-2] == 'product':
        return path_parts[-1]
        
    return None


def _extract_basic_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract basic product information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract title
    title_element = soup.select_one('.pdp-title')
    if title_element:
        product_data["title"] = title_element.text.strip()
    
    # Extract description
    description_element = soup.select_one('.pdp-description')
    if description_element:
        product_data["description"] = description_element.text.strip()
    

def _extract_pricing(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract pricing information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Current price
    current_price_element = soup.select_one('.currency-module_currency_29IIm .amount')
    if current_price_element:
        price_text = current_price_element.text.strip().replace('R', '').replace(',', '')
        try:
            product_data["price"] = float(price_text)
            product_data["currency"] = "ZAR"
        except ValueError:
            pass
    
    # List price
    list_price_element = soup.select_one('.pdp-show-desktop del')
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
    image_elements = soup.select('.pdp-images-module_slider-list_R6wFj img')
    for img in image_elements:
        if img.get('src'):
            src = img['src']
            # Convert thumbnail URL to full-size URL
            src = re.sub(r'[_-]\d+x\d+', '', src)
            images.append(src)
    
    # If no images found in gallery, try main product image
    if not images:
        main_image = soup.select_one('.pdp-images-module_slider-container_1FWu1 img')
        if main_image and main_image.get('src'):
            src = main_image['src']
            # Convert thumbnail URL to full-size URL
            src = re.sub(r'[_-]\d+x\d+', '', src)
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
    spec_sections = soup.select('.pdp-specifications-module_section_1TbAF')
    for section in spec_sections:
        # Find all specification rows
        rows = section.select('.detail-row')
        for row in rows:
            # Extract key and value
            key_elem = row.select_one('.detail-row-item:first-child')
            value_elem = row.select_one('.detail-row-item:last-child')
            
            if key_elem and value_elem:
                key = key_elem.text.strip()
                value = value_elem.text.strip()
                
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
    if "specifications" in product_data and "Brand" in product_data["specifications"]:
        product_data["brand"] = product_data["specifications"]["Brand"]
        return
    
    # Try to find brand in breadcrumb
    brand_element = soup.select_one('.pdp-breadcrumb-module_crumb_5qpA6[href*="/brand/"]')
    if brand_element:
        product_data["brand"] = brand_element.text.strip()


def _extract_categories(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product categories.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    categories = []
    category_ids = []
    
    # Extract from breadcrumbs
    breadcrumbs = soup.select('.pdp-breadcrumb-module_crumb_5qpA6')
    for crumb in breadcrumbs[1:]:  # Skip first (Home)
        category_name = crumb.text.strip()
        href = crumb.get('href', '')
        
        # Skip brand crumbs
        if 'brand/' in href:
            continue
            
        if category_name and category_name != 'Home':
            categories.append(category_name)
            
            # Try to extract category ID from URL
            cat_id_match = re.search(r'Categories/(\d+)', href)
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
    seller_element = soup.select_one('.pdp-marketplace-seller-module_name_y9-wg')
    if seller_element:
        product_data["seller"] = seller_element.text.strip()
        
        # Check if it's a marketplace seller or Takealot
        if product_data["seller"].lower() != "takealot":
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
    rating_element = soup.select_one('.review-module_star-rating-container_jlVJL .review-rating')
    if rating_element:
        rating_text = rating_element.text.strip().split('/')[0]
        try:
            product_data["rating"] = float(rating_text)
        except ValueError:
            pass
    
    # Extract review count
    review_count_element = soup.select_one('.review-module_star-rating-container_jlVJL .review-count')
    if review_count_element:
        review_text = review_count_element.text.strip().replace('(', '').replace(')', '')
        try:
            product_data["review_count"] = int(review_text)
        except ValueError:
            pass


def _extract_variants(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract product variants.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    variants = []
    
    # Find variant selectors
    variant_containers = soup.select('.pdp-select-a-variant-module_container_3YtFX')
    if not variant_containers:
        return
        
    for container in variant_containers:
        # Extract variant type
        variant_type_element = container.select_one('.pdp-select-a-variant-module_title_3YR9C')
        if not variant_type_element:
            continue
            
        variant_type = variant_type_element.text.strip()
        
        # Extract variant options
        variant_options = container.select('.pdp-select-a-variant-module_variant-option_1zszp')
        
        for option in variant_options:
            variant_info = {
                "type": variant_type,
                "value": option.text.strip()
            }
            
            # Extract variant URL/ID
            option_link = option.get('href')
            if option_link:
                variant_id_match = re.search(r'PLID(\d+)', option_link)
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
    out_of_stock = soup.select_one('.pdp-out-of-stock-module_container_1B85s')
    if out_of_stock:
        product_data["in_stock"] = False
        return
    
    # Check for "add to cart" button (indicates in stock)
    add_to_cart = soup.select_one('.add-to-cart-button')
    if add_to_cart:
        product_data["in_stock"] = True
    
    # Try to extract stock level
    stock_level_element = soup.select_one('.stock-availability-module_stock-level_28kjG')
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
    free_delivery = soup.select_one('.free-delivery')
    if free_delivery:
        shipping_info["free_shipping"] = True
    
    # Extract delivery time
    delivery_element = soup.select_one('.pdp-fulfillment-information-module_container_1jexO')
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
    # Check for Daily Deal
    daily_deal = soup.select_one('.pdp-deal-badge-module_daily-deal_1kUdX')
    if daily_deal:
        product_data["promotion"] = "Daily Deal"
    
    # Check for other promotions
    promo_element = soup.select_one('.pdp-promotion-module_container_1psoO')
    if promo_element and not product_data.get("promotion"):
        product_data["promotion"] = promo_element.text.strip()