# Competitor Alert System Monitoring Guide

This guide outlines how to monitor the competitor alert system performance and troubleshoot common issues.

## Key Metrics

The alert system exposes the following metrics to Cloud Monitoring:

1. **Alert Generation Rate**: Number of alerts generated over time

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/generated_count`
   - Normal range: 0-50 alerts per hour (depending on number of active watches)

2. **Alert Severity Distribution**: Breakdown of alerts by severity

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/severity_distribution`
   - Should generally follow: 5% critical, 15% high, 30% medium, 50% low

3. **Marketplace Distribution**: Breakdown of alerts by marketplace

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/marketplace_distribution`
   - Should roughly match the distribution of active watches across marketplaces

4. **Processing Time**: Time taken to process alerts

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/processing_time`
   - P99 should be < 2000ms

5. **Success Rate**: Percentage of successful alert processing attempts

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/success_rate`
   - Should remain > 99.5%

6. **Error Rate**: Rate of errors during alert processing

   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/error_rate`
   - Should remain < 0.5%

7. **Active Watches**: Number of active alert watches
   - Metric: `custom.googleapis.com/fluxori/competitor_alerts/active_watches`
   - This should align with the number of watches configured in the system

## Dashboards

A comprehensive dashboard is available in Cloud Monitoring:

- "Competitor Alerts Dashboard" provides a complete view of all alert system metrics

## Alert Policies

The following alert policies are configured:

1. **Competitor Alerts Processing Failure**: Triggers when the error rate exceeds 5%
2. **Competitor Alerts High Alert Rate**: Triggers when alerts are generated at an abnormally high rate
3. **Critical Alert Generation**: Triggers whenever a critical-severity alert is generated
4. **Slow Alert Processing**: Triggers when processing time exceeds 5 seconds

## Troubleshooting Common Issues

### High Error Rate

1. Check Cloud Logging for error messages with:

   ```
   resource.type="cloud_run_revision"
   resource.labels.service_name="marketplace-scraper"
   textPayload:"Error processing competitor alerts"
   ```

2. Common causes:
   - API connectivity issues with backend
   - Invalid watch configurations
   - Data format mismatches
   - Rate limiting

### Slow Processing Time

1. Check if the number of active watches has increased significantly
2. Look for high CPU or memory usage in Cloud Run metrics
3. Check for slow API responses from the backend

### High Alert Volume

1. Verify if there is a genuine market event causing multiple alerts
2. Check for watch configurations with too-sensitive thresholds
3. Look for duplicate watches or overlapping configurations

## Scaling Considerations

The alert system is designed to scale with the number of watches. However:

1. If active watches exceed 10,000:

   - Consider increasing Cloud Run instance size
   - Implement additional caching for watch configurations
   - Adjust the processing batch size

2. If processing time consistently exceeds thresholds:
   - Consider implementing a priority queue
   - Add additional workers for processing
   - Optimize database queries

## Credit System Integration

The alert system integrates with the credit system. Issues with this integration can cause:

1. Alerts not being generated due to insufficient credits
2. Credits being consumed without generating alerts
3. Inaccurate credit usage reporting

To troubleshoot credit system integration issues:

1. Check CreditSystemClient logs
2. Verify reservations are being made and confirmed correctly
3. Check that credit usage is being recorded accurately
