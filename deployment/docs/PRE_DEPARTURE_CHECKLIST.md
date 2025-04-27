# Pre-Departure Checklist for Marketplace Scrapers

Use this checklist before your 3-week absence to ensure the marketplace scrapers will run autonomously.

## 1. System Deployment Verification

- [ ] Confirm deployment completed successfully
- [ ] Verify service is accessible at the provided URL
- [ ] Check `/status` endpoint returns healthy status
- [ ] Check `/quota` endpoint shows proper quota configuration
- [ ] Verify Firestore collections are populated with sample data

## 2. Test Each Marketplace

Run a test scraping task for each marketplace to verify functionality:

- [ ] Takealot scraper test completed successfully
- [ ] Amazon SA scraper test completed successfully
- [ ] Bob Shop scraper test completed successfully
- [ ] Makro scraper test completed successfully
- [ ] Loot scraper test completed successfully
- [ ] Buck.cheap scraper test completed successfully

## 3. Verify Scheduled Tasks

- [ ] Confirm all scheduler jobs are created in Cloud Scheduler
- [ ] Test run one job manually to verify execution
- [ ] Check task history in Firestore to confirm job execution
- [ ] Verify proper spacing of scheduled tasks to manage quota

## 4. Monitoring & Alerts

- [ ] Confirm monitoring dashboard is created and showing data
- [ ] Verify email alerts are properly configured
- [ ] Send a test notification to confirm receipt
- [ ] Ensure dashboard shows key metrics:
  - [ ] API Quota Usage
  - [ ] Request Success Rate
  - [ ] Task Execution Count
  - [ ] Load Shedding Status

## 5. Quota Management

- [ ] Verify monthly quota limit is set to 82,000 requests
- [ ] Confirm daily quota limit is correctly distributed (~2,700 per day)
- [ ] Check quota allocation by priority level
- [ ] Verify quota usage tracking is working

## 6. Load Shedding Resilience

- [ ] Verify load shedding detection is operational
- [ ] Confirm adaptation behaviors are properly configured
- [ ] Test load shedding recovery procedures
- [ ] Check scheduled load shedding check job runs correctly

## 7. Access & Credentials

- [ ] Verify you can access Google Cloud Console remotely
- [ ] Confirm you have required authentication credentials
- [ ] Test access from travel devices/locations if possible
- [ ] Verify email access for receiving alerts

## 8. Documentation & Recovery

- [ ] Review all documentation files
- [ ] Familiarize yourself with emergency recovery procedures
- [ ] Ensure contact information for support is accurate
- [ ] Share critical information with a backup person if available

## 9. Security Verification

- [ ] Confirm SmartProxy token is securely stored in Secret Manager
- [ ] Verify service account has appropriate permissions
- [ ] Check that no sensitive information is exposed in logs

## 10. Final Go/No-Go Decision

- [ ] All critical components working properly
- [ ] Comfortable with monitoring procedures
- [ ] Understand emergency recovery steps
- [ ] Confident in system's ability to run autonomously

---

## Departure Ready!

When all items are checked, the system is ready for your departure. During your absence:

1. Check the daily status at: `https://your-service-url/status`
2. Monitor quota usage at: `https://your-service-url/quota`
3. Review the daily summary at: `https://your-service-url/daily-summary`
4. Check your email for any alerts

If problems arise, refer to the emergency recovery procedures in `deployment/docs/EMERGENCY_RECOVERY.md`.
