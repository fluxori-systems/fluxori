# Common Utilities for Marketplace Scraper

This directory contains common utilities and integrations used by the marketplace scraper.

## Alert Integration

The `alert_integration.py` module provides integration between the marketplace scraper and the competitor alert system in the backend.

### Overview

The AlertIntegration class is responsible for:

1. Fetching active competitor watches from the backend
2. Processing keyword research results to detect changes
3. Submitting comparison results for alert generation
4. Updating watch status after processing
5. Fetching historical data for comparison

### Usage

```python
from common.alert_integration import AlertIntegration

# Initialize with API URL and auth token
alert_integration = AlertIntegration(
    api_url="https://api.fluxori.com",
    auth_token="your-auth-token"
)

# Fetch active watches
active_watches = alert_integration.fetch_active_watches()

# Process ranking data and generate alerts
result = await alert_integration.process_ranking_data(
    marketplace="takealot",
    keyword="smartphone",
    rankings=[
        {"position": 1, "product_id": "123", "price": 999},
        {"position": 2, "product_id": "456", "price": 1099}
    ]
)

# Check how many alerts were generated
alerts_count = result.get("alerts_generated", 0)
print(f"Generated {alerts_count} alerts")
```

### Integration with Ranking Orchestrator

The AlertIntegration is used by the RankingOrchestrator to process competitor alerts:

```python
from orchestration.ranking_orchestrator import RankingOrchestrator
from common.alert_integration import AlertIntegration

# Initialize alert integration
alert_integration = AlertIntegration(
    api_url="https://api.fluxori.com",
    auth_token="your-auth-token"
)

# Initialize ranking orchestrator with alert integration
orchestrator = RankingOrchestrator(
    task_scheduler=task_scheduler,
    credit_manager=credit_manager,
    alert_integration=alert_integration
)

# Now the orchestrator can process competitor alerts
result = await orchestrator.process_competitor_alerts(
    marketplace="takealot",
    keyword_result={
        "keyword": "smartphone",
        "marketplace": "takealot",
        "rankings": [...]
    }
)
```

## Credit Integration

The `credit_integration.py` module provides integration between the marketplace scraper and the credit system in the backend.

See the main [Credit System README](/CREDIT_SYSTEM_README.md) for more details on the credit system.

## Other Utilities

- `base_scraper.py`: Base class for marketplace scrapers
- `browser_actions.py`: Common browser actions for scrapers
- `load_shedding_detector.py`: Utility for detecting load shedding in South Africa
- `proxy_client.py`: Client for managing proxies
- `quota_manager.py`: Manager for handling API quota limitations
- `session_manager.py`: Manager for browser sessions
- `user_agent_randomizer.py`: Utility for randomizing user agents
