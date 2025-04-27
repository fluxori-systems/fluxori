#!/usr/bin/env python3
"""
Quota Upgrade Validation Script

This script validates the SmartProxy quota upgrade implementation by:
1. Checking that service configuration matches expected quota values
2. Validating quota usage patterns against expected allocations
3. Verifying data freshness improvements
4. Testing scheduler job configuration
5. Monitoring alert policy configuration
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("quota_validation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("quota-validator")

# Constants
EXPECTED_MONTHLY_QUOTA = 216000
EXPECTED_DAILY_QUOTA = 7200
EXPECTED_WARNING_THRESHOLD = 0.85
EXPECTED_EMERGENCY_THRESHOLD = 0.97

class QuotaValidator:
    """Validator for SmartProxy quota upgrade implementation."""

    def __init__(self, service_url, notify_email=None, project_id="fluxori-web-app"):
        """Initialize the validator.
        
        Args:
            service_url: URL of the marketplace scraper service
            notify_email: Email to send validation reports to
            project_id: Google Cloud project ID
        """
        self.service_url = service_url.rstrip('/')
        self.notify_email = notify_email
        self.project_id = project_id
        self.validation_results = {
            "timestamp": datetime.now().isoformat(),
            "service_url": service_url,
            "tests": [],
            "passed": 0,
            "failed": 0,
            "warnings": 0,
            "overall_status": "pending"
        }
        
    def validate_service_config(self):
        """Validate that the service configuration has correct quota values."""
        test_name = "Service Configuration Validation"
        try:
            # Get current quota settings
            response = requests.get(f"{self.service_url}/quota")
            if response.status_code != 200:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get quota settings: HTTP {response.status_code}")
                return
                
            quota_data = response.json()
            
            # Validate monthly quota
            monthly_quota = quota_data.get("monthly_quota", {}).get("total_quota", 0)
            if monthly_quota != EXPECTED_MONTHLY_QUOTA:
                self._add_test_result(test_name, "failed", 
                    f"Monthly quota mismatch: {monthly_quota} != {EXPECTED_MONTHLY_QUOTA}")
                return
                
            # Validate daily quota
            daily_quota = quota_data.get("daily_quota", {}).get("total_quota", 0)
            if daily_quota != EXPECTED_DAILY_QUOTA:
                self._add_test_result(test_name, "failed", 
                    f"Daily quota mismatch: {daily_quota} != {EXPECTED_DAILY_QUOTA}")
                return
                
            # Validate thresholds
            thresholds = quota_data.get("thresholds", {})
            warning = thresholds.get("warning", 0)
            emergency = thresholds.get("emergency", 0)
            
            if abs(warning - EXPECTED_WARNING_THRESHOLD) > 0.01:
                self._add_test_result(test_name, "failed", 
                    f"Warning threshold mismatch: {warning} != {EXPECTED_WARNING_THRESHOLD}")
                return
                
            if abs(emergency - EXPECTED_EMERGENCY_THRESHOLD) > 0.01:
                self._add_test_result(test_name, "failed", 
                    f"Emergency threshold mismatch: {emergency} != {EXPECTED_EMERGENCY_THRESHOLD}")
                return
                
            # Validate priority allocations
            priority_usage = quota_data.get("priority_usage", {})
            critical_allocation = priority_usage.get("CRITICAL", {}).get("allocation", 0)
            high_allocation = priority_usage.get("HIGH", {}).get("allocation", 0)
            
            if abs(critical_allocation - 0.35) > 0.01:
                self._add_test_result(test_name, "warning", 
                    f"CRITICAL priority allocation unexpected: {critical_allocation} != 0.35")
            
            if abs(high_allocation - 0.35) > 0.01:
                self._add_test_result(test_name, "warning", 
                    f"HIGH priority allocation unexpected: {high_allocation} != 0.35")
                
            # All checks passed
            self._add_test_result(test_name, "passed", 
                "Service configuration has correct quota values")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating service configuration: {str(e)}")
            
    def validate_scheduler_jobs(self):
        """Validate Cloud Scheduler job configuration."""
        test_name = "Scheduler Jobs Validation"
        try:
            # Get scheduler jobs from Cloud
            result = subprocess.run(
                ["gcloud", "scheduler", "jobs", "list", "--format=json"],
                capture_output=True, text=True, check=True
            )
            
            if result.returncode != 0:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get scheduler jobs: {result.stderr}")
                return
                
            jobs = json.loads(result.stdout)
            
            # Check if we have the expected number of jobs
            if len(jobs) < 20:  # We expect at least 20 jobs based on jobs.yaml
                self._add_test_result(test_name, "warning", 
                    f"Found fewer scheduler jobs than expected: {len(jobs)} < 20")
            
            # Check for required job types
            job_types = set()
            marketplace_jobs = {
                "takealot": 0,
                "amazon": 0,
                "bob_shop": 0,
                "makro": 0,
                "loot": 0,
                "buck_cheap": 0
            }
            
            for job in jobs:
                # Check job body for task_type
                body = job.get("httpTarget", {}).get("body", "{}")
                if not body:
                    continue
                    
                try:
                    job_data = json.loads(body)
                    task_type = job_data.get("task_type", "")
                    marketplace = job_data.get("marketplace", "")
                    
                    if task_type:
                        job_types.add(task_type)
                        
                    if marketplace in marketplace_jobs:
                        marketplace_jobs[marketplace] += 1
                except:
                    pass
            
            # Validate we have all required task types
            required_types = {
                "extract_daily_deals", "track_keyword_ranking", 
                "product_details", "category_scanning", "opportunity_scoring"
            }
            
            missing_types = required_types - job_types
            if missing_types:
                self._add_test_result(test_name, "failed", 
                    f"Missing required task types in scheduler jobs: {missing_types}")
                return
                
            # Validate we have jobs for all marketplaces
            for marketplace, count in marketplace_jobs.items():
                if count == 0:
                    self._add_test_result(test_name, "failed", 
                        f"No scheduler jobs found for marketplace: {marketplace}")
                    return
            
            # Check if validation job exists
            validation_job_exists = any("validate-quota" in job.get("name", "") for job in jobs)
            if not validation_job_exists:
                self._add_test_result(test_name, "warning", 
                    "Quota validation scheduler job not found")
            
            # All checks passed
            self._add_test_result(test_name, "passed", 
                f"Found {len(jobs)} scheduler jobs with all required task types and marketplaces")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating scheduler jobs: {str(e)}")
    
    def validate_alert_policies(self):
        """Validate monitoring alert policies configuration."""
        test_name = "Alert Policies Validation"
        try:
            # Get alert policies from Cloud
            result = subprocess.run(
                ["gcloud", "monitoring", "policies", "list", "--format=json"],
                capture_output=True, text=True, check=True
            )
            
            if result.returncode != 0:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get alert policies: {result.stderr}")
                return
                
            policies = json.loads(result.stdout)
            
            # Required alert policy names
            required_policies = {
                "quota_alert", "critical_quota_alert", "daily_quota_alert",
                "efficiency_alert", "opportunity_alert"
            }
            
            # Check for required policies by display name
            found_policies = set()
            for policy in policies:
                display_name = policy.get("displayName", "").lower()
                
                for required in required_policies:
                    if required.replace("_", " ") in display_name:
                        found_policies.add(required)
            
            # Validate we have all required policies
            missing_policies = required_policies - found_policies
            if missing_policies:
                self._add_test_result(test_name, "failed", 
                    f"Missing required alert policies: {missing_policies}")
                return
                
            # Check quota alert threshold values
            for policy in policies:
                display_name = policy.get("displayName", "").lower()
                
                # Check quota alert thresholds
                if "quota usage" in display_name and "high" in display_name:
                    conditions = policy.get("conditions", [])
                    for condition in conditions:
                        threshold = condition.get("conditionThreshold", {})
                        threshold_value = threshold.get("thresholdValue", 0)
                        
                        # Expecting around 85% for warning
                        if abs(threshold_value - 85.0) > 5.0:
                            self._add_test_result(test_name, "warning", 
                                f"Unexpected threshold value for quota alert: {threshold_value}")
                
                # Check critical quota alert thresholds
                if "quota usage" in display_name and "critical" in display_name:
                    conditions = policy.get("conditions", [])
                    for condition in conditions:
                        threshold = condition.get("conditionThreshold", {})
                        threshold_value = threshold.get("thresholdValue", 0)
                        
                        # Expecting around 97% for critical
                        if abs(threshold_value - 97.0) > 5.0:
                            self._add_test_result(test_name, "warning", 
                                f"Unexpected threshold value for critical quota alert: {threshold_value}")
            
            # All checks passed
            self._add_test_result(test_name, "passed", 
                f"Found all required alert policies with appropriate thresholds")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating alert policies: {str(e)}")
    
    def validate_quota_usage(self):
        """Validate quota usage patterns against expected allocations."""
        test_name = "Quota Usage Validation"
        try:
            # Get quota usage metrics
            response = requests.get(f"{self.service_url}/admin/quota-metrics")
            if response.status_code != 200:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get quota metrics: HTTP {response.status_code}")
                return
                
            metrics = response.json()
            
            # Validate marketplace allocation
            marketplace_usage = metrics.get("usage_by_marketplace", {})
            if not marketplace_usage:
                self._add_test_result(test_name, "warning", 
                    "No marketplace usage data available")
            else:
                # Check takealot has highest allocation
                takealot_usage = marketplace_usage.get("takealot", 0)
                amazon_usage = marketplace_usage.get("amazon", 0)
                
                if takealot_usage < amazon_usage:
                    self._add_test_result(test_name, "warning", 
                        f"Unexpected usage pattern: Takealot ({takealot_usage}) < Amazon ({amazon_usage})")
                
                # Check all marketplaces have some allocation
                for marketplace in ["takealot", "amazon", "bob_shop", "makro", "loot"]:
                    if marketplace not in marketplace_usage:
                        self._add_test_result(test_name, "warning", 
                            f"No usage data for marketplace: {marketplace}")
            
            # Validate task type allocation
            task_usage = metrics.get("usage_by_task_type", {})
            if not task_usage:
                self._add_test_result(test_name, "warning", 
                    "No task type usage data available")
            else:
                # Check if we have usage for key task types
                for task_type in ["keyword_ranking", "product_details", "daily_deals"]:
                    if task_type not in task_usage:
                        self._add_test_result(test_name, "warning", 
                            f"No usage data for task type: {task_type}")
            
            # Validate efficiency
            efficiency = metrics.get("efficiency_score", 0)
            if efficiency < 5.0:  # Expecting at least 5 data points per request
                self._add_test_result(test_name, "warning", 
                    f"Low quota efficiency score: {efficiency}")
            
            # All checks passed
            self._add_test_result(test_name, "passed", 
                "Quota usage patterns align with expected allocations")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating quota usage: {str(e)}")
    
    def validate_data_freshness(self):
        """Validate data freshness improvements."""
        test_name = "Data Freshness Validation"
        try:
            # Get data freshness metrics
            response = requests.get(f"{self.service_url}/admin/data-freshness")
            if response.status_code != 200:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get data freshness metrics: HTTP {response.status_code}")
                return
                
            metrics = response.json()
            
            # Validate average data age
            avg_age = metrics.get("average_age_hours", 0)
            if avg_age > 24.0:  # Expecting less than 24 hours average age
                self._add_test_result(test_name, "warning", 
                    f"Average data age higher than expected: {avg_age} hours")
            
            # Validate marketplace refresh rates
            marketplace_refresh = metrics.get("refresh_rates", {})
            if not marketplace_refresh:
                self._add_test_result(test_name, "warning", 
                    "No marketplace refresh rate data available")
            else:
                # Check takealot refresh rate (expecting <= 12 hours)
                takealot_refresh = marketplace_refresh.get("takealot", {}).get("average_hours", 0)
                if takealot_refresh > 12.0:
                    self._add_test_result(test_name, "warning", 
                        f"Takealot refresh rate higher than expected: {takealot_refresh} hours")
                
                # Check daily deals refresh rate (expecting <= 6 hours)
                deals_refresh = metrics.get("task_types", {}).get("daily_deals", {}).get("average_hours", 0)
                if deals_refresh > 6.0:
                    self._add_test_result(test_name, "warning", 
                        f"Daily deals refresh rate higher than expected: {deals_refresh} hours")
            
            # All checks passed
            self._add_test_result(test_name, "passed", 
                "Data freshness metrics indicate improved refresh rates")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating data freshness: {str(e)}")
                
    def validate_system_health(self):
        """Validate system health with the new quota settings."""
        test_name = "System Health Validation"
        try:
            # Get system health metrics
            response = requests.get(f"{self.service_url}/health")
            if response.status_code != 200:
                self._add_test_result(test_name, "failed", 
                    f"Failed to get system health: HTTP {response.status_code}")
                return
                
            health = response.json()
            
            # Check overall status
            status = health.get("status", "").lower()
            if status != "ok" and status != "healthy":
                self._add_test_result(test_name, "failed", 
                    f"System health status not OK: {status}")
                return
            
            # Check for error rates
            error_rate = health.get("error_rate", 0)
            if error_rate > 0.1:  # 10% error rate threshold
                self._add_test_result(test_name, "warning", 
                    f"High error rate: {error_rate:.2%}")
            
            # Check for task queue size
            queue_size = health.get("task_queue_size", 0)
            if queue_size > 1000:  # Large queue may indicate processing issues
                self._add_test_result(test_name, "warning", 
                    f"Large task queue size: {queue_size}")
            
            # Check for load shedding
            load_shedding = health.get("load_shedding_active", False)
            if load_shedding:
                self._add_test_result(test_name, "warning", 
                    "Load shedding is currently active")
            
            # All checks passed
            self._add_test_result(test_name, "passed", 
                "System health is good with new quota settings")
                
        except Exception as e:
            self._add_test_result(test_name, "failed", 
                f"Error validating system health: {str(e)}")
    
    def run_all_validations(self):
        """Run all validation tests."""
        logger.info("Starting quota upgrade validation")
        
        # Run all validation tests
        self.validate_service_config()
        self.validate_scheduler_jobs()
        self.validate_alert_policies()
        self.validate_quota_usage()
        self.validate_data_freshness()
        self.validate_system_health()
        
        # Calculate overall status
        if self.validation_results["failed"] > 0:
            self.validation_results["overall_status"] = "failed"
        elif self.validation_results["warnings"] > 0:
            self.validation_results["overall_status"] = "warning"
        else:
            self.validation_results["overall_status"] = "passed"
        
        # Log summary
        logger.info(f"Validation complete: {self.validation_results['overall_status']}")
        logger.info(f"Passed: {self.validation_results['passed']}")
        logger.info(f"Failed: {self.validation_results['failed']}")
        logger.info(f"Warnings: {self.validation_results['warnings']}")
        
        # Send email notification if requested
        if self.notify_email:
            self._send_validation_report()
        
        return self.validation_results
        
    def _add_test_result(self, test_name, status, message):
        """Add a test result to the validation results.
        
        Args:
            test_name: Name of the test
            status: Test status (passed, failed, warning)
            message: Test message
        """
        self.validation_results["tests"].append({
            "name": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        if status == "passed":
            self.validation_results["passed"] += 1
            logger.info(f"PASS: {test_name} - {message}")
        elif status == "failed":
            self.validation_results["failed"] += 1
            logger.error(f"FAIL: {test_name} - {message}")
        elif status == "warning":
            self.validation_results["warnings"] += 1
            logger.warning(f"WARN: {test_name} - {message}")
    
    def _send_validation_report(self):
        """Send validation report via email."""
        if not self.notify_email:
            return
            
        try:
            # Create report message
            status_icon = "✅" if self.validation_results["overall_status"] == "passed" else "⚠️" if self.validation_results["overall_status"] == "warning" else "❌"
            
            subject = f"{status_icon} Quota Upgrade Validation Report - {self.validation_results['overall_status'].upper()}"
            
            body = f"Quota Upgrade Validation Report\n\n"
            body += f"Status: {self.validation_results['overall_status'].upper()}\n"
            body += f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            body += f"Service: {self.service_url}\n\n"
            body += f"Summary:\n"
            body += f"- Passed: {self.validation_results['passed']}\n"
            body += f"- Failed: {self.validation_results['failed']}\n"
            body += f"- Warnings: {self.validation_results['warnings']}\n\n"
            
            body += f"Test Results:\n"
            for test in self.validation_results["tests"]:
                test_icon = "✅" if test["status"] == "passed" else "⚠️" if test["status"] == "warning" else "❌"
                body += f"{test_icon} {test['name']}: {test['message']}\n"
            
            # Send email via service
            notification = {
                "subject": subject,
                "message": body,
                "email": self.notify_email
            }
            
            response = requests.post(
                f"{self.service_url}/admin/notify",
                json=notification
            )
            
            if response.status_code == 200:
                logger.info(f"Validation report sent to {self.notify_email}")
            else:
                logger.error(f"Failed to send validation report: HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error sending validation report: {str(e)}")
            
    def save_report(self, output_file=None):
        """Save validation report to a file.
        
        Args:
            output_file: Path to output file (default: quota_validation_report.json)
        """
        if not output_file:
            output_file = f"quota_validation_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
            
        try:
            with open(output_file, 'w') as f:
                json.dump(self.validation_results, f, indent=2)
                
            logger.info(f"Validation report saved to {output_file}")
            return output_file
        except Exception as e:
            logger.error(f"Error saving validation report: {str(e)}")
            return None

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Validate SmartProxy quota upgrade implementation")
    parser.add_argument("--service-url", required=True, help="URL of the marketplace scraper service")
    parser.add_argument("--notify-email", help="Email to send validation report to")
    parser.add_argument("--output-file", help="Path to save validation report")
    parser.add_argument("--project-id", default="fluxori-web-app", help="Google Cloud project ID")
    
    args = parser.parse_args()
    
    validator = QuotaValidator(
        service_url=args.service_url,
        notify_email=args.notify_email,
        project_id=args.project_id
    )
    
    validation_results = validator.run_all_validations()
    
    if args.output_file:
        validator.save_report(args.output_file)
    else:
        validator.save_report()
    
    # Exit with status code based on validation results
    if validation_results["overall_status"] == "failed":
        sys.exit(1)
    elif validation_results["overall_status"] == "warning":
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()