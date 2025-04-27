"""
Ranking analysis tools for cross-marketplace product ranking data.

This module provides analysis capabilities for keyword ranking data
collected from multiple marketplaces, helping identify opportunities
and trends across South African e-commerce platforms.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple, Union
import statistics

# Local imports
from ...storage.repository import Repository


class RankingAnalyzer:
    """Cross-marketplace ranking and opportunity analysis.
    
    This class provides tools for analyzing product ranking data across
    multiple marketplaces, identifying trends, opportunities, and competitive
    insights.
    """
    
    def __init__(self, storage_client: Repository):
        """Initialize the ranking analyzer.
        
        Args:
            storage_client: Repository client for data storage
        """
        self.storage_client = storage_client
        self.logger = logging.getLogger("ranking-analyzer")
        
        # Analysis thresholds
        self.opportunity_threshold = 75  # Score threshold for high opportunity
        self.competition_threshold = 7  # Avg sellers per product for high competition
        self.low_competition_threshold = 3  # Avg sellers per product for low competition
        self.significant_change = 5  # Position change to consider significant
        
    async def analyze_keyword_performance(self, 
                                         keyword: str,
                                         marketplaces: List[str],
                                         days: int = 30) -> Dict[str, Any]:
        """Analyze keyword performance across marketplaces.
        
        Args:
            keyword: Keyword to analyze
            marketplaces: List of marketplaces to include
            days: Number of days of history to analyze
            
        Returns:
            Dictionary with analysis results
        """
        self.logger.info(f"Analyzing keyword '{keyword}' across {len(marketplaces)} marketplaces")
        
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get keyword data for each marketplace
        keyword_data = {}
        for marketplace in marketplaces:
            keyword_id = f"{marketplace}_{keyword}"
            keyword_entry = await self.storage_client.get_keyword_ranking(keyword_id)
            
            if not keyword_entry:
                continue
                
            # Filter history to requested timeframe
            history = [
                entry for entry in keyword_entry.get("history", [])
                if entry.get("date", "9999-12-31") >= cutoff_date
            ]
            
            # Skip if no history
            if not history:
                continue
                
            # Add to data
            keyword_data[marketplace] = {
                "current": keyword_entry,
                "history": history
            }
            
        # Skip analysis if no data
        if not keyword_data:
            return {
                "keyword": keyword,
                "marketplaces_analyzed": 0,
                "status": "no_data"
            }
            
        # Calculate cross-marketplace metrics
        total_results = {}
        competitive_density = {}
        opportunity_scores = {}
        price_averages = {}
        price_trends = {}
        position_trends = {}
        
        for marketplace, data in keyword_data.items():
            history = data["history"]
            
            # Get total results
            results_history = [entry.get("total_results", 0) for entry in history]
            total_results[marketplace] = results_history[-1] if results_history else 0
            
            # Get competitive density
            density_history = [entry.get("competitive_density", 0) for entry in history]
            competitive_density[marketplace] = density_history[-1] if density_history else 0
            
            # Get opportunity scores
            score_history = [entry.get("opportunity_score", 0) for entry in history]
            opportunity_scores[marketplace] = score_history[-1] if score_history else 0
            
            # Calculate price trends
            price_history = [entry.get("average_price", 0) for entry in history]
            price_averages[marketplace] = price_history[-1] if price_history else 0
            
            if len(price_history) >= 2:
                price_change = price_history[-1] - price_history[0]
                price_change_pct = (price_change / price_history[0]) * 100 if price_history[0] > 0 else 0
                price_trends[marketplace] = {
                    "change": price_change,
                    "change_percent": price_change_pct,
                    "trend": "up" if price_change > 0 else "down" if price_change < 0 else "stable"
                }
            else:
                price_trends[marketplace] = {"trend": "unknown"}
                
            # Calculate position trends for top products
            if len(history) >= 2:
                earliest = history[0]
                latest = history[-1]
                
                earliest_positions = {
                    product.get("product_id"): product.get("position")
                    for product in earliest.get("top_positions", [])
                }
                
                latest_positions = {
                    product.get("product_id"): product.get("position")
                    for product in latest.get("top_positions", [])
                }
                
                # Track movements
                improved = 0
                declined = 0
                stable = 0
                
                for product_id, current_pos in latest_positions.items():
                    if product_id in earliest_positions:
                        previous_pos = earliest_positions[product_id]
                        change = previous_pos - current_pos  # Positive means improved (moved up)
                        
                        if change > self.significant_change:
                            improved += 1
                        elif change < -self.significant_change:
                            declined += 1
                        else:
                            stable += 1
                            
                position_trends[marketplace] = {
                    "improved": improved,
                    "declined": declined,
                    "stable": stable,
                    "trend": "up" if improved > declined else "down" if declined > improved else "stable"
                }
            else:
                position_trends[marketplace] = {"trend": "unknown"}
                
        # Cross-marketplace comparison
        marketplace_comparison = []
        for marketplace, data in keyword_data.items():
            comparison = {
                "marketplace": marketplace,
                "total_results": total_results.get(marketplace, 0),
                "competitive_density": competitive_density.get(marketplace, 0),
                "opportunity_score": opportunity_scores.get(marketplace, 0),
                "average_price": price_averages.get(marketplace, 0),
                "price_trend": price_trends.get(marketplace, {}).get("trend", "unknown"),
                "position_trend": position_trends.get(marketplace, {}).get("trend", "unknown")
            }
            marketplace_comparison.append(comparison)
            
        # Sort by opportunity score (highest first)
        marketplace_comparison.sort(key=lambda x: x["opportunity_score"], reverse=True)
        
        # Identify best marketplace opportunity
        best_opportunity = marketplace_comparison[0]["marketplace"] if marketplace_comparison else None
        
        # Calculate cross-marketplace average metrics
        avg_total_results = sum(total_results.values()) / len(total_results) if total_results else 0
        avg_competitive_density = sum(competitive_density.values()) / len(competitive_density) if competitive_density else 0
        avg_opportunity_score = sum(opportunity_scores.values()) / len(opportunity_scores) if opportunity_scores else 0
        avg_price = sum(price_averages.values()) / len(price_averages) if price_averages else 0
        
        # Calculate price spread
        price_min = min(price_averages.values()) if price_averages else 0
        price_max = max(price_averages.values()) if price_averages else 0
        price_spread = price_max - price_min
        price_spread_pct = (price_spread / price_min) * 100 if price_min > 0 else 0
        
        # Generate insights
        insights = []
        
        # Opportunity insights
        high_opportunity_markets = [
            m for m, score in opportunity_scores.items()
            if score >= self.opportunity_threshold
        ]
        
        if high_opportunity_markets:
            insights.append({
                "type": "high_opportunity",
                "message": f"High opportunity detected in {', '.join(high_opportunity_markets)}",
                "score": max(opportunity_scores.values()) if opportunity_scores else 0,
                "marketplaces": high_opportunity_markets
            })
            
        # Competition insights
        high_competition_markets = [
            m for m, density in competitive_density.items()
            if density >= self.competition_threshold
        ]
        
        low_competition_markets = [
            m for m, density in competitive_density.items()
            if density <= self.low_competition_threshold
        ]
        
        if high_competition_markets:
            insights.append({
                "type": "high_competition",
                "message": f"High competition detected in {', '.join(high_competition_markets)}",
                "density": max(competitive_density.values()) if competitive_density else 0,
                "marketplaces": high_competition_markets
            })
            
        if low_competition_markets:
            insights.append({
                "type": "low_competition",
                "message": f"Low competition detected in {', '.join(low_competition_markets)}",
                "density": min(competitive_density.values()) if competitive_density else 0,
                "marketplaces": low_competition_markets
            })
            
        # Price insights
        if price_spread_pct >= 20:  # 20% price spread is significant
            insights.append({
                "type": "price_arbitrage",
                "message": f"Significant price differences detected across marketplaces (spread: {price_spread_pct:.1f}%)",
                "min_price": price_min,
                "max_price": price_max,
                "spread_percent": price_spread_pct,
                "lowest_marketplace": min(price_averages.items(), key=lambda x: x[1])[0] if price_averages else None,
                "highest_marketplace": max(price_averages.items(), key=lambda x: x[1])[0] if price_averages else None
            })
            
        # Return compiled analysis
        return {
            "keyword": keyword,
            "marketplaces_analyzed": len(keyword_data),
            "analysis_period_days": days,
            "best_opportunity_marketplace": best_opportunity,
            "average_metrics": {
                "total_results": avg_total_results,
                "competitive_density": avg_competitive_density,
                "opportunity_score": avg_opportunity_score,
                "average_price": avg_price
            },
            "price_comparison": {
                "min_price": price_min,
                "max_price": price_max,
                "spread": price_spread,
                "spread_percent": price_spread_pct
            },
            "marketplace_comparison": marketplace_comparison,
            "insights": insights,
            "generated_at": datetime.now().isoformat()
        }
        
    async def find_cross_marketplace_opportunities(self, 
                                                 marketplace_set: List[str],
                                                 limit: int = 20) -> List[Dict[str, Any]]:
        """Find the best cross-marketplace opportunities.
        
        Args:
            marketplace_set: List of marketplaces to include
            limit: Maximum number of opportunities to return
            
        Returns:
            List of cross-marketplace opportunities
        """
        self.logger.info(f"Finding cross-marketplace opportunities across {len(marketplace_set)} marketplaces")
        
        # Get common keywords across all marketplaces
        common_keywords = await self._find_common_keywords(marketplace_set)
        
        # Analyze each keyword
        opportunities = []
        for keyword in common_keywords:
            analysis = await self.analyze_keyword_performance(keyword, marketplace_set)
            
            # Skip keywords with no data
            if analysis.get("status") == "no_data" or analysis.get("marketplaces_analyzed", 0) == 0:
                continue
                
            # Add to opportunities
            opportunities.append({
                "keyword": keyword,
                "analysis": analysis,
                "opportunity_score": analysis.get("average_metrics", {}).get("opportunity_score", 0),
                "price_spread_percent": analysis.get("price_comparison", {}).get("spread_percent", 0),
                "insight_count": len(analysis.get("insights", [])),
                "marketplace_count": analysis.get("marketplaces_analyzed", 0)
            })
            
        # Sort by opportunity score
        opportunities.sort(key=lambda x: x["opportunity_score"], reverse=True)
        
        return opportunities[:limit]
    
    async def analyze_product_across_marketplaces(self,
                                                product_name: str,
                                                marketplaces: List[str]) -> Dict[str, Any]:
        """Analyze a specific product across marketplaces.
        
        Args:
            product_name: Name of product to analyze
            marketplaces: List of marketplaces to include
            
        Returns:
            Dictionary with analysis results
        """
        self.logger.info(f"Analyzing product '{product_name}' across {len(marketplaces)} marketplaces")
        
        # Search for product by name in each marketplace
        product_data = {}
        for marketplace in marketplaces:
            # Search for products
            products = await self.storage_client.search_products(
                marketplace=marketplace,
                query=product_name,
                limit=10
            )
            
            # Skip if no products
            if not products:
                continue
                
            # Find best match
            best_match = None
            for product in products:
                # Simple matching heuristic - look for products with name in title
                title = product.get("title", "").lower()
                if product_name.lower() in title:
                    best_match = product
                    break
                    
            if best_match:
                # Get opportunity score if available
                opportunity_id = f"{marketplace}_{best_match.get('product_id')}"
                opportunity = await self.storage_client.get_opportunity_score(opportunity_id)
                
                best_match["opportunity_score"] = opportunity.get("opportunity_score", 0) if opportunity else 0
                
                # Add to data
                product_data[marketplace] = best_match
                
        # Skip analysis if no data
        if not product_data:
            return {
                "product_name": product_name,
                "marketplaces_analyzed": 0,
                "status": "no_data"
            }
            
        # Extract prices
        prices = {}
        for marketplace, product in product_data.items():
            price = product.get("price", 0)
            if price:
                prices[marketplace] = price
                
        # Calculate price metrics
        if prices:
            min_price = min(prices.values())
            max_price = max(prices.values())
            avg_price = sum(prices.values()) / len(prices)
            price_spread = max_price - min_price
            price_spread_pct = (price_spread / min_price) * 100 if min_price > 0 else 0
            
            # Get marketplaces with min/max prices
            min_price_marketplace = min(prices.items(), key=lambda x: x[1])[0]
            max_price_marketplace = max(prices.items(), key=lambda x: x[1])[0]
        else:
            min_price = max_price = avg_price = price_spread = price_spread_pct = 0
            min_price_marketplace = max_price_marketplace = None
            
        # Get opportunity scores
        opportunity_scores = {}
        for marketplace, product in product_data.items():
            score = product.get("opportunity_score", 0)
            if score:
                opportunity_scores[marketplace] = score
                
        # Calculate opportunity metrics
        if opportunity_scores:
            avg_opportunity = sum(opportunity_scores.values()) / len(opportunity_scores)
            max_opportunity = max(opportunity_scores.values())
            max_opportunity_marketplace = max(opportunity_scores.items(), key=lambda x: x[1])[0]
        else:
            avg_opportunity = max_opportunity = 0
            max_opportunity_marketplace = None
            
        # Generate insights
        insights = []
        
        # Price insights
        if price_spread_pct >= 20:  # 20% price spread is significant
            insights.append({
                "type": "price_arbitrage",
                "message": f"Significant price difference across marketplaces ({price_spread_pct:.1f}%)",
                "min_price": min_price,
                "max_price": max_price,
                "spread_percent": price_spread_pct,
                "lowest_marketplace": min_price_marketplace,
                "highest_marketplace": max_price_marketplace
            })
            
        # Opportunity insights
        if max_opportunity >= self.opportunity_threshold:
            insights.append({
                "type": "high_opportunity",
                "message": f"High opportunity detected in {max_opportunity_marketplace}",
                "score": max_opportunity,
                "marketplace": max_opportunity_marketplace
            })
            
        # Availability insights
        missing_marketplaces = [m for m in marketplaces if m not in product_data]
        if missing_marketplaces:
            insights.append({
                "type": "availability_gap",
                "message": f"Product not found in {len(missing_marketplaces)} marketplaces",
                "missing_marketplaces": missing_marketplaces
            })
            
        # Return compiled analysis
        return {
            "product_name": product_name,
            "marketplaces_analyzed": len(product_data),
            "marketplaces_with_product": list(product_data.keys()),
            "marketplaces_missing_product": missing_marketplaces,
            "price_comparison": {
                "min_price": min_price,
                "max_price": max_price,
                "average_price": avg_price,
                "spread": price_spread,
                "spread_percent": price_spread_pct,
                "lowest_marketplace": min_price_marketplace,
                "highest_marketplace": max_price_marketplace
            },
            "opportunity_analysis": {
                "average_score": avg_opportunity,
                "max_score": max_opportunity,
                "best_marketplace": max_opportunity_marketplace,
                "by_marketplace": opportunity_scores
            },
            "insights": insights,
            "product_details": product_data,
            "generated_at": datetime.now().isoformat()
        }
    
    async def identify_trending_keywords(self, 
                                        marketplace: Optional[str] = None,
                                        days: int = 30,
                                        limit: int = 20) -> List[Dict[str, Any]]:
        """Identify trending keywords based on ranking changes.
        
        Args:
            marketplace: Optional marketplace to filter by
            days: Number of days to analyze
            limit: Maximum number of trending keywords to return
            
        Returns:
            List of trending keywords
        """
        self.logger.info(f"Identifying trending keywords for the last {days} days")
        
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Build filters
        filters = {
            "tracking_enabled": True,
            "update_count": {">=": 2}  # Need at least 2 updates to detect trends
        }
        
        if marketplace:
            filters["marketplace"] = marketplace
            
        # Get keywords from storage
        keywords = await self.storage_client.get_keyword_rankings(
            filters=filters,
            limit=200  # Get more than we need to analyze
        )
        
        # Calculate trend scores
        trending_keywords = []
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
                
            # Get oldest and newest data points
            oldest = history[0]
            newest = history[-1]
            
            # Calculate metrics change
            results_change = newest.get("total_results", 0) - oldest.get("total_results", 0)
            results_change_pct = (results_change / oldest.get("total_results", 1)) * 100 if oldest.get("total_results", 0) > 0 else 0
            
            # Calculate competitive change
            density_change = newest.get("competitive_density", 0) - oldest.get("competitive_density", 0)
            density_change_pct = (density_change / oldest.get("competitive_density", 1)) * 100 if oldest.get("competitive_density", 0) > 0 else 0
            
            # Calculate opportunity change
            opportunity_change = newest.get("opportunity_score", 0) - oldest.get("opportunity_score", 0)
            
            # Calculate price change
            price_change = newest.get("average_price", 0) - oldest.get("average_price", 0)
            price_change_pct = (price_change / oldest.get("average_price", 1)) * 100 if oldest.get("average_price", 0) > 0 else 0
            
            # Calculate trend score (weighted combination of changes)
            trend_score = (
                abs(results_change_pct) * 0.4 +   # 40% weight to search volume change
                abs(opportunity_change) * 3 +      # 30% weight to opportunity score change
                abs(density_change_pct) * 0.2 +    # 20% weight to competition change
                abs(price_change_pct) * 0.1        # 10% weight to price change
            )
            
            # Create trending entry
            trending_entry = {
                "keyword": keyword.get("keyword", ""),
                "marketplace": keyword.get("marketplace", ""),
                "trend_score": trend_score,
                "keyword_id": keyword.get("keyword_id", ""),
                "latest_opportunity_score": newest.get("opportunity_score", 0),
                "changes": {
                    "results": {
                        "absolute": results_change,
                        "percent": results_change_pct,
                        "direction": "up" if results_change > 0 else "down" if results_change < 0 else "stable"
                    },
                    "competition": {
                        "absolute": density_change,
                        "percent": density_change_pct,
                        "direction": "up" if density_change > 0 else "down" if density_change < 0 else "stable"
                    },
                    "opportunity": {
                        "absolute": opportunity_change,
                        "direction": "up" if opportunity_change > 0 else "down" if opportunity_change < 0 else "stable"
                    },
                    "price": {
                        "absolute": price_change,
                        "percent": price_change_pct,
                        "direction": "up" if price_change > 0 else "down" if price_change < 0 else "stable"
                    }
                }
            }
            
            trending_keywords.append(trending_entry)
            
        # Sort by trend score (highest first)
        trending_keywords.sort(key=lambda x: x["trend_score"], reverse=True)
        
        return trending_keywords[:limit]
    
    async def generate_marketplace_opportunity_report(self, 
                                                    marketplace: str,
                                                    days: int = 30) -> Dict[str, Any]:
        """Generate a comprehensive opportunity report for a marketplace.
        
        Args:
            marketplace: Marketplace to analyze
            days: Number of days to analyze
            
        Returns:
            Dictionary with report data
        """
        self.logger.info(f"Generating opportunity report for {marketplace}")
        
        # Define cutoff date
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # 1. Get top opportunity keywords
        top_opportunities = await self.storage_client.get_opportunity_scores(
            filters={
                "marketplace": marketplace,
                "entity_type": "keyword"
            },
            limit=20,
            order_by="opportunity_score",
            order_direction="desc"
        )
        
        # 2. Get trending keywords
        trending_keywords = await self.identify_trending_keywords(
            marketplace=marketplace,
            days=days,
            limit=10
        )
        
        # 3. Get high competition keywords
        high_competition = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True,
                "competitive_density": {">=": self.competition_threshold}
            },
            limit=10,
            order_by="competitive_density",
            order_direction="desc"
        )
        
        # 4. Get low competition keywords
        low_competition = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True,
                "competitive_density": {"<=": self.low_competition_threshold},
                "competitive_density": {">": 0}  # Ensure some competition
            },
            limit=10,
            order_by="opportunity_score",
            order_direction="desc"
        )
        
        # 5. Calculate overall marketplace metrics
        # Get recent keyword data
        recent_keywords = await self.storage_client.get_keyword_rankings(
            filters={
                "marketplace": marketplace,
                "tracking_enabled": True,
                "last_updated": {">=": cutoff_date}
            },
            limit=100
        )
        
        # Calculate average metrics
        if recent_keywords:
            avg_opportunity = statistics.mean([k.get("last_opportunity_score", 0) for k in recent_keywords])
            avg_competition = statistics.mean([k.get("seller_density", 0) for k in recent_keywords if "seller_density" in k])
            median_competition = statistics.median([k.get("seller_density", 0) for k in recent_keywords if "seller_density" in k])
            total_tracked = len(recent_keywords)
        else:
            avg_opportunity = avg_competition = median_competition = total_tracked = 0
            
        # 6. Generate category opportunities
        category_opportunities = await self._analyze_category_opportunities(marketplace, days)
        
        # Compile report
        return {
            "marketplace": marketplace,
            "analysis_period_days": days,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_keywords_tracked": total_tracked,
                "average_opportunity_score": avg_opportunity,
                "average_seller_density": avg_competition,
                "median_seller_density": median_competition,
                "total_high_opportunity_keywords": len([k for k in recent_keywords if k.get("last_opportunity_score", 0) >= self.opportunity_threshold]),
                "total_low_competition_keywords": len([k for k in recent_keywords if k.get("seller_density", 999) <= self.low_competition_threshold and k.get("seller_density", 0) > 0])
            },
            "top_opportunities": top_opportunities,
            "trending_keywords": trending_keywords,
            "high_competition_keywords": high_competition,
            "low_competition_opportunities": low_competition,
            "category_opportunities": category_opportunities
        }
        
    async def _find_common_keywords(self, marketplaces: List[str]) -> List[str]:
        """Find keywords tracked across all specified marketplaces.
        
        Args:
            marketplaces: List of marketplaces
            
        Returns:
            List of keywords tracked across all marketplaces
        """
        # Get keywords for each marketplace
        marketplace_keywords = {}
        for marketplace in marketplaces:
            keywords = await self.storage_client.get_keyword_rankings(
                filters={
                    "marketplace": marketplace,
                    "tracking_enabled": True
                },
                limit=1000
            )
            
            # Extract keyword text
            marketplace_keywords[marketplace] = {k.get("keyword") for k in keywords}
            
        # Find intersection of all sets
        if not marketplace_keywords:
            return []
            
        # Start with first marketplace's keywords
        common_keywords = marketplace_keywords.get(marketplaces[0], set())
        
        # Find intersection with remaining marketplaces
        for marketplace in marketplaces[1:]:
            keywords = marketplace_keywords.get(marketplace, set())
            common_keywords = common_keywords.intersection(keywords)
            
        return list(common_keywords)
    
    async def _analyze_category_opportunities(self, 
                                            marketplace: str,
                                            days: int) -> List[Dict[str, Any]]:
        """Analyze category-level opportunities in a marketplace.
        
        Args:
            marketplace: Marketplace to analyze
            days: Number of days to analyze
            
        Returns:
            List of category opportunity objects
        """
        # Get all keywords with categories
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
            return []
            
        # Calculate metrics for each category
        category_metrics = {}
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
            avg_opportunity = statistics.mean(opportunity_scores)
            avg_density = statistics.mean(seller_densities)
            
            # Calculate counts
            high_opportunity = len([s for s in opportunity_scores if s >= self.opportunity_threshold])
            low_competition = len([d for d in seller_densities if d <= self.low_competition_threshold and d > 0])
            
            # Store metrics
            category_metrics[category] = {
                "category": category,
                "keyword_count": len(category_keywords),
                "average_opportunity_score": avg_opportunity,
                "average_seller_density": avg_density,
                "high_opportunity_count": high_opportunity,
                "low_competition_count": low_competition,
                "opportunity_index": avg_opportunity / (avg_density if avg_density > 0 else 1)  # Higher is better
            }
            
        # Sort by opportunity index (highest first)
        sorted_categories = sorted(
            category_metrics.values(),
            key=lambda x: x["opportunity_index"],
            reverse=True
        )
        
        return sorted_categories[:10]  # Return top 10 categories
"""