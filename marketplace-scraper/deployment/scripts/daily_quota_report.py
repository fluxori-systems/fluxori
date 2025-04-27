#!/usr/bin/env python3
"""
Daily Quota Usage Report Generator

This script generates a detailed daily report on SmartProxy quota usage,
including marketplace distribution, efficiency metrics, and trends.
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
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import matplotlib.pyplot as plt
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("quota_report.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("quota-report")

class QuotaReportGenerator:
    """Generator for daily quota usage reports."""

    def __init__(self, service_url, output_dir="./reports", recipients=None):
        """Initialize the report generator.
        
        Args:
            service_url: URL of the marketplace scraper service
            output_dir: Directory to save reports
            recipients: List of email recipients for the report
        """
        self.service_url = service_url.rstrip('/')
        self.output_dir = output_dir
        self.recipients = recipients or []
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/charts", exist_ok=True)
        
        # Report data
        self.report_date = datetime.now()
        self.quota_metrics = None
        self.freshness_metrics = None
        self.system_health = None
        self.report_data = None
        
    def fetch_quota_metrics(self):
        """Fetch quota usage metrics from the service."""
        try:
            # Get current day metrics
            response = requests.get(f"{self.service_url}/admin/quota-metrics?days=1")
            if response.status_code != 200:
                logger.error(f"Failed to fetch quota metrics: HTTP {response.status_code}")
                return False
                
            current_metrics = response.json()
            
            # Get last 7 days for trends
            response = requests.get(f"{self.service_url}/admin/quota-metrics?days=7")
            if response.status_code != 200:
                logger.error(f"Failed to fetch 7-day quota metrics: HTTP {response.status_code}")
                return False
                
            trend_metrics = response.json()
                
            # Combine metrics
            self.quota_metrics = {
                "current": current_metrics,
                "trend": trend_metrics
            }
            
            logger.info("Successfully fetched quota metrics")
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
            return True
        except Exception as e:
            logger.error(f"Error fetching freshness metrics: {str(e)}")
            return False
            
    def fetch_system_health(self):
        """Fetch system health metrics from the service."""
        try:
            response = requests.get(f"{self.service_url}/health")
            if response.status_code != 200:
                logger.error(f"Failed to fetch system health: HTTP {response.status_code}")
                return False
                
            self.system_health = response.json()
            logger.info("Successfully fetched system health")
            return True
        except Exception as e:
            logger.error(f"Error fetching system health: {str(e)}")
            return False
    
    def generate_charts(self):
        """Generate charts for the report."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for chart generation")
            return False
            
        try:
            # 1. Generate marketplace usage pie chart
            self._generate_marketplace_usage_chart()
            
            # 2. Generate task type usage pie chart  
            self._generate_task_type_usage_chart()
            
            # 3. Generate 7-day usage trend chart
            self._generate_usage_trend_chart()
            
            # 4. Generate data freshness chart
            if self.freshness_metrics:
                self._generate_freshness_chart()
                
            logger.info("Successfully generated charts for report")
            return True
        except Exception as e:
            logger.error(f"Error generating charts: {str(e)}")
            return False
    
    def _generate_marketplace_usage_chart(self):
        """Generate pie chart for marketplace usage distribution."""
        try:
            plt.figure(figsize=(8, 6))
            
            # Get marketplace usage data
            marketplace_usage = self.quota_metrics["current"].get("usage_by_marketplace", {})
            labels = list(marketplace_usage.keys())
            values = list(marketplace_usage.values())
            
            if not values:
                logger.warning("No marketplace usage data available for chart")
                return
                
            # Generate exploded pie chart
            explode = [0.1 if label == "takealot" else 0 for label in labels]
            colors = plt.cm.Paired(np.arange(len(labels)) / len(labels))
            
            plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90, 
                   explode=explode, colors=colors, shadow=True)
            plt.axis('equal')
            plt.title('Marketplace Usage Distribution')
            
            # Save chart
            chart_path = f"{self.output_dir}/charts/marketplace_usage.png"
            plt.savefig(chart_path, dpi=100, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Generated marketplace usage chart: {chart_path}")
            return chart_path
        except Exception as e:
            logger.error(f"Error generating marketplace usage chart: {str(e)}")
            return None
    
    def _generate_task_type_usage_chart(self):
        """Generate pie chart for task type usage distribution."""
        try:
            plt.figure(figsize=(8, 6))
            
            # Get task type usage data
            task_usage = self.quota_metrics["current"].get("usage_by_task_type", {})
            labels = list(task_usage.keys())
            values = list(task_usage.values())
            
            if not values:
                logger.warning("No task type usage data available for chart")
                return
                
            # Generate pie chart
            colors = plt.cm.Set3(np.arange(len(labels)) / len(labels))
            
            plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90, 
                   colors=colors, shadow=True)
            plt.axis('equal')
            plt.title('Task Type Usage Distribution')
            
            # Save chart
            chart_path = f"{self.output_dir}/charts/task_type_usage.png"
            plt.savefig(chart_path, dpi=100, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Generated task type usage chart: {chart_path}")
            return chart_path
        except Exception as e:
            logger.error(f"Error generating task type usage chart: {str(e)}")
            return None
    
    def _generate_usage_trend_chart(self):
        """Generate line chart for 7-day usage trend."""
        try:
            plt.figure(figsize=(10, 6))
            
            # Get trend data
            daily_usage = self.quota_metrics["trend"].get("daily_usage", [])
            
            if not daily_usage:
                logger.warning("No trend data available for chart")
                return
                
            # Extract dates and values
            dates = [item.get("date") for item in daily_usage]
            values = [item.get("requests") for item in daily_usage]
            percentage = [item.get("percentage") for item in daily_usage]
            
            # Create line chart
            plt.plot(dates, values, marker='o', linestyle='-', linewidth=2)
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.title('Daily Quota Usage - Last 7 Days')
            plt.xlabel('Date')
            plt.ylabel('Requests')
            plt.xticks(rotation=45)
            
            # Add daily quota line
            daily_quota = self.quota_metrics["current"].get("daily_quota", 7200)
            plt.axhline(y=daily_quota, color='r', linestyle='--', alpha=0.7, 
                       label=f'Daily Quota ({daily_quota})')
            
            # Add percentage labels
            for i, (date, value, pct) in enumerate(zip(dates, values, percentage)):
                plt.annotate(f"{pct:.1f}%", (date, value), 
                            textcoords="offset points", xytext=(0,10), ha='center')
            
            plt.legend()
            plt.tight_layout()
            
            # Save chart
            chart_path = f"{self.output_dir}/charts/usage_trend.png"
            plt.savefig(chart_path, dpi=100, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Generated usage trend chart: {chart_path}")
            return chart_path
        except Exception as e:
            logger.error(f"Error generating usage trend chart: {str(e)}")
            return None
    
    def _generate_freshness_chart(self):
        """Generate bar chart for data freshness by marketplace."""
        try:
            plt.figure(figsize=(10, 6))
            
            # Get freshness data
            marketplace_refresh = self.freshness_metrics.get("refresh_rates", {})
            
            if not marketplace_refresh:
                logger.warning("No freshness data available for chart")
                return
                
            # Extract marketplaces and values
            marketplaces = list(marketplace_refresh.keys())
            avg_hours = [marketplace_refresh[m].get("average_hours", 0) for m in marketplaces]
            
            # Create bar chart
            bars = plt.bar(marketplaces, avg_hours, color=plt.cm.viridis(np.arange(len(marketplaces)) / len(marketplaces)))
            plt.grid(True, linestyle='--', alpha=0.3, axis='y')
            plt.title('Average Data Freshness by Marketplace')
            plt.xlabel('Marketplace')
            plt.ylabel('Average Age (Hours)')
            plt.xticks(rotation=45)
            
            # Add value labels
            for bar in bars:
                height = bar.get_height()
                plt.annotate(f"{height:.1f}h", xy=(bar.get_x() + bar.get_width()/2, height),
                            xytext=(0, 3), textcoords="offset points", ha='center', va='bottom')
            
            plt.tight_layout()
            
            # Save chart
            chart_path = f"{self.output_dir}/charts/freshness.png"
            plt.savefig(chart_path, dpi=100, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Generated freshness chart: {chart_path}")
            return chart_path
        except Exception as e:
            logger.error(f"Error generating freshness chart: {str(e)}")
            return None
    
    def generate_report(self):
        """Generate the daily quota report."""
        if not self.quota_metrics:
            logger.error("No quota metrics available for report generation")
            return False
            
        try:
            # Create report data structure
            current_metrics = self.quota_metrics["current"]
            
            self.report_data = {
                "report_date": self.report_date.strftime("%Y-%m-%d"),
                "generated_at": datetime.now().isoformat(),
                "service_url": self.service_url,
                "quota_summary": {
                    "monthly_quota": current_metrics.get("monthly_quota", 216000),
                    "daily_quota": current_metrics.get("daily_quota", 7200),
                    "current_usage": current_metrics.get("total_usage", 0),
                    "usage_percentage": current_metrics.get("usage_percentage", 0),
                    "usage_trend": self._calculate_usage_trend(),
                    "daily_usage": current_metrics.get("daily_usage", 0),
                    "daily_percentage": current_metrics.get("daily_percentage", 0),
                    "efficiency_score": current_metrics.get("efficiency_score", 0)
                },
                "marketplace_usage": current_metrics.get("usage_by_marketplace", {}),
                "task_type_usage": current_metrics.get("usage_by_task_type", {}),
                "priority_usage": current_metrics.get("usage_by_priority", {}),
                "forecast": self._calculate_forecast(),
                "data_freshness": self.freshness_metrics if self.freshness_metrics else {},
                "system_health": self._summarize_system_health(),
                "charts": {
                    "marketplace_usage": "charts/marketplace_usage.png",
                    "task_type_usage": "charts/task_type_usage.png",
                    "usage_trend": "charts/usage_trend.png",
                    "freshness": "charts/freshness.png" if self.freshness_metrics else None
                }
            }
            
            # Save report as JSON
            report_file = f"{self.output_dir}/quota_report_{self.report_date.strftime('%Y%m%d')}.json"
            with open(report_file, 'w') as f:
                json.dump(self.report_data, f, indent=2)
                
            logger.info(f"Generated quota report: {report_file}")
            
            # Generate HTML report
            self._generate_html_report()
            
            return True
        except Exception as e:
            logger.error(f"Error generating quota report: {str(e)}")
            return False
    
    def _calculate_usage_trend(self):
        """Calculate usage trend compared to previous days."""
        try:
            # Get daily usage for last 7 days
            daily_usage = self.quota_metrics["trend"].get("daily_usage", [])
            
            if len(daily_usage) < 2:
                return {
                    "status": "unknown",
                    "change": 0,
                    "change_percent": 0
                }
                
            # Get latest and previous day
            latest = daily_usage[-1].get("requests", 0)
            previous = daily_usage[-2].get("requests", 0)
            
            # Calculate change
            change = latest - previous
            change_percent = (change / previous * 100) if previous > 0 else 0
            
            # Determine trend status
            if change_percent > 10:
                status = "increasing"
            elif change_percent < -10:
                status = "decreasing"
            else:
                status = "stable"
                
            return {
                "status": status,
                "change": change,
                "change_percent": change_percent
            }
        except Exception as e:
            logger.error(f"Error calculating usage trend: {str(e)}")
            return {
                "status": "unknown",
                "change": 0,
                "change_percent": 0
            }
    
    def _calculate_forecast(self):
        """Calculate forecast for the current month."""
        try:
            current_metrics = self.quota_metrics["current"]
            
            # Get current usage and quota
            current_usage = current_metrics.get("total_usage", 0)
            monthly_quota = current_metrics.get("monthly_quota", 216000)
            
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
                
            return {
                "daily_rate": daily_rate,
                "days_remaining": days_remaining,
                "forecasted_usage": forecasted_usage,
                "forecasted_percentage": forecasted_percentage,
                "status": status,
                "message": message
            }
        except Exception as e:
            logger.error(f"Error calculating forecast: {str(e)}")
            return {
                "status": "unknown",
                "message": "Unable to calculate forecast"
            }
    
    def _summarize_system_health(self):
        """Summarize system health metrics."""
        if not self.system_health:
            return {
                "status": "unknown",
                "message": "No health data available"
            }
            
        try:
            status = self.system_health.get("status", "unknown").lower()
            error_rate = self.system_health.get("error_rate", 0)
            queue_size = self.system_health.get("task_queue_size", 0)
            load_shedding = self.system_health.get("load_shedding_active", False)
            
            # Determine overall health
            if status != "ok" and status != "healthy":
                health_status = "unhealthy"
                message = f"System status: {status}"
            elif error_rate > 0.1:
                health_status = "degraded"
                message = f"High error rate: {error_rate:.2%}"
            elif load_shedding:
                health_status = "degraded"
                message = "Load shedding is active"
            elif queue_size > 1000:
                health_status = "warning"
                message = f"Large task queue size: {queue_size}"
            else:
                health_status = "healthy"
                message = "System is operating normally"
                
            return {
                "status": health_status,
                "message": message,
                "error_rate": error_rate,
                "queue_size": queue_size,
                "load_shedding": load_shedding
            }
        except Exception as e:
            logger.error(f"Error summarizing system health: {str(e)}")
            return {
                "status": "unknown",
                "message": "Error processing health data"
            }
    
    def _generate_html_report(self):
        """Generate HTML report from report data."""
        if not self.report_data:
            logger.error("No report data available for HTML generation")
            return
            
        try:
            # Start HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Daily Quota Report - {self.report_data['report_date']}</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 1000px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    h1, h2, h3 {{
                        color: #2c3e50;
                    }}
                    h1 {{
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }}
                    .report-header {{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }}
                    .report-date {{
                        color: #7f8c8d;
                        font-size: 1.1em;
                    }}
                    .summary-box {{
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .metrics-grid {{
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }}
                    .metric-card {{
                        background-color: #fff;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 15px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }}
                    .metric-value {{
                        font-size: 24px;
                        font-weight: bold;
                        margin: 10px 0;
                        color: #2980b9;
                    }}
                    .metric-label {{
                        color: #7f8c8d;
                        font-size: 14px;
                    }}
                    .chart-container {{
                        margin: 30px 0;
                        text-align: center;
                    }}
                    .chart-grid {{
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                    }}
                    .status-indicator {{
                        display: inline-block;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }}
                    .status-good {{
                        background-color: #2ecc71;
                    }}
                    .status-warning {{
                        background-color: #f39c12;
                    }}
                    .status-critical {{
                        background-color: #e74c3c;
                    }}
                    .status-unknown {{
                        background-color: #95a5a6;
                    }}
                    .trend-up {{
                        color: #e74c3c;
                    }}
                    .trend-down {{
                        color: #2ecc71;
                    }}
                    .trend-stable {{
                        color: #3498db;
                    }}
                    table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }}
                    th, td {{
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #f2f2f2;
                    }}
                    tr:nth-child(even) {{
                        background-color: #f9f9f9;
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        font-size: 0.9em;
                        color: #7f8c8d;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>SmartProxy Quota Usage Report</h1>
                    <div class="report-date">{self.report_data['report_date']}</div>
                </div>
            """
            
            # Quota Summary Section
            quota_summary = self.report_data['quota_summary']
            forecast = self.report_data['forecast']
            
            forecast_status_class = "status-good" if forecast['status'] == "good" else "status-warning" if forecast['status'] == "warning" else "status-critical"
            trend_status = quota_summary['usage_trend']['status']
            trend_class = "trend-up" if trend_status == "increasing" else "trend-down" if trend_status == "decreasing" else "trend-stable"
            
            html_content += f"""
                <div class="summary-box">
                    <h2>Quota Status Summary</h2>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-label">Monthly Usage</div>
                            <div class="metric-value">{quota_summary['usage_percentage']:.1f}%</div>
                            <div>{quota_summary['current_usage']:,} / {quota_summary['monthly_quota']:,}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Daily Usage</div>
                            <div class="metric-value">{quota_summary['daily_percentage']:.1f}%</div>
                            <div>{quota_summary['daily_usage']:,} / {quota_summary['daily_quota']:,}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Usage Trend</div>
                            <div class="metric-value {trend_class}">{trend_status.capitalize()}</div>
                            <div>{quota_summary['usage_trend']['change_percent']:.1f}% change</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Efficiency Score</div>
                            <div class="metric-value">{quota_summary['efficiency_score']:.2f}</div>
                            <div>data points per request</div>
                        </div>
                    </div>
                </div>
                
                <div class="summary-box">
                    <h2>Monthly Forecast</h2>
                    <p><span class="status-indicator {forecast_status_class}"></span> <strong>{forecast['status'].capitalize()}:</strong> {forecast['message']}</p>
                    <p>Current daily usage rate: <strong>{forecast['daily_rate']:.1f}</strong> requests/day</p>
                    <p>Days remaining in month: <strong>{forecast['days_remaining']}</strong></p>
                    <p>Forecasted end-of-month usage: <strong>{forecast['forecasted_usage']:,}</strong> requests (<strong>{forecast['forecasted_percentage']:.1f}%</strong> of quota)</p>
                </div>
            """
            
            # System Health Section
            health = self.report_data['system_health']
            health_class = "status-good" if health['status'] == "healthy" else "status-warning" if health['status'] == "warning" else "status-critical"
            
            html_content += f"""
                <div class="summary-box">
                    <h2>System Health</h2>
                    <p><span class="status-indicator {health_class}"></span> <strong>{health['status'].capitalize()}:</strong> {health['message']}</p>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-label">Error Rate</div>
                            <div class="metric-value">{health['error_rate']*100:.1f}%</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Task Queue Size</div>
                            <div class="metric-value">{health['queue_size']}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Load Shedding</div>
                            <div class="metric-value">{"Active" if health['load_shedding'] else "Inactive"}</div>
                        </div>
                    </div>
                </div>
            """
            
            # Charts Section
            html_content += f"""
                <h2>Usage Distribution</h2>
                <div class="chart-grid">
                    <div class="chart-container">
                        <h3>Marketplace Usage</h3>
                        <img src="{self.report_data['charts']['marketplace_usage']}" alt="Marketplace Usage" style="max-width:100%;">
                    </div>
                    <div class="chart-container">
                        <h3>Task Type Usage</h3>
                        <img src="{self.report_data['charts']['task_type_usage']}" alt="Task Type Usage" style="max-width:100%;">
                    </div>
                </div>
                
                <div class="chart-grid">
                    <div class="chart-container">
                        <h3>7-Day Usage Trend</h3>
                        <img src="{self.report_data['charts']['usage_trend']}" alt="Usage Trend" style="max-width:100%;">
                    </div>
            """
            
            if self.report_data['charts']['freshness']:
                html_content += f"""
                    <div class="chart-container">
                        <h3>Data Freshness</h3>
                        <img src="{self.report_data['charts']['freshness']}" alt="Data Freshness" style="max-width:100%;">
                    </div>
                """
                
            html_content += "</div>"
            
            # Detailed Tables Section
            html_content += """
                <h2>Detailed Usage Breakdown</h2>
                
                <h3>Marketplace Usage</h3>
                <table>
                    <tr>
                        <th>Marketplace</th>
                        <th>Requests</th>
                        <th>Percentage</th>
                    </tr>
            """
            
            # Add marketplace usage rows
            marketplace_usage = self.report_data['marketplace_usage']
            total_marketplace = sum(marketplace_usage.values())
            
            for marketplace, usage in sorted(marketplace_usage.items(), key=lambda x: x[1], reverse=True):
                percentage = (usage / total_marketplace * 100) if total_marketplace > 0 else 0
                html_content += f"""
                    <tr>
                        <td>{marketplace}</td>
                        <td>{usage:,}</td>
                        <td>{percentage:.1f}%</td>
                    </tr>
                """
                
            html_content += "</table>"
            
            # Add task type usage table
            html_content += """
                <h3>Task Type Usage</h3>
                <table>
                    <tr>
                        <th>Task Type</th>
                        <th>Requests</th>
                        <th>Percentage</th>
                    </tr>
            """
            
            task_usage = self.report_data['task_type_usage']
            total_tasks = sum(task_usage.values())
            
            for task, usage in sorted(task_usage.items(), key=lambda x: x[1], reverse=True):
                percentage = (usage / total_tasks * 100) if total_tasks > 0 else 0
                html_content += f"""
                    <tr>
                        <td>{task}</td>
                        <td>{usage:,}</td>
                        <td>{percentage:.1f}%</td>
                    </tr>
                """
                
            html_content += "</table>"
            
            # Add priority usage table
            html_content += """
                <h3>Priority Usage</h3>
                <table>
                    <tr>
                        <th>Priority</th>
                        <th>Requests</th>
                        <th>Percentage</th>
                    </tr>
            """
            
            priority_usage = self.report_data['priority_usage']
            total_priority = sum(priority_usage.values())
            
            # Define priority order
            priority_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "BACKGROUND"]
            
            for priority in priority_order:
                if priority in priority_usage:
                    usage = priority_usage[priority]
                    percentage = (usage / total_priority * 100) if total_priority > 0 else 0
                    html_content += f"""
                        <tr>
                            <td>{priority}</td>
                            <td>{usage:,}</td>
                            <td>{percentage:.1f}%</td>
                        </tr>
                    """
                    
            html_content += "</table>"
            
            # Add data freshness table if available
            if self.freshness_metrics:
                html_content += """
                    <h3>Data Freshness</h3>
                    <table>
                        <tr>
                            <th>Marketplace</th>
                            <th>Average Age (Hours)</th>
                            <th>Minimum Age (Hours)</th>
                            <th>Maximum Age (Hours)</th>
                        </tr>
                """
                
                marketplace_refresh = self.freshness_metrics.get("refresh_rates", {})
                
                for marketplace, metrics in sorted(marketplace_refresh.items()):
                    avg_hours = metrics.get("average_hours", 0)
                    min_hours = metrics.get("min_hours", 0)
                    max_hours = metrics.get("max_hours", 0)
                    
                    html_content += f"""
                        <tr>
                            <td>{marketplace}</td>
                            <td>{avg_hours:.1f}</td>
                            <td>{min_hours:.1f}</td>
                            <td>{max_hours:.1f}</td>
                        </tr>
                    """
                    
                html_content += "</table>"
            
            # Close HTML
            html_content += f"""
                <div class="footer">
                    <p>Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} • Service URL: {self.service_url}</p>
                </div>
            </body>
            </html>
            """
            
            # Save HTML report
            html_file = f"{self.output_dir}/quota_report_{self.report_date.strftime('%Y%m%d')}.html"
            with open(html_file, 'w') as f:
                f.write(html_content)
                
            logger.info(f"Generated HTML report: {html_file}")
            return html_file
        except Exception as e:
            logger.error(f"Error generating HTML report: {str(e)}")
            return None
    
    def email_report(self):
        """Email the report to recipients."""
        if not self.recipients:
            logger.info("No recipients specified, skipping email")
            return False
            
        if not self.report_data:
            logger.error("No report data available for email")
            return False
            
        try:
            # Get HTML report path
            html_file = f"{self.output_dir}/quota_report_{self.report_date.strftime('%Y%m%d')}.html"
            
            if not os.path.exists(html_file):
                logger.error(f"HTML report not found: {html_file}")
                return False
                
            # Use service for sending email
            notification = {
                "subject": f"SmartProxy Quota Report - {self.report_date.strftime('%Y-%m-%d')}",
                "message": "See attached HTML report for details.",
                "email": ",".join(self.recipients),
                "html_file": html_file
            }
            
            response = requests.post(
                f"{self.service_url}/admin/notify",
                json=notification
            )
            
            if response.status_code == 200:
                logger.info(f"Sent report to {len(self.recipients)} recipients")
                return True
            else:
                logger.error(f"Failed to send email: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email report: {str(e)}")
            return False
    
    def run(self):
        """Run the report generation process."""
        logger.info(f"Starting quota report generation for {self.report_date.strftime('%Y-%m-%d')}")
        
        # Fetch required data
        if not self.fetch_quota_metrics():
            logger.error("Failed to fetch quota metrics, aborting")
            return False
            
        self.fetch_freshness_metrics()
        self.fetch_system_health()
        
        # Generate charts
        self.generate_charts()
        
        # Generate report
        if not self.generate_report():
            logger.error("Failed to generate report, aborting")
            return False
            
        # Send email if recipients specified
        if self.recipients:
            self.email_report()
            
        logger.info("Quota report generation completed")
        return True

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Generate daily SmartProxy quota usage report")
    parser.add_argument("--service-url", required=True, help="URL of the marketplace scraper service")
    parser.add_argument("--output-dir", default="./reports", help="Directory to save reports")
    parser.add_argument("--email", help="Comma-separated list of email recipients")
    
    args = parser.parse_args()
    
    # Parse email recipients
    recipients = args.email.split(",") if args.email else []
    
    generator = QuotaReportGenerator(
        service_url=args.service_url,
        output_dir=args.output_dir,
        recipients=recipients
    )
    
    success = generator.run()
    
    if success:
        print(f"Report generated successfully at {args.output_dir}")
        sys.exit(0)
    else:
        print("Report generation failed. Check logs for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()