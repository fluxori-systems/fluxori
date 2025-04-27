"""
Competitor Alert Integration Module

This module provides integration between the marketplace scraper 
and the competitor alert system in the backend.
"""

import json
import logging
import time
import requests
from datetime import datetime
from requests.exceptions import RequestException
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class AlertIntegration:
    """
    Class for integrating with the backend competitor alert system
    """
    
    def __init__(self, api_url: str, auth_token: str):
        """
        Initialize with API URL and authentication token
        
        Args:
            api_url: Base URL for the backend API
            auth_token: Authentication token for API requests
        """
        self.api_url = api_url.rstrip('/')
        self.alert_endpoint = f"{self.api_url}/api/credit-system/competitor-alerts"
        self.auth_token = auth_token
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def fetch_active_watches(self) -> List[Dict[str, Any]]:
        """
        Fetches active watches that are due for processing
        
        Returns:
            List of active watch configurations
        """
        try:
            endpoint = f"{self.alert_endpoint}/watches/active-due"
            response = requests.get(endpoint, headers=self.headers)
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch active watches: {response.status_code} - {response.text}")
                return []
            
            return response.json()
        except RequestException as e:
            logger.error(f"Error fetching active watches: {str(e)}")
            return []
    
    def submit_comparison_result(
        self, 
        watch_id: str, 
        keyword: str, 
        marketplace: str, 
        current_data: Dict[str, Any], 
        previous_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Submits comparison results for alert processing
        
        Args:
            watch_id: ID of the watch configuration
            keyword: The keyword being monitored
            marketplace: The marketplace being monitored
            current_data: Current scraping results
            previous_data: Previous scraping results for comparison (if available)
            
        Returns:
            Boolean indicating success or failure
        """
        try:
            endpoint = f"{self.alert_endpoint}/process-comparison"
            payload = {
                'watchId': watch_id,
                'keyword': keyword,
                'marketplace': marketplace,
                'currentData': current_data,
                'previousData': previous_data,
                'processedAt': datetime.utcnow().isoformat()
            }
            
            response = requests.post(
                endpoint, 
                headers=self.headers, 
                data=json.dumps(payload)
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to submit comparison: {response.status_code} - {response.text}")
                return False
            
            return True
        except RequestException as e:
            logger.error(f"Error submitting comparison result: {str(e)}")
            return False
    
    def update_watch_status(self, watch_id: str, success: bool, error_message: Optional[str] = None) -> bool:
        """
        Updates the status of a watch after processing
        
        Args:
            watch_id: ID of the watch configuration
            success: Whether processing was successful
            error_message: Error message if processing failed
            
        Returns:
            Boolean indicating success or failure
        """
        try:
            endpoint = f"{self.alert_endpoint}/watches/{watch_id}/update-status"
            payload = {
                'success': success,
                'processedAt': datetime.utcnow().isoformat()
            }
            
            if error_message:
                payload['errorMessage'] = error_message
            
            response = requests.put(
                endpoint, 
                headers=self.headers, 
                data=json.dumps(payload)
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to update watch status: {response.status_code} - {response.text}")
                return False
            
            return True
        except RequestException as e:
            logger.error(f"Error updating watch status: {str(e)}")
            return False

    def fetch_historical_data(self, keyword: str, marketplace: str) -> Optional[Dict[str, Any]]:
        """
        Fetches historical data for a keyword in a marketplace
        
        Args:
            keyword: The keyword to fetch data for
            marketplace: The marketplace to fetch data from
            
        Returns:
            Historical data or None if not available
        """
        try:
            # URL encode the keyword and marketplace
            encoded_keyword = requests.utils.quote(keyword)
            encoded_marketplace = requests.utils.quote(marketplace)
            
            endpoint = f"{self.api_url}/api/credit-system/keyword-research/results/latest?keyword={encoded_keyword}&marketplace={encoded_marketplace}"
            
            response = requests.get(endpoint, headers=self.headers)
            
            if response.status_code == 404:
                logger.info(f"No historical data found for {keyword} in {marketplace}")
                return None
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch historical data: {response.status_code} - {response.text}")
                return None
            
            return response.json()
        except RequestException as e:
            logger.error(f"Error fetching historical data: {str(e)}")
            return None

    def process_alert_triggers(self, watch: Dict[str, Any], keyword_data: Dict[str, Any]) -> None:
        """
        Process alerts for a specific watch and keyword data
        
        Args:
            watch: The watch configuration
            keyword_data: Current keyword research results
        """
        try:
            # First, fetch historical data for comparison
            historical_data = self.fetch_historical_data(
                keyword=watch.get('keyword', ''),
                marketplace=keyword_data.get('marketplace', '')
            )
            
            if not historical_data:
                logger.info(f"No historical data available for comparison")
                # Still update the watch status
                self.update_watch_status(watch['id'], True)
                return
            
            # Submit for comparison and alert generation
            success = self.submit_comparison_result(
                watch_id=watch['id'],
                keyword=watch.get('keyword', ''),
                marketplace=keyword_data.get('marketplace', ''),
                current_data=keyword_data,
                previous_data=historical_data
            )
            
            # Update watch status
            self.update_watch_status(watch['id'], success)
            
        except Exception as e:
            logger.error(f"Error processing alert triggers: {str(e)}")
            # Update watch with error status
            self.update_watch_status(watch['id'], False, str(e))
            
    async def process_ranking_data(self, marketplace: str, keyword: str, rankings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process ranking data for a keyword to generate alerts
        
        Args:
            marketplace: The marketplace the data was collected from
            keyword: The keyword that was searched
            rankings: The product rankings data
            
        Returns:
            Dictionary with alert processing results
        """
        logger.info(f"Processing ranking data for keyword '{keyword}' in {marketplace}")
        
        try:
            # Fetch active watches for this keyword/marketplace
            watches = self.fetch_watches_for_keyword(keyword, marketplace)
            
            if not watches:
                logger.info(f"No active watches found for '{keyword}' in {marketplace}")
                return {
                    "success": True,
                    "alerts_generated": 0,
                    "alerts": []
                }
            
            # Process each watch
            alerts_generated = 0
            alert_details = []
            
            # Create the keyword data structure
            keyword_data = {
                "keyword": keyword,
                "marketplace": marketplace,
                "rankings": rankings,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for watch in watches:
                try:
                    # Process this specific watch
                    self.process_alert_triggers(watch, keyword_data)
                    alerts_count = self.check_generated_alerts(watch['id'])
                    
                    if alerts_count > 0:
                        alerts_generated += alerts_count
                        alert_details.append({
                            "watch_id": watch['id'],
                            "alerts_count": alerts_count,
                            "keyword": keyword,
                            "marketplace": marketplace,
                            "trigger_type": watch.get('triggerType', 'unknown')
                        })
                except Exception as e:
                    logger.error(f"Error processing watch {watch.get('id', 'unknown')}: {str(e)}")
            
            return {
                "success": True,
                "alerts_generated": alerts_generated,
                "alerts": alert_details
            }
        except Exception as e:
            logger.error(f"Error processing ranking data: {str(e)}")
            return {
                "success": False,
                "message": f"Error processing ranking data: {str(e)}",
                "alerts_generated": 0,
                "alerts": []
            }
            
    def fetch_watches_for_keyword(self, keyword: str, marketplace: str) -> List[Dict[str, Any]]:
        """
        Fetch active watches for a specific keyword and marketplace
        
        Args:
            keyword: The keyword to fetch watches for
            marketplace: The marketplace to fetch watches from
            
        Returns:
            List of active watch configurations
        """
        try:
            # URL encode the keyword and marketplace
            encoded_keyword = requests.utils.quote(keyword)
            encoded_marketplace = requests.utils.quote(marketplace)
            
            endpoint = f"{self.alert_endpoint}/watches/active?keyword={encoded_keyword}&marketplace={encoded_marketplace}"
            
            response = requests.get(endpoint, headers=self.headers)
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch watches: {response.status_code} - {response.text}")
                return []
            
            return response.json()
        except RequestException as e:
            logger.error(f"Error fetching watches for keyword: {str(e)}")
            return []
            
    def check_generated_alerts(self, watch_id: str) -> int:
        """
        Check how many alerts were generated for a specific watch
        
        Args:
            watch_id: ID of the watch configuration
            
        Returns:
            Number of alerts generated
        """
        try:
            endpoint = f"{self.alert_endpoint}/watches/{watch_id}/alerts/count"
            
            response = requests.get(endpoint, headers=self.headers)
            
            if response.status_code != 200:
                logger.error(f"Failed to check alerts: {response.status_code} - {response.text}")
                return 0
            
            result = response.json()
            return result.get('count', 0)
        except RequestException as e:
            logger.error(f"Error checking generated alerts: {str(e)}")
            return 0