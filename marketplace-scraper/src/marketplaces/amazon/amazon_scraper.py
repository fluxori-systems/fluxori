"""
Amazon South Africa scraper implementation for marketplace data collection.

This module provides the Amazon-specific implementation of the marketplace scraper,
with optimized template-based extraction of product data, search results, reviews,
and more from Amazon South Africa.
"""

import asyncio
import json
import logging
import re
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Set, Tuple
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, quote

# Import base scraper
from ...common.base_scraper import MarketplaceScraper, NetworkError, LoadSheddingDetectedError
from ...common.proxy_client import SmartProxyClient
from ...storage.repository import MarketplaceDataRepository


class AmazonSAScraper(MarketplaceScraper):
    """Amazon South Africa scraper implementation optimized for template-based extraction.
    
    This class provides specialized methods for scraping Amazon South Africa's website,
    leveraging SmartProxy's specialized Amazon templates for optimal data extraction.
    Features include:
    - Product extraction with specialized ASIN templates
    - Search results with geo-targeting for South Africa
    - Price monitoring with historical tracking
    - Reviews and ratings extraction
    - Bestseller discovery by category
    - Data processors for standardized outputs
    """
    
    def __init__(self, 
                 proxy_client: SmartProxyClient, 
                 storage_client: MarketplaceDataRepository,
                 request_interval: float = 2.0):
        """Initialize the Amazon South Africa scraper.
        
        Args:
            proxy_client: SmartProxy client for web requests
            storage_client: Repository client for data storage
            request_interval: Minimum interval between requests (in seconds)
        """
        # Initialize with template support enabled and compatible templates
        super().__init__(
            proxy_client=proxy_client,
            storage_client=storage_client,
            marketplace_name="amazon_sa",
            base_url="https://www.amazon.co.za",
            request_interval=request_interval,
            respect_robots=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            template_support=True,
            compatible_templates=list(proxy_client.AMAZON_TEMPLATES.values())
        )
        
        # Amazon-specific constants
        self.search_base_url = "https://www.amazon.co.za/s"
        self.product_base_url = "https://www.amazon.co.za/dp"
        self.bestsellers_url = "https://www.amazon.co.za/gp/bestsellers/"
        self.price_history = {}  # In-memory price history cache
        
        # Template mapping for different data types
        self.template_map = {
            "product": proxy_client.AMAZON_TEMPLATES["product"],
            "search": proxy_client.AMAZON_TEMPLATES["search"],
            "reviews": proxy_client.AMAZON_TEMPLATES["reviews"],
            "pricing": proxy_client.AMAZON_TEMPLATES["pricing"],
            "bestsellers": proxy_client.AMAZON_TEMPLATES["bestsellers"],
            "sellers": proxy_client.AMAZON_TEMPLATES["sellers"]
        }
        
        # Performance tracking for different template types
        self.template_performance = {
            "product": {"attempts": 0, "successes": 0, "failures": 0},
            "search": {"attempts": 0, "successes": 0, "failures": 0},
            "pricing": {"attempts": 0, "successes": 0, "failures": 0},
            "reviews": {"attempts": 0, "successes": 0, "failures": 0},
            "bestsellers": {"attempts": 0, "successes": 0, "failures": 0},
            "sellers": {"attempts": 0, "successes": 0, "failures": 0}
        }
    
    async def discover_products(self, 
                              category: Optional[str] = None, 
                              page: int = 1, 
                              limit: int = 50) -> List[str]:
        """Discover products from Amazon South Africa.
        
        Args:
            category: Category path or ID (optional)
            page: Page number (1-based)
            limit: Maximum number of products to return
            
        Returns:
            List of product ASINs
            
        Raises:
            NetworkError: If page couldn't be fetched
            ValueError: If invalid parameters provided
        """
        try:
            product_asins = []
            
            # Determine URL based on parameters
            if category:
                if category.startswith('http'):
                    # Direct category URL
                    url = f"{category}&page={page}"
                elif category.startswith('/'):
                    # Category path
                    url = f"{self.base_url}{category}?page={page}"
                else:
                    # Try to use as a category node ID or search term
                    if category.isdigit():
                        # Category node ID
                        url = f"{self.base_url}/s?node={category}&page={page}"
                    else:
                        # Search term for department
                        url = f"{self.search_base_url}?k={quote(category)}&page={page}"
            else:
                # Default to bestsellers if no category provided
                url = f"{self.bestsellers_url}?pg={page}"
            
            # Use the appropriate template based on URL type
            if "bestsellers" in url:
                template = self.template_map["bestsellers"]
                template_params = {"page": str(page)}
                self.template_performance["bestsellers"]["attempts"] += 1
            else:
                template = self.template_map["search"]
                template_params = {"page": str(page)}
                self.template_performance["search"]["attempts"] += 1
            
            # Fetch the page with template-based extraction
            response = await self.fetch_page(
                url=url,
                use_js=True,
                template=template,
                template_params=template_params
            )
            
            # Extract ASINs from the response
            if "parsed_content" in response:
                # Extract from structured data
                parsed_data = response["parsed_content"]
                
                # Update template performance tracking
                if "bestsellers" in url:
                    self.template_performance["bestsellers"]["successes"] += 1
                else:
                    self.template_performance["search"]["successes"] += 1
                
                if "products" in parsed_data:
                    # Extract ASINs from products list
                    for product in parsed_data["products"][:limit]:
                        if "asin" in product:
                            product_asins.append(product["asin"])
                
                elif "items" in parsed_data:
                    # Extract ASINs from bestsellers
                    for item in parsed_data["items"][:limit]:
                        if "asin" in item:
                            product_asins.append(item["asin"])
                
            else:
                # Fallback to regex extraction from HTML
                html_content = response.get("content", "")
                
                # Update template performance tracking
                if "bestsellers" in url:
                    self.template_performance["bestsellers"]["failures"] += 1
                else:
                    self.template_performance["search"]["failures"] += 1
                
                # Extract ASINs using regex pattern
                asin_pattern = r'data-asin="([A-Z0-9]{10})"'
                found_asins = re.findall(asin_pattern, html_content)
                
                # Deduplicate ASINs and limit to requested amount
                product_asins = list(dict.fromkeys(found_asins))[:limit]
            
            self.logger.info(f"Discovered {len(product_asins)} products from Amazon SA")
            return product_asins
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during product discovery: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during product discovery: {str(e)}")
            raise
    
    async def extract_product_details(self, product_id_or_url: str) -> Dict[str, Any]:
        """Extract detailed product information from Amazon.
        
        Args:
            product_id_or_url: Product ASIN, URL, or path
            
        Returns:
            Product details dictionary
            
        Raises:
            NetworkError: If product page couldn't be fetched
            ValueError: If invalid product ID or URL provided
        """
        try:
            # Determine ASIN and URL
            asin = self._extract_asin(product_id_or_url)
            if not asin:
                raise ValueError(f"Invalid Amazon product ID or URL: {product_id_or_url}")
                
            product_url = f"{self.product_base_url}/{asin}"
            
            # Track template usage
            self.template_performance["product"]["attempts"] += 1
            
            # Fetch product data using the product template
            template_params = {"asin": asin}
            
            response = await self.fetch_page(
                url=product_url,
                use_js=True,
                template=self.template_map["product"],
                template_params=template_params
            )
            
            # Process the response
            product_data = {}
            
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["product"]["successes"] += 1
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Map parsed fields to our schema
                product_data = {
                    "product_id": asin,
                    "marketplace": self.marketplace_name,
                    "url": product_url,
                    "timestamp": datetime.now().isoformat(),
                    "extraction_method": "template"
                }
                
                # Map common fields
                field_mapping = {
                    "title": "title",
                    "description": "description",
                    "brand": "brand",
                    "rating": "rating",
                    "review_count": "review_count",
                    "images": "images",
                    "price": "price",
                    "currency": "currency",
                    "in_stock": "in_stock",
                    "features": "features", 
                    "categories": "categories"
                }
                
                for our_field, parsed_field in field_mapping.items():
                    if parsed_field in parsed_data:
                        product_data[our_field] = parsed_data[parsed_field]
                
                # Process special fields
                if "price" in parsed_data:
                    try:
                        # Extract numeric price
                        price_str = str(parsed_data["price"]).replace('R', '').replace(',', '')
                        product_data["price"] = float(price_str)
                    except (ValueError, TypeError):
                        # Keep original price if conversion fails
                        pass
                
                # Set default currency for Amazon SA
                if "price" in product_data and "currency" not in product_data:
                    product_data["currency"] = "ZAR"
                
                # Extract specifications if available
                if "specifications" in parsed_data:
                    product_data["specifications"] = {}
                    
                    for spec in parsed_data["specifications"]:
                        if isinstance(spec, dict) and "name" in spec and "value" in spec:
                            product_data["specifications"][spec["name"]] = spec["value"]
                
                # Process list price and discount if available
                if "list_price" in parsed_data:
                    try:
                        list_price_str = str(parsed_data["list_price"]).replace('R', '').replace(',', '')
                        product_data["list_price"] = float(list_price_str)
                        
                        # Calculate discount percentage
                        if "price" in product_data and product_data["price"] < product_data["list_price"]:
                            discount = (1 - (product_data["price"] / product_data["list_price"])) * 100
                            product_data["discount_percentage"] = round(discount, 2)
                    except (ValueError, TypeError):
                        pass
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["product"]["failures"] += 1
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                product_data = self._extract_product_from_html(html_content, asin, product_url)
            
            # Save product data
            if product_data and "title" in product_data:
                await self.storage_client.save_product(product_data)
                self.logger.info(f"Extracted and saved Amazon product {asin}")
                
                # Update price history
                if "price" in product_data:
                    self._update_price_history(asin, product_data["price"], product_data.get("currency", "ZAR"))
                
            return product_data
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting product details: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting product details: {str(e)}")
            raise
    
    def _extract_product_from_html(self, html_content: str, asin: str, product_url: str) -> Dict[str, Any]:
        """Extract product details from raw HTML when template extraction fails.
        
        Args:
            html_content: Raw HTML content
            asin: Product ASIN
            product_url: Product URL
            
        Returns:
            Product details dictionary
        """
        # Basic extraction of key information using regex patterns
        product_data = {
            "product_id": asin,
            "marketplace": self.marketplace_name,
            "url": product_url,
            "timestamp": datetime.now().isoformat(),
            "extraction_method": "html"
        }
        
        # Extract title
        title_pattern = r'<span id="productTitle" class="[^"]*">([^<]+)</span>'
        title_match = re.search(title_pattern, html_content)
        if title_match:
            product_data["title"] = title_match.group(1).strip()
        
        # Extract price
        price_pattern = r'<span class="a-price-whole">([^<]+)</span><span class="a-price-fraction">([^<]+)</span>'
        price_match = re.search(price_pattern, html_content)
        if price_match:
            whole = price_match.group(1).replace(',', '')
            fraction = price_match.group(2)
            try:
                product_data["price"] = float(f"{whole}.{fraction}")
                product_data["currency"] = "ZAR"
            except ValueError:
                pass
        
        # Extract brand
        brand_pattern = r'<a id="bylineInfo" class="[^"]*" href="[^"]*">([^<]+)</a>'
        brand_match = re.search(brand_pattern, html_content)
        if brand_match:
            brand_text = brand_match.group(1).strip()
            if 'brand:' in brand_text.lower():
                product_data["brand"] = brand_text.split(':')[1].strip()
            else:
                product_data["brand"] = brand_text
        
        # Extract rating
        rating_pattern = r'<span class="a-icon-alt">([0-9\.]+) out of 5 stars</span>'
        rating_match = re.search(rating_pattern, html_content)
        if rating_match:
            try:
                product_data["rating"] = float(rating_match.group(1))
            except ValueError:
                pass
        
        # Extract review count
        review_pattern = r'<span id="acrCustomerReviewText" class="[^"]*">([0-9,]+) ratings</span>'
        review_match = re.search(review_pattern, html_content)
        if review_match:
            try:
                review_count = review_match.group(1).replace(',', '')
                product_data["review_count"] = int(review_count)
            except ValueError:
                pass
        
        # Extract main image
        image_pattern = r'<img[^>]*id="landingImage"[^>]*src="([^"]+)"'
        image_match = re.search(image_pattern, html_content)
        if image_match:
            product_data["images"] = [image_match.group(1)]
        
        # Extract availability
        in_stock_pattern = r'<span class="a-size-medium a-color-success">([^<]+)</span>'
        in_stock_match = re.search(in_stock_pattern, html_content)
        if in_stock_match:
            status_text = in_stock_match.group(1).strip().lower()
            product_data["in_stock"] = "in stock" in status_text
        
        return product_data
    
    async def search_products(self, 
                            keyword: str, 
                            page: int = 1, 
                            limit: int = 50) -> Dict[str, Any]:
        """Search for products on Amazon using a keyword.
        
        Args:
            keyword: Search keyword or phrase
            page: Page number (1-based)
            limit: Maximum number of products to return
            
        Returns:
            Search results with products and metadata
            
        Raises:
            NetworkError: If search page couldn't be fetched
        """
        try:
            # Track template usage
            self.template_performance["search"]["attempts"] += 1
            
            # Build search URL
            search_url = f"{self.search_base_url}?k={quote(keyword)}&page={page}"
            
            # Fetch search results using the search template
            template_params = {
                "keyword": keyword,
                "page": str(page)
            }
            
            response = await self.fetch_page(
                url=search_url,
                use_js=True,
                template=self.template_map["search"],
                template_params=template_params
            )
            
            # Initialize search results
            search_data = {
                "keyword": keyword,
                "marketplace": self.marketplace_name,
                "page": page,
                "timestamp": datetime.now().isoformat(),
                "results": []
            }
            
            # Process the response
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["search"]["successes"] += 1
                search_data["extraction_method"] = "template"
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Extract total results count if available
                if "total_results" in parsed_data:
                    search_data["total_results"] = parsed_data["total_results"]
                
                # Extract search results
                if "products" in parsed_data:
                    result_position = 1
                    
                    for product in parsed_data["products"][:limit]:
                        result = {"position": result_position}
                        
                        # Map fields
                        field_mapping = {
                            "asin": "product_id",
                            "title": "title",
                            "price": "price",
                            "rating": "rating",
                            "review_count": "review_count",
                            "image": "image_url",
                            "url": "url",
                            "sponsored": "sponsored"
                        }
                        
                        for parsed_field, our_field in field_mapping.items():
                            if parsed_field in product:
                                result[our_field] = product[parsed_field]
                        
                        # Process price if available
                        if "price" in result:
                            try:
                                price_str = str(result["price"]).replace('R', '').replace(',', '')
                                result["price"] = float(price_str)
                                result["currency"] = "ZAR"
                            except (ValueError, TypeError):
                                pass
                        
                        search_data["results"].append(result)
                        result_position += 1
                
                # Extract search suggestions if available
                if "related_searches" in parsed_data:
                    search_data["suggestions"] = parsed_data["related_searches"]
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["search"]["failures"] += 1
                search_data["extraction_method"] = "html"
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                
                # Extract search results using regex patterns
                # Extract products using a regex pattern that matches product cards
                product_pattern = r'<div data-asin="([A-Z0-9]{10})"[^>]*>.*?<span class="a-size-medium">(.*?)</span>.*?<span class="a-price">(.*?)</span>'
                product_matches = re.finditer(product_pattern, html_content, re.DOTALL)
                
                result_position = 1
                for match in product_matches:
                    if result_position > limit:
                        break
                        
                    asin = match.group(1)
                    title = match.group(2).strip()
                    price_html = match.group(3)
                    
                    # Extract price from price HTML
                    price_match = re.search(r'<span class="a-price-whole">([^<]+)</span><span class="a-price-fraction">([^<]+)</span>', price_html)
                    price = None
                    if price_match:
                        whole = price_match.group(1).replace(',', '')
                        fraction = price_match.group(2)
                        try:
                            price = float(f"{whole}.{fraction}")
                        except ValueError:
                            pass
                            
                    # Create result
                    result = {
                        "position": result_position,
                        "product_id": asin,
                        "title": title,
                        "price": price,
                        "currency": "ZAR" if price else None,
                        "url": f"{self.product_base_url}/{asin}"
                    }
                    
                    search_data["results"].append(result)
                    result_position += 1
            
            # Update result count
            search_data["result_count"] = len(search_data["results"])
            
            # Save search results
            await self.storage_client.save_search_results(search_data)
            self.logger.info(f"Extracted and saved search results for '{keyword}' with {search_data['result_count']} results")
            
            return search_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during search: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during search: {str(e)}")
            raise
    
    async def extract_product_reviews(self, 
                                    product_id_or_url: str, 
                                    page: int = 1, 
                                    limit: int = 20) -> Dict[str, Any]:
        """Extract product reviews from Amazon.
        
        Args:
            product_id_or_url: Product ASIN, URL, or path
            page: Page number (1-based)
            limit: Maximum number of reviews to return
            
        Returns:
            Reviews data dictionary
            
        Raises:
            NetworkError: If reviews page couldn't be fetched
        """
        try:
            # Track template usage
            self.template_performance["reviews"]["attempts"] += 1
            
            # Determine ASIN and URL
            asin = self._extract_asin(product_id_or_url)
            if not asin:
                raise ValueError(f"Invalid Amazon product ID or URL: {product_id_or_url}")
                
            # Build reviews URL
            reviews_url = f"{self.base_url}/product-reviews/{asin}?pageNumber={page}"
            
            # Fetch reviews using the reviews template
            template_params = {
                "asin": asin,
                "page": str(page)
            }
            
            response = await self.fetch_page(
                url=reviews_url,
                use_js=True,
                template=self.template_map["reviews"],
                template_params=template_params
            )
            
            # Initialize reviews data
            reviews_data = {
                "product_id": asin,
                "marketplace": self.marketplace_name,
                "page": page,
                "timestamp": datetime.now().isoformat(),
                "reviews": []
            }
            
            # Process the response
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["reviews"]["successes"] += 1
                reviews_data["extraction_method"] = "template"
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Extract reviews
                if "reviews" in parsed_data:
                    for review in parsed_data["reviews"][:limit]:
                        reviews_data["reviews"].append(review)
                
                # Extract total reviews count if available
                if "total_reviews" in parsed_data:
                    reviews_data["total_reviews"] = parsed_data["total_reviews"]
                
                # Extract rating distribution if available
                if "rating_distribution" in parsed_data:
                    reviews_data["rating_distribution"] = parsed_data["rating_distribution"]
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["reviews"]["failures"] += 1
                reviews_data["extraction_method"] = "html"
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                
                # Extract reviews using regex patterns
                review_pattern = r'<div data-hook="review".*?<span class="a-profile-name">([^<]+)</span>.*?<i class="a-icon a-icon-star a-star-([0-5]).*?<span data-hook="review-title">.*?>([^<]+)</span>.*?<span data-hook="review-body">.*?<span>([^<]+)</span>'
                review_matches = re.finditer(review_pattern, html_content, re.DOTALL)
                
                for i, match in enumerate(review_matches):
                    if i >= limit:
                        break
                        
                    reviewer_name = match.group(1).strip()
                    rating = int(match.group(2))
                    title = match.group(3).strip()
                    body = match.group(4).strip()
                    
                    review = {
                        "reviewer_name": reviewer_name,
                        "rating": rating,
                        "title": title,
                        "body": body,
                        "date": None  # Unable to reliably extract date with simple regex
                    }
                    
                    reviews_data["reviews"].append(review)
            
            # Update review count
            reviews_data["review_count"] = len(reviews_data["reviews"])
            
            # Save reviews data
            await self.storage_client.save_reviews(reviews_data)
            self.logger.info(f"Extracted {reviews_data['review_count']} reviews for product {asin}")
            
            return reviews_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting reviews: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting reviews: {str(e)}")
            raise
    
    async def extract_product_pricing(self, product_id_or_url: str) -> Dict[str, Any]:
        """Extract detailed pricing information from Amazon.
        
        Args:
            product_id_or_url: Product ASIN, URL, or path
            
        Returns:
            Pricing data dictionary
            
        Raises:
            NetworkError: If pricing couldn't be fetched
        """
        try:
            # Track template usage
            self.template_performance["pricing"]["attempts"] += 1
            
            # Determine ASIN and URL
            asin = self._extract_asin(product_id_or_url)
            if not asin:
                raise ValueError(f"Invalid Amazon product ID or URL: {product_id_or_url}")
                
            product_url = f"{self.product_base_url}/{asin}"
            
            # Fetch pricing data using the pricing template
            template_params = {
                "asin": asin,
                "parse_offers": "true"
            }
            
            response = await self.fetch_page(
                url=product_url,
                use_js=True,
                template=self.template_map["pricing"],
                template_params=template_params
            )
            
            # Initialize pricing data
            pricing_data = {
                "product_id": asin,
                "marketplace": self.marketplace_name,
                "timestamp": datetime.now().isoformat()
            }
            
            # Process the response
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["pricing"]["successes"] += 1
                pricing_data["extraction_method"] = "template"
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Extract price
                if "price" in parsed_data:
                    try:
                        price_str = str(parsed_data["price"]).replace('R', '').replace(',', '')
                        pricing_data["price"] = float(price_str)
                        pricing_data["currency"] = "ZAR"
                    except (ValueError, TypeError):
                        pass
                
                # Extract list price
                if "list_price" in parsed_data:
                    try:
                        list_price_str = str(parsed_data["list_price"]).replace('R', '').replace(',', '')
                        pricing_data["list_price"] = float(list_price_str)
                        
                        # Calculate discount percentage
                        if "price" in pricing_data and pricing_data["price"] < pricing_data["list_price"]:
                            discount = (1 - (pricing_data["price"] / pricing_data["list_price"])) * 100
                            pricing_data["discount_percentage"] = round(discount, 2)
                    except (ValueError, TypeError):
                        pass
                
                # Extract stock status
                if "in_stock" in parsed_data:
                    pricing_data["in_stock"] = parsed_data["in_stock"]
                
                # Extract seller information
                if "seller" in parsed_data:
                    pricing_data["seller"] = parsed_data["seller"]
                
                # Extract offers if available
                if "offers" in parsed_data:
                    pricing_data["offers"] = parsed_data["offers"]
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["pricing"]["failures"] += 1
                pricing_data["extraction_method"] = "html"
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                
                # Extract price
                price_pattern = r'<span class="a-price-whole">([^<]+)</span><span class="a-price-fraction">([^<]+)</span>'
                price_match = re.search(price_pattern, html_content)
                if price_match:
                    whole = price_match.group(1).replace(',', '')
                    fraction = price_match.group(2)
                    try:
                        pricing_data["price"] = float(f"{whole}.{fraction}")
                        pricing_data["currency"] = "ZAR"
                    except ValueError:
                        pass
                
                # Extract stock status
                in_stock_pattern = r'<span class="a-size-medium a-color-success">([^<]+)</span>'
                in_stock_match = re.search(in_stock_pattern, html_content)
                if in_stock_match:
                    status_text = in_stock_match.group(1).strip().lower()
                    pricing_data["in_stock"] = "in stock" in status_text
                else:
                    # Check for out of stock message
                    out_of_stock_pattern = r'<span class="a-color-price a-text-bold">([^<]+)</span>'
                    out_of_stock_match = re.search(out_of_stock_pattern, html_content)
                    if out_of_stock_match:
                        status_text = out_of_stock_match.group(1).strip().lower()
                        pricing_data["in_stock"] = "out of stock" not in status_text
            
            # Update price history
            if "price" in pricing_data:
                self._update_price_history(asin, pricing_data["price"], pricing_data.get("currency", "ZAR"))
                
                # Add price history to the response
                pricing_data["price_history"] = self._get_price_history(asin)
            
            # Save pricing data as a price point
            if "price" in pricing_data:
                await self.storage_client.save_price_point(pricing_data)
                self.logger.info(f"Extracted and saved pricing data for Amazon product {asin}")
            
            return pricing_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting pricing data: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting pricing data: {str(e)}")
            raise
    
    async def extract_bestsellers(self, category_path: str = "", page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Extract bestseller products from a category.
        
        Args:
            category_path: Category path after the bestsellers URL (e.g., "electronics")
            page: Page number (1-based)
            limit: Maximum number of products to return
            
        Returns:
            Bestseller data dictionary
            
        Raises:
            NetworkError: If bestsellers page couldn't be fetched
        """
        try:
            # Track template usage
            self.template_performance["bestsellers"]["attempts"] += 1
            
            # Build bestsellers URL
            if category_path:
                # Remove leading slash if present
                if category_path.startswith('/'):
                    category_path = category_path[1:]
                bestsellers_url = f"{self.bestsellers_url}{category_path}"
            else:
                bestsellers_url = self.bestsellers_url
                
            if "?" in bestsellers_url:
                bestsellers_url += f"&pg={page}"
            else:
                bestsellers_url += f"?pg={page}"
            
            # Fetch bestsellers using the bestsellers template
            template_params = {
                "page": str(page)
            }
            
            response = await self.fetch_page(
                url=bestsellers_url,
                use_js=True,
                template=self.template_map["bestsellers"],
                template_params=template_params
            )
            
            # Initialize bestsellers data
            bestsellers_data = {
                "category": category_path or "all",
                "marketplace": self.marketplace_name,
                "page": page,
                "timestamp": datetime.now().isoformat(),
                "products": []
            }
            
            # Process the response
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["bestsellers"]["successes"] += 1
                bestsellers_data["extraction_method"] = "template"
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Extract category information if available
                if "category" in parsed_data:
                    bestsellers_data["category_name"] = parsed_data["category"]
                
                # Extract items
                items_list = []
                if "items" in parsed_data:
                    items_list = parsed_data["items"]
                elif "products" in parsed_data:
                    items_list = parsed_data["products"]
                
                # Process each item
                for position, item in enumerate(items_list[:limit], 1):
                    if not isinstance(item, dict):
                        continue
                        
                    product = {"position": position}
                    
                    # Map common fields
                    field_mapping = {
                        "asin": "product_id",
                        "title": "title",
                        "price": "price",
                        "url": "url",
                        "image": "image_url",
                        "rating": "rating",
                        "review_count": "review_count"
                    }
                    
                    for parsed_field, our_field in field_mapping.items():
                        if parsed_field in item:
                            product[our_field] = item[parsed_field]
                    
                    # Process price if available
                    if "price" in product:
                        try:
                            price_str = str(product["price"]).replace('R', '').replace(',', '')
                            product["price"] = float(price_str)
                            product["currency"] = "ZAR"
                        except (ValueError, TypeError):
                            pass
                    
                    # Make sure product has a URL
                    if "product_id" in product and "url" not in product:
                        product["url"] = f"{self.product_base_url}/{product['product_id']}"
                    
                    bestsellers_data["products"].append(product)
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["bestsellers"]["failures"] += 1
                bestsellers_data["extraction_method"] = "html"
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                
                # Extract bestseller items
                item_pattern = r'<div class="zg-item"[^>]*>.*?<a href="([^"]+)"[^>]*>.*?<img src="([^"]+)"[^>]*alt="([^"]+)".*?<span class="a-size-small aok-float-right zg-badge-body zg-badge-color">#([0-9]+)</span>.*?<div class="a-icon-row">.*?<span class="a-icon-alt">([0-9\.]+) out of 5 stars</span>.*?<a href="[^"]+"[^>]*>([0-9,]+)</a>.*?<span class="p13n-sc-price">([^<]+)</span>'
                item_matches = re.finditer(item_pattern, html_content, re.DOTALL)
                
                for match in item_matches:
                    url = match.group(1)
                    image_url = match.group(2)
                    title = match.group(3)
                    position = int(match.group(4))
                    rating = float(match.group(5))
                    review_count = int(match.group(6).replace(',', ''))
                    price_str = match.group(7).replace('R', '').replace(',', '')
                    
                    # Extract ASIN from URL
                    asin = self._extract_asin(url)
                    
                    # Create product entry
                    product = {
                        "position": position,
                        "product_id": asin,
                        "title": title,
                        "url": url if url.startswith('http') else f"{self.base_url}{url}",
                        "image_url": image_url,
                        "rating": rating,
                        "review_count": review_count
                    }
                    
                    # Process price
                    try:
                        product["price"] = float(price_str)
                        product["currency"] = "ZAR"
                    except ValueError:
                        pass
                    
                    bestsellers_data["products"].append(product)
                
                # Sort by position
                bestsellers_data["products"].sort(key=lambda x: x.get("position", 999))
                
                # Limit to requested amount
                bestsellers_data["products"] = bestsellers_data["products"][:limit]
            
            # Update product count
            bestsellers_data["product_count"] = len(bestsellers_data["products"])
            
            # Save bestsellers data
            await self.storage_client.save_bestsellers(bestsellers_data)
            self.logger.info(f"Extracted and saved {bestsellers_data['product_count']} bestseller products for category {bestsellers_data['category']}")
            
            return bestsellers_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting bestsellers: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting bestsellers: {str(e)}")
            raise
    
    async def extract_sellers(self, product_id_or_url: str, limit: int = 20) -> Dict[str, Any]:
        """Extract sellers for a specific product.
        
        Args:
            product_id_or_url: Product ASIN, URL, or path
            limit: Maximum number of sellers to return
            
        Returns:
            Sellers data dictionary
            
        Raises:
            NetworkError: If sellers page couldn't be fetched
        """
        try:
            # Track template usage
            self.template_performance["sellers"]["attempts"] += 1
            
            # Determine ASIN and URL
            asin = self._extract_asin(product_id_or_url)
            if not asin:
                raise ValueError(f"Invalid Amazon product ID or URL: {product_id_or_url}")
                
            # Build sellers URL
            sellers_url = f"{self.base_url}/gp/offer-listing/{asin}"
            
            # Fetch sellers using the sellers template
            template_params = {
                "asin": asin
            }
            
            response = await self.fetch_page(
                url=sellers_url,
                use_js=True,
                template=self.template_map["sellers"],
                template_params=template_params
            )
            
            # Initialize sellers data
            sellers_data = {
                "product_id": asin,
                "marketplace": self.marketplace_name,
                "timestamp": datetime.now().isoformat(),
                "sellers": []
            }
            
            # Process the response
            if "parsed_content" in response:
                # Template extraction succeeded
                self.template_performance["sellers"]["successes"] += 1
                sellers_data["extraction_method"] = "template"
                
                # Use structured data from template
                parsed_data = response["parsed_content"]
                
                # Extract sellers list
                if "sellers" in parsed_data and isinstance(parsed_data["sellers"], list):
                    for seller in parsed_data["sellers"][:limit]:
                        if not isinstance(seller, dict):
                            continue
                            
                        seller_info = {}
                        
                        # Map common fields
                        field_mapping = {
                            "name": "name",
                            "id": "seller_id",
                            "price": "price",
                            "condition": "condition",
                            "shipping": "shipping",
                            "delivery": "delivery",
                            "rating": "rating",
                            "rating_count": "rating_count",
                            "fulfilled_by_amazon": "fulfilled_by_amazon"
                        }
                        
                        for parsed_field, our_field in field_mapping.items():
                            if parsed_field in seller:
                                seller_info[our_field] = seller[parsed_field]
                        
                        # Process price if available
                        if "price" in seller_info:
                            try:
                                price_str = str(seller_info["price"]).replace('R', '').replace(',', '')
                                seller_info["price"] = float(price_str)
                                seller_info["currency"] = "ZAR"
                            except (ValueError, TypeError):
                                pass
                        
                        sellers_data["sellers"].append(seller_info)
                
            else:
                # Template extraction failed, fallback to HTML extraction
                self.template_performance["sellers"]["failures"] += 1
                sellers_data["extraction_method"] = "html"
                
                # Fallback to HTML extraction
                html_content = response.get("content", "")
                
                # Extract seller listings
                seller_pattern = r'<div class="a-row a-spacing-mini olpOffer"[^>]*>.*?<h3 class="a-spacing-none olpSellerName">.*?<span class="a-size-medium">([^<]+)</span>.*?<span class="a-size-large a-color-price olpOfferPrice">([^<]+)</span>.*?<span class="a-size-medium olpCondition">([^<]+)</span>'
                seller_matches = re.finditer(seller_pattern, html_content, re.DOTALL)
                
                for i, match in enumerate(seller_matches):
                    if i >= limit:
                        break
                        
                    seller_name = match.group(1).strip()
                    price_str = match.group(2).replace('R', '').replace(',', '')
                    condition = match.group(3).strip()
                    
                    # Create seller entry
                    seller_info = {
                        "name": seller_name,
                        "condition": condition
                    }
                    
                    # Process price
                    try:
                        seller_info["price"] = float(price_str)
                        seller_info["currency"] = "ZAR"
                    except ValueError:
                        pass
                    
                    # Check if fulfilled by Amazon
                    fulfilled_pattern = r'Fulfilled by Amazon'
                    seller_info["fulfilled_by_amazon"] = bool(re.search(fulfilled_pattern, match.group(0)))
                    
                    sellers_data["sellers"].append(seller_info)
            
            # Update seller count
            sellers_data["seller_count"] = len(sellers_data["sellers"])
            
            # Save sellers data
            await self.storage_client.save_sellers(sellers_data)
            self.logger.info(f"Extracted and saved {sellers_data['seller_count']} sellers for product {asin}")
            
            return sellers_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting sellers: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting sellers: {str(e)}")
            raise
    
    def _extract_asin(self, product_id_or_url: str) -> Optional[str]:
        """Extract ASIN from product ID or URL.
        
        Args:
            product_id_or_url: Product ASIN, URL, or path
            
        Returns:
            ASIN or None if not found
        """
        # Check if already an ASIN (10 character alphanumeric string)
        if re.match(r'^[A-Z0-9]{10}$', product_id_or_url):
            return product_id_or_url
        
        # Check for ASIN in URL path
        asin_patterns = [
            r'/dp/([A-Z0-9]{10})',
            r'/product/([A-Z0-9]{10})',
            r'/gp/product/([A-Z0-9]{10})',
            r'product-reviews/([A-Z0-9]{10})',
            r'asin=([A-Z0-9]{10})'
        ]
        
        for pattern in asin_patterns:
            match = re.search(pattern, product_id_or_url)
            if match:
                return match.group(1)
        
        return None
    
    def _update_price_history(self, asin: str, price: float, currency: str) -> None:
        """Update the price history for a product.
        
        Args:
            asin: Product ASIN
            price: Current price
            currency: Currency code
        """
        now = datetime.now().isoformat()
        if asin not in self.price_history:
            self.price_history[asin] = []
            
        # Add this price point
        self.price_history[asin].append({
            "price": price,
            "currency": currency,
            "timestamp": now
        })
        
        # Keep only the most recent 30 days of price history
        if len(self.price_history[asin]) > 30:
            self.price_history[asin] = self.price_history[asin][-30:]
    
    def _get_price_history(self, asin: str) -> List[Dict[str, Any]]:
        """Get the price history for a product.
        
        Args:
            asin: Product ASIN
            
        Returns:
            List of price history points
        """
        return self.price_history.get(asin, [])
    
    def get_template_statistics(self) -> Dict[str, Any]:
        """Get statistics about template usage.
        
        Returns:
            Template usage statistics
        """
        stats = {}
        for template_type, data in self.template_performance.items():
            total = data["attempts"]
            success_rate = 0
            if total > 0:
                success_rate = (data["successes"] / total) * 100
                
            stats[template_type] = {
                "attempts": total,
                "successes": data["successes"],
                "failures": data["failures"],
                "success_rate": success_rate
            }
            
        # Calculate overall statistics
        total_attempts = sum(data["attempts"] for data in self.template_performance.values())
        total_successes = sum(data["successes"] for data in self.template_performance.values())
        overall_success_rate = 0
        if total_attempts > 0:
            overall_success_rate = (total_successes / total_attempts) * 100
            
        stats["overall"] = {
            "attempts": total_attempts,
            "successes": total_successes,
            "failures": total_attempts - total_successes,
            "success_rate": overall_success_rate
        }
        
        return stats