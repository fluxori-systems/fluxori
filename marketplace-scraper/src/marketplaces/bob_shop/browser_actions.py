"""
Browser actions specifically tailored for Bob Shop marketplace.

This module provides specialized browser actions for interacting with Bob Shop pages,
handling site-specific elements like cookie notices, popups, etc.
"""

from typing import Dict, Any, List
from ...common.browser_actions import BrowserActionBuilder, BrowserActionTemplate


# Register Bob Shop-specific browser action templates
BrowserActionTemplate.register_template(
    "bobshop_product_page",
    [
        {"action": "set_capture_network", "value": "xhr"},
        {"action": "click", "selector": ".cookie-banner__button", "optional": True},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.3"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.6"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight"},
        {"action": "wait", "value": 500},
        {"action": "click", "selector": ".product__accordion-toggle", "optional": True},
        {"action": "wait", "value": 500}
    ]
)

BrowserActionTemplate.register_template(
    "bobshop_search_page",
    [
        {"action": "set_capture_network", "value": "xhr"},
        {"action": "click", "selector": ".cookie-banner__button", "optional": True},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.3"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.7"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight"},
        {"action": "wait", "value": 500}
    ]
)

BrowserActionTemplate.register_template(
    "bobshop_category_page",
    [
        {"action": "set_capture_network", "value": "xhr"},
        {"action": "click", "selector": ".cookie-banner__button", "optional": True},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.3"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight * 0.7"},
        {"action": "wait", "value": 500},
        {"action": "scroll", "value": "document.body.scrollHeight"},
        {"action": "wait", "value": 500},
        {"action": "click", "selector": ".facets__summary", "optional": True},
        {"action": "wait", "value": 500}
    ]
)

# Pre-built browser action sequences for different Bob Shop page types
BOBSHOP_ACTIONS = {
    "product": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-banner__button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .click(".product__accordion-toggle", optional=True)
        .wait(500)
        .build(),
        
    "search": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-banner__button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.5")
        .wait(800)
        .scroll("document.body.scrollHeight")
        .wait(500)
        .build(),
        
    "category": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-banner__button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .click(".facets__summary", optional=True)
        .wait(500)
        .build(),
        
    "seller": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-banner__button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .wait(500)
        .build()
}