"""
Buck.cheap scraper implementation for historical price data collection.

This module provides a specialized scraper for Buck.cheap, a website that tracks
historical pricing data for major South African retailers including Takealot,
Makro, Checkers Sixty60, Woolworths, and Pick n Pay.
"""

import asyncio
import csv
import json
import logging
import re
import time
from datetime import datetime, timedelta
from io import StringIO
from typing import Dict, List, Any, Optional, Union, Set, Tuple
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, quote

# Import base scraper
from ...common.base_scraper import MarketplaceScraper, NetworkError, LoadSheddingDetectedError
from ...common.proxy_client import SmartProxyClient
from ...storage.repository import MarketplaceDataRepository

# Import extractors
from .extractors.product_extractor import extract_product_details
from .extractors.price_history_extractor import extract_price_history


class BuckCheapScraper(MarketplaceScraper):
    """Buck.cheap historical price data scraper.
    
    This class provides specialized methods for scraping Buck.cheap, which tracks
    pricing history for products from major South African retailers including
    Takealot, Makro, Checkers Sixty60, Woolworths, and Pick n Pay.
    
    Features:
    - Extract historical price data going back 2+ years
    - Identify price change events with dates
    - Download and process CSV files with detailed price history
    - Match products with marketplace scrapers' data
    - Implement respectful scraping practices
    """
    
    def __init__(self, 
                 proxy_client: SmartProxyClient, 
                 storage_client: MarketplaceDataRepository,
                 request_interval: float = 7.0):  # Conservative rate limiting
        """Initialize the Buck.cheap scraper.
        
        Args:
            proxy_client: SmartProxy client for web requests
            storage_client: Repository client for data storage
            request_interval: Minimum interval between requests (in seconds)
        """
        super().__init__(
            proxy_client=proxy_client,
            storage_client=storage_client,
            marketplace_name="buck_cheap",
            base_url="https://buck.cheap",
            request_interval=request_interval,
            respect_robots=True,
            user_agent="Fluxori_Marketplace_Intelligence/1.0 (https://fluxori.com)",
            template_support=False  # Buck.cheap likely doesn't work with generic e-commerce templates
        )
        
        # Buck.cheap-specific constants
        self.search_base_url = "https://buck.cheap/search"
        self.supported_retailers = {
            "takealot": "Takealot",
            "makro": "Makro",
            "pnp": "Pick n Pay",
            "checkers": "Checkers",
            "woolworths": "Woolworths",
            "game": "Game",
            "dis-chem": "Dis-Chem",
            "clicks": "Clicks",
            "incredible": "Incredible Connection"
        }
        
        # In-memory cache for mapping products
        self._product_mapping_cache = {}
        
        # Matching configuration
        self.minimum_match_confidence = 70  # Percentage threshold for confident matches
        
    async def search_products(self, keyword: str, page: int = 1) -> Dict[str, Any]:
        """Search for products on Buck.cheap using a keyword.
        
        Args:
            keyword: Search keyword or phrase
            page: Page number (1-based)
            
        Returns:
            Search results with products and metadata
            
        Raises:
            NetworkError: If search page couldn't be fetched
        """
        try:
            # Build search URL
            search_url = f"{self.search_base_url}?q={quote(keyword)}&page={page}"
            
            # Fetch search page
            response = await self.fetch_page(
                url=search_url,
                use_js=True,
                selector_to_wait=".product-grid"
            )
            
            if "content" not in response:
                self.logger.error(f"Invalid response for search '{keyword}': {response}")
                return {"keyword": keyword, "marketplace": self.marketplace_name, "results": []}
            
            # Extract search results
            html_content = response["content"]
            
            # Parse products from the search results page
            products = self._parse_search_results(html_content)
            
            # Create search data dictionary
            search_data = {
                "keyword": keyword,
                "marketplace": self.marketplace_name,
                "page": page,
                "results": products,
                "result_count": len(products),
                "timestamp": datetime.now().isoformat()
            }
            
            # Log results
            self.logger.info(f"Found {len(products)} products for keyword '{keyword}'")
            
            return search_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during search: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during search: {str(e)}")
            raise
            
    def _parse_search_results(self, html_content: str) -> List[Dict[str, Any]]:
        """Parse search results from HTML content.
        
        Args:
            html_content: HTML content of search results page
            
        Returns:
            List of product dictionaries
        """
        from bs4 import BeautifulSoup
        
        products = []
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find all product cards in the search results
        product_cards = soup.select(".product-card")
        
        for position, card in enumerate(product_cards, 1):
            try:
                # Extract product URL
                product_link = card.select_one("a.product-link")
                if not product_link:
                    continue
                    
                product_url = urljoin(self.base_url, product_link.get("href", ""))
                
                # Extract retailer from URL
                retailer = "unknown"
                for retailer_key, retailer_name in self.supported_retailers.items():
                    if f"/{retailer_key}/" in product_url:
                        retailer = retailer_key
                        break
                
                # Extract product title
                title_element = card.select_one(".product-title")
                title = title_element.text.strip() if title_element else "Unknown Product"
                
                # Extract current price
                price = None
                price_element = card.select_one(".price-current")
                if price_element:
                    price_text = price_element.text.strip()
                    # Extract numeric value from price text (e.g., "R123.45" -> 123.45)
                    price_match = re.search(r'R\s*(\d+(?:\.\d+)?)', price_text)
                    if price_match:
                        try:
                            price = float(price_match.group(1))
                        except ValueError:
                            pass
                
                # Extract image URL
                image_url = None
                image_element = card.select_one("img.product-image")
                if image_element and image_element.get("src"):
                    image_url = urljoin(self.base_url, image_element["src"])
                
                # Extract product ID from URL
                product_id = self._extract_product_id_from_url(product_url)
                
                # Create product data dictionary
                product_data = {
                    "product_id": product_id,
                    "url": product_url,
                    "title": title,
                    "position": position,
                    "retailer": retailer,
                    "retailer_name": self.supported_retailers.get(retailer, "Unknown Retailer")
                }
                
                if price:
                    product_data["price"] = price
                    product_data["currency"] = "ZAR"
                    
                if image_url:
                    product_data["image"] = image_url
                
                products.append(product_data)
                
            except Exception as e:
                self.logger.error(f"Error parsing product card: {str(e)}")
                continue
        
        return products
        
    def _extract_product_id_from_url(self, url: str) -> str:
        """Extract product ID from Buck.cheap URL.
        
        Args:
            url: Buck.cheap product URL
            
        Returns:
            Product ID or sanitized URL path as fallback
        """
        # Extract from URL pattern like /takealot/PLID12345678-product-name
        product_id_match = re.search(r'/([^/]+)/([^-/]+)-', url)
        if product_id_match:
            retailer = product_id_match.group(1)
            product_id = product_id_match.group(2)
            return f"{retailer}_{product_id}"
            
        # Fallback to sanitized path
        path = urlparse(url).path.strip('/')
        return path.replace('/', '_')
    
    async def extract_product_details(self, product_url_or_id: str) -> Dict[str, Any]:
        """Extract detailed product information including price history.
        
        Args:
            product_url_or_id: Product URL or Buck.cheap product ID
            
        Returns:
            Product details dictionary with price history
            
        Raises:
            NetworkError: If product page couldn't be fetched
            ValueError: If invalid product URL or ID provided
        """
        try:
            # Determine product URL
            if product_url_or_id.startswith("http"):
                product_url = product_url_or_id
            else:
                # Try to reconstruct URL from ID if possible
                parts = product_url_or_id.split('_', 1)
                if len(parts) == 2 and parts[0] in self.supported_retailers:
                    retailer, prod_id = parts
                    # This is a guess at URL structure, might need refinement
                    product_url = f"{self.base_url}/{retailer}/{prod_id}"
                else:
                    raise ValueError(f"Cannot determine URL from product ID: {product_url_or_id}")
            
            # Fetch product page
            response = await self.fetch_page(
                url=product_url,
                use_js=True,
                selector_to_wait=".product-detail"
            )
            
            if "content" not in response:
                self.logger.error(f"Invalid response for product {product_url}: {response}")
                return {}
            
            # Extract base product details
            html_content = response["content"]
            product_data = extract_product_details(html_content, product_url)
            
            # Extract price history from the page
            price_history = extract_price_history(html_content)
            if price_history:
                product_data["price_history"] = price_history
            
            # Attempt to download CSV price history if available
            csv_history = await self._download_price_history_csv(html_content, product_url)
            if csv_history:
                product_data["price_history_csv"] = csv_history
                
                # Merge CSV data with parsed history data for a complete picture
                self._merge_price_history_data(product_data)
            
            # Get original retailer product URL if available
            retailer_url = self._extract_retailer_url(html_content)
            if retailer_url:
                product_data["retailer_url"] = retailer_url
            
            # Identify the retailer from URL
            for retailer_key, retailer_name in self.supported_retailers.items():
                if f"/{retailer_key}/" in product_url:
                    product_data["retailer"] = retailer_key
                    product_data["retailer_name"] = retailer_name
                    break
            
            # Store in our repository
            if "product_id" in product_data:
                try:
                    await self.storage_client.save_product(product_data)
                    self.logger.info(f"Saved Buck.cheap product data for {product_data['product_id']}")
                except Exception as e:
                    self.logger.error(f"Error saving product data: {str(e)}")
            
            return product_data
            
        except (NetworkError, LoadSheddingDetectedError) as e:
            self.logger.error(f"Network error during product extraction: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error during product extraction: {str(e)}")
            raise
    
    async def _download_price_history_csv(self, html_content: str, product_url: str) -> Optional[List[Dict[str, Any]]]:
        """Download and parse CSV price history data if available.
        
        Args:
            html_content: HTML content of product page
            product_url: Product page URL
            
        Returns:
            List of price history points from CSV or None if unavailable
        """
        from bs4 import BeautifulSoup
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Look for CSV download link
            csv_link = soup.select_one("a[href$='.csv'], a[href*='download'], a[href*='history']")
            if not csv_link or not csv_link.get("href"):
                self.logger.info(f"No CSV price history link found for {product_url}")
                return None
            
            csv_url = urljoin(product_url, csv_link["href"])
            
            # Fetch CSV file
            self.logger.info(f"Downloading price history CSV from {csv_url}")
            
            # Use raw download without JavaScript
            csv_response = await self.fetch_page(
                url=csv_url,
                use_js=False,
                retries=2
            )
            
            if "content" not in csv_response:
                self.logger.warning(f"Failed to download CSV from {csv_url}")
                return None
            
            # Parse CSV content
            csv_content = csv_response["content"]
            return self._parse_csv_data(csv_content)
            
        except Exception as e:
            self.logger.error(f"Error downloading CSV price history: {str(e)}")
            return None
    
    def _parse_csv_data(self, csv_content: str) -> List[Dict[str, Any]]:
        """Parse CSV price history data.
        
        Args:
            csv_content: CSV file content as string
            
        Returns:
            List of price history points
        """
        price_points = []
        
        try:
            # Parse CSV content
            csv_file = StringIO(csv_content)
            csv_reader = csv.reader(csv_file)
            
            # Try to determine format from header row
            headers = next(csv_reader, None)
            if not headers:
                return []
            
            # Expected columns: date and price (potentially with different names)
            date_col = -1
            price_col = -1
            
            for i, header in enumerate(headers):
                header_lower = header.lower()
                if 'date' in header_lower:
                    date_col = i
                elif 'price' in header_lower or 'amount' in header_lower:
                    price_col = i
            
            # If we couldn't identify columns, guess based on position
            if date_col == -1 and len(headers) > 0:
                date_col = 0
            if price_col == -1 and len(headers) > 1:
                price_col = 1
            elif price_col == -1 and len(headers) == 1:
                # Only one column, assume it's paired date,price
                price_col = 0
            
            # Parse rows
            for row in csv_reader:
                if not row or len(row) <= max(date_col, price_col):
                    continue
                
                try:
                    # Extract date and price
                    date_str = row[date_col].strip()
                    price_str = row[price_col].strip() if price_col != date_col else None
                    
                    # If only one column, try to split it
                    if price_str is None and ',' in date_str:
                        parts = date_str.split(',', 1)
                        if len(parts) == 2:
                            date_str = parts[0].strip()
                            price_str = parts[1].strip()
                    
                    # Try to parse date
                    date_obj = None
                    
                    # Try multiple date formats
                    date_formats = [
                        '%Y-%m-%d',              # 2024-04-17
                        '%d/%m/%Y',              # 17/04/2024
                        '%d-%m-%Y',              # 17-04-2024
                        '%b %d %Y',              # Apr 17 2024
                        '%d %b %Y',              # 17 Apr 2024
                        '%a %b %d %Y',           # Wed Apr 17 2024
                        '%A, %B %d, %Y',         # Wednesday, April 17, 2024
                        '%Y/%m/%d',              # 2024/04/17
                    ]
                    
                    for date_format in date_formats:
                        try:
                            date_obj = datetime.strptime(date_str, date_format)
                            break
                        except ValueError:
                            continue
                    
                    if not date_obj:
                        continue
                    
                    # Parse price
                    price = None
                    if price_str:
                        # Remove currency symbols and commas
                        price_str = re.sub(r'[^\d.]', '', price_str)
                        try:
                            price = float(price_str)
                        except ValueError:
                            continue
                    
                    # Create price point
                    price_point = {
                        "date": date_obj.isoformat().split('T')[0],  # ISO format date only
                    }
                    
                    if price is not None:
                        price_point["price"] = price
                        price_point["currency"] = "ZAR"
                    
                    price_points.append(price_point)
                    
                except Exception as e:
                    self.logger.debug(f"Error parsing CSV row: {str(e)}")
                    continue
            
            # Sort price points by date
            price_points.sort(key=lambda x: x["date"])
            
            return price_points
            
        except Exception as e:
            self.logger.error(f"Error parsing CSV data: {str(e)}")
            return []
    
    def _extract_retailer_url(self, html_content: str) -> Optional[str]:
        """Extract original retailer product URL from product page.
        
        Args:
            html_content: HTML content of product page
            
        Returns:
            Original retailer URL or None if not found
        """
        from bs4 import BeautifulSoup
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Look for retailer link
            retailer_link = soup.select_one("a.retailer-link, a.original-link, a[href*='takealot.com'], a[href*='makro.co.za'], a[href*='pnp.co.za'], a[href*='checkers.co.za'], a[href*='woolworths.co.za'], a[href*='game.co.za'], a[href*='clicks.co.za'], a[href*='dischem.co.za']")
            
            if retailer_link and retailer_link.get("href"):
                return retailer_link["href"]
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error extracting retailer URL: {str(e)}")
            return None
    
    def _merge_price_history_data(self, product_data: Dict[str, Any]) -> None:
        """Merge price history data from different sources for a complete picture.
        
        Args:
            product_data: Product data dictionary to update
        """
        # If we have both parsed history and CSV history, merge them
        if "price_history" in product_data and "price_history_csv" in product_data:
            merged_history = []
            
            # Create a lookup of dates we already have
            existing_dates = {point["date"]: point for point in product_data["price_history"] if "date" in point}
            
            # Add all points from parsed history
            merged_history.extend(product_data["price_history"])
            
            # Add additional points from CSV history
            for csv_point in product_data["price_history_csv"]:
                if "date" in csv_point and csv_point["date"] not in existing_dates:
                    merged_history.append(csv_point)
                elif "date" in csv_point and "price" in csv_point and csv_point["date"] in existing_dates:
                    # If we have a price for an existing date, use the most detailed entry
                    existing = existing_dates[csv_point["date"]]
                    if "price" not in existing and "price" in csv_point:
                        # Update the existing entry with the price from CSV
                        for i, point in enumerate(merged_history):
                            if point.get("date") == csv_point["date"]:
                                merged_history[i]["price"] = csv_point["price"]
                                if "currency" in csv_point:
                                    merged_history[i]["currency"] = csv_point["currency"]
                                break
            
            # Sort by date
            merged_history.sort(key=lambda x: x.get("date", ""))
            
            # Update product data with merged history
            product_data["price_history"] = merged_history
            
            # Calculate price statistics
            prices = [point["price"] for point in merged_history if "price" in point]
            if prices:
                product_data["price_history_stats"] = {
                    "min_price": min(prices),
                    "max_price": max(prices),
                    "avg_price": sum(prices) / len(prices),
                    "first_price": prices[0] if prices else None,
                    "last_price": prices[-1] if prices else None,
                    "num_points": len(prices),
                    "date_range": {
                        "start": merged_history[0].get("date") if merged_history else None,
                        "end": merged_history[-1].get("date") if merged_history else None
                    }
                }
            
            # Remove raw CSV data to save space
            product_data.pop("price_history_csv", None)
    
    async def match_with_marketplace_product(self, 
                                           marketplace: str, 
                                           marketplace_product: Dict[str, Any]) -> Dict[str, Any]:
        """Match a marketplace product with Buck.cheap historical data.
        
        Args:
            marketplace: Marketplace name (e.g., "takealot")
            marketplace_product: Product data from marketplace scraper
            
        Returns:
            Match results including confidence score and matched data
            
        Raises:
            ValueError: If required product information is missing
        """
        if "product_id" not in marketplace_product or "title" not in marketplace_product:
            raise ValueError("Product must have ID and title for matching")
        
        try:
            product_id = marketplace_product["product_id"]
            title = marketplace_product["title"]
            
            # Check cache for previous matches
            cache_key = f"{marketplace}_{product_id}"
            if cache_key in self._product_mapping_cache:
                return self._product_mapping_cache[cache_key]
            
            # Strategy 1: Direct match by product ID
            # This works if Buck.cheap uses the same IDs
            direct_match = await self._search_by_product_id(marketplace, product_id)
            if direct_match and direct_match.get("confidence", 0) >= self.minimum_match_confidence:
                self._product_mapping_cache[cache_key] = direct_match
                return direct_match
            
            # Strategy 2: Search by product title
            title_match = await self._search_by_title(marketplace, title)
            if title_match and title_match.get("confidence", 0) >= self.minimum_match_confidence:
                self._product_mapping_cache[cache_key] = title_match
                return title_match
            
            # Strategy 3: Use retailer URL if available
            if "url" in marketplace_product:
                url_match = await self._search_by_retailer_url(marketplace_product["url"])
                if url_match and url_match.get("confidence", 0) >= self.minimum_match_confidence:
                    self._product_mapping_cache[cache_key] = url_match
                    return url_match
            
            # Return best match or no match
            if direct_match and (not title_match or direct_match.get("confidence", 0) > title_match.get("confidence", 0)):
                self._product_mapping_cache[cache_key] = direct_match
                return direct_match
            elif title_match:
                self._product_mapping_cache[cache_key] = title_match
                return title_match
            else:
                return {
                    "matched": False,
                    "confidence": 0,
                    "message": "No match found"
                }
            
        except Exception as e:
            self.logger.error(f"Error matching product: {str(e)}")
            return {
                "matched": False,
                "confidence": 0,
                "error": str(e)
            }
    
    async def _search_by_product_id(self, marketplace: str, product_id: str) -> Dict[str, Any]:
        """Search for a product by ID in Buck.cheap.
        
        Args:
            marketplace: Marketplace name
            product_id: Product ID from the marketplace
            
        Returns:
            Match results
        """
        # Some marketplaces may use different ID formats
        # For example, Takealot uses PLID12345678
        search_id = product_id
        if marketplace == "takealot" and not product_id.startswith("PLID"):
            search_id = f"PLID{product_id}"
        
        # Search using the ID
        search_results = await self.search_products(search_id, page=1)
        
        if not search_results.get("results"):
            return {"matched": False, "confidence": 0}
        
        # Look for exact matches first
        for result in search_results["results"]:
            result_id = result.get("product_id", "")
            
            # Check if IDs match
            if result_id.endswith(search_id) or search_id in result_id:
                # Get full details
                product_details = await self.extract_product_details(result["url"])
                
                return {
                    "matched": True,
                    "confidence": 95,  # High confidence for ID match
                    "buck_cheap_id": result_id,
                    "buck_cheap_url": result["url"],
                    "price_history": product_details.get("price_history", []),
                    "price_history_stats": product_details.get("price_history_stats", {})
                }
        
        return {"matched": False, "confidence": 0}
    
    async def _search_by_title(self, marketplace: str, title: str) -> Dict[str, Any]:
        """Search for a product by title in Buck.cheap.
        
        Args:
            marketplace: Marketplace name
            title: Product title
            
        Returns:
            Match results
        """
        # Clean up title for better matching
        # Remove common noise words, keep only significant terms
        clean_title = self._clean_title_for_search(title)
        
        # Search using the cleaned title
        search_results = await self.search_products(clean_title, page=1)
        
        if not search_results.get("results"):
            return {"matched": False, "confidence": 0}
        
        # Find best match by title similarity
        best_match = None
        best_score = 0
        
        for result in search_results["results"]:
            result_title = result.get("title", "")
            result_retailer = result.get("retailer", "")
            
            # Skip if retailer doesn't match the marketplace
            if marketplace != result_retailer and f"{marketplace}.co.za" not in result.get("url", ""):
                continue
                
            # Calculate similarity score
            similarity = self._calculate_title_similarity(title, result_title)
            
            if similarity > best_score:
                best_score = similarity
                best_match = result
        
        if best_match and best_score >= 0.7:  # 70% similarity threshold
            # Get full details
            product_details = await self.extract_product_details(best_match["url"])
            
            # Convert similarity to confidence percentage
            confidence = int(best_score * 100)
            
            return {
                "matched": True,
                "confidence": confidence,
                "buck_cheap_id": best_match.get("product_id", ""),
                "buck_cheap_url": best_match["url"],
                "price_history": product_details.get("price_history", []),
                "price_history_stats": product_details.get("price_history_stats", {})
            }
        
        return {"matched": False, "confidence": int(best_score * 100) if best_score else 0}
    
    async def _search_by_retailer_url(self, retailer_url: str) -> Dict[str, Any]:
        """Search for a product by retailer URL in Buck.cheap.
        
        Args:
            retailer_url: URL of the product on the retailer's site
            
        Returns:
            Match results
        """
        # Extract product ID or key identifiers from URL
        url_parts = urlparse(retailer_url)
        path = url_parts.path.strip('/')
        
        # Extract useful search terms from the URL path
        search_terms = re.sub(r'[_\-/]', ' ', path)
        
        # Search using the extracted terms
        search_results = await self.search_products(search_terms, page=1)
        
        if not search_results.get("results"):
            return {"matched": False, "confidence": 0}
        
        # Find matches by comparing retailer URLs
        for result in search_results["results"]:
            # Get full details to access retailer URL
            product_details = await self.extract_product_details(result["url"])
            
            if "retailer_url" in product_details:
                result_retailer_url = product_details["retailer_url"]
                
                # Compare URLs
                if self._compare_urls(retailer_url, result_retailer_url):
                    return {
                        "matched": True,
                        "confidence": 90,  # High confidence for URL match
                        "buck_cheap_id": result.get("product_id", ""),
                        "buck_cheap_url": result["url"],
                        "price_history": product_details.get("price_history", []),
                        "price_history_stats": product_details.get("price_history_stats", {})
                    }
        
        return {"matched": False, "confidence": 0}
    
    def _clean_title_for_search(self, title: str) -> str:
        """Clean product title for better search results.
        
        Args:
            title: Original product title
            
        Returns:
            Cleaned search terms
        """
        # Remove common noise words and characters
        noise_words = [
            "with", "and", "for", "the", "in", "a", "an", "by", "to", "of", "on", 
            "new", "original", "genuine", "official", "pack", "bundle", "set", "edition"
        ]
        
        # Convert to lowercase
        title = title.lower()
        
        # Remove brackets and their contents
        title = re.sub(r'\(.*?\)', '', title)
        
        # Split into words
        words = title.split()
        
        # Filter out noise words and very short words
        filtered_words = [word for word in words if word not in noise_words and len(word) > 2]
        
        # Join back, but limit to first several significant words to avoid over-specific queries
        return ' '.join(filtered_words[:6])
    
    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two product titles.
        
        Args:
            title1: First product title
            title2: Second product title
            
        Returns:
            Similarity score between 0 and 1
        """
        # Method 1: Word overlap ratio
        words1 = set(re.findall(r'\b\w{3,}\b', title1.lower()))
        words2 = set(re.findall(r'\b\w{3,}\b', title2.lower()))
        
        if not words1 or not words2:
            return 0.0
            
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        overlap_ratio = len(intersection) / len(union)
        
        # Method 2: Include model numbers as a stronger signal
        # Model numbers often appear as alphanumeric patterns
        models1 = set(re.findall(r'[A-Za-z0-9]{2,4}[-][A-Za-z0-9]{2,8}|[A-Z][A-Z0-9]{4,}', title1))
        models2 = set(re.findall(r'[A-Za-z0-9]{2,4}[-][A-Za-z0-9]{2,8}|[A-Z][A-Z0-9]{4,}', title2))
        
        model_match = 0.0
        if models1 and models2:
            model_intersection = models1.intersection(models2)
            if model_intersection:
                model_match = 0.3  # Boost score if model numbers match
                
        # Return combined score
        return min(overlap_ratio + model_match, 1.0)
    
    def _compare_urls(self, url1: str, url2: str) -> bool:
        """Compare two retailer URLs to determine if they point to the same product.
        
        Args:
            url1: First URL
            url2: Second URL
            
        Returns:
            True if URLs likely point to the same product
        """
        # Parse URLs
        parsed1 = urlparse(url1)
        parsed2 = urlparse(url2)
        
        # If domains don't match, probably not the same
        if parsed1.netloc != parsed2.netloc:
            return False
            
        # Extract paths
        path1 = parsed1.path.strip('/')
        path2 = parsed2.path.strip('/')
        
        # If paths are identical, it's a match
        if path1 == path2:
            return True
            
        # Extract product IDs or key identifiers from paths
        # This is retailer-specific logic
        
        # Takealot product IDs (PLID format)
        takealot_id1 = re.search(r'PLID(\d+)', path1)
        takealot_id2 = re.search(r'PLID(\d+)', path2)
        
        if takealot_id1 and takealot_id2 and takealot_id1.group(1) == takealot_id2.group(1):
            return True
            
        # For other retailers, do similar ID extraction based on URL patterns
        # This would need to be expanded for each supported retailer
        
        return False
    
    async def get_price_history_by_timeframe(self, 
                                          buck_cheap_url: str,
                                          start_date: Optional[str] = None,
                                          end_date: Optional[str] = None) -> Dict[str, Any]:
        """Get price history data within a specific timeframe.
        
        Args:
            buck_cheap_url: Buck.cheap product URL
            start_date: Start date in ISO format (YYYY-MM-DD)
            end_date: End date in ISO format (YYYY-MM-DD)
            
        Returns:
            Filtered price history data
        """
        try:
            # Extract product details including price history
            product_data = await self.extract_product_details(buck_cheap_url)
            
            if not product_data or "price_history" not in product_data:
                return {"error": "No price history available"}
                
            price_history = product_data["price_history"]
            
            # Filter by date range if specified
            if start_date or end_date:
                start = datetime.fromisoformat(start_date) if start_date else datetime.min
                end = datetime.fromisoformat(end_date) if end_date else datetime.max
                
                filtered_history = []
                for point in price_history:
                    if "date" in point:
                        point_date = datetime.fromisoformat(point["date"])
                        if start <= point_date <= end:
                            filtered_history.append(point)
                
                price_history = filtered_history
            
            # Calculate statistics for the filtered data
            prices = [point["price"] for point in price_history if "price" in point]
            price_stats = {}
            
            if prices:
                price_stats = {
                    "min_price": min(prices),
                    "max_price": max(prices),
                    "avg_price": sum(prices) / len(prices),
                    "first_price": prices[0] if prices else None,
                    "last_price": prices[-1] if prices else None,
                    "num_points": len(prices),
                    "date_range": {
                        "start": price_history[0].get("date") if price_history else None,
                        "end": price_history[-1].get("date") if price_history else None
                    }
                }
            
            return {
                "product_id": product_data.get("product_id", ""),
                "title": product_data.get("title", ""),
                "retailer": product_data.get("retailer", ""),
                "price_history": price_history,
                "price_stats": price_stats,
                "filtered_by": {
                    "start_date": start_date,
                    "end_date": end_date
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting price history by timeframe: {str(e)}")
            return {"error": str(e)}
    
    async def analyze_price_trends(self, buck_cheap_url: str) -> Dict[str, Any]:
        """Analyze price trends and patterns for a product.
        
        Args:
            buck_cheap_url: Buck.cheap product URL
            
        Returns:
            Price trend analysis
        """
        try:
            # Extract product details including price history
            product_data = await self.extract_product_details(buck_cheap_url)
            
            if not product_data or "price_history" not in product_data:
                return {"error": "No price history available"}
                
            price_history = product_data["price_history"]
            
            # Ensure price history has required data
            valid_points = [point for point in price_history if "date" in point and "price" in point]
            
            if len(valid_points) < 2:
                return {
                    "product_id": product_data.get("product_id", ""),
                    "title": product_data.get("title", ""),
                    "error": "Insufficient price history for trend analysis"
                }
            
            # Sort by date to ensure chronological order
            valid_points.sort(key=lambda x: x["date"])
            
            # Calculate price changes and trends
            price_changes = []
            current_trend = "stable"
            trend_duration = 0
            max_price_drop = {"amount": 0, "percentage": 0, "date": None}
            max_price_increase = {"amount": 0, "percentage": 0, "date": None}
            
            for i in range(1, len(valid_points)):
                prev = valid_points[i-1]
                curr = valid_points[i]
                
                price_diff = curr["price"] - prev["price"]
                percentage_change = (price_diff / prev["price"]) * 100 if prev["price"] else 0
                
                # Record price change
                price_changes.append({
                    "date": curr["date"],
                    "prev_price": prev["price"],
                    "new_price": curr["price"],
                    "change": price_diff,
                    "percentage": percentage_change
                })
                
                # Track maximum drops and increases
                if price_diff < 0 and abs(price_diff) > max_price_drop["amount"]:
                    max_price_drop = {
                        "amount": abs(price_diff),
                        "percentage": abs(percentage_change),
                        "date": curr["date"],
                        "from": prev["price"],
                        "to": curr["price"]
                    }
                elif price_diff > 0 and price_diff > max_price_increase["amount"]:
                    max_price_increase = {
                        "amount": price_diff,
                        "percentage": percentage_change,
                        "date": curr["date"],
                        "from": prev["price"],
                        "to": curr["price"]
                    }
            
            # Determine overall trend
            first_price = valid_points[0]["price"]
            last_price = valid_points[-1]["price"]
            total_change = last_price - first_price
            total_percentage = (total_change / first_price) * 100 if first_price else 0
            
            if total_percentage < -10:
                overall_trend = "declining"
            elif total_percentage > 10:
                overall_trend = "increasing"
            else:
                overall_trend = "stable"
            
            # Identify price patterns
            patterns = []
            
            # Check for seasonal patterns (very simplified)
            months_with_changes = {}
            for change in price_changes:
                month = datetime.fromisoformat(change["date"]).month
                months_with_changes[month] = months_with_changes.get(month, 0) + 1
            
            high_activity_months = [month for month, count in months_with_changes.items() if count > 1]
            if high_activity_months:
                month_names = {
                    1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 
                    7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
                }
                patterns.append({
                    "type": "seasonal",
                    "description": f"Price changes often occur in {', '.join(month_names[m] for m in high_activity_months)}",
                    "confidence": "medium"
                })
            
            # Check for discount cycles (price drops followed by returns to original)
            discount_cycles = []
            for i in range(1, len(price_changes)):
                current = price_changes[i]
                previous = price_changes[i-1]
                
                if previous["change"] < 0 and current["change"] > 0:
                    discount_cycles.append({
                        "start_date": previous["date"],
                        "end_date": current["date"],
                        "discount_amount": abs(previous["change"]),
                        "discount_percentage": abs(previous["percentage"])
                    })
            
            if discount_cycles:
                patterns.append({
                    "type": "discount_cycles",
                    "description": f"Found {len(discount_cycles)} discount cycles where prices drop and then return to original",
                    "cycles": discount_cycles,
                    "confidence": "high" if len(discount_cycles) > 2 else "medium"
                })
            
            # Return analysis
            return {
                "product_id": product_data.get("product_id", ""),
                "title": product_data.get("title", ""),
                "retailer": product_data.get("retailer", ""),
                "overall_trend": {
                    "direction": overall_trend,
                    "total_change": total_change,
                    "total_percentage": total_percentage,
                    "period": {
                        "start": valid_points[0]["date"],
                        "end": valid_points[-1]["date"]
                    }
                },
                "price_change_count": len(price_changes),
                "max_price_drop": max_price_drop,
                "max_price_increase": max_price_increase,
                "patterns_detected": patterns,
                "price_volatility": self._calculate_price_volatility(valid_points)
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing price trends: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_price_volatility(self, price_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate price volatility metrics.
        
        Args:
            price_points: List of price history points
            
        Returns:
            Volatility metrics
        """
        if len(price_points) < 2:
            return {"level": "unknown", "score": 0}
            
        prices = [point["price"] for point in price_points]
        changes = [abs((prices[i] - prices[i-1]) / prices[i-1]) * 100 for i in range(1, len(prices))]
        
        avg_change = sum(changes) / len(changes) if changes else 0
        max_change = max(changes) if changes else 0
        
        # Determine volatility level
        if avg_change < 2:
            level = "very_low"
        elif avg_change < 5:
            level = "low"
        elif avg_change < 10:
            level = "medium"
        elif avg_change < 20:
            level = "high"
        else:
            level = "very_high"
            
        return {
            "level": level,
            "score": avg_change,
            "average_change_percentage": avg_change,
            "maximum_change_percentage": max_change,
            "change_count": len(changes)
        }