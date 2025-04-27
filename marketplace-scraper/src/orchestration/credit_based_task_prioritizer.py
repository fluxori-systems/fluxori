"""
Credit-based task prioritizer for marketplace scraping tasks.

This module provides a task prioritizer that adjusts task priorities based on
credit system constraints and usage patterns.
"""

import logging
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta

from ..common.credit_integration import KeywordResearchCreditManager, CreditSystemClient

# Set up logging
logger = logging.getLogger(__name__)

class CreditBasedTaskPrioritizer:
    """
    Prioritizes tasks based on credit system requirements and constraints.
    
    This class integrates with the Fluxori credit system to:
    1. Prioritize tasks based on paid credits vs. free tier
    2. Adjust priorities based on organization credit balance
    3. Ensure tasks with reserved credits are executed first
    4. Balance resources across multiple organizations
    """
    
    # Task priority modifiers (applies to base priority)
    PRIORITY_MODIFIERS = {
        # Credit system modifiers
        "paid_tier_boost": 3,
        "premium_tier_boost": 5,
        "enterprise_tier_boost": 7,
        "free_tier_penalty": -1,
        "low_credits_penalty": -2,
        
        # Operation type modifiers
        "competitor_alert_boost": 4,
        "keyword_ranking_boost": 2,
        "historical_data_penalty": -3,
        
        # Time-based modifiers
        "urgent_boost": 5,
        "scheduled_penalty": -3
    }
    
    def __init__(self, credit_manager: KeywordResearchCreditManager):
        """
        Initialize the credit-based task prioritizer.
        
        Args:
            credit_manager: The credit system manager
        """
        self.credit_manager = credit_manager
        self.organization_tiers = {}  # Cache of organization tier levels
        self.organization_credits = {}  # Cache of organization credit balances
        self.credit_reservations = {}  # Map of operation_id to reservation_id
        self.last_check = {}  # Last time credits were checked for an organization
        
        # Cache TTL in seconds (10 minutes)
        self.cache_ttl = 600
    
    async def prioritize_task(self, 
                             task_type: str, 
                             marketplace: str, 
                             params: Dict[str, Any], 
                             base_priority: int = 1) -> Tuple[int, Dict[str, Any]]:
        """
        Prioritize a task based on credit system requirements.
        
        Args:
            task_type: Type of task (e.g., 'search', 'extract_product')
            marketplace: Marketplace name
            params: Task parameters
            base_priority: Base priority (1-10)
            
        Returns:
            Tuple of (adjusted_priority, updated_params)
        """
        # Extract organization info
        organization_id = params.get('organization_id')
        if not organization_id:
            # No credit adjustment for tasks without organization ID
            return base_priority, params
        
        # Get parameters relevant to credit calculation
        operation_id = params.get('operation_id', str(uuid.uuid4()))
        keywords = params.get('keywords', [])
        if 'keyword' in params and params['keyword'] not in keywords:
            keywords = [params['keyword']] + keywords
            
        include_seo_metrics = params.get('include_seo_metrics', False)
        max_pages_to_scan = params.get('max_pages', 1)
        
        # Update params with operation ID if not present
        if 'operation_id' not in params:
            params['operation_id'] = operation_id
        
        # Determine credit operation type based on task type
        credit_operation_type = self._map_task_to_credit_operation(task_type)
        
        # Skip credit checks for non-credit operations
        if not credit_operation_type:
            return base_priority, params
            
        # Apply organization-based priority modification
        priority = base_priority
        organization_tier = await self._get_organization_tier(organization_id)
        
        # Apply tier-based priority modification
        if organization_tier == 'free':
            priority += self.PRIORITY_MODIFIERS["free_tier_penalty"]
        elif organization_tier == 'standard':
            priority += self.PRIORITY_MODIFIERS["paid_tier_boost"]
        elif organization_tier == 'professional':
            priority += self.PRIORITY_MODIFIERS["premium_tier_boost"]
        elif organization_tier == 'enterprise':
            priority += self.PRIORITY_MODIFIERS["enterprise_tier_boost"]
        
        # Apply operation-based priority modification
        if credit_operation_type == 'competitor_analysis':
            priority += self.PRIORITY_MODIFIERS["competitor_alert_boost"]
        elif credit_operation_type == 'ranking_tracking':
            priority += self.PRIORITY_MODIFIERS["keyword_ranking_boost"]
        elif credit_operation_type == 'historical_data':
            priority += self.PRIORITY_MODIFIERS["historical_data_penalty"]
        
        # Time-based priority modification
        if params.get('urgent', False):
            priority += self.PRIORITY_MODIFIERS["urgent_boost"]
        elif params.get('scheduled_time') and datetime.fromisoformat(params['scheduled_time']) > datetime.now():
            priority += self.PRIORITY_MODIFIERS["scheduled_penalty"]
        
        # Check if credits have already been reserved for this operation
        reservation_id = self.credit_reservations.get(operation_id)
        
        # If no reservation exists, try to reserve credits
        if not reservation_id:
            # Create reservation for long-running operations or significant credit usage
            if (task_type in ['batch_process_keywords', 'track_keyword_ranking'] or
                (task_type == 'search' and max_pages_to_scan > 2) or
                len(keywords) >= 5):
                
                try:
                    # Estimate and reserve credits
                    reservation = self.credit_manager.reserve_research_credits(
                        organization_id=organization_id,
                        operation_type=credit_operation_type,
                        operation_id=operation_id,
                        marketplaces=[marketplace],
                        keywords=keywords,
                        include_seo_metrics=include_seo_metrics,
                        max_pages_to_scan=max_pages_to_scan,
                        additional_metadata={
                            'task_type': task_type,
                            'original_priority': base_priority,
                            'adjusted_priority': priority
                        }
                    )
                    
                    if reservation and reservation.get('hasCredits', False) and reservation.get('reservationId'):
                        # Store reservation ID for later use
                        reservation_id = reservation['reservationId']
                        self.credit_reservations[operation_id] = reservation_id
                        
                        # Add reservation ID to params
                        params['credit_reservation_id'] = reservation_id
                        
                        # If credit reservation succeeded, give a priority boost
                        priority += 1
                    else:
                        # If credit reservation failed, reduce priority
                        priority -= 2
                        
                        # Log failure reason
                        if reservation and 'reason' in reservation:
                            logger.warning(f"Credit reservation failed: {reservation['reason']}")
                            
                            # Add failure reason to params
                            params['credit_reservation_failed'] = True
                            params['credit_failure_reason'] = reservation.get('reason')
                except Exception as e:
                    logger.error(f"Error reserving credits: {str(e)}")
                    # Don't modify priority if there was an error
        else:
            # If reservation already exists, add it to params
            params['credit_reservation_id'] = reservation_id
            
            # Reserved tasks get a priority boost
            priority += 2
        
        # Ensure priority is within valid range (1-10)
        priority = max(1, min(10, priority))
        
        return priority, params
    
    async def record_task_completion(self, 
                                   task_id: str, 
                                   task_type: str,
                                   params: Dict[str, Any],
                                   successful: bool,
                                   result: Optional[Any] = None,
                                   error: Optional[str] = None) -> None:
        """
        Record task completion and update credit usage.
        
        Args:
            task_id: Task ID
            task_type: Type of task
            params: Task parameters
            successful: Whether the task completed successfully
            result: Task result (if successful)
            error: Error message (if unsuccessful)
        """
        # Extract organization info
        organization_id = params.get('organization_id')
        if not organization_id:
            # Skip credit recording for tasks without organization ID
            return
            
        # Extract credit-related parameters
        operation_id = params.get('operation_id')
        reservation_id = params.get('credit_reservation_id')
        
        # Get reservation ID from cache if not in params
        if operation_id and not reservation_id:
            reservation_id = self.credit_reservations.get(operation_id)
        
        # Skip if no operation ID or no way to identify the credit operation
        if not operation_id:
            return
            
        # Determine credit operation type based on task type
        credit_operation_type = self._map_task_to_credit_operation(task_type)
        
        # Skip credit recording for non-credit operations
        if not credit_operation_type:
            return
        
        try:
            # Record credit usage
            self.credit_manager.record_research_usage(
                organization_id=organization_id,
                operation_type=credit_operation_type,
                reservation_id=reservation_id,
                resource_id=task_id,
                success=successful,
                error_message=error if not successful else None,
                additional_metadata={
                    'task_type': task_type,
                    'task_id': task_id,
                    'result_size': len(str(result)) if result else 0,
                    'operation_id': operation_id
                }
            )
            
            # Remove reservation from cache if task completed
            if operation_id in self.credit_reservations:
                del self.credit_reservations[operation_id]
                
        except Exception as e:
            logger.error(f"Error recording credit usage: {str(e)}")
    
    async def _get_organization_tier(self, organization_id: str) -> str:
        """
        Get the subscription tier for an organization.
        
        Args:
            organization_id: Organization ID
            
        Returns:
            Subscription tier (free, standard, professional, enterprise)
        """
        # Check cache first
        if organization_id in self.organization_tiers:
            cache_time, tier = self.organization_tiers[organization_id]
            if (datetime.now() - cache_time).total_seconds() < self.cache_ttl:
                return tier
        
        # If we don't have the tier information, assume standard tier
        # In a real implementation, this would query the credit system API
        tier = 'standard'
        self.organization_tiers[organization_id] = (datetime.now(), tier)
        return tier
    
    def _map_task_to_credit_operation(self, task_type: str) -> Optional[str]:
        """
        Map task type to credit operation type.
        
        Args:
            task_type: Task type
            
        Returns:
            Credit operation type or None if not applicable
        """
        mapping = {
            'search': 'basic_research',
            'batch_process_keywords': 'basic_research',
            'track_keyword_ranking': 'ranking_tracking',
            'process_competitor_alert': 'competitor_analysis',
            'calculate_product_opportunity': 'opportunity_scoring',
            'historical_data_collection': 'historical_data'
        }
        
        return mapping.get(task_type)
    
    def release_operation_reservation(self, operation_id: str) -> bool:
        """
        Release a credit reservation for an operation.
        
        Args:
            operation_id: Operation ID
            
        Returns:
            True if successful, False otherwise
        """
        # Check if we have a reservation for this operation
        reservation_id = self.credit_reservations.get(operation_id)
        if not reservation_id:
            return False
            
        try:
            # Release reservation
            success = self.credit_manager.credit_client.release_reservation(reservation_id)
            
            # If successful, remove from cache
            if success:
                del self.credit_reservations[operation_id]
                
            return success
        except Exception as e:
            logger.error(f"Error releasing credit reservation: {str(e)}")
            return False