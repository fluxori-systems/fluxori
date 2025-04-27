"""
Data transformation tools for ranking visualization.

This module provides utilities for transforming ranking and opportunity
data into formats suitable for visualization and reporting.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
import json

# Local imports
from ...storage.repository import Repository


class VisualizationTransformer:
    """Transform ranking and opportunity data for visualization.
    
    This class converts raw ranking and opportunity data into formats
    suitable for visualization in charts, dashboards, and reports.
    """
    
    def __init__(self, storage_client: Repository):
        """Initialize the visualization transformer.
        
        Args:
            storage_client: Repository client for data storage
        """
        self.storage_client = storage_client
        self.logger = logging.getLogger("visualization-transformer")
        
    async def keyword_history_timeseries(self, 
                                        marketplace: str,
                                        keyword: str,
                                        metrics: List[str] = None,
                                        days: int = 90) -> Dict[str, Any]:
        """Transform keyword history into timeseries format for charts.
        
        Args:
            marketplace: Marketplace name
            keyword: Keyword to visualize
            metrics: List of metrics to include (default: all)
            days: Number of days of history
            
        Returns:
            Dictionary with timeseries data
        """
        # Default metrics
        if metrics is None:
            metrics = [
                "total_results", 
                "competitive_density", 
                "opportunity_score", 
                "average_price"
            ]
            
        # Get keyword data
        keyword_id = f"{marketplace}_{keyword}"
        keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
        
        if not keyword_entry:
            return {
                "keyword": keyword,
                "marketplace": marketplace,
                "status": "not_found",
                "series": {}
            }
            
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Filter history to requested timeframe
        history = [
            entry for entry in keyword_entry.get("history", [])
            if entry.get("date", "9999-12-31") >= cutoff_date
        ]
        
        # Sort by date
        history.sort(key=lambda x: x.get("date", ""))
        
        # Extract series data
        series_data = {}
        dates = []
        
        for metric in metrics:
            series_data[metric] = []
            
        for entry in history:
            # Add date
            date = entry.get("date", "")
            dates.append(date)
            
            # Add metric values
            for metric in metrics:
                value = entry.get(metric, 0)
                series_data[metric].append(value)
                
        # Create normalized series
        normalized_series = {}
        for metric in metrics:
            if not series_data[metric]:
                continue
                
            # Normalize to 0-100 range
            min_val = min(series_data[metric])
            max_val = max(series_data[metric])
            
            if max_val > min_val:
                normalized = [
                    ((v - min_val) / (max_val - min_val)) * 100
                    for v in series_data[metric]
                ]
            else:
                normalized = [50 for _ in series_data[metric]]  # Default to middle
                
            normalized_series[metric] = normalized
            
        # Generate chart configuration
        chart_config = {
            "type": "line",
            "data": {
                "labels": dates,
                "datasets": [
                    {
                        "label": metric,
                        "data": series_data[metric],
                        "normalized": normalized_series[metric],
                        "tension": 0.2
                    }
                    for metric in metrics
                    if metric in series_data and series_data[metric]
                ]
            },
            "options": {
                "title": f"{keyword} - {marketplace} Trend",
                "x_axis_label": "Date",
                "y_axis_label": "Value"
            }
        }
            
        return {
            "keyword": keyword,
            "marketplace": marketplace,
            "start_date": dates[0] if dates else None,
            "end_date": dates[-1] if dates else None,
            "metrics": metrics,
            "chart_config": chart_config,
            "raw_series": series_data,
            "normalized_series": normalized_series
        }
        
    async def competition_matrix(self,
                               marketplace: str,
                               limit: int = 50) -> Dict[str, Any]:
        """Generate competition vs. opportunity matrix data.
        
        Args:
            marketplace: Marketplace name
            limit: Maximum number of keywords to include
            
        Returns:
            Dictionary with matrix data
        """
        # Get keywords
        keywords = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True
            },
            limit=limit
        )
        
        # Generate matrix data
        matrix_data = []
        for keyword in keywords:
            # Skip if missing key data
            if "seller_density" not in keyword or "last_opportunity_score" not in keyword:
                continue
                
            matrix_data.append({
                "keyword": keyword.get("keyword", ""),
                "x": keyword.get("seller_density", 0),  # X-axis: competition
                "y": keyword.get("last_opportunity_score", 0),  # Y-axis: opportunity
                "keyword_id": keyword.get("keyword_id", ""),
                "categories": keyword.get("categories", []),
                "size": keyword.get("current_results", 500) / 100  # Bubble size based on results
            })
            
        # Generate chart configuration
        chart_config = {
            "type": "scatter",
            "data": {
                "datasets": [
                    {
                        "label": "Keywords",
                        "data": matrix_data,
                        "pointRadius": [item["size"] for item in matrix_data],
                        "pointBackgroundColor": "rgba(75, 192, 192, 0.6)",
                        "pointBorderColor": "rgba(75, 192, 192, 1)"
                    }
                ]
            },
            "options": {
                "title": f"{marketplace} Competition vs. Opportunity Matrix",
                "x_axis_label": "Competition (Seller Density)",
                "y_axis_label": "Opportunity Score"
            }
        }
            
        return {
            "marketplace": marketplace,
            "matrix_data": matrix_data,
            "chart_config": chart_config,
            "quadrants": {
                "high_opportunity_low_competition": [
                    item for item in matrix_data
                    if item["y"] >= 70 and item["x"] <= 3
                ],
                "high_opportunity_high_competition": [
                    item for item in matrix_data
                    if item["y"] >= 70 and item["x"] > 3
                ],
                "low_opportunity_low_competition": [
                    item for item in matrix_data
                    if item["y"] < 70 and item["x"] <= 3
                ],
                "low_opportunity_high_competition": [
                    item for item in matrix_data
                    if item["y"] < 70 and item["x"] > 3
                ]
            }
        }
        
    async def marketplace_comparison_radar(self,
                                         keyword: str,
                                         marketplaces: List[str]) -> Dict[str, Any]:
        """Generate radar chart data for marketplace comparison.
        
        Args:
            keyword: Keyword to compare
            marketplaces: List of marketplaces to include
            
        Returns:
            Dictionary with radar chart data
        """
        # Get keyword data for each marketplace
        marketplace_data = {}
        for marketplace in marketplaces:
            keyword_id = f"{marketplace}_{keyword}"
            keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
            
            if keyword_entry:
                marketplace_data[marketplace] = keyword_entry
                
        # Skip if less than 2 marketplaces have data
        if len(marketplace_data) < 2:
            return {
                "keyword": keyword,
                "marketplaces": marketplaces,
                "status": "insufficient_data",
                "available_marketplaces": list(marketplace_data.keys())
            }
            
        # Define radar metrics
        radar_metrics = [
            "opportunity_score",
            "competitive_density",
            "total_results",
            "price_competitiveness"
        ]
        
        # Extract metrics
        radar_data = {}
        for metric in radar_metrics:
            radar_data[metric] = {
                marketplace: self._extract_metric(marketplace_data[marketplace], metric)
                for marketplace in marketplace_data
            }
            
        # Normalize values to 0-100
        normalized_data = {}
        for metric in radar_metrics:
            values = list(radar_data[metric].values())
            
            if not values:
                continue
                
            min_val = min(values)
            max_val = max(values)
            
            # Invert some metrics where lower is better
            invert = metric in ["competitive_density"]
            
            if max_val > min_val:
                normalized_data[metric] = {
                    marketplace: 100 - ((value - min_val) / (max_val - min_val) * 100) if invert
                                else ((value - min_val) / (max_val - min_val) * 100)
                    for marketplace, value in radar_data[metric].items()
                }
            else:
                normalized_data[metric] = {
                    marketplace: 50  # Default to middle
                    for marketplace in radar_data[metric]
                }
                
        # Generate datasets for chart
        datasets = []
        for marketplace in marketplace_data:
            datasets.append({
                "label": marketplace,
                "data": [
                    normalized_data.get(metric, {}).get(marketplace, 0)
                    for metric in radar_metrics
                ],
                "raw_data": [
                    radar_data.get(metric, {}).get(marketplace, 0)
                    for metric in radar_metrics
                ]
            })
            
        # Generate chart configuration
        chart_config = {
            "type": "radar",
            "data": {
                "labels": [
                    "Opportunity",
                    "Low Competition",
                    "Search Volume",
                    "Price Competitiveness"
                ],
                "datasets": datasets
            },
            "options": {
                "title": f"{keyword} - Marketplace Comparison",
                "scale": {
                    "min": 0,
                    "max": 100
                }
            }
        }
            
        return {
            "keyword": keyword,
            "marketplaces": list(marketplace_data.keys()),
            "metrics": radar_metrics,
            "chart_config": chart_config,
            "raw_data": radar_data,
            "normalized_data": normalized_data
        }
        
    async def trending_keywords_chart(self,
                                    marketplace: str,
                                    days: int = 30,
                                    limit: int = 20) -> Dict[str, Any]:
        """Generate chart data for trending keywords.
        
        Args:
            marketplace: Marketplace name
            days: Number of days to analyze
            limit: Maximum number of keywords to include
            
        Returns:
            Dictionary with chart data
        """
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get keywords updated in timeframe
        keywords = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True,
                "last_updated": {">=": cutoff_date}
            },
            limit=limit * 5  # Get more to analyze trends
        )
        
        # Calculate trend metrics
        trending_data = []
        for keyword in keywords:
            history = keyword.get("history", [])
            
            # Filter history to requested timeframe
            history = [
                entry for entry in history
                if entry.get("date", "9999-12-31") >= cutoff_date
            ]
            
            # Skip if less than 2 data points
            if len(history) < 2:
                continue
                
            # Sort by date
            history.sort(key=lambda x: x.get("date", ""))
            
            # Get oldest and newest entries
            oldest = history[0]
            newest = history[-1]
            
            # Calculate changes
            opportunity_change = newest.get("opportunity_score", 0) - oldest.get("opportunity_score", 0)
            
            # Normalize to per-day change (to account for different history lengths)
            days_between = max(1, (datetime.fromisoformat(newest.get("date", cutoff_date)) - 
                                datetime.fromisoformat(oldest.get("date", cutoff_date))).days)
            daily_change = opportunity_change / days_between
            
            # Create data point
            trending_data.append({
                "keyword": keyword.get("keyword", ""),
                "opportunity_score": newest.get("opportunity_score", 0),
                "opportunity_change": opportunity_change,
                "daily_change": daily_change,
                "keyword_id": keyword.get("keyword_id", ""),
                "total_results": newest.get("total_results", 0),
                "competitive_density": newest.get("competitive_density", 0)
            })
            
        # Sort by daily change (highest first)
        trending_data.sort(key=lambda x: abs(x["daily_change"]), reverse=True)
        
        # Limit to requested number
        trending_data = trending_data[:limit]
        
        # Generate chart data
        chart_data = {
            "improving": [item for item in trending_data if item["opportunity_change"] > 0],
            "declining": [item for item in trending_data if item["opportunity_change"] < 0]
        }
        
        # Generate chart configuration
        chart_config = {
            "type": "bar",
            "data": {
                "labels": [item["keyword"] for item in trending_data],
                "datasets": [
                    {
                        "label": "Opportunity Score Change",
                        "data": [item["opportunity_change"] for item in trending_data],
                        "backgroundColor": [
                            "rgba(75, 192, 192, 0.6)" if change > 0 else "rgba(255, 99, 132, 0.6)"
                            for change in [item["opportunity_change"] for item in trending_data]
                        ]
                    }
                ]
            },
            "options": {
                "title": f"{marketplace} Trending Keywords",
                "x_axis_label": "Keyword",
                "y_axis_label": "Opportunity Score Change"
            }
        }
            
        return {
            "marketplace": marketplace,
            "timeframe_days": days,
            "trending_keywords": trending_data,
            "improving_count": len(chart_data["improving"]),
            "declining_count": len(chart_data["declining"]),
            "chart_config": chart_config,
            "chart_data": chart_data
        }
        
    async def opportunity_breakdown_pie(self,
                                      keyword: str,
                                      marketplace: str) -> Dict[str, Any]:
        """Generate pie chart data for opportunity score breakdown.
        
        Args:
            keyword: Keyword to analyze
            marketplace: Marketplace name
            
        Returns:
            Dictionary with pie chart data
        """
        # Get opportunity score
        opportunity_id = f"{marketplace}_{keyword}"
        opportunity = await self.storage_client.get_opportunity_score(
            entity_type="keyword",
            entity_id=opportunity_id
        )
        
        if not opportunity:
            return {
                "keyword": keyword,
                "marketplace": marketplace,
                "status": "not_found"
            }
            
        # Get factor scores
        factor_scores = opportunity.get("factor_scores", [])
        
        # Skip if no factors
        if not factor_scores:
            return {
                "keyword": keyword,
                "marketplace": marketplace,
                "status": "no_factors"
            }
            
        # Extract pie data
        pie_data = []
        for factor in factor_scores:
            # Calculate weighted score
            weighted_score = factor.get("score", 0) * factor.get("weight", 0)
            
            pie_data.append({
                "factor": factor.get("factor_name", "Unknown"),
                "score": factor.get("score", 0),
                "weight": factor.get("weight", 0),
                "weighted_score": weighted_score,
                "explanation": factor.get("explanation", "")
            })
            
        # Sort by weighted score (highest first)
        pie_data.sort(key=lambda x: x["weighted_score"], reverse=True)
        
        # Generate chart configuration
        chart_config = {
            "type": "pie",
            "data": {
                "labels": [item["factor"] for item in pie_data],
                "datasets": [
                    {
                        "label": "Opportunity Factors",
                        "data": [item["weighted_score"] for item in pie_data]
                    }
                ]
            },
            "options": {
                "title": f"{keyword} - {marketplace} Opportunity Breakdown"
            }
        }
            
        return {
            "keyword": keyword,
            "marketplace": marketplace,
            "opportunity_score": opportunity.get("opportunity_score", 0),
            "factor_breakdown": pie_data,
            "chart_config": chart_config
        }
        
    async def category_opportunity_heatmap(self,
                                         marketplace: str,
                                         limit: int = 20) -> Dict[str, Any]:
        """Generate heatmap data for category opportunities.
        
        Args:
            marketplace: Marketplace name
            limit: Maximum number of categories to include
            
        Returns:
            Dictionary with heatmap data
        """
        # Get keywords with categories
        keywords = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True
            },
            limit=1000
        )
        
        # Extract all categories
        categories = set()
        for keyword in keywords:
            for category in keyword.get("categories", []):
                categories.add(category)
                
        # Skip if no categories
        if not categories:
            return {
                "marketplace": marketplace,
                "status": "no_categories"
            }
            
        # Calculate metrics for each category
        category_data = {}
        for category in categories:
            # Get keywords in this category
            category_keywords = [
                k for k in keywords
                if category in k.get("categories", [])
            ]
            
            # Skip if no keywords
            if not category_keywords:
                continue
                
            # Calculate metrics
            opportunity_scores = [k.get("last_opportunity_score", 0) for k in category_keywords]
            seller_densities = [k.get("seller_density", 0) for k in category_keywords if "seller_density" in k]
            
            # Skip if no data
            if not opportunity_scores or not seller_densities:
                continue
                
            # Calculate averages
            avg_opportunity = sum(opportunity_scores) / len(opportunity_scores)
            avg_density = sum(seller_densities) / len(seller_densities)
            
            # Create data point
            category_data[category] = {
                "category": category,
                "average_opportunity": avg_opportunity,
                "average_competition": avg_density,
                "keyword_count": len(category_keywords),
                "opportunity_index": avg_opportunity / (avg_density if avg_density > 0 else 1)  # Higher is better
            }
            
        # Sort by opportunity index (highest first)
        sorted_categories = sorted(
            category_data.values(),
            key=lambda x: x["opportunity_index"],
            reverse=True
        )
        
        # Limit to requested number
        sorted_categories = sorted_categories[:limit]
        
        # Generate heatmap data
        heatmap_data = []
        for category in sorted_categories:
            heatmap_data.append({
                "category": category["category"],
                "opportunity": category["average_opportunity"],
                "competition": category["average_competition"],
                "keyword_count": category["keyword_count"],
                "opportunity_index": category["opportunity_index"]
            })
            
        # Generate chart configuration
        chart_config = {
            "type": "heatmap",
            "data": {
                "labels": [item["category"] for item in heatmap_data],
                "datasets": [
                    {
                        "label": "Opportunity",
                        "data": [item["opportunity"] for item in heatmap_data]
                    },
                    {
                        "label": "Competition",
                        "data": [item["competition"] for item in heatmap_data]
                    }
                ]
            },
            "options": {
                "title": f"{marketplace} Category Opportunity Heatmap"
            }
        }
            
        return {
            "marketplace": marketplace,
            "categories": [item["category"] for item in heatmap_data],
            "heatmap_data": heatmap_data,
            "chart_config": chart_config
        }
        
    def _extract_metric(self, data: Dict[str, Any], metric: str) -> float:
        """Extract a specific metric from keyword data.
        
        Args:
            data: Keyword data
            metric: Metric to extract
            
        Returns:
            Metric value as float
        """
        # Handle nested metrics
        if metric == "opportunity_score":
            return data.get("last_opportunity_score", 0)
        elif metric == "competitive_density":
            return data.get("seller_density", 0)
        elif metric == "total_results":
            return data.get("current_results", 0)
        elif metric == "price_competitiveness":
            # Try to calculate from latest history
            history = data.get("history", [])
            if history:
                latest = history[-1]
                return latest.get("average_price", 0)
            return 0
        
        # Default
        return data.get(metric, 0)
"""