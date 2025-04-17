"""
Product schema definition for marketplace scraper.

This module defines the schema for product data collected from marketplaces,
ensuring consistent data structure and validation.
"""

from typing import Dict, List, Any, Optional, Union

# Product schema definition
PRODUCT_SCHEMA = {
    "type": "object",
    "required": [
        "product_id",
        "marketplace",
        "title",
        "price",
        "url"
    ],
    "properties": {
        "product_id": {
            "type": "string",
            "description": "Unique identifier for the product in the marketplace"
        },
        "marketplace": {
            "type": "string",
            "description": "Name of the marketplace (e.g., takealot)"
        },
        "title": {
            "type": "string",
            "description": "Product title"
        },
        "description": {
            "type": "string",
            "description": "Product description"
        },
        "brand": {
            "type": "string",
            "description": "Product brand"
        },
        "categories": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of categories the product belongs to"
        },
        "category_ids": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of category IDs the product belongs to"
        },
        "price": {
            "type": "number",
            "description": "Current product price"
        },
        "list_price": {
            "type": "number",
            "description": "Original/list price before discounts"
        },
        "currency": {
            "type": "string",
            "default": "ZAR",
            "description": "Currency code (default: ZAR)"
        },
        "discount_percentage": {
            "type": "number",
            "description": "Discount percentage"
        },
        "in_stock": {
            "type": "boolean",
            "description": "Whether the product is in stock"
        },
        "stock_level": {
            "type": "number",
            "description": "Current stock level if available"
        },
        "url": {
            "type": "string",
            "description": "URL to the product page"
        },
        "images": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of product image URLs"
        },
        "main_image": {
            "type": "string",
            "description": "Main product image URL"
        },
        "specifications": {
            "type": "object",
            "additionalProperties": {
                "type": "string"
            },
            "description": "Product specifications as key-value pairs"
        },
        "attributes": {
            "type": "object",
            "additionalProperties": true,
            "description": "Product attributes as key-value pairs"
        },
        "variants": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "variant_id": {
                        "type": "string"
                    },
                    "title": {
                        "type": "string"
                    },
                    "price": {
                        "type": "number"
                    },
                    "attributes": {
                        "type": "object",
                        "additionalProperties": true
                    },
                    "in_stock": {
                        "type": "boolean"
                    }
                }
            },
            "description": "Product variants"
        },
        "rating": {
            "type": "number",
            "description": "Product rating (e.g., 4.5)"
        },
        "rating_count": {
            "type": "number",
            "description": "Number of ratings"
        },
        "review_count": {
            "type": "number",
            "description": "Number of reviews"
        },
        "seller": {
            "type": "string",
            "description": "Seller name"
        },
        "seller_id": {
            "type": "string",
            "description": "Seller ID"
        },
        "shipping_info": {
            "type": "object",
            "properties": {
                "free_shipping": {
                    "type": "boolean"
                },
                "shipping_cost": {
                    "type": "number"
                },
                "delivery_time": {
                    "type": "string"
                }
            },
            "description": "Shipping information"
        },
        "tags": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Product tags"
        },
        "promotion": {
            "type": "string",
            "description": "Promotion information (e.g., 'Daily Deal')"
        },
        "sku": {
            "type": "string",
            "description": "Stock keeping unit"
        },
        "barcode": {
            "type": "string",
            "description": "Product barcode/UPC/EAN"
        },
        "first_seen": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when product was first seen"
        },
        "last_updated": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when product was last updated"
        },
        "update_count": {
            "type": "number",
            "description": "Number of times product data has been updated"
        }
    },
    "additionalProperties": true
}


# Price point schema definition
PRICE_SCHEMA = {
    "type": "object",
    "required": [
        "product_id",
        "marketplace",
        "price"
    ],
    "properties": {
        "product_id": {
            "type": "string",
            "description": "Product ID"
        },
        "marketplace": {
            "type": "string",
            "description": "Marketplace name"
        },
        "price": {
            "type": "number",
            "description": "Current price"
        },
        "list_price": {
            "type": "number",
            "description": "Original/list price"
        },
        "discount_percentage": {
            "type": "number",
            "description": "Discount percentage"
        },
        "currency": {
            "type": "string",
            "default": "ZAR",
            "description": "Currency code"
        },
        "in_stock": {
            "type": "boolean",
            "description": "Whether the product is in stock"
        },
        "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when price was recorded"
        },
        "promotion": {
            "type": "string",
            "description": "Promotion information"
        }
    },
    "additionalProperties": false
}


def validate_product(product_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate product data against schema.
    
    Args:
        product_data: Product data to validate
        
    Returns:
        Dictionary with validation errors, empty if valid
    """
    errors = {}
    
    # Check required fields
    for field in PRODUCT_SCHEMA["required"]:
        if field not in product_data:
            errors.setdefault("missing_fields", []).append(field)
    
    # Validate field types
    for field, value in product_data.items():
        if field in PRODUCT_SCHEMA["properties"]:
            expected_type = PRODUCT_SCHEMA["properties"][field]["type"]
            
            # Check type
            if expected_type == "string" and not isinstance(value, str):
                errors.setdefault("invalid_types", []).append(f"{field} should be a string")
            elif expected_type == "number" and not isinstance(value, (int, float)):
                errors.setdefault("invalid_types", []).append(f"{field} should be a number")
            elif expected_type == "boolean" and not isinstance(value, bool):
                errors.setdefault("invalid_types", []).append(f"{field} should be a boolean")
            elif expected_type == "array" and not isinstance(value, list):
                errors.setdefault("invalid_types", []).append(f"{field} should be an array")
            elif expected_type == "object" and not isinstance(value, dict):
                errors.setdefault("invalid_types", []).append(f"{field} should be an object")
    
    return errors


def validate_price(price_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate price data against schema.
    
    Args:
        price_data: Price data to validate
        
    Returns:
        Dictionary with validation errors, empty if valid
    """
    errors = {}
    
    # Check required fields
    for field in PRICE_SCHEMA["required"]:
        if field not in price_data:
            errors.setdefault("missing_fields", []).append(field)
    
    # Validate field types
    for field, value in price_data.items():
        if field in PRICE_SCHEMA["properties"]:
            expected_type = PRICE_SCHEMA["properties"][field]["type"]
            
            # Check type
            if expected_type == "string" and not isinstance(value, str):
                errors.setdefault("invalid_types", []).append(f"{field} should be a string")
            elif expected_type == "number" and not isinstance(value, (int, float)):
                errors.setdefault("invalid_types", []).append(f"{field} should be a number")
            elif expected_type == "boolean" and not isinstance(value, bool):
                errors.setdefault("invalid_types", []).append(f"{field} should be a boolean")
    
    return errors