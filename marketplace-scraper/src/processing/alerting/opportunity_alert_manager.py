"""
Opportunity alerting system for marketplace ranking changes.

This module provides alerting capabilities for significant changes in
keyword rankings, product opportunities, and competitive dynamics across
South African marketplaces.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple, Union
import json

# Local imports
from ...storage.repository import Repository


class OpportunityAlertManager:
    """Manager for detecting and alerting on significant ranking changes.
    
    This class monitors keyword rankings and product opportunities across
    marketplaces, generating alerts for significant changes that represent
    potential business opportunities.
    """
    
    def __init__(self, 
                 storage_client: Repository,
                 notification_endpoint: Optional[str] = None):
        """Initialize the opportunity alert manager.
        
        Args:
            storage_client: Repository client for data storage
            notification_endpoint: Optional endpoint for sending notifications
        """
        self.storage_client = storage_client
        self.notification_endpoint = notification_endpoint
        self.logger = logging.getLogger("opportunity-alert-manager")
        
        # Alert thresholds
        self.significant_opportunity_increase = 15  # Points
        self.significant_position_change = 10  # Positions
        self.significant_competition_change = 3  # Sellers
        self.significant_price_change_pct = 20  # Percent
        
        # Alert categories
        self.alert_categories = {
            "opportunity_increase": "High opportunity detected",
            "opportunity_decrease": "Opportunity decrease detected",
            "competition_increase": "Competition increase detected",
            "competition_decrease": "Competition decrease detected",
            "position_improvement": "Position improvement detected",
            "position_decline": "Position decline detected",
            "price_increase": "Price increase detected",
            "price_decrease": "Price decrease detected",
            "cross_marketplace": "Cross-marketplace opportunity detected"
        }
        
    async def check_for_alerts(self, 
                             days: int = 7,
                             limit: int = 100) -> List[Dict[str, Any]]:
        """Check for alert-worthy events in recent data.
        
        Args:
            days: Number of days to look back
            limit: Maximum number of keywords to check
            
        Returns:
            List of generated alerts
        """
        self.logger.info(f"Checking for alerts in the last {days} days")
        
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get recently updated keywords
        keywords = await self.storage_client.get_keyword_rankings(
            filters={
                "tracking_enabled": True,
                "last_updated": {">=": cutoff_date}
            },
            limit=limit,
            order_by="last_updated",
            order_direction="desc"
        )
        
        # Check each keyword for alerts
        alerts = []
        for keyword in keywords:
            keyword_alerts = await self._check_keyword_alerts(keyword, cutoff_date)
            alerts.extend(keyword_alerts)
            
        # Add cross-marketplace alerts
        cross_alerts = await self._check_cross_marketplace_alerts(keywords)
        alerts.extend(cross_alerts)
        
        # Sort by importance (highest first)
        alerts.sort(key=lambda x: x.get("importance", 0), reverse=True)
        
        # Send alerts if endpoint configured
        if self.notification_endpoint and alerts:
            await self._send_alerts(alerts)
            
        return alerts
    
    async def check_specific_keyword(self, 
                                   marketplace: str,
                                   keyword: str) -> List[Dict[str, Any]]:
        """Check for alerts for a specific keyword.
        
        Args:
            marketplace: Marketplace name
            keyword: Keyword to check
            
        Returns:
            List of generated alerts
        """
        self.logger.info(f"Checking alerts for {keyword} in {marketplace}")
        
        # Get keyword data
        keyword_id = f"{marketplace}_{keyword}"
        keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        
        if not keyword_entry:
            return []
            
        # Check last 30 days
        cutoff_date = (datetime.now() - timedelta(days=30)).isoformat()
        
        # Check for alerts
        alerts = await self._check_keyword_alerts(keyword_entry, cutoff_date)
        
        # Send alerts if endpoint configured
        if self.notification_endpoint and alerts:
            await self._send_alerts(alerts)
            
        return alerts
    
    async def generate_daily_alert_digest(self) -> Dict[str, Any]:
        """Generate a daily digest of alerts.
        
        Returns:
            Dictionary with digest data
        """
        self.logger.info("Generating daily alert digest")
        
        # Check for alerts in the last day
        alerts = await self.check_for_alerts(days=1, limit=200)
        
        # Skip if no alerts
        if not alerts:
            return {
                "date": datetime.now().isoformat(),
                "status": "no_alerts",
                "alert_count": 0
            }
            
        # Group alerts by category
        categorized_alerts = {}
        for category in self.alert_categories:
            categorized_alerts[category] = [
                alert for alert in alerts
                if alert.get("category") == category
            ]
            
        # Group alerts by marketplace
        marketplace_alerts = {}
        for alert in alerts:
            marketplace = alert.get("marketplace")
            if marketplace not in marketplace_alerts:
                marketplace_alerts[marketplace] = []
            marketplace_alerts[marketplace].append(alert)
            
        # Get top alerts by importance
        top_alerts = sorted(alerts, key=lambda x: x.get("importance", 0), reverse=True)[:10]
        
        # Create digest
        digest = {
            "date": datetime.now().isoformat(),
            "alert_count": len(alerts),
            "marketplace_breakdown": {
                marketplace: len(alerts_list)
                for marketplace, alerts_list in marketplace_alerts.items()
            },
            "category_breakdown": {
                category: len(alerts_list)
                for category, alerts_list in categorized_alerts.items()
            },
            "top_alerts": top_alerts,
            "alerts_by_category": categorized_alerts,
            "alerts_by_marketplace": marketplace_alerts
        }
        
        # Send digest if endpoint configured
        if self.notification_endpoint:
            await self._send_digest(digest)
            
        return digest
    
    async def _check_keyword_alerts(self, 
                                  keyword_entry: Dict[str, Any],
                                  cutoff_date: str) -> List[Dict[str, Any]]:
        """Check a specific keyword for alerts.
        
        Args:
            keyword_entry: Keyword data
            cutoff_date: Cutoff date for history
            
        Returns:
            List of generated alerts
        """
        alerts = []
        
        # Extract basic info
        keyword = keyword_entry.get("keyword", "")
        marketplace = keyword_entry.get("marketplace", "")
        keyword_id = keyword_entry.get("keyword_id", "")
        
        # Filter history to recent entries
        history = keyword_entry.get("history", [])
        recent_history = [
            entry for entry in history
            if entry.get("date", "9999-12-31") >= cutoff_date
        ]
        
        # Skip if less than 2 entries
        if len(recent_history) < 2:
            return []
            
        # Sort by date
        recent_history.sort(key=lambda x: x.get("date", ""))
        
        # Get oldest and newest entries
        oldest = recent_history[0]
        newest = recent_history[-1]
        
        # Check for opportunity score change
        old_score = oldest.get("opportunity_score", 0)
        new_score = newest.get("opportunity_score", 0)
        score_change = new_score - old_score
        
        if score_change >= self.significant_opportunity_increase:
            # Significant opportunity increase
            alerts.append({
                "category": "opportunity_increase",
                "title": f"Significant opportunity increase for '{keyword}' in {marketplace}",
                "message": f"Opportunity score increased from {old_score:.1f} to {new_score:.1f} (+{score_change:.1f})",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(100, score_change * 2),  # Scale importance by change magnitude
                "old_value": old_score,
                "new_value": new_score,
                "change": score_change,
                "change_percent": (score_change / old_score * 100) if old_score > 0 else 0,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
        elif score_change <= -self.significant_opportunity_increase:
            # Significant opportunity decrease
            alerts.append({
                "category": "opportunity_decrease",
                "title": f"Significant opportunity decrease for '{keyword}' in {marketplace}",
                "message": f"Opportunity score decreased from {old_score:.1f} to {new_score:.1f} ({score_change:.1f})",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(100, abs(score_change) * 1.5),  # Scale importance by change magnitude
                "old_value": old_score,
                "new_value": new_score,
                "change": score_change,
                "change_percent": (score_change / old_score * 100) if old_score > 0 else 0,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
            
        # Check for competition change
        old_density = oldest.get("competitive_density", 0)
        new_density = newest.get("competitive_density", 0)
        density_change = new_density - old_density
        
        if density_change >= self.significant_competition_change:
            # Significant competition increase
            alerts.append({
                "category": "competition_increase",
                "title": f"Significant competition increase for '{keyword}' in {marketplace}",
                "message": f"Competitive density increased from {old_density:.1f} to {new_density:.1f} (+{density_change:.1f})",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(90, density_change * 10),  # Scale importance by change magnitude
                "old_value": old_density,
                "new_value": new_density,
                "change": density_change,
                "change_percent": (density_change / old_density * 100) if old_density > 0 else 0,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
        elif density_change <= -self.significant_competition_change:
            # Significant competition decrease
            alerts.append({
                "category": "competition_decrease",
                "title": f"Significant competition decrease for '{keyword}' in {marketplace}",
                "message": f"Competitive density decreased from {old_density:.1f} to {new_density:.1f} ({density_change:.1f})",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(85, abs(density_change) * 8),  # Scale importance by change magnitude
                "old_value": old_density,
                "new_value": new_density,
                "change": density_change,
                "change_percent": (density_change / old_density * 100) if old_density > 0 else 0,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
            
        # Check for price changes
        old_price = oldest.get("average_price", 0)
        new_price = newest.get("average_price", 0)
        
        if old_price > 0 and new_price > 0:
            price_change = new_price - old_price
            price_change_pct = (price_change / old_price) * 100
            
            if price_change_pct >= self.significant_price_change_pct:
                # Significant price increase
                alerts.append({
                    "category": "price_increase",
                    "title": f"Significant price increase for '{keyword}' in {marketplace}",
                    "message": f"Average price increased from {old_price:.2f} to {new_price:.2f} (+{price_change_pct:.1f}%)",
                    "keyword": keyword,
                    "marketplace": marketplace,
                    "keyword_id": keyword_id,
                    "importance": min(80, price_change_pct * 0.8),  # Scale importance by change magnitude
                    "old_value": old_price,
                    "new_value": new_price,
                    "change": price_change,
                    "change_percent": price_change_pct,
                    "timestamp": datetime.now().isoformat(),
                    "data_date": newest.get("date")
                })
            elif price_change_pct <= -self.significant_price_change_pct:
                # Significant price decrease
                alerts.append({
                    "category": "price_decrease",
                    "title": f"Significant price decrease for '{keyword}' in {marketplace}",
                    "message": f"Average price decreased from {old_price:.2f} to {new_price:.2f} ({price_change_pct:.1f}%)",
                    "keyword": keyword,
                    "marketplace": marketplace,
                    "keyword_id": keyword_id,
                    "importance": min(75, abs(price_change_pct) * 0.7),  # Scale importance by change magnitude
                    "old_value": old_price,
                    "new_value": new_price,
                    "change": price_change,
                    "change_percent": price_change_pct,
                    "timestamp": datetime.now().isoformat(),
                    "data_date": newest.get("date")
                })
                
        # Check for position changes in top products
        oldest_positions = oldest.get("top_positions", [])
        newest_positions = newest.get("top_positions", [])
        
        # Track products that improved or declined significantly
        improved_products = []
        declined_products = []
        
        for new_product in newest_positions:
            product_id = new_product.get("product_id")
            new_position = new_product.get("position", 999)
            
            # Find product in old positions
            old_product = next(
                (p for p in oldest_positions if p.get("product_id") == product_id),
                None
            )
            
            if old_product:
                old_position = old_product.get("position", 999)
                position_change = old_position - new_position  # Positive means improvement
                
                if position_change >= self.significant_position_change:
                    # Significant improvement
                    improved_products.append({
                        "product_id": product_id,
                        "title": new_product.get("title", "Unknown product"),
                        "old_position": old_position,
                        "new_position": new_position,
                        "change": position_change
                    })
                elif position_change <= -self.significant_position_change:
                    # Significant decline
                    declined_products.append({
                        "product_id": product_id,
                        "title": new_product.get("title", "Unknown product"),
                        "old_position": old_position,
                        "new_position": new_position,
                        "change": position_change
                    })
                    
        # Generate position alerts if significant changes found
        if improved_products:
            alerts.append({
                "category": "position_improvement",
                "title": f"Products improving positions for '{keyword}' in {marketplace}",
                "message": f"{len(improved_products)} products significantly improved position",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(95, len(improved_products) * 15),
                "products": improved_products,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
            
        if declined_products:
            alerts.append({
                "category": "position_decline",
                "title": f"Products declining positions for '{keyword}' in {marketplace}",
                "message": f"{len(declined_products)} products significantly declined in position",
                "keyword": keyword,
                "marketplace": marketplace,
                "keyword_id": keyword_id,
                "importance": min(85, len(declined_products) * 10),
                "products": declined_products,
                "timestamp": datetime.now().isoformat(),
                "data_date": newest.get("date")
            })
            
        return alerts
    
    async def _check_cross_marketplace_alerts(self, 
                                            keywords: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for cross-marketplace opportunities.
        
        Args:
            keywords: List of keyword entries
            
        Returns:
            List of cross-marketplace alerts
        """
        # Group keywords by keyword text
        keyword_groups = {}
        for entry in keywords:
            keyword = entry.get("keyword", "")
            if keyword not in keyword_groups:
                keyword_groups[keyword] = []
            keyword_groups[keyword].append(entry)
            
        # Filter to keywords with multiple marketplaces
        multi_marketplace_keywords = {
            k: v for k, v in keyword_groups.items()
            if len(set(entry.get("marketplace", "") for entry in v)) > 1
        }
        
        # Generate alerts for significant differences
        alerts = []
        
        for keyword, entries in multi_marketplace_keywords.items():
            # Skip if less than 2 marketplaces
            marketplaces = set(entry.get("marketplace", "") for entry in entries)
            if len(marketplaces) < 2:
                continue
                
            # Calculate opportunity and competition metrics
            marketplace_data = {}
            for entry in entries:
                marketplace = entry.get("marketplace", "")
                opportunity = entry.get("last_opportunity_score", 0)
                competition = entry.get("seller_density", 0)
                
                marketplace_data[marketplace] = {
                    "opportunity": opportunity,
                    "competition": competition,
                    "keyword_id": entry.get("keyword_id", "")
                }
                
            # Find max opportunity difference
            max_opportunity = max(
                (data["opportunity"] for data in marketplace_data.values()),
                default=0
            )
            min_opportunity = min(
                (data["opportunity"] for data in marketplace_data.values()),
                default=0
            )
            opportunity_diff = max_opportunity - min_opportunity
            
            max_opportunity_marketplace = next(
                (m for m, data in marketplace_data.items() 
                 if data["opportunity"] == max_opportunity),
                None
            )
            
            min_opportunity_marketplace = next(
                (m for m, data in marketplace_data.items() 
                 if data["opportunity"] == min_opportunity),
                None
            )
            
            # Find max competition difference
            max_competition = max(
                (data["competition"] for data in marketplace_data.values()),
                default=0
            )
            min_competition = min(
                (data["competition"] for data in marketplace_data.values() 
                 if data["competition"] > 0),  # Only consider non-zero competition
                default=0
            )
            
            max_competition_marketplace = next(
                (m for m, data in marketplace_data.items() 
                 if data["competition"] == max_competition),
                None
            )
            
            min_competition_marketplace = next(
                (m for m, data in marketplace_data.items() 
                 if data["competition"] == min_competition),
                None
            )
            
            # Generate alert if significant differences
            if opportunity_diff >= self.significant_opportunity_increase:
                alerts.append({
                    "category": "cross_marketplace",
                    "title": f"Cross-marketplace opportunity for '{keyword}'",
                    "message": f"Significant opportunity difference between {max_opportunity_marketplace} ({max_opportunity:.1f}) and {min_opportunity_marketplace} ({min_opportunity:.1f})",
                    "keyword": keyword,
                    "marketplace": max_opportunity_marketplace,  # Best marketplace
                    "keyword_id": marketplace_data[max_opportunity_marketplace]["keyword_id"],
                    "importance": min(100, opportunity_diff * 1.5),
                    "opportunity_difference": opportunity_diff,
                    "comparison": {
                        "best": {
                            "marketplace": max_opportunity_marketplace,
                            "opportunity": max_opportunity
                        },
                        "worst": {
                            "marketplace": min_opportunity_marketplace,
                            "opportunity": min_opportunity
                        }
                    },
                    "marketplace_data": marketplace_data,
                    "timestamp": datetime.now().isoformat()
                })
                
        return alerts
    
    async def _send_alerts(self, alerts: List[Dict[str, Any]]) -> bool:
        """Send alerts to notification endpoint.
        
        Args:
            alerts: List of alerts to send
            
        Returns:
            True if successful, False otherwise
        """
        if not self.notification_endpoint:
            return False
            
        try:
            # TODO: Implement actual notification sending
            # This would typically use a webhook, email service, or messaging system
            self.logger.info(f"Would send {len(alerts)} alerts to {self.notification_endpoint}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send alerts: {str(e)}")
            return False
            
    async def _send_digest(self, digest: Dict[str, Any]) -> bool:
        """Send alert digest to notification endpoint.
        
        Args:
            digest: Digest data to send
            
        Returns:
            True if successful, False otherwise
        """
        if not self.notification_endpoint:
            return False
            
        try:
            # TODO: Implement actual notification sending
            # This would typically use a webhook, email service, or messaging system
            self.logger.info(f"Would send digest with {digest['alert_count']} alerts to {self.notification_endpoint}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send digest: {str(e)}")
            return False
"""