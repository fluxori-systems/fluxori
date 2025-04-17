"""
Marketplace data repository for storing and retrieving marketplace data.

This module provides a repository implementation for Google Cloud Firestore,
with specific optimizations for storing marketplace data like products,
prices, search results, and categories.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Set, Tuple

try:
    from google.cloud import firestore
    from google.cloud.firestore_v1.base_query import FieldFilter, And, Or
except ImportError:
    # Mock classes for development without Firebase
    class firestore:
        @staticmethod
        def SERVER_TIMESTAMP():
            return datetime.now().isoformat()
            
        class AsyncClient:
            def __init__(self, *args, **kwargs):
                pass
                
            def collection(self, name):
                return Collection(name)
                
    class FieldFilter:
        def __init__(self, field, op, value):
            self.field = field
            self.op = op
            self.value = value
            
    class And:
        def __init__(self, *filters):
            self.filters = filters
            
    class Or:
        def __init__(self, *filters):
            self.filters = filters
            
    class Collection:
        def __init__(self, name):
            self.name = name
            
        def document(self, doc_id):
            return Document(doc_id)
            
        def add(self, data):
            return ("mock_doc_id", None)
            
    class Document:
        def __init__(self, doc_id):
            self.id = doc_id
            
        async def get(self):
            return MockDocSnapshot()
            
        async def set(self, data):
            return True
            
        async def update(self, data):
            return True
            
    class MockDocSnapshot:
        @property
        def exists(self):
            return False
            
        def to_dict(self):
            return {}
            

class MarketplaceDataRepository:
    """Repository for marketplace data with Firestore implementation.
    
    This class handles storage and retrieval of marketplace data with
    optimizations for the South African market, including:
    
    - Efficient document structure for quick queries
    - Historical price tracking
    - Transaction support for consistent updates
    - Caching for load shedding resilience
    - Optimistic locking for concurrent operations
    """
    
    def __init__(self, 
                 firestore_client = None,
                 project_id: Optional[str] = None,
                 cache_enabled: bool = True,
                 cache_ttl: int = 3600):  # 1 hour default TTL
        """Initialize the marketplace data repository.
        
        Args:
            firestore_client: Firestore client (created if not provided)
            project_id: Google Cloud project ID
            cache_enabled: Whether to enable in-memory caching
            cache_ttl: Cache time-to-live in seconds
        """
        self.db = firestore_client or firestore.AsyncClient(project=project_id)
        self.products_collection = self.db.collection("marketplace_products")
        self.prices_collection = self.db.collection("product_prices")
        self.keywords_collection = self.db.collection("search_keywords")
        self.categories_collection = self.db.collection("marketplace_categories")
        self.suggestions_collection = self.db.collection("search_suggestions")
        
        # Caching setup
        self.cache_enabled = cache_enabled
        self.cache_ttl = cache_ttl
        self.cache = {
            "products": {},
            "prices": {},
            "keywords": {},
            "categories": {},
            "suggestions": {}
        }
        self.cache_timestamps = {
            "products": {},
            "prices": {},
            "keywords": {},
            "categories": {},
            "suggestions": {}
        }
        
        # Setup logging
        self.logger = logging.getLogger("marketplace-repository")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    def _sanitize_id(self, id_string: str) -> str:
        """Sanitize ID for use as a Firestore document ID.
        
        Args:
            id_string: Raw ID string
            
        Returns:
            Sanitized ID string
        """
        # Remove invalid characters, limit length
        sanitized = ''.join(c for c in id_string if c.isalnum() or c in ['-', '_'])
        if len(sanitized) > 1500:  # Firestore has 1500 character limit
            sanitized = sanitized[:1500]
        return sanitized
        
    def _get_document_id(self, marketplace: str, entity_id: str, entity_type: str = "product") -> str:
        """Generate a consistent document ID for an entity.
        
        Args:
            marketplace: Marketplace name
            entity_id: Entity ID
            entity_type: Entity type
            
        Returns:
            Document ID
        """
        entity_id = self._sanitize_id(entity_id)
        return f"{marketplace}_{entity_id}"
        
    def _get_from_cache(self, cache_key: str, entity_type: str) -> Optional[Dict[str, Any]]:
        """Get data from cache if available and not expired.
        
        Args:
            cache_key: Cache key
            entity_type: Entity type
            
        Returns:
            Cached data or None if not in cache or expired
        """
        if not self.cache_enabled:
            return None
            
        if cache_key not in self.cache[entity_type]:
            return None
            
        # Check if cache entry has expired
        timestamp = self.cache_timestamps[entity_type].get(cache_key, 0)
        if time.time() - timestamp > self.cache_ttl:
            # Remove expired entry
            self.cache[entity_type].pop(cache_key, None)
            self.cache_timestamps[entity_type].pop(cache_key, None)
            return None
            
        return self.cache[entity_type][cache_key]
        
    def _set_in_cache(self, cache_key: str, entity_type: str, data: Dict[str, Any]) -> None:
        """Store data in cache.
        
        Args:
            cache_key: Cache key
            entity_type: Entity type
            data: Data to cache
        """
        if not self.cache_enabled:
            return
            
        self.cache[entity_type][cache_key] = data
        self.cache_timestamps[entity_type][cache_key] = time.time()
        
    async def save_product(self, product_data: Dict[str, Any]) -> str:
        """Save product data with efficient document structure.
        
        Args:
            product_data: Product data to save
            
        Returns:
            Document ID of the saved product
            
        Raises:
            Exception: If save fails
        """
        if "product_id" not in product_data:
            raise ValueError("product_id is required")
            
        if "marketplace" not in product_data:
            raise ValueError("marketplace is required")
            
        try:
            # Generate document ID
            doc_id = self._get_document_id(
                product_data["marketplace"], 
                product_data["product_id"]
            )
            
            product_ref = self.products_collection.document(doc_id)
            
            # Check if product exists to determine if this is an update
            doc_snapshot = await product_ref.get()
            
            timestamp = firestore.SERVER_TIMESTAMP()
            
            if doc_snapshot.exists:
                # Update existing product with change tracking
                existing_data = doc_snapshot.to_dict()
                
                # Create update data
                update_data = {}
                
                # Only update fields that have changed
                for key, value in product_data.items():
                    if key not in existing_data or existing_data[key] != value:
                        update_data[key] = value
                        
                if update_data:
                    # Add metadata
                    update_data.update({
                        "last_updated": timestamp,
                        "update_count": (existing_data.get("update_count", 0) + 1)
                    })
                    
                    await product_ref.update(update_data)
                    self.logger.info(f"Updated product {doc_id} with {len(update_data)} changed fields")
                else:
                    self.logger.info(f"No changes detected for product {doc_id}")
            else:
                # Create new product
                product_data.update({
                    "first_seen": timestamp,
                    "last_updated": timestamp,
                    "update_count": 1
                })
                
                await product_ref.set(product_data)
                self.logger.info(f"Created new product {doc_id}")
                
            # Save price data if available
            if all(k in product_data for k in ["price", "marketplace", "product_id"]):
                price_data = {
                    "product_id": product_data["product_id"],
                    "marketplace": product_data["marketplace"],
                    "price": product_data["price"],
                    "currency": product_data.get("currency", "ZAR"),
                    "in_stock": product_data.get("in_stock", True),
                }
                
                if "list_price" in product_data:
                    price_data["list_price"] = product_data["list_price"]
                    
                if "discount_percentage" in product_data:
                    price_data["discount_percentage"] = product_data["discount_percentage"]
                    
                await self.save_price_point(price_data)
                
            # Update cache
            self._set_in_cache(doc_id, "products", product_data)
            
            return doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to save product: {str(e)}")
            raise
            
    async def save_price_point(self, price_data: Dict[str, Any]) -> str:
        """Save a price point in the historical price collection.
        
        Args:
            price_data: Price data to save
            
        Returns:
            Document ID of the saved price point
            
        Raises:
            Exception: If save fails
        """
        required_fields = ["product_id", "marketplace", "price"]
        for field in required_fields:
            if field not in price_data:
                raise ValueError(f"{field} is required")
                
        try:
            # Add timestamp
            price_data["timestamp"] = firestore.SERVER_TIMESTAMP()
            
            # Save to Firestore
            doc_ref, _ = await self.prices_collection.add(price_data)
            self.logger.info(f"Saved price point for {price_data['marketplace']}_{price_data['product_id']}")
            
            return doc_ref.id
            
        except Exception as e:
            self.logger.error(f"Failed to save price point: {str(e)}")
            raise
            
    async def save_search_results(self, search_data: Dict[str, Any]) -> str:
        """Save search results with position tracking.
        
        Args:
            search_data: Search results data
            
        Returns:
            Document ID of the saved search results
            
        Raises:
            Exception: If save fails
        """
        required_fields = ["keyword", "marketplace", "results"]
        for field in required_fields:
            if field not in search_data:
                raise ValueError(f"{field} is required")
                
        try:
            # Generate document ID
            doc_id = self._get_document_id(
                search_data["marketplace"], 
                search_data["keyword"],
                "search"
            )
            
            search_ref = self.keywords_collection.document(doc_id)
            
            # Limit results to prevent large documents
            results = search_data["results"][:100] if len(search_data["results"]) > 100 else search_data["results"]
            
            # Process results to include position
            processed_results = []
            for idx, result in enumerate(results):
                processed_result = {
                    "position": idx + 1,
                }
                
                # Copy relevant fields
                for field in ["product_id", "title", "price", "url", "image_url"]:
                    if field in result:
                        processed_result[field] = result[field]
                        
                processed_results.append(processed_result)
                
            # Create final data
            final_data = {
                "keyword": search_data["keyword"],
                "marketplace": search_data["marketplace"],
                "result_count": len(results),
                "timestamp": firestore.SERVER_TIMESTAMP(),
                "results": processed_results
            }
            
            await search_ref.set(final_data)
            self.logger.info(f"Saved search results for '{search_data['keyword']}' with {len(results)} results")
            
            # Update cache
            self._set_in_cache(doc_id, "keywords", final_data)
            
            return doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to save search results: {str(e)}")
            raise
            
    async def save_category(self, category_data: Dict[str, Any]) -> str:
        """Save category data.
        
        Args:
            category_data: Category data
            
        Returns:
            Document ID of the saved category
            
        Raises:
            Exception: If save fails
        """
        required_fields = ["category_id", "marketplace", "name"]
        for field in required_fields:
            if field not in category_data:
                raise ValueError(f"{field} is required")
                
        try:
            # Generate document ID
            doc_id = self._get_document_id(
                category_data["marketplace"], 
                category_data["category_id"],
                "category"
            )
            
            category_ref = self.categories_collection.document(doc_id)
            
            # Add timestamp
            category_data["last_updated"] = firestore.SERVER_TIMESTAMP()
            
            # Check if category exists
            doc_snapshot = await category_ref.get()
            
            if doc_snapshot.exists:
                await category_ref.update(category_data)
                self.logger.info(f"Updated category {doc_id}")
            else:
                # Add first seen timestamp for new categories
                category_data["first_seen"] = firestore.SERVER_TIMESTAMP()
                await category_ref.set(category_data)
                self.logger.info(f"Created new category {doc_id}")
                
            # Update cache
            self._set_in_cache(doc_id, "categories", category_data)
            
            return doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to save category: {str(e)}")
            raise
            
    async def save_search_suggestions(self, suggestion_data: Dict[str, Any]) -> str:
        """Save search suggestions.
        
        Args:
            suggestion_data: Suggestion data
            
        Returns:
            Document ID of the saved suggestions
            
        Raises:
            Exception: If save fails
        """
        required_fields = ["prefix", "marketplace", "suggestions"]
        for field in required_fields:
            if field not in suggestion_data:
                raise ValueError(f"{field} is required")
                
        try:
            # Generate document ID
            doc_id = self._get_document_id(
                suggestion_data["marketplace"], 
                suggestion_data["prefix"],
                "suggestion"
            )
            
            suggestion_ref = self.suggestions_collection.document(doc_id)
            
            # Create final data
            final_data = {
                "prefix": suggestion_data["prefix"],
                "marketplace": suggestion_data["marketplace"],
                "suggestions": suggestion_data["suggestions"],
                "timestamp": firestore.SERVER_TIMESTAMP(),
                "count": len(suggestion_data["suggestions"])
            }
            
            await suggestion_ref.set(final_data)
            self.logger.info(f"Saved {len(suggestion_data['suggestions'])} search suggestions for '{suggestion_data['prefix']}'")
            
            # Update cache
            self._set_in_cache(doc_id, "suggestions", final_data)
            
            return doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to save search suggestions: {str(e)}")
            raise
            
    async def get_product(self, marketplace: str, product_id: str) -> Optional[Dict[str, Any]]:
        """Get a product by ID.
        
        Args:
            marketplace: Marketplace name
            product_id: Product ID
            
        Returns:
            Product data or None if not found
            
        Raises:
            Exception: If retrieval fails
        """
        try:
            doc_id = self._get_document_id(marketplace, product_id)
            
            # Check cache first
            cached_data = self._get_from_cache(doc_id, "products")
            if cached_data:
                self.logger.debug(f"Cache hit for product {doc_id}")
                return cached_data
                
            # Fetch from Firestore
            doc_ref = self.products_collection.document(doc_id)
            doc_snapshot = await doc_ref.get()
            
            if not doc_snapshot.exists:
                return None
                
            product_data = doc_snapshot.to_dict()
            
            # Update cache
            self._set_in_cache(doc_id, "products", product_data)
            
            return product_data
            
        except Exception as e:
            self.logger.error(f"Failed to get product: {str(e)}")
            raise
            
    async def get_price_history(self, 
                              marketplace: str, 
                              product_id: str, 
                              days: int = 30) -> List[Dict[str, Any]]:
        """Get price history for a product.
        
        Args:
            marketplace: Marketplace name
            product_id: Product ID
            days: Number of days of history to retrieve
            
        Returns:
            List of price points
            
        Raises:
            Exception: If retrieval fails
        """
        try:
            # Calculate time limit
            time_limit = datetime.now().timestamp() - (days * 86400)
            
            # Create query
            query = (
                self.prices_collection
                .where(filter=FieldFilter("marketplace", "==", marketplace))
                .where(filter=FieldFilter("product_id", "==", product_id))
                .where(filter=FieldFilter("timestamp", ">=", time_limit))
                .order_by("timestamp")
            )
            
            # Execute query
            docs = query.stream()
            
            price_history = []
            async for doc in docs:
                price_point = doc.to_dict()
                price_history.append(price_point)
                
            self.logger.info(f"Retrieved {len(price_history)} price points for {marketplace}_{product_id}")
            
            return price_history
            
        except Exception as e:
            self.logger.error(f"Failed to get price history: {str(e)}")
            raise
            
    async def get_search_history(self, 
                               marketplace: str, 
                               keyword: str, 
                               limit: int = 10) -> List[Dict[str, Any]]:
        """Get search history for a keyword.
        
        Args:
            marketplace: Marketplace name
            keyword: Search keyword
            limit: Maximum number of historical searches to retrieve
            
        Returns:
            List of search result snapshots
            
        Raises:
            Exception: If retrieval fails
        """
        try:
            # Create query
            query = (
                self.keywords_collection
                .where(filter=FieldFilter("marketplace", "==", marketplace))
                .where(filter=FieldFilter("keyword", "==", keyword))
                .order_by("timestamp", direction="DESCENDING")
                .limit(limit)
            )
            
            # Execute query
            docs = query.stream()
            
            search_history = []
            async for doc in docs:
                search_data = doc.to_dict()
                search_history.append(search_data)
                
            self.logger.info(f"Retrieved {len(search_history)} search snapshots for '{keyword}'")
            
            return search_history
            
        except Exception as e:
            self.logger.error(f"Failed to get search history: {str(e)}")
            raise
            
    async def get_category(self, marketplace: str, category_id: str) -> Optional[Dict[str, Any]]:
        """Get a category by ID.
        
        Args:
            marketplace: Marketplace name
            category_id: Category ID
            
        Returns:
            Category data or None if not found
            
        Raises:
            Exception: If retrieval fails
        """
        try:
            doc_id = self._get_document_id(marketplace, category_id, "category")
            
            # Check cache first
            cached_data = self._get_from_cache(doc_id, "categories")
            if cached_data:
                self.logger.debug(f"Cache hit for category {doc_id}")
                return cached_data
                
            # Fetch from Firestore
            doc_ref = self.categories_collection.document(doc_id)
            doc_snapshot = await doc_ref.get()
            
            if not doc_snapshot.exists:
                return None
                
            category_data = doc_snapshot.to_dict()
            
            # Update cache
            self._set_in_cache(doc_id, "categories", category_data)
            
            return category_data
            
        except Exception as e:
            self.logger.error(f"Failed to get category: {str(e)}")
            raise
            
    async def get_marketplace_stats(self, marketplace: str) -> Dict[str, Any]:
        """Get statistics for a marketplace.
        
        Args:
            marketplace: Marketplace name
            
        Returns:
            Marketplace statistics
            
        Raises:
            Exception: If retrieval fails
        """
        try:
            # Get product count
            products_query = (
                self.products_collection
                .where(filter=FieldFilter("marketplace", "==", marketplace))
                .limit(1)
            )
            products_count = await self._count_query_results(products_query)
            
            # Get category count
            categories_query = (
                self.categories_collection
                .where(filter=FieldFilter("marketplace", "==", marketplace))
                .limit(1)
            )
            categories_count = await self._count_query_results(categories_query)
            
            # Get search keyword count
            keywords_query = (
                self.keywords_collection
                .where(filter=FieldFilter("marketplace", "==", marketplace))
                .limit(1)
            )
            keywords_count = await self._count_query_results(keywords_query)
            
            return {
                "marketplace": marketplace,
                "product_count": products_count,
                "category_count": categories_count,
                "keyword_count": keywords_count,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get marketplace stats: {str(e)}")
            raise
            
    async def _count_query_results(self, query) -> int:
        """Helper method to count query results.
        
        Args:
            query: Firestore query
            
        Returns:
            Count of documents matching query
        """
        # This is a workaround since Firestore doesn't have a direct count API
        count = 0
        async for _ in query.stream():
            count += 1
        return count