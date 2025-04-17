"""
Common components for the marketplace scraper.

This package provides core components used across the marketplace scraper,
including enhanced SmartProxy client, session management, browser actions,
quota management, user agent randomization, and load shedding detection.
"""

from .base_scraper import MarketplaceScraper, NetworkError, LoadSheddingDetectedError
from .proxy_client import (
    SmartProxyClient,
    QuotaExceededError,
    SessionExpiredError,
    BrowserActionError
)

from .session_manager import (
    SessionManager,
    SessionPool,
    SessionLimitExceededError
)

from .browser_actions import (
    BrowserAction,
    BrowserActionSequence,
    BrowserActionTemplate,
    BrowserActionBuilder,
    MARKETPLACE_ACTIONS
)

from .quota_manager import (
    QuotaManager,
    QuotaDistributor,
    QuotaPriority
)

from .user_agent_randomizer import (
    UserAgentRandomizer
)

from .load_shedding_detector import (
    LoadSheddingDetector,
    LoadSheddingAdapter,
    LoadSheddingStatus
)

__all__ = [
    # Base scraper
    'MarketplaceScraper',
    'NetworkError',
    'LoadSheddingDetectedError',
    
    # Proxy client
    'SmartProxyClient',
    'QuotaExceededError',
    'SessionExpiredError',
    'BrowserActionError',
    
    # Session management
    'SessionManager',
    'SessionPool',
    'SessionLimitExceededError',
    
    # Browser actions
    'BrowserAction',
    'BrowserActionSequence',
    'BrowserActionTemplate',
    'BrowserActionBuilder',
    'MARKETPLACE_ACTIONS',
    
    # Quota management
    'QuotaManager',
    'QuotaDistributor',
    'QuotaPriority',
    
    # User agent randomization
    'UserAgentRandomizer',
    
    # Load shedding detection
    'LoadSheddingDetector',
    'LoadSheddingAdapter',
    'LoadSheddingStatus'
]