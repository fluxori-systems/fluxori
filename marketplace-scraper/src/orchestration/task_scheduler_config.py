"""
Configuration for task scheduler with credit system integration.

This module provides configuration settings and factory functions
for creating task schedulers with credit system integration.
"""

import logging
import os
import json
from typing import Dict, List, Any, Optional, Tuple
from ..common.credit_integration import create_credit_manager_from_config
from .credit_based_task_prioritizer import CreditBasedTaskPrioritizer

# Set up logging
logger = logging.getLogger(__name__)

class TaskSchedulerConfig:
    """Configuration for task scheduler with credit system integration."""
    
    def __init__(self, 
                 config_path: Optional[str] = None,
                 enable_credit_system: bool = True,
                 max_concurrent_tasks: int = 5,
                 task_interval: float = 1.0):
        """
        Initialize task scheduler configuration.
        
        Args:
            config_path: Path to configuration file (optional)
            enable_credit_system: Whether to enable credit system integration
            max_concurrent_tasks: Maximum number of concurrent tasks
            task_interval: Minimum interval between task starts (in seconds)
        """
        self.enable_credit_system = enable_credit_system
        self.max_concurrent_tasks = max_concurrent_tasks
        self.task_interval = task_interval
        
        # Load configuration from file if provided
        if config_path:
            self._load_config(config_path)
        else:
            # Try to load from default locations
            default_paths = [
                os.environ.get("SCHEDULER_CONFIG_PATH"),
                "./config/scheduler_config.json",
                "../config/scheduler_config.json",
                "../../config/scheduler_config.json"
            ]
            
            for path in default_paths:
                if path and os.path.exists(path):
                    self._load_config(path)
                    break
    
    def _load_config(self, config_path: str) -> None:
        """
        Load configuration from file.
        
        Args:
            config_path: Path to configuration file
        """
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Update settings from config
            if 'enable_credit_system' in config:
                self.enable_credit_system = config['enable_credit_system']
                
            if 'max_concurrent_tasks' in config:
                self.max_concurrent_tasks = config['max_concurrent_tasks']
                
            if 'task_interval' in config:
                self.task_interval = config['task_interval']
                
            # Store the rest of the config
            self.config = config
            
            logger.info(f"Loaded task scheduler configuration from {config_path}")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"Error loading configuration from {config_path}: {str(e)}")
            self.config = {}
    
    def create_credit_prioritizer(self) -> Optional[CreditBasedTaskPrioritizer]:
        """
        Create a credit-based task prioritizer.
        
        Returns:
            CreditBasedTaskPrioritizer instance or None if credit system is disabled
        """
        if not self.enable_credit_system:
            return None
            
        try:
            # Create credit manager
            credit_manager = create_credit_manager_from_config()
            
            if not credit_manager:
                logger.warning("Failed to create credit manager, credit system integration will be disabled")
                return None
                
            # Create prioritizer
            return CreditBasedTaskPrioritizer(credit_manager)
        except Exception as e:
            logger.error(f"Error creating credit prioritizer: {str(e)}")
            return None
            
    def get_scheduler_settings(self) -> Dict[str, Any]:
        """
        Get settings for task scheduler.
        
        Returns:
            Dictionary with scheduler settings
        """
        return {
            'max_concurrent_tasks': self.max_concurrent_tasks,
            'task_interval': self.task_interval
        }
        
    def get_south_african_optimization_settings(self) -> Dict[str, Any]:
        """
        Get South Africa specific optimization settings.
        
        Returns:
            Dictionary with regional optimization settings
        """
        # Default settings for South African optimization
        default_settings = {
            'enable_load_shedding_detection': True,
            'load_shedding_threshold': 5,
            'load_shedding_recovery_time': 120,  # minutes
            'proxy_rotation_interval': 30,  # minutes
            'regional_caching_enabled': True,
            'cache_ttl': 24 * 60  # minutes (24 hours)
        }
        
        # Update with config if available
        if hasattr(self, 'config') and 'south_african_optimizations' in self.config:
            default_settings.update(self.config['south_african_optimizations'])
            
        return default_settings