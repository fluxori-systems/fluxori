"""
Bob Shop scraper implementation for marketplace data collection.

This module provides the Bob Shop-specific implementation of the marketplace scraper,
with specialized methods for extracting data from Bob Shop's website (bobshop.co.za).
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

# Import extractors (will be implemented separately)
from .extractors.product_extractor import extract_product_details
from .extractors.search_extractor import extract_search_results, extract_search_suggestions
from .extractors.category_extractor import extract_category_details


class BobShopScraper(MarketplaceScraper):
    """Bob Shop-specific implementation of the marketplace scraper.
    
    This class provides specialized methods for scraping Bob Shop's website,
    including product discovery, product details extraction, search functionality,
    and category navigation with South African market optimizations.
    
    Enhanced with template support and hybrid scraping approach that combines
    template-based extraction with traditional HTML parsing for optimal results.
    """
    
    def __init__(self, 
                 proxy_client: SmartProxyClient, 
                 storage_client: MarketplaceDataRepository,
                 request_interval: float = 2.0):
        """Initialize the Bob Shop scraper.
        
        Args:
            proxy_client: SmartProxy client for web requests
            storage_client: Repository client for data storage
            request_interval: Minimum interval between requests (in seconds)
        """
        # List of generic templates that might be compatible with Bob Shop
        potentially_compatible_templates = [
            proxy_client.GENERIC_TEMPLATES["ecommerce"]  # Try the generic e-commerce template
        ]
        
        super().__init__(
            proxy_client=proxy_client,
            storage_client=storage_client,
            marketplace_name="bob_shop",
            base_url="https://www.bobshop.co.za",
            request_interval=request_interval,
            respect_robots=True,
            user_agent="Fluxori_Marketplace_Intelligence/1.0 (https://fluxori.com)",
            template_support=True,  # Enable template support
            compatible_templates=potentially_compatible_templates
        )
        
        # Bob Shop-specific constants
        self.category_base_url = "https://www.bobshop.co.za/collections"
        self.search_base_url = "https://www.bobshop.co.za/search"
        self.product_base_url = "https://www.bobshop.co.za/products"
        self.suggest_url = "https://www.bobshop.co.za/search/suggest"
        self.daily_deals_url = "https://www.bobshop.co.za/collections/deals"
        
        # Cache for categories to avoid repeated requests
        self._category_cache = {}
        
        # Template performance tracking for hybrid approach
        self.hybrid_performance = {
            "product_extraction": {"template": 0, "raw": 0, "template_success_rate": 0},
            "search_extraction": {"template": 0, "raw": 0, "template_success_rate": 0},
            "category_extraction": {"template": 0, "raw": 0, "template_success_rate": 0}
        }
        
    async def discover_products(self, 
                             category: Optional[str] = None, 
                             page: int = 1, 
                             limit: int = 50) -> List[str]:
        """Discover products from Bob Shop.
        
        Args:
            category: Category path or ID (optional)
            page: Page number (1-based)
            limit: Maximum number of products to return
            
        Returns:
            List of product URLs
            
        Raises:
            NetworkError: If page couldn't be fetched
            ValueError: If invalid parameters provided
        """
        try:
            # Determine URL based on parameters
            if category:
                # Category-based discovery
                url = self._build_category_url(category, page)
            else:
                # Default to browsing new arrivals
                url = f"{self.base_url}/collections/all?sort_by=created-descending&page={page}"
                
            # Fetch page with JavaScript rendering - wait for product grid
            response = await self.fetch_page(
                url=url,
                use_js=True,
                selector_to_wait=".product-grid"
            )
            
            # Extract product URLs
            product_urls = []
            
            if "content" in response:
                html_content = response["content"]
                
                # Extract product cards
                # Pattern to match product links in the product grid
                product_link_pattern = r'<a\s+[^>]*href="(/products/[^"]+)"[^>]*class="[^"]*product-card[^"]*"'
                product_paths = re.findall(product_link_pattern, html_content)
                
                # Build product URLs
                for path in product_paths:
                    product_urls.append(f"{self.base_url}{path}")
                
                # Log results
                self.logger.info(f"Discovered {len(product_urls)} products from {url}")
                
                # Limit to requested amount
                return product_urls[:limit]
            else:
                self.logger.error(f"Invalid response while discovering products: {response}")
                return []
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during product discovery: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during product discovery: {str(e)}")
            raise
            
    def _build_category_url(self, category: str, page: int = 1) -> str:
        """Build a category URL for Bob Shop.
        
        Args:
            category: Category path or ID
            page: Page number
            
        Returns:
            Category URL
        """
        # Check if category is a full URL
        if category.startswith("http"):
            parsed_url = urlparse(category)
            path = parsed_url.path
            query = parsed_url.query
            
            # Add page parameter if not in the query
            if query:
                params = parse_qs(query)
                params["page"] = [str(page)]
                new_query = urlencode(params, doseq=True)
                return f"{self.base_url}{path}?{new_query}"
            else:
                return f"{self.base_url}{path}?page={page}"
        
        # Check if category is a path
        if category.startswith("/"):
            if "collections" in category:
                return f"{self.base_url}{category}?page={page}"
            else:
                return f"{self.category_base_url}{category}?page={page}"
            
        # Assume it's a category name/path slug
        return f"{self.category_base_url}/{category}?page={page}"
            
    async def extract_product_details(self, product_id_or_url: str) -> Dict[str, Any]:
        """Extract detailed product information from Bob Shop.
        
        Args:
            product_id_or_url: Product ID, URL, or path
            
        Returns:
            Product details dictionary
            
        Raises:
            NetworkError: If product page couldn't be fetched
            ValueError: If invalid product ID or URL provided
        """
        try:
            # Determine product URL
            if product_id_or_url.startswith("http"):
                product_url = product_id_or_url
            elif product_id_or_url.startswith("/"):
                product_url = f"{self.base_url}{product_id_or_url}"
            else:
                # Assume it's a product handle
                product_url = f"{self.product_base_url}/{product_id_or_url}"
            
            # Create a session ID for consistent IP usage
            session_id = f"bobshop_product_{int(time.time())}"
            
            # Initialize variables for hybrid approach
            template_data = None
            raw_data = None
            product_data = None
            template_success = False
            
            # Step 1: Attempt template-based extraction if template support is enabled
            if self.template_support and self.compatible_templates:
                try:
                    self.logger.info(f"Attempting template-based extraction for {product_url}")
                    
                    # Try the hybrid approach with multiple templates and fallback
                    template_response = await self.proxy_client.scrape_with_hybrid_approach(
                        url=product_url,
                        templates=self.compatible_templates,
                        geo=None, # Use default from client (ZA)
                        session_id=session_id,
                        fallback_to_raw=False # We'll handle raw scraping ourselves
                    )
                    
                    # Check if we got parsed content from the template
                    if "parsed_content" in template_response:
                        template_data = template_response["parsed_content"]
                        template_success = True
                        self.hybrid_performance["product_extraction"]["template"] += 1
                        self.logger.info(f"Successfully extracted product data using template")
                        
                        # Transform template data into our product schema
                        product_data = self._transform_template_product_data(template_data, product_url)
                    else:
                        self.logger.info(f"Template extraction did not produce structured data, falling back to raw HTML")
                except Exception as e:
                    self.logger.warning(f"Template-based extraction failed: {str(e)}, falling back to raw HTML")
            
            # Step 2: If template extraction failed or wasn't enabled, fall back to raw HTML extraction
            if not template_success:
                # Fetch product page with JavaScript rendering
                response = await self.fetch_page(
                    url=product_url,
                    use_js=True,
                    selector_to_wait=".product",
                    session_id=session_id
                )
                
                # Extract product data
                if "content" in response:
                    # Use our specialized product extractor
                    product_data = extract_product_details(response["content"], product_url)
                    self.hybrid_performance["product_extraction"]["raw"] += 1
                else:
                    self.logger.error(f"Invalid response for product {product_url}: {response}")
                    return {}
            
            # Save product data to repository
            if product_data:
                await self.storage_client.save_product(product_data)
                self.logger.info(f"Extracted and saved product {product_data.get('product_id')}")
                
                # Update performance metrics
                total_extractions = self.hybrid_performance["product_extraction"]["template"] + self.hybrid_performance["product_extraction"]["raw"]
                if total_extractions > 0:
                    self.hybrid_performance["product_extraction"]["template_success_rate"] = (
                        self.hybrid_performance["product_extraction"]["template"] / total_extractions * 100
                    )
                
                return product_data
            else:
                self.logger.error(f"Failed to extract product data from {product_url}")
                return {}
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting product details: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting product details: {str(e)}")
            raise
    
    def _transform_template_product_data(self, template_data: Dict[str, Any], product_url: str) -> Dict[str, Any]:
        """Transform template-extracted data into our product schema.
        
        Args:
            template_data: Data extracted via template
            product_url: Original product URL
            
        Returns:
            Transformed product data matching our schema
        """
        try:
            # Extract product ID/handle from URL
            product_id = None
            product_handle = None
            
            if "/products/" in product_url:
                parts = product_url.split("/products/")
                if len(parts) > 1:
                    product_handle = parts[1].split("?")[0].split("#")[0]
                    product_id = product_handle
            
            # Build product data object based on our schema
            product_data = {
                "product_id": product_id,
                "handle": product_handle,
                "url": product_url,
                "marketplace": self.marketplace_name,
                "timestamp": datetime.now().isoformat(),
                "title": template_data.get("name") or template_data.get("title", ""),
                "price": {
                    "current": self._extract_price_from_template(template_data),
                    "currency": "ZAR",
                },
                "brand": template_data.get("brand", {}).get("name", "") if isinstance(template_data.get("brand"), dict) else template_data.get("brand", ""),
                "availability": "in_stock" if template_data.get("availability", "").lower() == "in stock" else "out_of_stock",
                "rating": {
                    "average": template_data.get("rating", {}).get("value", 0) if isinstance(template_data.get("rating"), dict) else template_data.get("rating", 0),
                    "count": template_data.get("rating", {}).get("count", 0) if isinstance(template_data.get("rating"), dict) else template_data.get("review_count", 0),
                },
                "images": self._extract_images_from_template(template_data),
                "description": template_data.get("description", ""),
                "specifications": self._extract_specs_from_template(template_data),
            }
            
            # Extract seller information if available
            if "seller" in template_data:
                seller_data = template_data.get("seller", {})
                if isinstance(seller_data, dict):
                    product_data["seller"] = {
                        "name": seller_data.get("name", ""),
                        "url": seller_data.get("url", ""),
                        "rating": seller_data.get("rating", 0)
                    }
            
            return product_data
        except Exception as e:
            self.logger.error(f"Error transforming template data: {str(e)}")
            return None
            
    def _extract_price_from_template(self, template_data: Dict[str, Any]) -> float:
        """Extract standardized price from template data.
        
        Args:
            template_data: Template extraction result
            
        Returns:
            Price as float
        """
        # Try different possible price field names
        price = 0.0
        
        # Look for offers structure
        if "offers" in template_data and isinstance(template_data["offers"], dict):
            price_str = template_data["offers"].get("price", "0")
        # Look for direct price field
        elif "price" in template_data:
            if isinstance(template_data["price"], (int, float)):
                return float(template_data["price"])
            price_str = template_data["price"]
        # Look for current_price field
        elif "current_price" in template_data:
            price_str = template_data["current_price"]
        else:
            return 0.0
            
        # Convert string price to float
        if isinstance(price_str, str):
            # Remove currency symbols and commas
            price_str = re.sub(r'[^0-9.]', '', price_str)
            try:
                price = float(price_str)
            except ValueError:
                pass
                
        return price
        
    def _extract_images_from_template(self, template_data: Dict[str, Any]) -> List[str]:
        """Extract image URLs from template data.
        
        Args:
            template_data: Template extraction result
            
        Returns:
            List of image URLs
        """
        images = []
        
        # Check for image field
        if "image" in template_data:
            if isinstance(template_data["image"], str):
                images.append(template_data["image"])
            elif isinstance(template_data["image"], list):
                images.extend(template_data["image"])
                
        # Check for images array
        if "images" in template_data:
            if isinstance(template_data["images"], list):
                for img in template_data["images"]:
                    if isinstance(img, str):
                        images.append(img)
                    elif isinstance(img, dict) and "url" in img:
                        images.append(img["url"])
                        
        return images
        
    def _extract_specs_from_template(self, template_data: Dict[str, Any]) -> Dict[str, str]:
        """Extract specifications from template data.
        
        Args:
            template_data: Template extraction result
            
        Returns:
            Dictionary of specifications
        """
        specs = {}
        
        # Check for specifications field
        if "specifications" in template_data and isinstance(template_data["specifications"], list):
            for spec in template_data["specifications"]:
                if isinstance(spec, dict) and "name" in spec and "value" in spec:
                    specs[spec["name"]] = spec["value"]
                    
        # Check for product_details field
        elif "product_details" in template_data and isinstance(template_data["product_details"], list):
            for detail in template_data["product_details"]:
                if isinstance(detail, dict) and "name" in detail and "value" in detail:
                    specs[detail["name"]] = detail["value"]
                    
        # Check for attributes field
        elif "attributes" in template_data and isinstance(template_data["attributes"], dict):
            for key, value in template_data["attributes"].items():
                specs[key] = str(value)
                    
        return specs
            
    async def search_products(self, 
                            keyword: str, 
                            page: int = 1, 
                            limit: int = 50) -> Dict[str, Any]:
        """Search for products on Bob Shop using a keyword.
        
        Implements a hybrid approach that attempts template-based extraction first,
        then falls back to traditional HTML parsing if needed.
        
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
            # Build search URL
            search_url = f"{self.search_base_url}?q={quote(keyword)}&page={page}"
            
            # Create a session ID for consistent IP usage
            session_id = f"bobshop_search_{int(time.time())}"
            
            # Initialize variables for hybrid approach
            template_data = None
            search_data = None
            template_success = False
            
            # Step 1: Attempt template-based extraction if template support is enabled
            if self.template_support and self.compatible_templates:
                try:
                    self.logger.info(f"Attempting template-based search extraction for '{keyword}'")
                    
                    # Template params for search
                    template_params = {
                        "keyword": keyword,
                        "page": str(page)
                    }
                    
                    # Try the hybrid approach with multiple templates and fallback
                    template_response = await self.proxy_client.scrape_with_hybrid_approach(
                        url=search_url,
                        templates=self.compatible_templates,
                        template_params=template_params,
                        geo=None, # Use default from client (ZA)
                        session_id=session_id,
                        fallback_to_raw=False # We'll handle raw scraping ourselves
                    )
                    
                    # Check if we got parsed content from the template
                    if "parsed_content" in template_response and isinstance(template_response["parsed_content"], dict):
                        template_data = template_response["parsed_content"]
                        
                        # Check if we have search results in the template data
                        if "results" in template_data and isinstance(template_data["results"], list) and template_data["results"]:
                            template_success = True
                            self.hybrid_performance["search_extraction"]["template"] += 1
                            self.logger.info(f"Successfully extracted search results using template")
                            
                            # Transform template data into our search results schema
                            search_data = self._transform_template_search_data(template_data, keyword, page)
                        else:
                            self.logger.info(f"Template extraction did not produce valid search results, falling back to raw HTML")
                    else:
                        self.logger.info(f"Template extraction did not produce structured data, falling back to raw HTML")
                except Exception as e:
                    self.logger.warning(f"Template-based search extraction failed: {str(e)}, falling back to raw HTML")
            
            # Step 2: If template extraction failed or wasn't enabled, fall back to raw HTML extraction
            if not template_success:
                # Fetch search page with JavaScript rendering
                response = await self.fetch_page(
                    url=search_url,
                    use_js=True,
                    selector_to_wait=".product-grid",
                    session_id=session_id
                )
                
                # Extract search data
                if "content" in response:
                    # Use our specialized search extractor
                    search_data = extract_search_results(response["content"], keyword, page)
                    self.hybrid_performance["search_extraction"]["raw"] += 1
                else:
                    self.logger.error(f"Invalid response for search '{keyword}': {response}")
                    return {"keyword": keyword, "marketplace": self.marketplace_name, "results": []}
            
            # Process search data
            if search_data:
                # Add additional metadata
                search_data["marketplace"] = self.marketplace_name
                search_data["timestamp"] = datetime.now().isoformat()
                
                # Limit results if needed
                if limit < len(search_data["results"]):
                    search_data["results"] = search_data["results"][:limit]
                    search_data["result_count"] = limit
                
                # Save search data to repository
                await self.storage_client.save_search_results(search_data)
                self.logger.info(f"Extracted and saved search results for '{keyword}' with {search_data['result_count']} results")
                
                # Update performance metrics
                total_extractions = self.hybrid_performance["search_extraction"]["template"] + self.hybrid_performance["search_extraction"]["raw"]
                if total_extractions > 0:
                    self.hybrid_performance["search_extraction"]["template_success_rate"] = (
                        self.hybrid_performance["search_extraction"]["template"] / total_extractions * 100
                    )
                
                return search_data
            else:
                self.logger.error(f"Failed to extract search results for '{keyword}'")
                return {"keyword": keyword, "marketplace": self.marketplace_name, "results": []}
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during search: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during search: {str(e)}")
            raise
            
    def _transform_template_search_data(self, template_data: Dict[str, Any], keyword: str, page: int) -> Dict[str, Any]:
        """Transform template-extracted search data into our search results schema.
        
        Args:
            template_data: Data extracted via template
            keyword: Original search keyword
            page: Page number
            
        Returns:
            Transformed search results matching our schema
        """
        try:
            # Initialize search results
            search_data = {
                "keyword": keyword,
                "page": page,
                "marketplace": self.marketplace_name,
                "timestamp": datetime.now().isoformat(),
                "results": [],
                "result_count": 0,
                "total_pages": template_data.get("total_pages", 1),
                "extraction_method": "template"
            }
            
            # Process search results
            if "results" in template_data and isinstance(template_data["results"], list):
                for item in template_data["results"]:
                    # Skip invalid items
                    if not isinstance(item, dict):
                        continue
                        
                    # Extract product URL
                    product_url = item.get("url", "")
                    if not product_url.startswith("http"):
                        product_url = urljoin(self.base_url, product_url)
                    
                    # Create result item
                    result_item = {
                        "product_id": item.get("id", ""),
                        "title": item.get("name", "") or item.get("title", ""),
                        "url": product_url,
                        "price": self._extract_price_from_template(item),
                        "currency": "ZAR",
                        "image": item.get("image", ""),
                        "brand": item.get("brand", ""),
                        "rating": item.get("rating", 0),
                        "review_count": item.get("review_count", 0),
                        "position": item.get("position", 0)
                    }
                    
                    search_data["results"].append(result_item)
                
                # Update result count
                search_data["result_count"] = len(search_data["results"])
            
            return search_data
        except Exception as e:
            self.logger.error(f"Error transforming template search data: {str(e)}")
            return {
                "keyword": keyword,
                "page": page,
                "marketplace": self.marketplace_name,
                "results": [],
                "result_count": 0
            }
            
    async def extract_search_suggestions(self, keyword_prefix: str) -> Dict[str, Any]:
        """Extract search suggestions for a keyword prefix from Bob Shop.
        
        Args:
            keyword_prefix: Partial search term
            
        Returns:
            Dictionary with suggestions
            
        Raises:
            NetworkError: If suggestions couldn't be fetched
        """
        try:
            # Build suggestions URL
            suggest_url = f"{self.suggest_url}?q={quote(keyword_prefix)}"
            
            # Fetch suggestions (no JS needed)
            response = await self.fetch_page(
                url=suggest_url,
                use_js=False
            )
            
            # Extract suggestions
            if "content" in response:
                suggestion_data = extract_search_suggestions(response["content"], keyword_prefix)
                
                # Add metadata
                suggestion_data["marketplace"] = self.marketplace_name
                suggestion_data["timestamp"] = datetime.now().isoformat()
                
                # Save suggestions to repository
                await self.storage_client.save_search_suggestions(suggestion_data)
                self.logger.info(f"Extracted and saved {len(suggestion_data['suggestions'])} search suggestions for '{keyword_prefix}'")
                
                return suggestion_data
            else:
                self.logger.error(f"Invalid response for suggestions '{keyword_prefix}': {response}")
                return {"prefix": keyword_prefix, "marketplace": self.marketplace_name, "suggestions": []}
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting search suggestions: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting search suggestions: {str(e)}")
            raise
            
    async def extract_category(self, category_id_or_url: str) -> Dict[str, Any]:
        """Extract category details from Bob Shop.
        
        Args:
            category_id_or_url: Category ID, URL, or path
            
        Returns:
            Category details dictionary
            
        Raises:
            NetworkError: If category page couldn't be fetched
        """
        try:
            # Check if we have this category cached
            cache_key = str(category_id_or_url)
            if cache_key in self._category_cache:
                return self._category_cache[cache_key]
            
            # Determine category URL
            if category_id_or_url.startswith("http"):
                category_url = category_id_or_url
            elif category_id_or_url.startswith("/"):
                category_url = f"{self.base_url}{category_id_or_url}"
            else:
                # Assume it's a path slug
                category_url = f"{self.category_base_url}/{category_id_or_url}"
                
            # Fetch category page with JavaScript rendering
            response = await self.fetch_page(
                url=category_url,
                use_js=True,
                selector_to_wait=".collection-header"
            )
            
            # Extract category data
            if "content" in response:
                # Use our specialized category extractor
                category_data = extract_category_details(response["content"], category_url)
                
                # Add metadata
                category_data["marketplace"] = self.marketplace_name
                
                # Save category data to repository
                if "category_id" in category_data:
                    await self.storage_client.save_category(category_data)
                    self.logger.info(f"Extracted and saved category {category_data.get('category_id')}")
                    
                    # Cache the result
                    self._category_cache[cache_key] = category_data
                    
                    return category_data
                else:
                    self.logger.error(f"Failed to extract category data from {category_url}")
                    return {}
            else:
                self.logger.error(f"Invalid response for category {category_url}: {response}")
                return {}
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting category: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting category: {str(e)}")
            raise
            
    async def extract_deals(self) -> List[Dict[str, Any]]:
        """Extract deals from Bob Shop.
        
        Uses hybrid approach to attempt template-based extraction first
        before falling back to raw HTML parsing.
        
        Returns:
            List of deal products
            
        Raises:
            NetworkError: If deals page couldn't be fetched
        """
        try:
            # Create a session ID for consistent IP usage
            session_id = f"bobshop_deals_{int(time.time())}"
            
            # Initialize variables for hybrid approach
            template_success = False
            deal_products = []
            
            # Step 1: Attempt template-based extraction if template support is enabled
            if self.template_support and self.compatible_templates:
                try:
                    self.logger.info(f"Attempting template-based extraction for deals")
                    
                    # Try the hybrid approach with templates
                    template_response = await self.proxy_client.scrape_with_hybrid_approach(
                        url=self.daily_deals_url,
                        templates=self.compatible_templates,
                        geo=None, # Use default from client (ZA)
                        session_id=session_id,
                        fallback_to_raw=False # We'll handle raw scraping ourselves
                    )
                    
                    # Check if we got parsed content from the template
                    if "parsed_content" in template_response and isinstance(template_response["parsed_content"], dict):
                        template_data = template_response["parsed_content"]
                        
                        # Look for products array in template data
                        if ("products" in template_data and isinstance(template_data["products"], list) and template_data["products"]) or \
                           ("results" in template_data and isinstance(template_data["results"], list) and template_data["results"]):
                            
                            products_list = template_data.get("products", []) or template_data.get("results", [])
                            self.logger.info(f"Successfully extracted {len(products_list)} deals using template")
                            
                            # Process each deal product
                            for product_data in products_list:
                                if not isinstance(product_data, dict):
                                    continue
                                
                                # Get product URL
                                product_url = product_data.get("url", "")
                                if not product_url.startswith("http"):
                                    product_url = urljoin(self.base_url, product_url)
                                
                                # For each product, fetch complete details
                                detailed_product = await self.extract_product_details(product_url)
                                
                                if detailed_product:
                                    # Mark as deal
                                    detailed_product["promotion"] = "Deal"
                                    
                                    # Save the updated product
                                    await self.storage_client.save_product(detailed_product)
                                    
                                    deal_products.append(detailed_product)
                            
                            template_success = True
                            self.hybrid_performance["category_extraction"]["template"] += 1
                        else:
                            self.logger.info(f"Template extraction did not produce valid deal products, falling back to raw HTML")
                    else:
                        self.logger.info(f"Template extraction did not produce structured data, falling back to raw HTML")
                except Exception as e:
                    self.logger.warning(f"Template-based extraction failed: {str(e)}, falling back to raw HTML")
            
            # Step 2: If template extraction failed or wasn't enabled, fall back to raw HTML extraction
            if not template_success:
                # Fetch deals page
                response = await self.fetch_page(
                    url=self.daily_deals_url,
                    use_js=True,
                    selector_to_wait=".product-grid",
                    session_id=session_id
                )
                
                # Extract deals
                if "content" in response:
                    html_content = response["content"]
                    self.hybrid_performance["category_extraction"]["raw"] += 1
                    
                    # Extract product cards
                    product_link_pattern = r'<a\s+[^>]*href="(/products/[^"]+)"[^>]*class="[^"]*product-card[^"]*"'
                    product_paths = re.findall(product_link_pattern, html_content)
                    
                    # Process each deal product
                    for path in product_paths:
                        product_url = f"{self.base_url}{path}"
                        
                        # Extract the product details (this will also save it)
                        product_data = await self.extract_product_details(product_url)
                        
                        if product_data:
                            # Mark as deal
                            product_data["promotion"] = "Deal"
                            
                            # Save the updated product
                            await self.storage_client.save_product(product_data)
                            
                            deal_products.append(product_data)
                else:
                    self.logger.error(f"Invalid response for deals: {response}")
                    return []
            
            # Update performance metrics
            total_extractions = self.hybrid_performance["category_extraction"]["template"] + self.hybrid_performance["category_extraction"]["raw"]
            if total_extractions > 0:
                self.hybrid_performance["category_extraction"]["template_success_rate"] = (
                    self.hybrid_performance["category_extraction"]["template"] / total_extractions * 100
                )
                
            self.logger.info(f"Extracted {len(deal_products)} deal products")
            return deal_products
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting deals: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting deals: {str(e)}")
            raise
            
    async def extract_seller_details(self, seller_id_or_url: str) -> Dict[str, Any]:
        """Extract seller details from Bob Shop.
        
        Args:
            seller_id_or_url: Seller ID or URL
            
        Returns:
            Seller details dictionary
            
        Raises:
            NetworkError: If seller page couldn't be fetched
        """
        try:
            # Determine seller URL
            if seller_id_or_url.startswith("http"):
                seller_url = seller_id_or_url
            elif seller_id_or_url.startswith("/"):
                seller_url = f"{self.base_url}{seller_id_or_url}"
            else:
                # Assume it's a seller handle/ID
                seller_url = f"{self.base_url}/sellers/{seller_id_or_url}"
            
            # Fetch seller page with JavaScript rendering
            response = await self.fetch_page(
                url=seller_url,
                use_js=True,
                selector_to_wait=".seller-profile"
            )
            
            # Extract seller data
            if "content" in response:
                html_content = response["content"]
                
                # Basic seller extraction (would be replaced by a specialized extractor)
                seller_data = {}
                
                # Extract seller name
                seller_name_match = re.search(r'<h1[^>]*class="[^"]*seller-name[^"]*"[^>]*>(.*?)</h1>', html_content, re.DOTALL)
                if seller_name_match:
                    seller_data["name"] = seller_name_match.group(1).strip()
                
                # Extract seller ID
                seller_id = seller_id_or_url
                if "/" in seller_id:
                    seller_id = seller_id.rstrip("/").split("/")[-1]
                seller_data["seller_id"] = seller_id
                
                # Extract rating
                rating_match = re.search(r'<span[^>]*class="[^"]*rating[^"]*"[^>]*>(\d+\.\d+)</span>', html_content)
                if rating_match:
                    seller_data["rating"] = float(rating_match.group(1))
                
                # Extract product count
                product_count_match = re.search(r'(\d+)\s+products', html_content)
                if product_count_match:
                    seller_data["product_count"] = int(product_count_match.group(1))
                
                # Add metadata
                seller_data["marketplace"] = self.marketplace_name
                seller_data["url"] = seller_url
                seller_data["timestamp"] = datetime.now().isoformat()
                
                return seller_data
            else:
                self.logger.error(f"Invalid response for seller {seller_url}: {response}")
                return {}
                
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error extracting seller details: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting seller details: {str(e)}")
            raise
            
    async def test_template_compatibility(self, test_url: Optional[str] = None) -> Dict[str, Any]:
        """Test compatibility of various templates with Bob Shop.
        
        Runs a comprehensive test of available templates against Bob Shop pages
        to determine which ones work best for different types of data.
        
        Args:
            test_url: URL to test (defaults to a bestselling product page)
            
        Returns:
            Compatibility report with effectiveness metrics for different templates
        """
        self.logger.info("Starting template compatibility testing for Bob Shop")
        
        # Use provided URL or default to popular category page
        if not test_url:
            test_url = f"{self.base_url}/collections/electronics"
            
        # Create test URLs for different page types
        product_url = f"{self.base_url}/products/samsung-galaxy-s21-smartphone"  # Example product URL
        search_url = f"{self.search_base_url}?q=smartphone&page=1"
        category_url = f"{self.category_base_url}/electronics?page=1"
        
        # Templates to test
        templates_to_test = self.proxy_client.GENERIC_TEMPLATES.values()
        
        # Test results
        results = {
            "product_page": await self.proxy_client.test_template_compatibility(
                url=product_url,
                marketplace_type=self.marketplace_name,
                templates_to_test=templates_to_test
            ),
            "search_results": await self.proxy_client.test_template_compatibility(
                url=search_url,
                marketplace_type=self.marketplace_name,
                templates_to_test=templates_to_test
            ),
            "category_page": await self.proxy_client.test_template_compatibility(
                url=category_url,
                marketplace_type=self.marketplace_name,
                templates_to_test=templates_to_test
            )
        }
        
        # Find best templates for each page type
        best_templates = {
            "product_page": results["product_page"].get("best_template"),
            "search_results": results["search_results"].get("best_template"),
            "category_page": results["category_page"].get("best_template")
        }
        
        # Update compatible templates based on results
        new_compatible_templates = [t for t in best_templates.values() if t]
        if new_compatible_templates:
            self.compatible_templates = list(set(new_compatible_templates))
            self.template_support = True
            self.logger.info(f"Updated compatible templates: {self.compatible_templates}")
        
        # Generate summary report
        summary = {
            "marketplace": self.marketplace_name,
            "best_templates": best_templates,
            "compatible_templates": self.compatible_templates,
            "test_results": {
                "product_page": {
                    "url": product_url,
                    "successful_templates": results["product_page"]["successful_templates"],
                    "structured_data_templates": results["product_page"]["structured_data_templates"],
                    "best_template": results["product_page"]["best_template"],
                    "fastest_template": results["product_page"]["fastest_template"]
                },
                "search_results": {
                    "url": search_url,
                    "successful_templates": results["search_results"]["successful_templates"],
                    "structured_data_templates": results["search_results"]["structured_data_templates"],
                    "best_template": results["search_results"]["best_template"],
                    "fastest_template": results["search_results"]["fastest_template"]
                },
                "category_page": {
                    "url": category_url,
                    "successful_templates": results["category_page"]["successful_templates"],
                    "structured_data_templates": results["category_page"]["structured_data_templates"],
                    "best_template": results["category_page"]["best_template"],
                    "fastest_template": results["category_page"]["fastest_template"]
                }
            }
        }
        
        self.logger.info(f"Template compatibility testing completed with {len(self.compatible_templates)} compatible templates found")
        return summary
        
    def get_hybrid_performance_report(self) -> Dict[str, Any]:
        """Get detailed performance statistics for template vs. raw HTML approaches.
        
        Returns:
            Dictionary with hybrid approach performance statistics
        """
        # Calculate performance metrics
        for extraction_type in self.hybrid_performance:
            total = self.hybrid_performance[extraction_type]["template"] + self.hybrid_performance[extraction_type]["raw"]
            if total > 0:
                self.hybrid_performance[extraction_type]["template_success_rate"] = (
                    self.hybrid_performance[extraction_type]["template"] / total * 100
                )
            else:
                self.hybrid_performance[extraction_type]["template_success_rate"] = 0
        
        # Calculate overall statistics
        total_template = sum(stats["template"] for stats in self.hybrid_performance.values())
        total_raw = sum(stats["raw"] for stats in self.hybrid_performance.values())
        total_all = total_template + total_raw
        
        overall_template_success_rate = (total_template / total_all * 100) if total_all > 0 else 0
        
        # Create the report
        report = {
            "marketplace": self.marketplace_name,
            "template_support": self.template_support,
            "compatible_templates": self.compatible_templates,
            "hybrid_performance": self.hybrid_performance,
            "overall": {
                "template_extractions": total_template,
                "raw_html_extractions": total_raw,
                "total_extractions": total_all,
                "template_success_rate": overall_template_success_rate
            },
            "template_performance": self.proxy_client.get_template_performance()
        }
        
        return report
        
    async def discover_products_by_category(self, 
                                          category_slug: str, 
                                          max_pages: int = 5,
                                          products_per_page: int = 50) -> List[str]:
        """Discover products by browsing through category pages.
        
        Args:
            category_slug: Category slug or path
            max_pages: Maximum number of pages to scrape (1-based)
            products_per_page: Expected number of products per page
            
        Returns:
            List of product URLs
            
        Raises:
            NetworkError: If pages couldn't be fetched
        """
        discovered_products = []
        
        try:
            # Create a session ID for consistent IP usage across pages
            session_id = f"bobshop_category_{int(time.time())}"
            
            for page in range(1, max_pages + 1):
                self.logger.info(f"Discovering products from category {category_slug}, page {page}/{max_pages}")
                
                # Build the category URL
                category_url = self._build_category_url(category_slug, page)
                
                # Fetch page with JavaScript rendering
                response = await self.fetch_page(
                    url=category_url,
                    use_js=True,
                    selector_to_wait=".product-grid",
                    session_id=session_id
                )
                
                # Extract product URLs from the page
                if "content" in response:
                    html_content = response["content"]
                    
                    # Extract product cards
                    product_link_pattern = r'<a\s+[^>]*href="(/products/[^"]+)"[^>]*class="[^"]*product-card[^"]*"'
                    product_paths = re.findall(product_link_pattern, html_content)
                    
                    # Build product URLs
                    page_products = []
                    for path in product_paths:
                        page_products.append(f"{self.base_url}{path}")
                    
                    # Add to discovered products
                    discovered_products.extend(page_products)
                    self.logger.info(f"Discovered {len(page_products)} products from page {page}")
                    
                    # If we found fewer products than expected, we might be on the last page
                    if len(page_products) < products_per_page:
                        self.logger.info(f"Found fewer products than expected ({len(page_products)} < {products_per_page}), stopping pagination")
                        break
                else:
                    self.logger.error(f"Invalid response for category page {page}: {response}")
                    break
                
                # Brief delay between pages for politeness
                await asyncio.sleep(2)
            
            # Log final count
            self.logger.info(f"Total discovered products from category {category_slug}: {len(discovered_products)}")
            return discovered_products
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during category browsing: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during category browsing: {str(e)}")
            raise
            
    async def discover_products_by_search(self, 
                                        keyword: str, 
                                        max_pages: int = 5,
                                        products_per_page: int = 50) -> List[str]:
        """Discover products by performing search.
        
        Args:
            keyword: Search keyword or phrase
            max_pages: Maximum number of pages to scrape (1-based)
            products_per_page: Expected number of products per page
            
        Returns:
            List of product URLs
            
        Raises:
            NetworkError: If search couldn't be performed
        """
        discovered_products = []
        
        try:
            # Create a session ID for consistent IP usage across pages
            session_id = f"bobshop_search_{int(time.time())}"
            
            for page in range(1, max_pages + 1):
                self.logger.info(f"Discovering products from search '{keyword}', page {page}/{max_pages}")
                
                # Perform search and extract search results
                search_results = await self.search_products(
                    keyword=keyword,
                    page=page,
                    limit=products_per_page
                )
                
                # Extract product URLs from search results
                page_products = []
                if "results" in search_results and isinstance(search_results["results"], list):
                    for result in search_results["results"]:
                        if "url" in result:
                            page_products.append(result["url"])
                
                # Add to discovered products
                discovered_products.extend(page_products)
                self.logger.info(f"Discovered {len(page_products)} products from search page {page}")
                
                # If we found fewer products than expected, we might be on the last page
                if len(page_products) < products_per_page:
                    self.logger.info(f"Found fewer products than expected ({len(page_products)} < {products_per_page}), stopping pagination")
                    break
                
                # Brief delay between pages for politeness
                await asyncio.sleep(2)
            
            # Log final count
            self.logger.info(f"Total discovered products from search '{keyword}': {len(discovered_products)}")
            return discovered_products
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during search-based discovery: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during search-based discovery: {str(e)}")
            raise
            
    async def discover_sellers(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Discover sellers on Bob Shop.
        
        Args:
            max_pages: Maximum number of pages to scrape (1-based)
            
        Returns:
            List of sellers with basic information
            
        Raises:
            NetworkError: If sellers page couldn't be fetched
        """
        discovered_sellers = []
        
        try:
            # Bob Shop seller listing page
            sellers_base_url = f"{self.base_url}/sellers"
            
            # Create a session ID for consistent IP usage across pages
            session_id = f"bobshop_sellers_{int(time.time())}"
            
            for page in range(1, max_pages + 1):
                self.logger.info(f"Discovering sellers, page {page}/{max_pages}")
                
                # Build the sellers URL
                sellers_url = f"{sellers_base_url}?page={page}"
                
                # Fetch page with JavaScript rendering
                response = await self.fetch_page(
                    url=sellers_url,
                    use_js=True,
                    selector_to_wait=".seller-grid",
                    session_id=session_id
                )
                
                # Extract sellers from the page
                if "content" in response:
                    html_content = response["content"]
                    
                    # Extract seller cards
                    # Pattern to match seller links
                    seller_link_pattern = r'<a\s+[^>]*href="(/sellers/[^"]+)"[^>]*class="[^"]*seller-card[^"]*"'
                    seller_paths = re.findall(seller_link_pattern, html_content)
                    
                    # Process each seller
                    page_sellers = []
                    for path in seller_paths:
                        seller_url = f"{self.base_url}{path}"
                        
                        # Basic seller info
                        seller_id = path.split("/")[-1]
                        seller_info = {
                            "seller_id": seller_id,
                            "url": seller_url,
                            "marketplace": self.marketplace_name
                        }
                        
                        # Extract seller name from card if available
                        name_pattern = f'<a\\s+[^>]*href="{path}"[^>]*>\\s*<h3[^>]*>(.*?)</h3>'
                        name_match = re.search(name_pattern, html_content, re.DOTALL)
                        if name_match:
                            seller_info["name"] = name_match.group(1).strip()
                        
                        page_sellers.append(seller_info)
                    
                    # Add to discovered sellers
                    discovered_sellers.extend(page_sellers)
                    self.logger.info(f"Discovered {len(page_sellers)} sellers from page {page}")
                    
                    # If we found no sellers, we might be on the last page
                    if not page_sellers:
                        self.logger.info(f"Found no sellers on page {page}, stopping pagination")
                        break
                else:
                    self.logger.error(f"Invalid response for sellers page {page}: {response}")
                    break
                
                # Brief delay between pages for politeness
                await asyncio.sleep(2)
            
            # Log final count
            self.logger.info(f"Total discovered sellers: {len(discovered_sellers)}")
            return discovered_sellers
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during seller discovery: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during seller discovery: {str(e)}")
            raise