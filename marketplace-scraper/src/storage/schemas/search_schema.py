"""
Search schema definition for marketplace scraper.

This module defines the schema for search results and keyword data collected
from marketplaces, ensuring consistent data structure and validation.
"""

from typing import Dict, List, Any, Optional, Union

# Search results schema definition
SEARCH_SCHEMA = {
    "type": "object",
    "required": [
        "keyword",
        "marketplace",
        "results"
    ],
    "properties": {
        "keyword": {
            "type": "string",
            "description": "Search keyword or phrase"
        },
        "marketplace": {
            "type": "string",
            "description": "Marketplace name"
        },
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["product_id", "position"],
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "Product ID"
                    },
                    "position": {
                        "type": "number",
                        "description": "Position in search results (1-based)"
                    },
                    "title": {
                        "type": "string",
                        "description": "Product title"
                    },
                    "price": {
                        "type": "number",
                        "description": "Product price"
                    },
                    "url": {
                        "type": "string",
                        "description": "Product URL"
                    },
                    "image_url": {
                        "type": "string",
                        "description": "Product image URL"
                    },
                    "sponsored": {
                        "type": "boolean",
                        "description": "Whether the result is sponsored/promoted"
                    },
                    "badge": {
                        "type": "string",
                        "description": "Badge text (e.g., 'Daily Deal', 'Best Seller')"
                    },
                    "rating": {
                        "type": "number",
                        "description": "Product rating"
                    },
                    "review_count": {
                        "type": "number",
                        "description": "Number of reviews"
                    }
                }
            },
            "description": "Search results"
        },
        "result_count": {
            "type": "number",
            "description": "Number of results in this search"
        },
        "total_results": {
            "type": "number",
            "description": "Total number of results claimed by marketplace"
        },
        "page": {
            "type": "number",
            "description": "Page number"
        },
        "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when search was performed"
        },
        "filter_params": {
            "type": "object",
            "description": "Applied filters"
        },
        "sort_by": {
            "type": "string",
            "description": "Applied sorting"
        },
        "suggestions": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Related search suggestions"
        },
        "facets": {
            "type": "object",
            "additionalProperties": {
                "type": "array"
            },
            "description": "Available facets with counts"
        }
    },
    "additionalProperties": true
}

# Search suggestions schema definition
SUGGESTION_SCHEMA = {
    "type": "object",
    "required": [
        "prefix",
        "marketplace",
        "suggestions"
    ],
    "properties": {
        "prefix": {
            "type": "string",
            "description": "Search prefix"
        },
        "marketplace": {
            "type": "string",
            "description": "Marketplace name"
        },
        "suggestions": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "Search suggestions"
        },
        "count": {
            "type": "number",
            "description": "Number of suggestions"
        },
        "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp when suggestions were collected"
        }
    },
    "additionalProperties": false
}


def validate_search_results(search_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate search results data against schema.
    
    Args:
        search_data: Search data to validate
        
    Returns:
        Dictionary with validation errors, empty if valid
    """
    errors = {}
    
    # Check required fields
    for field in SEARCH_SCHEMA["required"]:
        if field not in search_data:
            errors.setdefault("missing_fields", []).append(field)
    
    # Validate results array
    if "results" in search_data:
        results = search_data["results"]
        if not isinstance(results, list):
            errors.setdefault("invalid_types", []).append("results should be an array")
        else:
            for i, result in enumerate(results):
                if not isinstance(result, dict):
                    errors.setdefault("invalid_results", []).append(f"Result at index {i} should be an object")
                else:
                    # Check required fields in each result
                    result_required = SEARCH_SCHEMA["properties"]["results"]["items"]["required"]
                    for required_field in result_required:
                        if required_field not in result:
                            errors.setdefault("invalid_results", []).append(
                                f"Result at index {i} is missing required field '{required_field}'"
                            )
    
    return errors


def validate_search_suggestions(suggestion_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate search suggestions data against schema.
    
    Args:
        suggestion_data: Suggestion data to validate
        
    Returns:
        Dictionary with validation errors, empty if valid
    """
    errors = {}
    
    # Check required fields
    for field in SUGGESTION_SCHEMA["required"]:
        if field not in suggestion_data:
            errors.setdefault("missing_fields", []).append(field)
    
    # Validate suggestions array
    if "suggestions" in suggestion_data:
        suggestions = suggestion_data["suggestions"]
        if not isinstance(suggestions, list):
            errors.setdefault("invalid_types", []).append("suggestions should be an array")
        else:
            for i, suggestion in enumerate(suggestions):
                if not isinstance(suggestion, str):
                    errors.setdefault("invalid_suggestions", []).append(
                        f"Suggestion at index {i} should be a string"
                    )
    
    return errors