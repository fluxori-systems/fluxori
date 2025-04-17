"""
Browser actions framework for marketplace data collection.

This module provides a robust framework for defining, composing, and executing
browser actions through the SmartProxy API, enabling complex web interactions
like clicks, scrolls, form inputs, and waiting, as well as capturing network
requests and handling dynamic content.
"""

import json
import logging
import random
from typing import Dict, Any, List, Optional, Union, Callable


class BrowserActionError(Exception):
    """Exception raised when a browser action fails."""
    pass


class BrowserAction:
    """Represents a single browser action.
    
    This class encapsulates a single browser action like clicking, scrolling,
    entering text, or waiting, with methods for validation and serialization.
    """
    
    # Valid action types and their required parameters
    VALID_ACTIONS = {
        "click": ["selector"],
        "scroll": [],  # Can use selector or value
        "input": ["selector", "value"],
        "wait": ["value"],
        "wait_for_selector": ["selector"],
        "wait_for_navigation": [],
        "set_capture_network": ["value"],
        "evaluate": ["value"],
        "screenshot": [],
        "hover": ["selector"]
    }
    
    # Optional parameters for each action type
    OPTIONAL_PARAMS = {
        "click": ["optional", "timeout"],
        "scroll": ["behavior"],
        "input": ["optional", "delay"],
        "wait": [],
        "wait_for_selector": ["visible", "timeout"],
        "wait_for_navigation": ["timeout"],
        "set_capture_network": [],
        "evaluate": ["args"],
        "screenshot": ["selector", "fullPage"],
        "hover": ["optional", "timeout"]
    }
    
    def __init__(self, action_type: str, **kwargs):
        """Initialize a browser action.
        
        Args:
            action_type: Type of browser action
            **kwargs: Action-specific parameters
            
        Raises:
            ValueError: If action type is invalid or required parameters are missing
        """
        if action_type not in self.VALID_ACTIONS:
            raise ValueError(f"Invalid action type: {action_type}")
            
        self.action_type = action_type
        self.params = kwargs
        
        # Validate required parameters
        required_params = self.VALID_ACTIONS[action_type]
        if action_type == "scroll" and "selector" not in kwargs and "value" not in kwargs:
            raise ValueError("Scroll action requires either 'selector' or 'value'")
        else:
            for param in required_params:
                if param not in kwargs:
                    raise ValueError(f"Required parameter '{param}' missing for {action_type} action")
        
        # Check for invalid parameters
        valid_params = set(self.VALID_ACTIONS[action_type] + self.OPTIONAL_PARAMS[action_type])
        for param in kwargs:
            if param not in valid_params:
                raise ValueError(f"Invalid parameter '{param}' for {action_type} action")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert action to dictionary format for SmartProxy API.
        
        Returns:
            Dictionary representation of the action
        """
        result = {"action": self.action_type}
        result.update(self.params)
        return result
    
    @classmethod
    def from_dict(cls, action_dict: Dict[str, Any]) -> 'BrowserAction':
        """Create a BrowserAction from a dictionary.
        
        Args:
            action_dict: Dictionary representation of action
            
        Returns:
            BrowserAction instance
        """
        if "action" not in action_dict:
            raise ValueError("Action dictionary must contain 'action' key")
            
        action_type = action_dict["action"]
        params = {k: v for k, v in action_dict.items() if k != "action"}
        
        return cls(action_type, **params)
    
    def __str__(self) -> str:
        """Get string representation of action.
        
        Returns:
            String representation
        """
        params_str = ", ".join(f"{k}={v}" for k, v in self.params.items())
        return f"BrowserAction({self.action_type}, {params_str})"


class BrowserActionSequence:
    """Sequence of browser actions to be executed.
    
    This class allows composing multiple browser actions into a sequence,
    with methods for validation, serialization, and execution.
    """
    
    def __init__(self, actions: Optional[List[BrowserAction]] = None):
        """Initialize a browser action sequence.
        
        Args:
            actions: List of BrowserAction objects (optional)
        """
        self.actions = actions or []
        self.logger = logging.getLogger("browser-actions")
    
    def add_action(self, action: BrowserAction) -> 'BrowserActionSequence':
        """Add an action to the sequence.
        
        Args:
            action: BrowserAction to add
            
        Returns:
            Self for method chaining
        """
        self.actions.append(action)
        return self
    
    def add_click(self, selector: str, optional: bool = False) -> 'BrowserActionSequence':
        """Add a click action.
        
        Args:
            selector: CSS selector to click
            optional: Whether this action is optional (won't fail if selector not found)
            
        Returns:
            Self for method chaining
        """
        self.add_action(BrowserAction("click", selector=selector, optional=optional))
        return self
    
    def add_input(self, selector: str, value: str, delay: int = None) -> 'BrowserActionSequence':
        """Add an input action.
        
        Args:
            selector: CSS selector for input field
            value: Value to input
            delay: Optional delay between key presses in milliseconds
            
        Returns:
            Self for method chaining
        """
        params = {"selector": selector, "value": value}
        if delay is not None:
            params["delay"] = delay
            
        self.add_action(BrowserAction("input", **params))
        return self
    
    def add_scroll(self, value: str = "document.body.scrollHeight") -> 'BrowserActionSequence':
        """Add a scroll action.
        
        Args:
            value: JavaScript expression for scroll position
            
        Returns:
            Self for method chaining
        """
        self.add_action(BrowserAction("scroll", value=value))
        return self
    
    def add_wait(self, milliseconds: int) -> 'BrowserActionSequence':
        """Add a wait action.
        
        Args:
            milliseconds: Time to wait in milliseconds
            
        Returns:
            Self for method chaining
        """
        self.add_action(BrowserAction("wait", value=milliseconds))
        return self
    
    def add_wait_for_selector(self, selector: str, timeout: int = None) -> 'BrowserActionSequence':
        """Add a wait-for-selector action.
        
        Args:
            selector: CSS selector to wait for
            timeout: Optional timeout in milliseconds
            
        Returns:
            Self for method chaining
        """
        params = {"selector": selector}
        if timeout is not None:
            params["timeout"] = timeout
            
        self.add_action(BrowserAction("wait_for_selector", **params))
        return self
    
    def add_wait_for_navigation(self, timeout: int = None) -> 'BrowserActionSequence':
        """Add a wait-for-navigation action.
        
        Args:
            timeout: Optional timeout in milliseconds
            
        Returns:
            Self for method chaining
        """
        params = {}
        if timeout is not None:
            params["timeout"] = timeout
            
        self.add_action(BrowserAction("wait_for_navigation", **params))
        return self
    
    def add_capture_network(self, request_types: str = "xhr") -> 'BrowserActionSequence':
        """Add a capture-network action.
        
        Args:
            request_types: Types of requests to capture (xhr, fetch, document, etc.)
            
        Returns:
            Self for method chaining
        """
        self.add_action(BrowserAction("set_capture_network", value=request_types))
        return self
    
    def add_evaluate(self, script: str, args: List[Any] = None) -> 'BrowserActionSequence':
        """Add a JavaScript evaluation action.
        
        Args:
            script: JavaScript code to evaluate
            args: Optional arguments to pass to the script
            
        Returns:
            Self for method chaining
        """
        params = {"value": script}
        if args is not None:
            params["args"] = args
            
        self.add_action(BrowserAction("evaluate", **params))
        return self
    
    def add_hover(self, selector: str, optional: bool = False) -> 'BrowserActionSequence':
        """Add a hover action.
        
        Args:
            selector: CSS selector to hover over
            optional: Whether this action is optional
            
        Returns:
            Self for method chaining
        """
        self.add_action(BrowserAction("hover", selector=selector, optional=optional))
        return self
    
    def to_list(self) -> List[Dict[str, Any]]:
        """Convert action sequence to list format for SmartProxy API.
        
        Returns:
            List of action dictionaries
        """
        return [action.to_dict() for action in self.actions]
    
    @classmethod
    def from_list(cls, action_list: List[Dict[str, Any]]) -> 'BrowserActionSequence':
        """Create a BrowserActionSequence from a list of dictionaries.
        
        Args:
            action_list: List of action dictionaries
            
        Returns:
            BrowserActionSequence instance
        """
        sequence = cls()
        for action_dict in action_list:
            action = BrowserAction.from_dict(action_dict)
            sequence.add_action(action)
        return sequence
    
    def __str__(self) -> str:
        """Get string representation of action sequence.
        
        Returns:
            String representation
        """
        return f"BrowserActionSequence({len(self.actions)} actions)"


class BrowserActionTemplate:
    """Template for browser action sequences.
    
    This class provides predefined, parameterized browser action sequences
    for common tasks, with support for parameter substitution.
    """
    
    # Standard templates
    TEMPLATES = {
        "scroll_to_bottom": [
            {"action": "scroll", "value": "document.body.scrollHeight"}
        ],
        "infinite_scroll": [
            {"action": "scroll", "value": "document.body.scrollHeight"},
            {"action": "wait", "value": 1000},
            {"action": "scroll", "value": "document.body.scrollHeight + 100"},
            {"action": "wait", "value": 1000},
            {"action": "scroll", "value": "document.body.scrollHeight + 200"}
        ],
        "click_next_page": [
            {"action": "click", "selector": ".pagination .next a"}
        ],
        "accept_cookies": [
            {"action": "click", "selector": "[data-testid='cookie-accept-all']", "optional": True}
        ],
        "close_popup": [
            {"action": "click", "selector": ".modal-close", "optional": True}
        ],
        "add_to_cart": [
            {"action": "click", "selector": ".add-to-cart-button"}
        ],
        "capture_network_requests": [
            {"action": "set_capture_network", "value": "xhr"}
        ],
        "login_form": [
            {"action": "input", "selector": "[name='username']", "value": "{username}"},
            {"action": "input", "selector": "[name='password']", "value": "{password}"},
            {"action": "click", "selector": "[type='submit']"}
        ],
        "load_more_results": [
            {"action": "scroll", "value": "document.body.scrollHeight"},
            {"action": "wait", "value": 1000},
            {"action": "click", "selector": ".load-more", "optional": True}
        ],
        "takealot_product_page": [
            {"action": "set_capture_network", "value": "xhr"},
            {"action": "click", "selector": ".cookie-notice-button", "optional": True},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight * 0.3"},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight * 0.6"},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight"}
        ],
        "amazon_product_page": [
            {"action": "set_capture_network", "value": "xhr"},
            {"action": "click", "selector": "#sp-cc-accept", "optional": True},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight * 0.3"},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight * 0.7"},
            {"action": "wait", "value": 500},
            {"action": "scroll", "value": "document.body.scrollHeight"}
        ]
    }
    
    @classmethod
    def get_template(cls, template_name: str) -> List[Dict[str, Any]]:
        """Get a template by name.
        
        Args:
            template_name: Name of template to get
            
        Returns:
            List of action dictionaries
            
        Raises:
            ValueError: If template name is invalid
        """
        if template_name not in cls.TEMPLATES:
            raise ValueError(f"Unknown template: {template_name}")
            
        return cls.TEMPLATES[template_name]
    
    @classmethod
    def apply_parameters(cls, 
                       template: List[Dict[str, Any]], 
                       parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply parameters to a template.
        
        Args:
            template: Template action list
            parameters: Parameter values
            
        Returns:
            Template with parameters applied
        """
        result = []
        
        for action in template:
            # Make a deep copy
            new_action = json.loads(json.dumps(action))
            
            # Apply parameters to string values
            for key, value in new_action.items():
                if isinstance(value, str):
                    for param_name, param_value in parameters.items():
                        placeholder = "{" + param_name + "}"
                        if placeholder in value:
                            new_action[key] = value.replace(placeholder, str(param_value))
            
            result.append(new_action)
            
        return result
    
    @classmethod
    def get_sequence(cls, template_name: str, parameters: Dict[str, Any] = None) -> BrowserActionSequence:
        """Get a browser action sequence from a template.
        
        Args:
            template_name: Name of template
            parameters: Optional parameters to apply
            
        Returns:
            BrowserActionSequence instance
        """
        template = cls.get_template(template_name)
        
        if parameters:
            template = cls.apply_parameters(template, parameters)
            
        return BrowserActionSequence.from_list(template)
    
    @classmethod
    def register_template(cls, name: str, actions: List[Dict[str, Any]]) -> None:
        """Register a new template.
        
        Args:
            name: Template name
            actions: List of action dictionaries
        """
        cls.TEMPLATES[name] = actions


class BrowserActionBuilder:
    """Fluent builder for creating browser action sequences.
    
    This class provides a fluent interface for building browser action
    sequences with method chaining, making it easier to create complex
    interactions in a readable way.
    """
    
    def __init__(self):
        """Initialize the browser action builder."""
        self.sequence = BrowserActionSequence()
    
    def click(self, selector: str, optional: bool = False) -> 'BrowserActionBuilder':
        """Add a click action.
        
        Args:
            selector: CSS selector to click
            optional: Whether this action is optional
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_click(selector, optional)
        return self
    
    def input(self, selector: str, value: str, delay: int = None) -> 'BrowserActionBuilder':
        """Add an input action.
        
        Args:
            selector: CSS selector for input field
            value: Value to input
            delay: Optional delay between key presses
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_input(selector, value, delay)
        return self
    
    def scroll(self, value: str = "document.body.scrollHeight") -> 'BrowserActionBuilder':
        """Add a scroll action.
        
        Args:
            value: JavaScript expression for scroll position
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_scroll(value)
        return self
    
    def wait(self, milliseconds: int) -> 'BrowserActionBuilder':
        """Add a wait action.
        
        Args:
            milliseconds: Time to wait in milliseconds
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_wait(milliseconds)
        return self
    
    def wait_for_selector(self, selector: str, timeout: int = None) -> 'BrowserActionBuilder':
        """Add a wait-for-selector action.
        
        Args:
            selector: CSS selector to wait for
            timeout: Optional timeout
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_wait_for_selector(selector, timeout)
        return self
    
    def wait_for_navigation(self, timeout: int = None) -> 'BrowserActionBuilder':
        """Add a wait-for-navigation action.
        
        Args:
            timeout: Optional timeout
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_wait_for_navigation(timeout)
        return self
    
    def capture_network(self, request_types: str = "xhr") -> 'BrowserActionBuilder':
        """Add a capture-network action.
        
        Args:
            request_types: Types of requests to capture
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_capture_network(request_types)
        return self
    
    def evaluate(self, script: str, args: List[Any] = None) -> 'BrowserActionBuilder':
        """Add a JavaScript evaluation action.
        
        Args:
            script: JavaScript code to evaluate
            args: Optional arguments
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_evaluate(script, args)
        return self
    
    def hover(self, selector: str, optional: bool = False) -> 'BrowserActionBuilder':
        """Add a hover action.
        
        Args:
            selector: CSS selector to hover over
            optional: Whether this action is optional
            
        Returns:
            Self for method chaining
        """
        self.sequence.add_hover(selector, optional)
        return self
    
    def use_template(self, template_name: str, parameters: Dict[str, Any] = None) -> 'BrowserActionBuilder':
        """Add actions from a template.
        
        Args:
            template_name: Name of template
            parameters: Optional parameters
            
        Returns:
            Self for method chaining
        """
        template_sequence = BrowserActionTemplate.get_sequence(template_name, parameters)
        
        for action in template_sequence.actions:
            self.sequence.add_action(action)
            
        return self
    
    def build(self) -> BrowserActionSequence:
        """Build the browser action sequence.
        
        Returns:
            Completed BrowserActionSequence
        """
        return self.sequence
    
    def to_list(self) -> List[Dict[str, Any]]:
        """Convert to list format for SmartProxy API.
        
        Returns:
            List of action dictionaries
        """
        return self.sequence.to_list()


# Common browser action sequences for marketplace scraping
MARKETPLACE_ACTIONS = {
    "takealot_product": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-notice-button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .build(),
        
    "takealot_search": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-notice-button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.5")
        .wait(800)
        .scroll("document.body.scrollHeight")
        .wait(500)
        .build(),
        
    "takealot_category": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click(".cookie-notice-button", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .click(".load-more-products", optional=True)
        .wait(1000)
        .scroll("document.body.scrollHeight")
        .build(),
        
    "amazon_product": BrowserActionBuilder()
        .capture_network("xhr,fetch")
        .click("#sp-cc-accept", optional=True)
        .wait(500)
        .scroll("document.body.scrollHeight * 0.3")
        .wait(500)
        .scroll("document.body.scrollHeight * 0.6")
        .wait(500)
        .scroll("document.body.scrollHeight")
        .build(),
        
    "infinite_scroll": BrowserActionBuilder()
        .scroll("document.body.scrollHeight")
        .wait(1000)
        .scroll("document.body.scrollHeight + 100")
        .wait(1000)
        .scroll("document.body.scrollHeight + 200")
        .wait(1000)
        .scroll("document.body.scrollHeight + 300")
        .wait(1000)
        .scroll("document.body.scrollHeight + 400")
        .build()
}