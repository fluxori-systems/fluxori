"""
Product extractor for Buck.cheap website.

This module provides functions for extracting product data from Buck.cheap's
product detail pages.
"""

import re
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def extract_product_details(html_content: str, product_url: str) -> Dict[str, Any]:
    """Extract product details from Buck.cheap product page HTML.
    
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
        "marketplace": "buck_cheap",
        "url": product_url
    }
    
    # Extract product ID from URL
    product_id = _extract_product_id(product_url)
    if product_id:
        product_data["product_id"] = product_id
    
    # Extract basic product info
    _extract_basic_info(soup, product_data)
    
    # Extract retailer information
    _extract_retailer_info(soup, product_data)
    
    # Extract current pricing information
    _extract_pricing(soup, product_data)
    
    # Extract images
    _extract_images(soup, product_data)
    
    # Extract date information
    _extract_date_info(soup, product_data)
    
    # Extract any available stock status
    _extract_stock_status(soup, product_data)
    
    return product_data


def _extract_product_id(product_url: str) -> Optional[str]:
    """Extract product ID from URL.
    
    Args:
        product_url: Product URL
        
    Returns:
        Product ID or None if not found
    """
    # Extract retailer and product ID from URL
    # Expected format: /retailer/id-product-name
    url_parts = urlparse(product_url).path.strip('/').split('/')
    
    if len(url_parts) >= 2:
        retailer = url_parts[0]
        
        # Extract ID from the next part, which is usually ID-title
        id_parts = url_parts[1].split('-', 1)
        if id_parts:
            product_id = f"{retailer}_{id_parts[0]}"
            return product_id
    
    # Fallback to just using the path as ID
    return urlparse(product_url).path.strip('/').replace('/', '_')


def _extract_basic_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract basic product information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract title
    title_element = soup.select_one('.product-title, h1')
    if title_element:
        product_data["title"] = title_element.text.strip()
    
    # Extract description
    description_element = soup.select_one('.product-description, .description, [itemprop="description"]')
    if description_element:
        product_data["description"] = description_element.text.strip()
    
    # Extract breadcrumb categories if available
    categories = []
    breadcrumbs = soup.select('.breadcrumbs a, .breadcrumb a')
    for crumb in breadcrumbs:
        category_name = crumb.text.strip()
        if category_name and category_name.lower() not in ('home', 'buck.cheap'):
            categories.append(category_name)
    
    if categories:
        product_data["categories"] = categories


def _extract_retailer_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract retailer information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract retailer name
    retailer_element = soup.select_one('.retailer-name, .retailer, [itemprop="brand"]')
    if retailer_element:
        product_data["retailer_name"] = retailer_element.text.strip()
    
    # Extract retailer URL
    retailer_link = soup.select_one('a.retailer-link, a.original-link, a[href*=".co.za"]')
    if retailer_link and retailer_link.get('href'):
        product_data["retailer_url"] = retailer_link['href']
        
        # Try to determine retailer from URL
        retailer_map = {
            'takealot.com': 'takealot',
            'makro.co.za': 'makro',
            'pnp.co.za': 'pnp',
            'picknpay.co.za': 'pnp',
            'checkers.co.za': 'checkers',
            'woolworths.co.za': 'woolworths',
            'game.co.za': 'game',
            'dischem.co.za': 'dis-chem',
            'clicks.co.za': 'clicks',
            'incredible.co.za': 'incredible'
        }
        
        url = product_data["retailer_url"].lower()
        for domain, retailer in retailer_map.items():
            if domain in url:
                product_data["retailer"] = retailer
                break


def _extract_pricing(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract pricing information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract current price
    price_element = soup.select_one('.current-price, .price, [itemprop="price"]')
    if price_element:
        price_text = price_element.text.strip()
        # Extract numeric value from price text (e.g., "R123.45" -> 123.45)
        price_match = re.search(r'R\s*(\d+(?:[.,]\d+)?)', price_text)
        if price_match:
            try:
                # Replace comma with dot for float conversion
                price_str = price_match.group(1).replace(',', '.')
                product_data["price"] = float(price_str)
                product_data["currency"] = "ZAR"
            except ValueError:
                pass
    
    # Extract original price if available (for discounted items)
    original_price_element = soup.select_one('.original-price, .list-price, del, .strikethrough')
    if original_price_element:
        price_text = original_price_element.text.strip()
        price_match = re.search(r'R\s*(\d+(?:[.,]\d+)?)', price_text)
        if price_match:
            try:
                price_str = price_match.group(1).replace(',', '.')
                product_data["list_price"] = float(price_str)
                
                # Calculate discount percentage if both prices are available
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
    image_elements = soup.select('.product-image, .product-gallery img, [itemprop="image"]')
    for img in image_elements:
        if img.get('src'):
            images.append(img['src'])
            
    # If we found images, add to product data
    if images:
        product_data["images"] = images
        product_data["main_image"] = images[0]


def _extract_date_info(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract date information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract date added
    date_added_element = soup.select_one('.date-added, .added-date, [itemprop="dateCreated"]')
    if date_added_element:
        product_data["date_added"] = date_added_element.text.strip()
    
    # Extract last updated
    last_updated_element = soup.select_one('.last-updated, .updated-date, [itemprop="dateModified"]')
    if last_updated_element:
        product_data["last_updated"] = last_updated_element.text.strip()


def _extract_stock_status(soup: BeautifulSoup, product_data: Dict[str, Any]) -> None:
    """Extract stock status information.
    
    Args:
        soup: BeautifulSoup object
        product_data: Product data dictionary to update
    """
    # Extract stock status
    stock_element = soup.select_one('.stock-status, .availability, [itemprop="availability"]')
    if stock_element:
        stock_text = stock_element.text.strip().lower()
        
        # Determine stock status
        if any(term in stock_text for term in ['in stock', 'available']):
            product_data["in_stock"] = True
        elif any(term in stock_text for term in ['out of stock', 'unavailable', 'sold out']):
            product_data["in_stock"] = False