# SmartProxy Quota System Operational Guide

This operational guide provides detailed instructions for managing and monitoring the SmartProxy quota system, particularly for historical data collection operations from Buck.cheap.

## System Overview

The quota system dynamically allocates SmartProxy resources across different marketplaces based on collection priorities and progress. It includes:

1. **Quota Manager**: Core component handling quota tracking and enforcement
2. **Collection Status Tracking**: Monitors progress of historical data collection
3. **Phase-Based Allocation**: Adjusts allocations based on collection completion
4. **Auto-Scaling**: Redistributes resources as collection progresses

## Daily Monitoring Procedures

### 1. Check Collection Status

To check the current status of historical data collection:

```python
# From the ranking orchestrator
status = await ranking_orchestrator.get_historical_collection_status()
print(status)
```

The status report includes:

- Completion percentage for each marketplace
- Current allocation percentages
- Products collected vs. target
- Current phase of collection
- Timestamps for collection start and last update

### 2. Verify Quota Allocation

To verify current quota allocations:

```python
# From the quota manager
status = quota_manager.get_status()
print(status["category_usage"])
```

Ensure that the Buck.cheap allocation percentage matches the expected value based on current collection phase.

### 3. Monitor Collection Rate

Track the collection rate to ensure it's on target:

1. Note the current `collected_count` value
2. Check again after 24 hours
3. Calculate daily collection rate
4. Ensure it's sufficient to complete collection within the target timeframe

### 4. Validate Collected Data Quality

Run data validation to ensure quality of collected data:

```python
# From the ranking orchestrator
validation_results = await ranking_orchestrator.validate_historical_data("takealot")
validation_results = await ranking_orchestrator.validate_historical_data("makro")
```

Look for issues such as:

- Missing product identifiers
- Insufficient price points
- Price consistency problems
- Incomplete date ranges

## Phase Transition Management

The system automatically transitions between phases based on collection progress:

| Phase | Completion Range | Buck.cheap Allocation | Action Required         |
| ----- | ---------------- | --------------------- | ----------------------- |
| 1→2   | 30% completion   | 15% → 10%             | Verify redistribution   |
| 2→3   | 75% completion   | 10% → 7%              | Verify redistribution   |
| 3→4   | 95% completion   | 7% → 4.2%             | Verify final allocation |

When a phase transition occurs:

1. Verify that the quota allocation has been updated correctly
2. Check that freed resources have been properly redistributed
3. Monitor collection rate after transition to ensure it remains acceptable
4. If collection rate drops too much, consider manual intervention

## Manual Interventions

### Adjusting Collection Target

To adjust the target number of products to collect:

```python
# From the ranking orchestrator
result = await ranking_orchestrator.start_historical_data_collection(
    target_marketplace="takealot",
    target_count=800  # Increased target
)
```

This will update the target count without restarting an in-progress collection.

### Forcing Quota Reallocation

To manually update quota allocation:

```python
# Direct via quota manager
quota_manager.set_category_allocation("buck_cheap", 0.12)  # 12%
```

### Pausing Collection

To effectively pause collection, set allocation to minimum:

```python
# Via quota manager
quota_manager.set_category_allocation("buck_cheap", 0.01)  # Minimal 1%
```

### Restarting Stalled Collection

If collection appears stalled:

```python
# Force new collection tasks
await ranking_orchestrator.start_historical_data_collection(
    target_marketplace="takealot",
    target_count=current_target  # Use same target
)
```

## Scheduled Tasks

The system runs the following scheduled tasks:

| Task                           | Schedule                   | Purpose                                                   |
| ------------------------------ | -------------------------- | --------------------------------------------------------- |
| `update_allocation_percentage` | Twice daily (00:00, 12:00) | Update Buck.cheap allocation based on collection progress |
| `historical_data_collection`   | Four times daily           | Schedule batches of collection tasks                      |
| `historical_data_validation`   | Twice daily (06:00, 18:00) | Validate collected data and schedule fixes                |

## Troubleshooting

### Collection Rate Too Slow

If collection is progressing too slowly:

1. Check SmartProxy response success rate and latency
2. Verify sufficient parallel collection tasks are running
3. Temporarily increase allocation:
   ```python
   quota_manager.set_category_allocation("buck_cheap", current_allocation * 1.2)  # 20% boost
   ```

### High Error Rates

If seeing high error rates in collection:

1. Check SmartProxy status for possible IP blocking
2. Verify Buck.cheap website structure hasn't changed
3. Adjust request interval in scraper configuration
4. Consider rotating to different proxy locations

### CSV Extraction Issues

If CSV download rate is low:

1. Examine the logs for CSV detection patterns
2. Check if Buck.cheap has changed their CSV format or link structure
3. Update CSV detection patterns in price_history_extractor.py

## Monitoring Dashboard

Key metrics to monitor on the dashboard:

1. **Collection Progress**: Overall and per-marketplace completion percentage
2. **Allocation Distribution**: Current allocation percentages
3. **Collection Rate**: Products collected per hour
4. **Validation Rate**: Percentage of collected data passing validation
5. **Phase Status**: Current phase and time in phase

## Contact Information

For urgent issues with the quota system, contact:

- System Administrator: admin@fluxori.com
- SmartProxy Account Manager: support@smartproxy.com

## Reference Materials

- [SmartProxy API Documentation](https://smartproxy.com/docs)
- [Quota Allocation Strategy](./QUOTA_ALLOCATION_STRATEGY.md)
- [Buck.cheap Scraper Implementation](./marketplace-scraper/src/marketplaces/buck_cheap/buck_cheap_scraper.py)
- [Price History Extractor](./marketplace-scraper/src/marketplaces/buck_cheap/extractors/price_history_extractor.py)
