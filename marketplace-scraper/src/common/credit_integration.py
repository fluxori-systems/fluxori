"""
Credit System Integration Module

This module provides integration with the Fluxori Credit System API
for performing credit checks, reserving credits, and recording usage.
"""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

logger = logging.getLogger(__name__)

class CreditSystemClient:
    """
    Client for interacting with the Fluxori Credit System API.
    """
    
    def __init__(self, base_url: str, api_key: str):
        """
        Initialize the credit system client.
        
        Args:
            base_url: Base URL for the credit system API
            api_key: API key for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
    
    def check_credits(self, 
                     organization_id: str, 
                     credit_type: str, 
                     estimated_cost: float, 
                     metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Check if an organization has sufficient credits.
        
        Args:
            organization_id: Organization ID
            credit_type: Type of credit operation
            estimated_cost: Estimated cost in credits
            metadata: Additional metadata for the credit check
            
        Returns:
            Dictionary with credit check results
        """
        try:
            url = f"{self.base_url}/credit-system/check"
            
            payload = {
                "organizationId": organization_id,
                "usageType": credit_type,
                "expectedInputTokens": 0,  # Not applicable for marketplace scraping
                "expectedOutputTokens": 0,  # Not applicable for marketplace scraping
                "modelId": "marketplace-scraper",
                "metadata": metadata or {}
            }
            
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Credit check failed: {str(e)}")
            # Return a default response indicating failure
            return {
                "hasCredits": False,
                "availableCredits": 0,
                "estimatedCost": estimated_cost,
                "reason": f"API error: {str(e)}"
            }
    
    def reserve_credits(self, 
                       organization_id: str, 
                       credit_type: str, 
                       operation_id: str, 
                       estimated_cost: float, 
                       metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Reserve credits for an operation.
        
        Args:
            organization_id: Organization ID
            credit_type: Type of credit operation
            operation_id: Unique operation identifier
            estimated_cost: Estimated cost in credits
            metadata: Additional metadata for the reservation
            
        Returns:
            Dictionary with reservation results
        """
        try:
            url = f"{self.base_url}/credit-system/reserve"
            
            payload = {
                "organizationId": organization_id,
                "usageType": credit_type,
                "expectedInputTokens": 0,  # Not applicable for marketplace scraping
                "expectedOutputTokens": 0,  # Not applicable for marketplace scraping
                "modelId": "marketplace-scraper",
                "operationId": operation_id,
                "metadata": metadata or {}
            }
            
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Credit reservation failed: {str(e)}")
            # Return a default response indicating failure
            return {
                "hasCredits": False,
                "availableCredits": 0,
                "estimatedCost": estimated_cost,
                "reason": f"API error: {str(e)}"
            }
    
    def record_usage(self, 
                    organization_id: str, 
                    credit_type: str, 
                    reservation_id: Optional[str], 
                    actual_cost: float, 
                    resource_id: Optional[str] = None,
                    resource_type: Optional[str] = None,
                    success: bool = True,
                    error_message: Optional[str] = None,
                    metadata: Dict[str, Any] = None) -> bool:
        """
        Record credit usage for an operation.
        
        Args:
            organization_id: Organization ID
            credit_type: Type of credit operation
            reservation_id: Optional reservation ID if credits were reserved
            actual_cost: Actual cost in credits
            resource_id: Optional ID of the resource that was processed
            resource_type: Optional type of the resource that was processed
            success: Whether the operation was successful
            error_message: Optional error message if operation failed
            metadata: Additional metadata about the usage
            
        Returns:
            True if usage was recorded successfully, False otherwise
        """
        try:
            url = f"{self.base_url}/credit-system/usage"
            
            payload = {
                "organizationId": organization_id,
                "usageType": credit_type,
                "modelId": "marketplace-scraper",
                "modelProvider": "fluxori",
                "inputTokens": 0,  # Not applicable for marketplace scraping
                "outputTokens": 0,  # Not applicable for marketplace scraping
                "success": success,
                "metadata": metadata or {}
            }
            
            if reservation_id:
                payload["reservationId"] = reservation_id
            
            if resource_id:
                payload["resourceId"] = resource_id
            
            if resource_type:
                payload["resourceType"] = resource_type
            
            if error_message:
                payload["errorMessage"] = error_message
            
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            return True
        except requests.RequestException as e:
            logger.error(f"Recording credit usage failed: {str(e)}")
            return False
    
    def confirm_reservation(self, reservation_id: str) -> bool:
        """
        Confirm a credit reservation.
        
        Args:
            reservation_id: Reservation ID to confirm
            
        Returns:
            True if confirmation was successful, False otherwise
        """
        try:
            url = f"{self.base_url}/credit-system/confirm/{reservation_id}"
            
            response = requests.post(url, headers=self.headers)
            response.raise_for_status()
            
            return True
        except requests.RequestException as e:
            logger.error(f"Confirming reservation failed: {str(e)}")
            return False
    
    def release_reservation(self, reservation_id: str) -> bool:
        """
        Release a credit reservation.
        
        Args:
            reservation_id: Reservation ID to release
            
        Returns:
            True if release was successful, False otherwise
        """
        try:
            url = f"{self.base_url}/credit-system/release/{reservation_id}"
            
            response = requests.post(url, headers=self.headers)
            response.raise_for_status()
            
            return True
        except requests.RequestException as e:
            logger.error(f"Releasing reservation failed: {str(e)}")
            return False


class KeywordResearchCreditManager:
    """
    Manager for credit operations related to keyword research.
    """
    
    # Credit operation types
    OPERATION_TYPES = {
        "basic_research": "KEYWORD_RESEARCH",
        "ranking_tracking": "RANKING_TRACKING",
        "competitor_analysis": "COMPETITOR_ANALYSIS",
        "opportunity_scoring": "OPPORTUNITY_SCORING",
        "historical_data": "HISTORICAL_DATA"
    }
    
    # Base costs for each operation type
    BASE_COSTS = {
        "basic_research": 5,
        "ranking_tracking": 3,
        "competitor_analysis": 8,
        "opportunity_scoring": 6,
        "historical_data": 10
    }
    
    # Marketplace multipliers
    MARKETPLACE_MULTIPLIERS = {
        "takealot": 1.0,  # Base marketplace
        "amazon": 1.2,    # More complex, higher cost
        "makro": 0.9,
        "loot": 0.8,
        "bob_shop": 0.7,  # Simpler marketplace, lower cost
        "buck_cheap": 0.7
    }
    
    def __init__(self, credit_client: CreditSystemClient):
        """
        Initialize the keyword research credit manager.
        
        Args:
            credit_client: Credit system client
        """
        self.credit_client = credit_client
    
    def estimate_cost(self, 
                     operation_type: str, 
                     marketplaces: List[str], 
                     keyword_count: int,
                     include_seo_metrics: bool = False,
                     max_pages_to_scan: int = 1) -> float:
        """
        Estimate the credit cost for a keyword research operation.
        
        Args:
            operation_type: Type of operation
            marketplaces: List of marketplaces to search
            keyword_count: Number of keywords
            include_seo_metrics: Whether to include SEO metrics
            max_pages_to_scan: Maximum number of pages to scan
            
        Returns:
            Estimated cost in credits
        """
        if operation_type not in self.OPERATION_TYPES:
            raise ValueError(f"Unknown operation type: {operation_type}")
        
        # Base cost per keyword
        base_cost = self.BASE_COSTS[operation_type]
        
        # Apply marketplace multipliers
        marketplace_cost = 0
        for marketplace in marketplaces:
            multiplier = self.MARKETPLACE_MULTIPLIERS.get(marketplace, 1.0)
            marketplace_cost += base_cost * multiplier
        
        # Average cost across marketplaces
        if marketplaces:
            avg_marketplace_cost = marketplace_cost / len(marketplaces)
        else:
            avg_marketplace_cost = base_cost
        
        # Calculate total cost
        total_cost = avg_marketplace_cost * keyword_count
        
        # Add cost for SEO metrics if requested
        if include_seo_metrics:
            total_cost += 2 * keyword_count
        
        # Add cost for additional pages to scan
        if max_pages_to_scan > 1:
            total_cost += (max_pages_to_scan - 1) * 2 * keyword_count
        
        # Apply bulk discount for multiple keywords
        if keyword_count >= 50:
            total_cost *= 0.7  # 30% discount
        elif keyword_count >= 20:
            total_cost *= 0.8  # 20% discount
        elif keyword_count >= 10:
            total_cost *= 0.9  # 10% discount
        
        return round(total_cost, 2)
    
    def reserve_research_credits(self, 
                               organization_id: str, 
                               operation_type: str,
                               operation_id: str,
                               marketplaces: List[str], 
                               keywords: List[str],
                               include_seo_metrics: bool = False,
                               max_pages_to_scan: int = 1,
                               additional_metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Reserve credits for a keyword research operation.
        
        Args:
            organization_id: Organization ID
            operation_type: Type of operation
            operation_id: Unique operation identifier
            marketplaces: List of marketplaces to search
            keywords: List of keywords to research
            include_seo_metrics: Whether to include SEO metrics
            max_pages_to_scan: Maximum number of pages to scan
            additional_metadata: Additional metadata for the reservation
            
        Returns:
            Dictionary with reservation results
        """
        # Estimate the cost
        estimated_cost = self.estimate_cost(
            operation_type, 
            marketplaces, 
            len(keywords),
            include_seo_metrics,
            max_pages_to_scan
        )
        
        # Build metadata
        metadata = {
            "operation_type": operation_type,
            "marketplaces": marketplaces,
            "keyword_count": len(keywords),
            "keywords": keywords[:10],  # Include first 10 keywords in metadata
            "include_seo_metrics": include_seo_metrics,
            "max_pages_to_scan": max_pages_to_scan,
            "estimated_cost": estimated_cost
        }
        
        # Add any additional metadata
        if additional_metadata:
            metadata.update(additional_metadata)
        
        # Reserve credits
        credit_type = self.OPERATION_TYPES[operation_type]
        reservation = self.credit_client.reserve_credits(
            organization_id, 
            credit_type, 
            operation_id, 
            estimated_cost,
            metadata
        )
        
        return reservation
    
    def record_research_usage(self, 
                            organization_id: str, 
                            operation_type: str,
                            reservation_id: Optional[str],
                            resource_id: Optional[str] = None,
                            success: bool = True,
                            error_message: Optional[str] = None,
                            actual_cost: Optional[float] = None,
                            override_cost: bool = False,
                            additional_metadata: Dict[str, Any] = None) -> bool:
        """
        Record credit usage for a keyword research operation.
        
        Args:
            organization_id: Organization ID
            operation_type: Type of operation
            reservation_id: Optional reservation ID if credits were reserved
            resource_id: Optional ID of the resource that was processed
            success: Whether the operation was successful
            error_message: Optional error message if operation failed
            actual_cost: Actual cost (if different from estimated)
            override_cost: Whether to override the reserved amount
            additional_metadata: Additional metadata about the usage
            
        Returns:
            True if usage was recorded successfully, False otherwise
        """
        # Build metadata
        metadata = {
            "operation_type": operation_type,
            "actual_cost": actual_cost,
            "override_cost": override_cost
        }
        
        # Add any additional metadata
        if additional_metadata:
            metadata.update(additional_metadata)
        
        # Record usage
        credit_type = self.OPERATION_TYPES[operation_type]
        return self.credit_client.record_usage(
            organization_id, 
            credit_type, 
            reservation_id, 
            actual_cost or 0,
            resource_id,
            "keyword_research",
            success,
            error_message,
            metadata
        )


# Factory function to create a credit manager from config
def create_credit_manager_from_config(config_path: Optional[str] = None) -> KeywordResearchCreditManager:
    """
    Create a keyword research credit manager from configuration file.
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        KeywordResearchCreditManager instance
    """
    # Default configuration path
    if config_path is None:
        config_path = os.environ.get(
            "CREDIT_CONFIG_PATH", 
            os.path.join(os.path.dirname(__file__), "../../config/credit_config.json")
        )
    
    try:
        # Load configuration
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Create credit client
        base_url = config.get("api_base_url", "https://api.fluxori.com")
        api_key = config.get("api_key")
        
        if not api_key:
            # Try to get from environment variable
            api_key = os.environ.get("FLUXORI_API_KEY")
            
            if not api_key:
                logger.warning("No API key found in config or environment")
                return None
        
        client = CreditSystemClient(base_url, api_key)
        
        # Create and return the credit manager
        return KeywordResearchCreditManager(client)
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
        logger.error(f"Failed to create credit manager from config: {str(e)}")
        return None