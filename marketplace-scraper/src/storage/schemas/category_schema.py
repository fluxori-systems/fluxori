"""
Category schema definition for marketplace scraper.

This module defines the schema for category data collected from marketplaces,
ensuring consistent data structure and validation.
"""

from typing import Dict, List, Any, Optional, Union

# Category schema definition
CATEGORY_SCHEMA = {
    "type": "object",
    "required": [
        "category_id",
        "marketplace",
        "name"
    ],
    "properties": {
        "category_id": {
            "type": "string",
            "description": "Unique identifier for the category in the marketplace"
        },
        "marketplace": {
            "type": "string",
            "description": "Marketplace name"
        },
        "name": {
            "type": "string",
            "description": "Category name"
        },
        "url": {
            "type": "string",
            "description": "URL to the category page"
        },
        "parent_id": {
            "type": "string",
            "description": "Parent category ID"
        },
        "level": {
            "type": "number",
            "description": "Depth level in the category hierarchy (0 = root)"
        },
        "path": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Full path from root to this category"
        },
        "path_ids": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Full path of category IDs from root to this category"
        },
        "subcategories": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of subcategory IDs"
        },
        "product_count": {
            "type": "number",
            "description": "Number of products in this category"
        },
        "image_url": {
            "type": "string",
            "description": "Category image URL"
        },
        "description": {
            "type": "string",
            "description": "Category description"
        },
        "attributes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "values": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "type": {
                        "type": "string"
                    }
                }
            },
            "description": "Category-specific attributes"
        },
        "filters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "values": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "name": {
                                    "type": "string"
                                },
                                "count": {
                                    "type": "number"
                                }
                            }
                        }
                    }
                }
            },
            "description": "Available filters for this category"
        },
        "first_seen": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when category was first seen"
        },
        "last_updated": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when category was last updated"
        }
    },
    "additionalProperties": true
}


def validate_category(category_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate category data against schema.
    
    Args:
        category_data: Category data to validate
        
    Returns:
        Dictionary with validation errors, empty if valid
    """
    errors = {}
    
    # Check required fields
    for field in CATEGORY_SCHEMA["required"]:
        if field not in category_data:
            errors.setdefault("missing_fields", []).append(field)
    
    # Validate field types
    for field, value in category_data.items():
        if field in CATEGORY_SCHEMA["properties"]:
            expected_type = CATEGORY_SCHEMA["properties"][field]["type"]
            
            # Check type
            if expected_type == "string" and not isinstance(value, str):
                errors.setdefault("invalid_types", []).append(f"{field} should be a string")
            elif expected_type == "number" and not isinstance(value, (int, float)):
                errors.setdefault("invalid_types", []).append(f"{field} should be a number")
            elif expected_type == "array" and not isinstance(value, list):
                errors.setdefault("invalid_types", []).append(f"{field} should be an array")
            elif expected_type == "object" and not isinstance(value, dict):
                errors.setdefault("invalid_types", []).append(f"{field} should be an object")
    
    # Validate subcategories array
    if "subcategories" in category_data and isinstance(category_data["subcategories"], list):
        for i, subcategory in enumerate(category_data["subcategories"]):
            if not isinstance(subcategory, str):
                errors.setdefault("invalid_subcategories", []).append(
                    f"Subcategory at index {i} should be a string"
                )
    
    # Validate path array
    if "path" in category_data and isinstance(category_data["path"], list):
        for i, path_item in enumerate(category_data["path"]):
            if not isinstance(path_item, str):
                errors.setdefault("invalid_path", []).append(
                    f"Path item at index {i} should be a string"
                )
    
    return errors