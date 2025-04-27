#!/usr/bin/env python3
"""
Quota Efficiency Optimizer

This script analyzes and optimizes the SmartProxy quota usage efficiency by:
1. Analyzing usage patterns across marketplaces and task types
2. Identifying inefficient operations
3. Recommending optimizations for scheduler configuration
4. Dynamically adjusting task priorities based on data value
5. Forecasting quota usage and predicting potential overruns
"""

import argparse
import json
import logging
import os
import requests
import sys
import time
from datetime import datetime, timedelta
import subprocess
import yaml
import math
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("quota_optimizer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("quota-optimizer")

class QuotaEfficiencyOptimizer:
    """Optimizer for SmartProxy quota usage efficiency."""

    def __init__(self, service_url, output_dir="./optimizer_output", project_id="fluxori-web-app"):
        """Initialize the optimizer.
        
        Args:
            service_url: URL of the marketplace scraper service
            output_dir: Directory to save optimizer output
            project_id: Google Cloud project ID
        """
        self.service_url = service_url.rstrip('/')
        self.output_dir = output_dir
        self.project_id = project_id
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize data structures
        self.quota_metrics = None
        self.freshness_metrics = None
        self.scheduler_jobs = None
        self.optimizations = []
        self.forecast = None
        
    def fetch_quota_metrics(self):
        """Fetch quota usage metrics from the service."""
        try:
            response = requests.get(f"{self.service_url}/admin/quota-metrics?days=30")
            if response.status_code != 200:
                logger.error(f"Failed to fetch quota metrics: HTTP {response.status_code}")
                return False
                
            self.quota_metrics = response.json()
            logger.info("Successfully fetched quota metrics")
            
            # Save metrics for reference
            with open(f"{self.output_dir}/quota_metrics.json", 'w') as f:
                json.dump(self.quota_metrics, f, indent=2)
                
            return True
        except Exception as e:
            logger.error(f"Error fetching quota metrics: {str(e)}")
            return False
            
    def fetch_freshness_metrics(self):
        """Fetch data freshness metrics from the service."""
        try:
            response = requests.get(f"{self.service_url}/admin/data-freshness")
            if response.status_code != 200:
                logger.error(f"Failed to fetch freshness metrics: HTTP {response.status_code}")
                return False
                
            self.freshness_metrics = response.json()
            logger.info("Successfully fetched freshness metrics")
            
            # Save metrics for reference
            with open(f"{self.output_dir}/freshness_metrics.json", 'w') as f:
                json.dump(self.freshness_metrics, f, indent=2)
                
            return True
        except Exception as e:
            logger.error(f"Error fetching freshness metrics: {str(e)}")
            return False
            
    def fetch_scheduler_jobs(self):
        """Fetch Cloud Scheduler jobs."""
        try:
            result = subprocess.run(
                ["gcloud", "scheduler", "jobs", "list", "--format=json"],
                capture_output=True, text=True, check=True
            )
            
            if result.returncode != 0:
                logger.error(f"Failed to fetch scheduler jobs: {result.stderr}")
                return False
                
            self.scheduler_jobs = json.loads(result.stdout)
            logger.info(f"Successfully fetched {len(self.scheduler_jobs)} scheduler jobs")
            
            # Save jobs for reference
            with open(f"{self.output_dir}/scheduler_jobs.json", 'w') as f:
                json.dump(self.scheduler_jobs, f, indent=2)
                
            return True
        except Exception as e:
            logger.error(f"Error fetching scheduler jobs: {str(e)}")
            return False
            
    def analyze_marketplace_efficiency(self):
        """Analyze efficiency by marketplace and identify optimizations."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for analysis")
            return
            
        # Get marketplace efficiency
        marketplace_usage = self.quota_metrics.get("usage_by_marketplace", {})
        marketplace_efficiency = self.quota_metrics.get("efficiency_by_marketplace", {})
        
        if not marketplace_efficiency:
            logger.warning("No marketplace efficiency data available")
            return
            
        # Identify low-efficiency marketplaces
        low_efficiency_marketplaces = []
        avg_efficiency = self.quota_metrics.get("efficiency_score", 0)
        
        for marketplace, efficiency in marketplace_efficiency.items():
            logger.info(f"Marketplace {marketplace}: Efficiency {efficiency:.2f}")
            
            # Flag marketplaces with below-average efficiency
            if efficiency < avg_efficiency * 0.7:
                low_efficiency_marketplaces.append({
                    "marketplace": marketplace,
                    "efficiency": efficiency,
                    "avg_efficiency": avg_efficiency,
                    "usage": marketplace_usage.get(marketplace, 0)
                })
                
        # Sort by usage (higher usage inefficiencies are more important)
        low_efficiency_marketplaces.sort(key=lambda x: x["usage"], reverse=True)
        
        # Add optimization recommendations
        for entry in low_efficiency_marketplaces:
            marketplace = entry["marketplace"]
            efficiency = entry["efficiency"]
            usage = entry["usage"]
            
            # Calculate potential savings
            potential_savings = usage * (1 - (efficiency / avg_efficiency))
            
            self.optimizations.append({
                "type": "marketplace_efficiency",
                "marketplace": marketplace,
                "current_efficiency": efficiency,
                "average_efficiency": avg_efficiency,
                "usage": usage,
                "potential_savings": int(potential_savings),
                "recommendation": f"Optimize {marketplace} scraping efficiency",
                "impact": "high" if potential_savings > 5000 else "medium" if potential_savings > 1000 else "low",
                "actions": [
                    f"Reduce request_delay for {marketplace} by 0.5 seconds",
                    f"Increase batch processing of {marketplace} tasks",
                    f"Adjust product detail extraction depth for {marketplace}"
                ]
            })
            
        logger.info(f"Identified {len(low_efficiency_marketplaces)} marketplaces with low efficiency")
            
    def analyze_task_type_efficiency(self):
        """Analyze efficiency by task type and identify optimizations."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for analysis")
            return
            
        # Get task type efficiency
        task_usage = self.quota_metrics.get("usage_by_task_type", {})
        task_efficiency = self.quota_metrics.get("efficiency_by_task_type", {})
        
        if not task_efficiency:
            logger.warning("No task type efficiency data available")
            return
            
        # Identify low-efficiency task types
        low_efficiency_tasks = []
        avg_efficiency = self.quota_metrics.get("efficiency_score", 0)
        
        for task_type, efficiency in task_efficiency.items():
            logger.info(f"Task type {task_type}: Efficiency {efficiency:.2f}")
            
            # Flag task types with below-average efficiency
            if efficiency < avg_efficiency * 0.7:
                low_efficiency_tasks.append({
                    "task_type": task_type,
                    "efficiency": efficiency,
                    "avg_efficiency": avg_efficiency,
                    "usage": task_usage.get(task_type, 0)
                })
                
        # Sort by usage (higher usage inefficiencies are more important)
        low_efficiency_tasks.sort(key=lambda x: x["usage"], reverse=True)
        
        # Add optimization recommendations
        for entry in low_efficiency_tasks:
            task_type = entry["task_type"]
            efficiency = entry["efficiency"]
            usage = entry["usage"]
            
            # Calculate potential savings
            potential_savings = usage * (1 - (efficiency / avg_efficiency))
            
            # Task-specific optimization actions
            actions = [f"Review {task_type} implementation for efficiency improvements"]
            
            if task_type == "track_keyword_ranking":
                actions.extend([
                    "Increase batch size for keyword tracking",
                    "Reduce page depth for low-value keywords",
                    "Optimize HTML parsing for ranking extraction"
                ])
            elif task_type == "product_details":
                actions.extend([
                    "Implement selective field extraction based on data needs",
                    "Cache product details for frequently accessed products",
                    "Prioritize critical fields for initial extraction"
                ])
            elif task_type == "category_scanning":
                actions.extend([
                    "Implement incremental category scanning",
                    "Reduce scanning depth for low-change categories",
                    "Implement change detection to skip unchanged categories"
                ])
            
            self.optimizations.append({
                "type": "task_type_efficiency",
                "task_type": task_type,
                "current_efficiency": efficiency,
                "average_efficiency": avg_efficiency,
                "usage": usage,
                "potential_savings": int(potential_savings),
                "recommendation": f"Optimize {task_type} task efficiency",
                "impact": "high" if potential_savings > 5000 else "medium" if potential_savings > 1000 else "low",
                "actions": actions
            })
            
        logger.info(f"Identified {len(low_efficiency_tasks)} task types with low efficiency")
            
    def analyze_frequency_optimizations(self):
        """Analyze job frequencies and identify optimizations."""
        if not self.scheduler_jobs or not self.freshness_metrics:
            logger.error("Missing data for frequency optimization analysis")
            return
            
        # Get freshness by marketplace and task type
        marketplace_refresh = self.freshness_metrics.get("refresh_rates", {})
        task_type_refresh = self.freshness_metrics.get("task_types", {})
        
        # Get current job frequencies
        job_frequencies = {}
        
        for job in self.scheduler_jobs:
            name = job.get("name", "").split("/")[-1]
            schedule = job.get("schedule", "")
            
            # Parse schedule information
            body = job.get("httpTarget", {}).get("body", "{}")
            if not body:
                continue
                
            try:
                job_data = json.loads(body)
                task_type = job_data.get("task_type", "")
                marketplace = job_data.get("marketplace", "all")
                priority = job_data.get("priority", 5)
                
                if schedule and task_type:
                    job_frequencies[name] = {
                        "schedule": schedule,
                        "task_type": task_type,
                        "marketplace": marketplace,
                        "priority": priority,
                        "estimated_hours": self._estimate_hours_from_cron(schedule)
                    }
            except:
                pass
                
        # Identify frequency optimization opportunities
        frequency_optimizations = []
        
        # Check for over-frequent jobs
        for name, job_info in job_frequencies.items():
            task_type = job_info["task_type"]
            marketplace = job_info["marketplace"]
            current_hours = job_info["estimated_hours"]
            
            # Get refresh metrics for this marketplace/task
            marketplace_refresh_hours = marketplace_refresh.get(marketplace, {}).get("average_hours", 24)
            task_refresh_hours = task_type_refresh.get(task_type, {}).get("average_hours", 24)
            
            # Determine if job frequency can be reduced
            if current_hours < marketplace_refresh_hours * 0.5 and current_hours < 8:
                frequency_optimizations.append({
                    "job_name": name,
                    "current_frequency_hours": current_hours,
                    "marketplace_refresh_hours": marketplace_refresh_hours,
                    "task_type": task_type,
                    "marketplace": marketplace,
                    "recommendation": "reduce_frequency",
                    "suggested_hours": max(int(current_hours * 1.5), min(int(marketplace_refresh_hours * 0.7), 12))
                })
                
        # Check for under-frequent high-value jobs
        for name, job_info in job_frequencies.items():
            task_type = job_info["task_type"]
            marketplace = job_info["marketplace"]
            current_hours = job_info["estimated_hours"]
            priority = job_info["priority"]
            
            # High-value jobs should be refreshed more frequently
            if priority >= 8 and current_hours > 12:
                frequency_optimizations.append({
                    "job_name": name,
                    "current_frequency_hours": current_hours,
                    "priority": priority,
                    "task_type": task_type,
                    "marketplace": marketplace,
                    "recommendation": "increase_frequency",
                    "suggested_hours": max(6, int(current_hours * 0.7))
                })
                
        # Add optimization recommendations
        for opt in frequency_optimizations:
            action_type = "Decrease" if opt["recommendation"] == "reduce_frequency" else "Increase"
            job_name = opt["job_name"]
            current = opt["current_frequency_hours"]
            suggested = opt["suggested_hours"]
            
            # Estimate request savings
            daily_savings = 0
            if opt["recommendation"] == "reduce_frequency":
                daily_executions_before = 24 / current
                daily_executions_after = 24 / suggested
                requests_per_execution = 50  # Estimate
                daily_savings = (daily_executions_before - daily_executions_after) * requests_per_execution
            
            self.optimizations.append({
                "type": "job_frequency",
                "job_name": job_name,
                "task_type": opt["task_type"],
                "marketplace": opt["marketplace"],
                "current_frequency_hours": current,
                "suggested_frequency_hours": suggested,
                "daily_request_savings": int(daily_savings),
                "monthly_request_savings": int(daily_savings * 30),
                "recommendation": f"{action_type} frequency of {job_name} from every {current}h to every {suggested}h",
                "impact": "high" if daily_savings > 100 else "medium" if daily_savings > 30 else "low",
                "actions": [
                    f"Update Cloud Scheduler job {job_name} to run every {suggested} hours"
                ]
            })
            
        logger.info(f"Identified {len(frequency_optimizations)} job frequency optimization opportunities")
    
    def analyze_allocation_optimizations(self):
        """Analyze quota allocation and identify optimizations."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for analysis")
            return
            
        # Get priority and marketplace allocations
        priority_usage = self.quota_metrics.get("usage_by_priority", {})
        marketplace_usage = self.quota_metrics.get("usage_by_marketplace", {})
        daily_budget = self.quota_metrics.get("daily_budget", 7200)
        
        # Check priority allocation
        priority_allocations = {
            "CRITICAL": 0.35,
            "HIGH": 0.35,
            "MEDIUM": 0.20,
            "LOW": 0.05,
            "BACKGROUND": 0.05
        }
        
        allocation_optimizations = []
        
        # Compare actual usage to target allocations
        for priority, target in priority_allocations.items():
            actual = priority_usage.get(priority, 0) / self.quota_metrics.get("total_usage", 1)
            
            # Check for significant deviation
            if abs(actual - target) > 0.1:
                allocation_optimizations.append({
                    "type": "priority_allocation",
                    "priority": priority,
                    "target_allocation": target,
                    "actual_allocation": actual,
                    "deviation": actual - target,
                    "recommendation": f"{'Increase' if actual < target else 'Decrease'} {priority} priority allocation",
                    "impact": "medium"
                })
                
        # Check marketplace allocation against targets
        marketplace_allocations = {
            "takealot": 0.35,
            "amazon": 0.28,
            "bob_shop": 0.12,
            "makro": 0.12,
            "loot": 0.08,
            "buck_cheap": 0.05
        }
        
        for marketplace, target in marketplace_allocations.items():
            actual = marketplace_usage.get(marketplace, 0) / self.quota_metrics.get("total_usage", 1)
            
            # Check for significant deviation
            if abs(actual - target) > 0.08:
                allocation_optimizations.append({
                    "type": "marketplace_allocation",
                    "marketplace": marketplace,
                    "target_allocation": target,
                    "actual_allocation": actual,
                    "deviation": actual - target,
                    "recommendation": f"{'Increase' if actual < target else 'Decrease'} {marketplace} allocation",
                    "impact": "medium"
                })
                
        # Add optimizations
        for opt in allocation_optimizations:
            if opt["type"] == "priority_allocation":
                priority = opt["priority"]
                deviation = opt["deviation"]
                action = "increase" if deviation < 0 else "decrease"
                
                self.optimizations.append({
                    "type": "quota_allocation",
                    "subtype": "priority",
                    "priority": priority,
                    "target_allocation": opt["target_allocation"],
                    "actual_allocation": opt["actual_allocation"],
                    "recommendation": f"{action.capitalize()} {priority} priority allocation",
                    "impact": "medium",
                    "actions": [
                        f"{action.capitalize()} number of {priority} priority tasks",
                        f"Adjust task priority settings in task scheduler"
                    ]
                })
            elif opt["type"] == "marketplace_allocation":
                marketplace = opt["marketplace"]
                deviation = opt["deviation"]
                action = "increase" if deviation < 0 else "decrease"
                
                self.optimizations.append({
                    "type": "quota_allocation",
                    "subtype": "marketplace",
                    "marketplace": marketplace,
                    "target_allocation": opt["target_allocation"],
                    "actual_allocation": opt["actual_allocation"],
                    "recommendation": f"{action.capitalize()} {marketplace} marketplace allocation",
                    "impact": "medium",
                    "actions": [
                        f"{action.capitalize()} {marketplace} max_daily_requests setting",
                        f"Adjust task frequency for {marketplace} tasks"
                    ]
                })
                
        logger.info(f"Identified {len(allocation_optimizations)} quota allocation optimization opportunities")
    
    def forecast_quota_usage(self):
        """Forecast quota usage for the current month."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for forecasting")
            return
            
        # Get current usage and quota
        current_usage = self.quota_metrics.get("total_usage", 0)
        monthly_quota = self.quota_metrics.get("monthly_quota", 216000)
        daily_quota = self.quota_metrics.get("daily_quota", 7200)
        
        # Get current date and days in month
        now = datetime.now()
        days_in_month = (datetime(now.year, now.month + 1 if now.month < 12 else 1, 1) - 
                         datetime(now.year, now.month, 1)).days
        days_elapsed = now.day
        days_remaining = days_in_month - days_elapsed
        
        # Calculate daily usage rate
        daily_rate = current_usage / max(1, days_elapsed)
        
        # Forecast total usage
        forecasted_usage = current_usage + (daily_rate * days_remaining)
        forecasted_percentage = (forecasted_usage / monthly_quota) * 100
        
        # Determine status
        if forecasted_percentage >= 100:
            status = "critical"
            message = f"Forecasted to exceed monthly quota by {forecasted_percentage - 100:.1f}%"
        elif forecasted_percentage >= 85:
            status = "warning"
            message = f"Forecasted to reach {forecasted_percentage:.1f}% of monthly quota"
        else:
            status = "good"
            message = f"Forecasted to use only {forecasted_percentage:.1f}% of monthly quota"
            
        # Create forecast
        self.forecast = {
            "timestamp": datetime.now().isoformat(),
            "current_usage": current_usage,
            "monthly_quota": monthly_quota,
            "daily_quota": daily_quota,
            "days_in_month": days_in_month,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "daily_usage_rate": daily_rate,
            "forecasted_usage": forecasted_usage,
            "forecasted_percentage": forecasted_percentage,
            "status": status,
            "message": message
        }
        
        # Add optimization if needed
        if status != "good":
            # Calculate required reduction to stay within limits
            if status == "critical":
                target_reduction_pct = ((forecasted_usage - monthly_quota) / forecasted_usage) * 100
                target_reduction = forecasted_usage - monthly_quota
            else:
                target_reduction_pct = ((forecasted_usage - (monthly_quota * 0.85)) / forecasted_usage) * 100
                target_reduction = forecasted_usage - (monthly_quota * 0.85)
                
            self.optimizations.append({
                "type": "quota_forecast",
                "status": status,
                "forecasted_usage": forecasted_usage,
                "forecasted_percentage": forecasted_percentage,
                "target_reduction": int(target_reduction),
                "target_reduction_percentage": target_reduction_pct,
                "recommendation": f"Reduce quota usage by approximately {target_reduction_pct:.1f}% to avoid {status} status",
                "impact": "high" if status == "critical" else "medium",
                "actions": [
                    "Temporarily reduce frequency of LOW priority tasks",
                    "Implement more aggressive batch processing",
                    "Prioritize high-value data collection tasks"
                ]
            })
            
        logger.info(f"Forecasted quota usage: {forecasted_percentage:.1f}% ({status})")
        
        # Save forecast
        with open(f"{self.output_dir}/quota_forecast.json", 'w') as f:
            json.dump(self.forecast, f, indent=2)
    
    def generate_optimization_report(self):
        """Generate optimization report with all recommendations."""
        # Sort optimizations by impact
        impact_order = {"high": 0, "medium": 1, "low": 2}
        self.optimizations.sort(key=lambda x: impact_order.get(x.get("impact", "low"), 3))
        
        # Create report
        report = {
            "timestamp": datetime.now().isoformat(),
            "service_url": self.service_url,
            "quota_metrics": {
                "monthly_quota": self.quota_metrics.get("monthly_quota", 216000),
                "current_usage": self.quota_metrics.get("total_usage", 0),
                "usage_percentage": self.quota_metrics.get("usage_percentage", 0),
                "efficiency_score": self.quota_metrics.get("efficiency_score", 0)
            },
            "forecast": self.forecast,
            "optimization_count": len(self.optimizations),
            "optimizations": self.optimizations,
            "summary": {
                "high_impact": sum(1 for opt in self.optimizations if opt.get("impact") == "high"),
                "medium_impact": sum(1 for opt in self.optimizations if opt.get("impact") == "medium"),
                "low_impact": sum(1 for opt in self.optimizations if opt.get("impact") == "low"),
                "potential_savings": sum(opt.get("potential_savings", 0) for opt in self.optimizations if "potential_savings" in opt),
                "potential_savings_percentage": sum(opt.get("potential_savings", 0) for opt in self.optimizations if "potential_savings" in opt) / 
                                              max(1, self.quota_metrics.get("total_usage", 1)) * 100
            }
        }
        
        # Save report
        report_file = f"{self.output_dir}/optimization_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Generated optimization report with {len(self.optimizations)} recommendations")
        logger.info(f"Report saved to {report_file}")
        
        # Generate markdown report for humans
        markdown_report = f"# SmartProxy Quota Optimization Report\n\n"
        markdown_report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Add quota metrics
        markdown_report += f"## Current Quota Status\n\n"
        markdown_report += f"- Monthly Quota: {report['quota_metrics']['monthly_quota']:,} requests\n"
        markdown_report += f"- Current Usage: {report['quota_metrics']['current_usage']:,} requests ({report['quota_metrics']['usage_percentage']:.1f}%)\n"
        markdown_report += f"- Efficiency Score: {report['quota_metrics']['efficiency_score']:.2f} data points per request\n\n"
        
        # Add forecast
        if self.forecast:
            markdown_report += f"## Quota Forecast\n\n"
            markdown_report += f"- Status: {self.forecast['status'].upper()}\n"
            markdown_report += f"- Message: {self.forecast['message']}\n"
            markdown_report += f"- Forecasted Usage: {self.forecast['forecasted_usage']:,} requests ({self.forecast['forecasted_percentage']:.1f}%)\n"
            markdown_report += f"- Days Remaining: {self.forecast['days_remaining']}\n"
            markdown_report += f"- Daily Usage Rate: {self.forecast['daily_usage_rate']:,.1f} requests/day\n\n"
        
        # Add optimization summary
        markdown_report += f"## Optimization Summary\n\n"
        markdown_report += f"Found {report['optimization_count']} optimization opportunities:\n\n"
        markdown_report += f"- High Impact: {report['summary']['high_impact']}\n"
        markdown_report += f"- Medium Impact: {report['summary']['medium_impact']}\n"
        markdown_report += f"- Low Impact: {report['summary']['low_impact']}\n\n"
        
        if report['summary']['potential_savings'] > 0:
            markdown_report += f"Potential Monthly Savings: {report['summary']['potential_savings']:,} requests "
            markdown_report += f"({report['summary']['potential_savings_percentage']:.1f}% of current usage)\n\n"
        
        # Add recommendations
        markdown_report += f"## Recommendations\n\n"
        
        for i, opt in enumerate(self.optimizations, 1):
            impact_icon = "🔴" if opt.get("impact") == "high" else "🟠" if opt.get("impact") == "medium" else "🟢"
            markdown_report += f"### {i}. {impact_icon} {opt['recommendation']}\n\n"
            
            if "potential_savings" in opt:
                markdown_report += f"**Potential Savings**: {opt['potential_savings']:,} requests\n\n"
                
            markdown_report += f"**Impact**: {opt.get('impact', 'medium').capitalize()}\n\n"
            
            if "actions" in opt:
                markdown_report += f"**Suggested Actions**:\n\n"
                for action in opt["actions"]:
                    markdown_report += f"- {action}\n"
                markdown_report += "\n"
                
            # Add additional details
            if opt["type"] == "marketplace_efficiency":
                markdown_report += f"**Details**: {opt['marketplace']} marketplace has an efficiency score of {opt['current_efficiency']:.2f} "
                markdown_report += f"compared to the average of {opt['average_efficiency']:.2f}.\n\n"
            elif opt["type"] == "task_type_efficiency":
                markdown_report += f"**Details**: {opt['task_type']} tasks have an efficiency score of {opt['current_efficiency']:.2f} "
                markdown_report += f"compared to the average of {opt['average_efficiency']:.2f}.\n\n"
            elif opt["type"] == "job_frequency":
                markdown_report += f"**Details**: {opt['job_name']} currently runs every {opt['current_frequency_hours']} hours. "
                markdown_report += f"Changing to every {opt['suggested_frequency_hours']} hours could save approximately "
                markdown_report += f"{opt['monthly_request_savings']:,} requests per month.\n\n"
                
            markdown_report += "---\n\n"
        
        # Save markdown report
        markdown_file = f"{self.output_dir}/optimization_report.md"
        with open(markdown_file, 'w') as f:
            f.write(markdown_report)
            
        logger.info(f"Generated markdown report at {markdown_file}")
        
        return report
    
    def _estimate_hours_from_cron(self, cron_expression):
        """Estimate hours between runs from a cron expression.
        
        Args:
            cron_expression: Cron expression (e.g., "0 */4 * * *")
            
        Returns:
            Estimated hours between runs
        """
        try:
            parts = cron_expression.split()
            if len(parts) != 5:
                return 24  # Default to daily
                
            minute, hour, day_of_month, month, day_of_week = parts
            
            # Handle common patterns
            if hour.startswith("*/"):
                # Every N hours
                return int(hour[2:])
            elif hour == "*":
                # Every hour
                return 1
            elif hour.isdigit():
                # Once per day at specific hour
                return 24
            elif "," in hour:
                # Multiple specific hours
                hour_count = len(hour.split(","))
                return 24 / hour_count
            else:
                # Fallback
                return 24
        except:
            return 24  # Default to daily
    
    def run_optimization(self):
        """Run all optimization analyses."""
        logger.info("Starting quota efficiency optimization")
        
        # Fetch required data
        if not self.fetch_quota_metrics():
            logger.error("Failed to fetch quota metrics, aborting")
            return False
            
        self.fetch_freshness_metrics()
        self.fetch_scheduler_jobs()
        
        # Run analyses
        self.analyze_marketplace_efficiency()
        self.analyze_task_type_efficiency()
        self.analyze_frequency_optimizations()
        self.analyze_allocation_optimizations()
        self.forecast_quota_usage()
        
        # Generate report
        report = self.generate_optimization_report()
        
        logger.info("Quota efficiency optimization completed")
        return report

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Optimize SmartProxy quota usage efficiency")
    parser.add_argument("--service-url", required=True, help="URL of the marketplace scraper service")
    parser.add_argument("--output-dir", default="./optimizer_output", help="Directory to save optimizer output")
    parser.add_argument("--project-id", default="fluxori-web-app", help="Google Cloud project ID")
    
    args = parser.parse_args()
    
    optimizer = QuotaEfficiencyOptimizer(
        service_url=args.service_url,
        output_dir=args.output_dir,
        project_id=args.project_id
    )
    
    report = optimizer.run_optimization()
    
    if report:
        # Print summary
        print("\nOptimization Summary:")
        print(f"Found {report['optimization_count']} optimization opportunities:")
        print(f"- High Impact: {report['summary']['high_impact']}")
        print(f"- Medium Impact: {report['summary']['medium_impact']}")
        print(f"- Low Impact: {report['summary']['low_impact']}")
        
        if report['summary']['potential_savings'] > 0:
            print(f"Potential Monthly Savings: {report['summary']['potential_savings']:,} requests "
                  f"({report['summary']['potential_savings_percentage']:.1f}% of current usage)")
                  
        print(f"\nDetailed report saved to {args.output_dir}/optimization_report.md")
        sys.exit(0)
    else:
        print("Optimization failed. Check logs for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()