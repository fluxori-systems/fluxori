"""
Base search ranking extractor for marketplace data collection.

This module provides base functionality for extracting search ranking data
from marketplace search results, including seller counting and keyword ranking.
"""

import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from bs4 import BeautifulSoup


class SearchRankingExtractor(ABC):
    """Base class for extracting search ranking information.
    
    This class provides common methods for tracking product rankings in search results,
    analyzing seller density, and calculating opportunity scores.
    """
    
    def __init__(self, marketplace_name: str):
        """Initialize the search ranking extractor.
        
        Args:
            marketplace_name: Name of the marketplace
        """
        self.marketplace_name = marketplace_name
        
        # Setup logging
        self.logger = logging.getLogger(f"{marketplace_name}-ranking-extractor")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        # Scoring weights - can be adjusted per marketplace
        self.scoring_weights = {
            "competition": 0.3,      # Lower competition → higher score
            "demand": 0.2,           # Higher demand → higher score
            "price_point": 0.15,     # Better price positioning → higher score
            "rating": 0.15,          # Higher ratings → higher score
            "trend": 0.1,            # Improving trends → higher score
            "seasonality": 0.05,     # In-season → higher score
            "marketplace_specific": 0.05  # Marketplace-specific factors
        }
    
    def extract_search_ranking_data(self, 
                                  html_content: str, 
                                  keyword: str,
                                  page: int = 1,
                                  max_depth: int = 3) -> Dict[str, Any]:
        """Extract search ranking data from search results page.
        
        Args:
            html_content: HTML content of the search page
            keyword: Search keyword
            page: Page number
            max_depth: Maximum number of pages to consider for ranking
            
        Returns:
            Search ranking data
        """
        self.logger.info(f"Extracting search ranking data for '{keyword}' (page {page})")
        
        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Create ranking data dictionary
        ranking_data = {
            "keyword": keyword,
            "marketplace": self.marketplace_name,
            "page": page,
            "current_results": self._extract_total_results(soup),
            "top_ranked_products": []
        }
        
        # Extract ranking data - implementation varies by marketplace
        products = self._extract_ranked_products(soup, keyword, page)
        
        # Calculate starting position for this page
        start_position = (page - 1) * self._get_products_per_page() + 1
        
        # Process each product
        for idx, product in enumerate(products):
            position = start_position + idx
            
            # Skip processing if we exceed the maximum depth
            if (position - 1) // self._get_products_per_page() >= max_depth:
                break
                
            # Add position to product data
            product["position"] = position
            
            # Get seller count for the product
            product["seller_count"] = self._extract_seller_count(product, soup)
            
            # Determine if this is a sponsored result
            is_sponsored = self._detect_sponsored_result(product, soup)
            if is_sponsored:
                product["sponsored"] = True
            
            # Add to top ranked products
            ranking_data["top_ranked_products"].append(product)
        
        # Calculate seller density
        seller_counts = [p.get("seller_count", 0) for p in ranking_data["top_ranked_products"] 
                        if p.get("seller_count", 0) > 0]
        if seller_counts:
            ranking_data["seller_density"] = sum(seller_counts) / len(seller_counts)
        else:
            ranking_data["seller_density"] = 0
            
        # Calculate competitive index (0-10)
        ranking_data["competitive_index"] = self._calculate_competitive_index(ranking_data)
        
        self.logger.info(f"Extracted {len(ranking_data['top_ranked_products'])} ranked products for '{keyword}'")
        
        return ranking_data
    
    def calculate_opportunity_score(self, 
                                   ranking_data: Dict[str, Any], 
                                   historical_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Calculate opportunity score for a keyword.
        
        Args:
            ranking_data: Current ranking data
            historical_data: Optional historical ranking data
            
        Returns:
            Opportunity score data
        """
        self.logger.info(f"Calculating opportunity score for '{ranking_data['keyword']}'")
        
        # Initialize score components
        factor_scores = []
        
        # 1. Competition Factor
        competition_score = self._calculate_competition_score(ranking_data)
        factor_scores.append({
            "factor_name": "competition",
            "score": competition_score,
            "weight": self.scoring_weights["competition"],
            "explanation": "Based on seller density and competitive index",
            "raw_value": ranking_data.get("seller_density", 0)
        })
        
        # 2. Demand Factor
        demand_score = self._calculate_demand_score(ranking_data)
        factor_scores.append({
            "factor_name": "demand",
            "score": demand_score,
            "weight": self.scoring_weights["demand"],
            "explanation": "Based on search result count and result quality",
            "raw_value": ranking_data.get("current_results", 0)
        })
        
        # 3. Price Point Factor
        price_score = self._calculate_price_score(ranking_data)
        factor_scores.append({
            "factor_name": "price_point",
            "score": price_score,
            "weight": self.scoring_weights["price_point"],
            "explanation": "Based on price distribution and positioning",
            "raw_value": self._get_average_price(ranking_data)
        })
        
        # 4. Rating Factor
        rating_score = self._calculate_rating_score(ranking_data)
        factor_scores.append({
            "factor_name": "rating",
            "score": rating_score,
            "weight": self.scoring_weights["rating"],
            "explanation": "Based on product ratings and review counts",
            "raw_value": self._get_average_rating(ranking_data)
        })
        
        # 5. Trend Factor (if historical data is available)
        trend_score = self._calculate_trend_score(ranking_data, historical_data) if historical_data else 50.0
        factor_scores.append({
            "factor_name": "trend",
            "score": trend_score,
            "weight": self.scoring_weights["trend"],
            "explanation": "Based on changes in search metrics over time",
            "raw_value": "stable" if trend_score == 50 else ("improving" if trend_score > 50 else "declining")
        })
        
        # 6. Seasonality Factor
        seasonality_score = self._calculate_seasonality_score(ranking_data)
        factor_scores.append({
            "factor_name": "seasonality",
            "score": seasonality_score,
            "weight": self.scoring_weights["seasonality"],
            "explanation": "Based on current season relevance",
            "raw_value": "in_season" if seasonality_score > 50 else "off_season"
        })
        
        # 7. Marketplace-specific Factor
        marketplace_score = self._calculate_marketplace_specific_score(ranking_data)
        factor_scores.append({
            "factor_name": "marketplace_specific",
            "score": marketplace_score,
            "weight": self.scoring_weights["marketplace_specific"],
            "explanation": "Based on marketplace-specific factors",
            "raw_value": self.marketplace_name
        })
        
        # Calculate weighted average for composite score
        composite_score = sum(factor["score"] * factor["weight"] for factor in factor_scores)
        
        # Ensure score is within 0-100 range
        composite_score = max(0, min(100, composite_score))
        
        # Create score breakdown
        score_breakdown = {factor["factor_name"]: factor["score"] for factor in factor_scores}
        
        # Create opportunity score data
        opportunity_data = {
            "marketplace": self.marketplace_name,
            "entity_type": "keyword",
            "entity_id": ranking_data["keyword"],
            "entity_name": ranking_data["keyword"],
            "opportunity_score": composite_score,
            "confidence": self._calculate_confidence_score(ranking_data),
            "factor_scores": factor_scores,
            "score_breakdown": score_breakdown,
            "search_volume": None,  # Would need external API for this
            "result_count": ranking_data.get("current_results", 0),
            "competitive_density": ranking_data.get("seller_density", 0)
        }
        
        # Generate recommendations based on score components
        opportunity_data["recommendations"] = self._generate_recommendations(opportunity_data)
        
        self.logger.info(f"Calculated opportunity score of {composite_score:.1f} for '{ranking_data['keyword']}'")
        
        return opportunity_data
    
    def _calculate_competitive_index(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate competitive index (0-10) based on seller density and result patterns.
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Competitive index (0-10, higher means more competitive)
        """
        # Base calculation on seller density
        seller_density = ranking_data.get("seller_density", 0)
        
        # Calculate base index
        if seller_density == 0:
            # No seller data, use alternative method
            return self._calculate_alternative_competitive_index(ranking_data)
        
        # Normalize to 0-10 scale with diminishing returns
        # Assumption: 5+ sellers per product is highly competitive
        index = min(10, seller_density * 2)
        
        # Adjust based on sponsored listings
        sponsored_count = sum(1 for p in ranking_data.get("top_ranked_products", []) 
                             if p.get("sponsored", False))
        
        # More sponsored results indicate higher competition
        sponsored_ratio = sponsored_count / max(1, len(ranking_data.get("top_ranked_products", [])))
        sponsored_factor = min(2, sponsored_ratio * 5)  # Cap adjustment at 2 points
        
        index = min(10, index + sponsored_factor)
        
        # Further marketplace-specific adjustments
        index = self._adjust_competitive_index(index, ranking_data)
        
        return index
    
    def _calculate_alternative_competitive_index(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate competitive index when seller data is not available.
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Competitive index (0-10)
        """
        # Default implementation based on result count
        result_count = ranking_data.get("current_results", 0)
        
        # More results = more competitive, with diminishing returns
        if result_count < 10:
            return 1.0  # Very low competition
        elif result_count < 50:
            return 3.0  # Low competition
        elif result_count < 200:
            return 5.0  # Medium competition
        elif result_count < 1000:
            return 7.0  # High competition
        else:
            return 9.0  # Very high competition
    
    def _calculate_competition_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate competition factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Competition score (0-100, higher means better opportunity)
        """
        # Use the inverse of the competitive index for scoring
        # Lower competition = higher opportunity
        competitive_index = ranking_data.get("competitive_index", 5.0)
        
        # Convert 0-10 index to 0-100 score (inverse)
        score = max(0, 100 - (competitive_index * 10))
        
        # Apply marketplace-specific adjustments
        return self._adjust_competition_score(score, ranking_data)
    
    def _calculate_demand_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate demand factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Demand score (0-100)
        """
        # Base on result count with non-linear scaling
        result_count = ranking_data.get("current_results", 0)
        
        # Convert result count to 0-100 score with sweet spot
        if result_count < 5:
            # Too few results = low demand
            score = max(0, result_count * 10)
        elif result_count < 50:
            # Good niche range (5-50 results)
            score = 60 + min(30, (result_count - 5) / 45 * 30)
        elif result_count < 200:
            # Moderate demand (50-200 results)
            score = 90 - min(20, (result_count - 50) / 150 * 20)
        elif result_count < 1000:
            # Higher competition range (200-1000)
            score = 70 - min(20, (result_count - 200) / 800 * 20)
        else:
            # Very high competition (>1000 results)
            score = max(30, 50 - (result_count / 5000) * 20)
        
        # Apply marketplace-specific adjustments
        return self._adjust_demand_score(score, ranking_data)
    
    def _calculate_price_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate price point factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Price score (0-100)
        """
        # Get price data from ranking data
        prices = [p.get("price", 0) for p in ranking_data.get("top_ranked_products", []) 
                 if "price" in p and p.get("price", 0) > 0]
        
        if not prices:
            return 50.0  # Neutral score if no price data
        
        # Calculate price statistics
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        price_range = max_price - min_price
        
        # Calculate price distribution
        if price_range == 0:
            # All products at same price - neutral opportunity
            return 50.0
        
        # Look for price gaps and clustering
        price_gaps = self._find_price_gaps(prices)
        
        # Higher score for markets with price gaps = more opportunity
        if price_gaps:
            gap_score = min(25, len(price_gaps) * 5)
        else:
            gap_score = 0
        
        # Calculate base score from price dispersion
        # More price dispersion = more opportunity
        if price_range < avg_price * 0.1:
            # Very tight pricing - less opportunity
            dispersion_score = 30
        elif price_range < avg_price * 0.3:
            # Moderate price range - some opportunity
            dispersion_score = 50
        else:
            # Wide price range - more opportunity for positioning
            dispersion_score = 70
        
        # Combine scores
        score = dispersion_score + gap_score
        
        # Cap at 100
        score = min(100, score)
        
        # Apply marketplace-specific adjustments
        return self._adjust_price_score(score, ranking_data)
    
    def _find_price_gaps(self, prices: List[float]) -> List[Tuple[float, float]]:
        """Find price gaps in the distribution that could represent opportunities.
        
        Args:
            prices: List of prices
            
        Returns:
            List of (gap_start, gap_end) tuples
        """
        if len(prices) < 3:
            return []
        
        # Sort prices
        sorted_prices = sorted(prices)
        
        # Calculate average gap
        avg_gap = (sorted_prices[-1] - sorted_prices[0]) / (len(sorted_prices) - 1)
        
        # Find gaps that are significantly larger than average
        gaps = []
        for i in range(1, len(sorted_prices)):
            gap = sorted_prices[i] - sorted_prices[i-1]
            if gap > avg_gap * 2:  # Significant gap threshold
                gaps.append((sorted_prices[i-1], sorted_prices[i]))
        
        return gaps
    
    def _calculate_rating_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate rating factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Rating score (0-100)
        """
        # Extract ratings and review counts
        ratings = []
        review_counts = []
        
        for product in ranking_data.get("top_ranked_products", []):
            if "rating" in product and product["rating"] > 0:
                ratings.append(product["rating"])
                
            if "review_count" in product and product["review_count"] > 0:
                review_counts.append(product["review_count"])
        
        if not ratings:
            return 50.0  # Neutral score if no rating data
        
        # Calculate average rating
        avg_rating = sum(ratings) / len(ratings)
        
        # Convert 0-5 star rating to 0-100 score
        normalized_rating = (avg_rating / 5) * 100
        
        # If we have review counts, adjust based on review volume
        if review_counts:
            avg_reviews = sum(review_counts) / len(review_counts)
            
            # More reviews = higher confidence = slight boost
            if avg_reviews < 10:
                review_modifier = 0.9  # Slight penalty for few reviews
            elif avg_reviews < 50:
                review_modifier = 1.0  # Neutral for moderate reviews
            else:
                review_modifier = 1.1  # Slight boost for many reviews
                
            score = normalized_rating * review_modifier
        else:
            score = normalized_rating
        
        # Cap at 100
        score = min(100, score)
        
        # Apply marketplace-specific adjustments
        return self._adjust_rating_score(score, ranking_data)
    
    def _calculate_trend_score(self, 
                              ranking_data: Dict[str, Any],
                              historical_data: List[Dict[str, Any]]) -> float:
        """Calculate trend factor score (0-100).
        
        Args:
            ranking_data: Current ranking data
            historical_data: Historical ranking data
            
        Returns:
            Trend score (0-100)
        """
        if not historical_data or len(historical_data) < 2:
            return 50.0  # Neutral score if insufficient historical data
        
        # Sort historical data by date
        sorted_history = sorted(historical_data, key=lambda x: x.get("date", ""))
        
        # Get the most recent previous data point
        previous_data = sorted_history[-1]
        
        # Compare metrics
        current_results = ranking_data.get("current_results", 0)
        previous_results = previous_data.get("total_results", 0)
        
        # Determine trend direction
        if current_results > previous_results * 1.2:
            # Significant increase in results = more interest
            result_trend = 2
        elif current_results > previous_results * 1.05:
            # Small increase
            result_trend = 1
        elif current_results < previous_results * 0.8:
            # Significant decrease
            result_trend = -2
        elif current_results < previous_results * 0.95:
            # Small decrease
            result_trend = -1
        else:
            # Stable
            result_trend = 0
        
        # Calculate competitive trend
        current_density = ranking_data.get("seller_density", 0)
        previous_density = previous_data.get("competitive_density", 0)
        
        if current_density == 0 or previous_density == 0:
            competition_trend = 0  # Neutral if no data
        elif current_density > previous_density * 1.2:
            # Significant increase in competition = negative
            competition_trend = -2
        elif current_density > previous_density * 1.05:
            # Small increase in competition
            competition_trend = -1
        elif current_density < previous_density * 0.8:
            # Significant decrease in competition = positive
            competition_trend = 2
        elif current_density < previous_density * 0.95:
            # Small decrease in competition
            competition_trend = 1
        else:
            # Stable
            competition_trend = 0
        
        # Combine trend factors
        trend_value = result_trend + competition_trend
        
        # Convert to 0-100 score (centered at 50)
        score = 50 + (trend_value * 10)  # Each point = 10% shift
        
        # Cap at 0-100
        score = max(0, min(100, score))
        
        # Apply marketplace-specific adjustments
        return self._adjust_trend_score(score, ranking_data, historical_data)
    
    def _calculate_seasonality_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate seasonality factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Seasonality score (0-100)
        """
        # Current month
        current_month = datetime.now().month
        
        # Default implementation assumes no seasonality knowledge - slight bias toward current season
        if 3 <= current_month <= 5:
            # Spring
            score = 60 if self._is_spring_keyword(ranking_data["keyword"]) else 50
        elif 6 <= current_month <= 8:
            # Summer
            score = 60 if self._is_summer_keyword(ranking_data["keyword"]) else 50
        elif 9 <= current_month <= 11:
            # Fall
            score = 60 if self._is_fall_keyword(ranking_data["keyword"]) else 50
        else:
            # Winter
            score = 60 if self._is_winter_keyword(ranking_data["keyword"]) else 50
        
        # Apply marketplace-specific adjustments
        return self._adjust_seasonality_score(score, ranking_data)
    
    def _is_spring_keyword(self, keyword: str) -> bool:
        """Check if keyword is spring-related.
        
        Args:
            keyword: Search keyword
            
        Returns:
            True if spring-related
        """
        spring_terms = ["spring", "easter", "garden", "planting", "allergy", "rain"]
        return any(term in keyword.lower() for term in spring_terms)
    
    def _is_summer_keyword(self, keyword: str) -> bool:
        """Check if keyword is summer-related.
        
        Args:
            keyword: Search keyword
            
        Returns:
            True if summer-related
        """
        summer_terms = ["summer", "beach", "pool", "bbq", "barbecue", "vacation", "holiday"]
        return any(term in keyword.lower() for term in summer_terms)
    
    def _is_fall_keyword(self, keyword: str) -> bool:
        """Check if keyword is fall-related.
        
        Args:
            keyword: Search keyword
            
        Returns:
            True if fall-related
        """
        fall_terms = ["fall", "autumn", "halloween", "harvest", "school", "thanksgiving"]
        return any(term in keyword.lower() for term in fall_terms)
    
    def _is_winter_keyword(self, keyword: str) -> bool:
        """Check if keyword is winter-related.
        
        Args:
            keyword: Search keyword
            
        Returns:
            True if winter-related
        """
        winter_terms = ["winter", "christmas", "snow", "cold", "holiday", "new year"]
        return any(term in keyword.lower() for term in winter_terms)
    
    def _calculate_marketplace_specific_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate marketplace-specific factor score (0-100).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Marketplace-specific score (0-100)
        """
        # Default implementation returns neutral score
        return 50.0
    
    def _calculate_confidence_score(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate confidence in the opportunity score (0.0-1.0).
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Confidence score (0.0-1.0)
        """
        # Base confidence on data completeness
        factors = [
            len(ranking_data.get("top_ranked_products", [])) > 0,
            ranking_data.get("current_results", 0) > 0,
            ranking_data.get("seller_density", 0) > 0,
            any("rating" in p for p in ranking_data.get("top_ranked_products", []))
        ]
        
        # Calculate percentage of factors with data
        return sum(1 for f in factors if f) / len(factors)
    
    def _generate_recommendations(self, opportunity_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations based on opportunity score components.
        
        Args:
            opportunity_data: Opportunity score data
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Analyze factor scores
        factor_scores = opportunity_data.get("factor_scores", [])
        
        # Find highest and lowest scoring factors
        sorted_factors = sorted(factor_scores, key=lambda x: x["score"], reverse=True)
        
        if sorted_factors:
            # Recommend based on strongest opportunity
            highest_factor = sorted_factors[0]
            if highest_factor["score"] > 70:
                if highest_factor["factor_name"] == "competition":
                    recommendations.append({
                        "type": "opportunity",
                        "text": f"Low competition detected - consider entering this market segment.",
                        "factor": "competition",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
                elif highest_factor["factor_name"] == "demand":
                    recommendations.append({
                        "type": "opportunity",
                        "text": f"Good demand with balanced competition - potential sweet spot.",
                        "factor": "demand",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
                elif highest_factor["factor_name"] == "price_point":
                    recommendations.append({
                        "type": "opportunity",
                        "text": f"Price gaps detected - opportunity for strategic price positioning.",
                        "factor": "price_point",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
                elif highest_factor["factor_name"] == "trend":
                    recommendations.append({
                        "type": "opportunity",
                        "text": f"Positive trend detected - growing interest in this segment.",
                        "factor": "trend",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
            
            # Add warning for weakest factor
            lowest_factor = sorted_factors[-1]
            if lowest_factor["score"] < 30:
                if lowest_factor["factor_name"] == "competition":
                    recommendations.append({
                        "type": "warning",
                        "text": f"Extremely high competition - may be difficult to establish presence.",
                        "factor": "competition",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
                elif lowest_factor["factor_name"] == "demand":
                    recommendations.append({
                        "type": "warning",
                        "text": f"Very low demand - may not be worth targeting.",
                        "factor": "demand",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
                elif lowest_factor["factor_name"] == "trend":
                    recommendations.append({
                        "type": "warning",
                        "text": f"Negative trend detected - interest appears to be declining.",
                        "factor": "trend",
                        "confidence": opportunity_data.get("confidence", 0.5)
                    })
        
        # Add overall recommendation
        overall_score = opportunity_data.get("opportunity_score", 0)
        if overall_score >= 70:
            recommendations.append({
                "type": "summary",
                "text": f"High opportunity detected - consider prioritizing this keyword.",
                "factor": "overall",
                "confidence": opportunity_data.get("confidence", 0.5)
            })
        elif overall_score < 30:
            recommendations.append({
                "type": "summary",
                "text": f"Low opportunity detected - consider deprioritizing this keyword.",
                "factor": "overall",
                "confidence": opportunity_data.get("confidence", 0.5)
            })
        else:
            recommendations.append({
                "type": "summary",
                "text": f"Moderate opportunity - monitor this keyword for changes.",
                "factor": "overall",
                "confidence": opportunity_data.get("confidence", 0.5)
            })
        
        return recommendations
    
    def _get_average_price(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate average price from ranking data.
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Average price
        """
        prices = [p.get("price", 0) for p in ranking_data.get("top_ranked_products", []) 
                 if "price" in p and p.get("price", 0) > 0]
        
        if not prices:
            return 0.0
            
        return sum(prices) / len(prices)
    
    def _get_average_rating(self, ranking_data: Dict[str, Any]) -> float:
        """Calculate average rating from ranking data.
        
        Args:
            ranking_data: Ranking data
            
        Returns:
            Average rating
        """
        ratings = [p.get("rating", 0) for p in ranking_data.get("top_ranked_products", []) 
                  if "rating" in p and p.get("rating", 0) > 0]
        
        if not ratings:
            return 0.0
            
        return sum(ratings) / len(ratings)
    
    # Methods that can be overridden by marketplace-specific implementations
    
    def _extract_total_results(self, soup: BeautifulSoup) -> int:
        """Extract total number of search results.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Total result count
        """
        # Default implementation must be overridden by each marketplace
        return 0
    
    @abstractmethod
    def _extract_ranked_products(self, 
                               soup: BeautifulSoup, 
                               keyword: str, 
                               page: int) -> List[Dict[str, Any]]:
        """Extract ranked products from search results.
        
        Args:
            soup: BeautifulSoup object
            keyword: Search keyword
            page: Page number
            
        Returns:
            List of product data dictionaries
        """
        pass
    
    @abstractmethod
    def _extract_seller_count(self, 
                            product: Dict[str, Any], 
                            soup: BeautifulSoup) -> int:
        """Extract seller count for a product.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            Seller count
        """
        pass
    
    @abstractmethod
    def _detect_sponsored_result(self, 
                               product: Dict[str, Any], 
                               soup: BeautifulSoup) -> bool:
        """Detect if a product is a sponsored result.
        
        Args:
            product: Product data
            soup: BeautifulSoup object
            
        Returns:
            True if sponsored
        """
        pass
    
    def _get_products_per_page(self) -> int:
        """Get number of products per page for the marketplace.
        
        Returns:
            Products per page
        """
        # Default implementation
        return 20
    
    # Adjustment methods that can be overridden by marketplace-specific implementations
    
    def _adjust_competitive_index(self, index: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to competitive index.
        
        Args:
            index: Base competitive index
            ranking_data: Ranking data
            
        Returns:
            Adjusted competitive index
        """
        return index
    
    def _adjust_competition_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to competition score.
        
        Args:
            score: Base competition score
            ranking_data: Ranking data
            
        Returns:
            Adjusted competition score
        """
        return score
    
    def _adjust_demand_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to demand score.
        
        Args:
            score: Base demand score
            ranking_data: Ranking data
            
        Returns:
            Adjusted demand score
        """
        return score
    
    def _adjust_price_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to price score.
        
        Args:
            score: Base price score
            ranking_data: Ranking data
            
        Returns:
            Adjusted price score
        """
        return score
    
    def _adjust_rating_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to rating score.
        
        Args:
            score: Base rating score
            ranking_data: Ranking data
            
        Returns:
            Adjusted rating score
        """
        return score
    
    def _adjust_trend_score(self, 
                          score: float, 
                          ranking_data: Dict[str, Any], 
                          historical_data: List[Dict[str, Any]]) -> float:
        """Apply marketplace-specific adjustments to trend score.
        
        Args:
            score: Base trend score
            ranking_data: Ranking data
            historical_data: Historical data
            
        Returns:
            Adjusted trend score
        """
        return score
    
    def _adjust_seasonality_score(self, score: float, ranking_data: Dict[str, Any]) -> float:
        """Apply marketplace-specific adjustments to seasonality score.
        
        Args:
            score: Base seasonality score
            ranking_data: Ranking data
            
        Returns:
            Adjusted seasonality score
        """
        return score