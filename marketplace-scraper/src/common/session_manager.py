"""
Session management system for marketplace data collection.

This module provides a robust session management system that maintains consistent
IP usage across related requests, respects the 10-minute session lifetime limit
of SmartProxy, and organizes sessions by category or search term for optimal
scraping efficiency.
"""

import time
import uuid
import logging
from typing import Dict, Any, Optional, List, Set
from datetime import datetime


class SessionExpiredError(Exception):
    """Exception raised when a session has expired."""
    pass


class SessionLimitExceededError(Exception):
    """Exception raised when session limit is exceeded."""
    pass


class SessionManager:
    """Manager for SmartProxy scraping sessions.
    
    This class handles the creation, tracking, and cleanup of API sessions
    for consistent IP usage during marketplace data collection. It organizes
    sessions by category to ensure related requests use the same IP address.
    
    Features:
    - Session creation and tracking by category
    - Session expiration handling (respecting SmartProxy's 10-minute limit)
    - Usage statistics and monitoring
    - Session rotation to prevent overuse
    - Circuit breaker pattern for error conditions
    """
    
    def __init__(self, 
                max_lifetime: int = 600,  # 10 minutes in seconds
                max_sessions: int = 50,
                max_requests_per_session: int = 100,
                cleanup_interval: int = 60,  # Clean up every minute
                session_prefix: str = "fluxori_"):
        """Initialize the session manager.
        
        Args:
            max_lifetime: Maximum session lifetime in seconds
            max_sessions: Maximum number of active sessions
            max_requests_per_session: Maximum requests per session
            cleanup_interval: Interval in seconds between cleanup runs
            session_prefix: Prefix for session IDs
        """
        self.max_lifetime = max_lifetime
        self.max_sessions = max_sessions
        self.max_requests_per_session = max_requests_per_session
        self.cleanup_interval = cleanup_interval
        self.session_prefix = session_prefix
        
        # Session tracking
        self.active_sessions = {}  # session_id -> {created_at, last_used, request_count, category}
        self.category_sessions = {}  # category -> [session_ids]
        
        # Statistics
        self.total_sessions_created = 0
        self.total_requests = 0
        self.expired_sessions = 0
        
        # Setup logging
        self.logger = logging.getLogger("session-manager")
        self._setup_logging()
        
        # Cleanup tracking
        self.last_cleanup_time = time.time()
    
    def _setup_logging(self):
        """Set up structured logging for the session manager."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def create_session(self, category: Optional[str] = None) -> str:
        """Create a new session ID.
        
        Args:
            category: Optional category for the session (e.g., 'search', 'product')
            
        Returns:
            New session ID
            
        Raises:
            SessionLimitExceededError: If maximum number of sessions is reached
        """
        # Check if we need to run cleanup
        self._cleanup_if_needed()
        
        # Check if we've hit the maximum session limit
        if len(self.active_sessions) >= self.max_sessions:
            # Try to clean up expired sessions first
            self._clean_expired_sessions()
            
            # If we still have too many sessions, raise an error
            if len(self.active_sessions) >= self.max_sessions:
                self.logger.error(f"Maximum session limit reached: {self.max_sessions}")
                raise SessionLimitExceededError(f"Maximum session limit reached: {self.max_sessions}")
        
        # Create new session ID
        session_id = f"{self.session_prefix}{uuid.uuid4().hex[:12]}"
        
        # Register the session
        self.active_sessions[session_id] = {
            "created_at": time.time(),
            "last_used": time.time(),
            "request_count": 0,
            "category": category
        }
        
        # Register in category mapping if applicable
        if category:
            if category not in self.category_sessions:
                self.category_sessions[category] = []
            self.category_sessions[category].append(session_id)
        
        # Update statistics
        self.total_sessions_created += 1
        
        self.logger.info(f"Created new session: {session_id} (category: {category})")
        return session_id
    
    def get_session_for_category(self, category: str) -> str:
        """Get or create a session ID for a specific category.
        
        This helps group related requests (like product searches in a category)
        under the same IP address for consistency.
        
        Args:
            category: Category to get a session for
            
        Returns:
            Session ID for the category
        """
        # Check if we need to run cleanup
        self._cleanup_if_needed()
        
        # Look for an existing valid session for this category
        if category in self.category_sessions:
            for session_id in self.category_sessions[category]:
                # Skip session if it's expired or over request limit
                if not self.is_session_valid(session_id):
                    continue
                
                session_data = self.active_sessions[session_id]
                if session_data["request_count"] < self.max_requests_per_session:
                    return session_id
        
        # Create a new session if none found
        return self.create_session(category)
    
    def update_session_usage(self, session_id: str) -> None:
        """Update session usage tracking.
        
        Args:
            session_id: Session ID to update
            
        Raises:
            SessionExpiredError: If session is expired or invalid
        """
        if not self.is_session_valid(session_id):
            raise SessionExpiredError(f"Session {session_id} has expired or is invalid")
            
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["last_used"] = time.time()
            self.active_sessions[session_id]["request_count"] += 1
            self.total_requests += 1
    
    def is_session_valid(self, session_id: str) -> bool:
        """Check if a session is valid.
        
        Args:
            session_id: Session ID to check
            
        Returns:
            True if the session is valid, False otherwise
        """
        if session_id not in self.active_sessions:
            return False
        
        session_data = self.active_sessions[session_id]
        now = time.time()
        
        # Check if session is expired
        if now - session_data["created_at"] > self.max_lifetime:
            return False
        
        # Check if session has reached max requests
        if session_data["request_count"] >= self.max_requests_per_session:
            return False
        
        return True
    
    def _cleanup_if_needed(self) -> None:
        """Run cleanup if enough time has passed since last cleanup."""
        now = time.time()
        if now - self.last_cleanup_time > self.cleanup_interval:
            self._clean_expired_sessions()
            self.last_cleanup_time = now
    
    def _clean_expired_sessions(self) -> None:
        """Clean up expired sessions."""
        now = time.time()
        expired_sessions = [
            sid for sid, data in self.active_sessions.items()
            if now - data["created_at"] > self.max_lifetime or 
            data["request_count"] >= self.max_requests_per_session
        ]
        
        for sid in expired_sessions:
            self._remove_session(sid)
            
        if expired_sessions:
            self.logger.info(f"Cleaned {len(expired_sessions)} expired sessions")
            self.expired_sessions += len(expired_sessions)
    
    def _remove_session(self, session_id: str) -> None:
        """Remove a session from all tracking.
        
        Args:
            session_id: Session ID to remove
        """
        if session_id in self.active_sessions:
            # Get the category to remove from that mapping as well
            category = self.active_sessions[session_id]["category"]
            if category and category in self.category_sessions:
                if session_id in self.category_sessions[category]:
                    self.category_sessions[category].remove(session_id)
                
                # Clean up empty category lists
                if not self.category_sessions[category]:
                    del self.category_sessions[category]
            
            # Remove from active sessions
            del self.active_sessions[session_id]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get session management statistics.
        
        Returns:
            Dictionary with session statistics
        """
        # Clean up expired sessions first to ensure accurate stats
        self._clean_expired_sessions()
        
        # Calculate usage per category
        category_stats = {}
        for category, sessions in self.category_sessions.items():
            valid_sessions = [s for s in sessions if self.is_session_valid(s)]
            category_stats[category] = {
                "total_sessions": len(sessions),
                "valid_sessions": len(valid_sessions),
                "total_requests": sum(self.active_sessions[s]["request_count"] for s in sessions if s in self.active_sessions)
            }
        
        return {
            "active_sessions": len(self.active_sessions),
            "expired_sessions": self.expired_sessions,
            "total_sessions_created": self.total_sessions_created,
            "total_requests": self.total_requests,
            "session_categories": len(self.category_sessions),
            "category_stats": category_stats,
            "max_sessions": self.max_sessions,
            "max_lifetime": self.max_lifetime,
            "max_requests_per_session": self.max_requests_per_session
        }
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific session.
        
        Args:
            session_id: Session ID to get info for
            
        Returns:
            Dictionary with session info or None if session not found
        """
        if session_id not in self.active_sessions:
            return None
            
        session_data = self.active_sessions[session_id]
        now = time.time()
        
        return {
            "session_id": session_id,
            "category": session_data["category"],
            "created_at": datetime.fromtimestamp(session_data["created_at"]).isoformat(),
            "last_used": datetime.fromtimestamp(session_data["last_used"]).isoformat(),
            "request_count": session_data["request_count"],
            "idle_time": now - session_data["last_used"],
            "lifetime": now - session_data["created_at"],
            "remaining_lifetime": max(0, self.max_lifetime - (now - session_data["created_at"])),
            "remaining_requests": max(0, self.max_requests_per_session - session_data["request_count"]),
            "is_valid": self.is_session_valid(session_id)
        }
    
    def get_sessions_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get information about all sessions for a category.
        
        Args:
            category: Category to get sessions for
            
        Returns:
            List of session info dictionaries
        """
        if category not in self.category_sessions:
            return []
            
        return [
            self.get_session_info(session_id)
            for session_id in self.category_sessions[category]
            if session_id in self.active_sessions
        ]
    
    def get_all_sessions(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all active sessions.
        
        Returns:
            Dictionary mapping session IDs to session info
        """
        # Clean up expired sessions first
        self._clean_expired_sessions()
        
        return {
            session_id: self.get_session_info(session_id)
            for session_id in self.active_sessions
        }


class SessionPool:
    """Pool of sessions for different scraping purposes.
    
    This class provides a higher-level interface for managing sessions
    organized by purpose, with automatic rotation and distribution.
    """
    
    def __init__(self, session_manager: SessionManager):
        """Initialize the session pool.
        
        Args:
            session_manager: Session manager instance
        """
        self.session_manager = session_manager
        self.purpose_sessions = {}  # purpose -> [session_ids]
        self.session_purposes = {}  # session_id -> purpose
        self.logger = logging.getLogger("session-pool")
        
        # Set up logging
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def get_session(self, purpose: str, context: Optional[str] = None) -> str:
        """Get a session for a specific purpose.
        
        Args:
            purpose: Purpose of the session (e.g., 'product_scraping', 'search')
            context: Optional context for the session (e.g., category, search term)
            
        Returns:
            Session ID to use
        """
        # Create a category that combines purpose and context
        category = purpose
        if context:
            category = f"{purpose}_{context}"
            
        # Get a session for this category
        session_id = self.session_manager.get_session_for_category(category)
        
        # Track this session's purpose if it's new
        if session_id not in self.session_purposes:
            self.session_purposes[session_id] = purpose
            
            # Add to purpose mapping
            if purpose not in self.purpose_sessions:
                self.purpose_sessions[purpose] = []
            self.purpose_sessions[purpose].append(session_id)
        
        return session_id
    
    def update_session_usage(self, session_id: str) -> None:
        """Update session usage.
        
        Args:
            session_id: Session ID to update
            
        Raises:
            SessionExpiredError: If session is expired or invalid
        """
        self.session_manager.update_session_usage(session_id)
    
    def get_stats_by_purpose(self) -> Dict[str, Any]:
        """Get session statistics organized by purpose.
        
        Returns:
            Dictionary with session statistics by purpose
        """
        purpose_stats = {}
        
        for purpose, sessions in self.purpose_sessions.items():
            # Filter to sessions that still exist and are valid
            valid_sessions = [
                s for s in sessions 
                if s in self.session_manager.active_sessions and
                self.session_manager.is_session_valid(s)
            ]
            
            purpose_stats[purpose] = {
                "total_sessions": len(sessions),
                "valid_sessions": len(valid_sessions),
                "requests": sum(
                    self.session_manager.active_sessions[s]["request_count"]
                    for s in valid_sessions
                )
            }
        
        return {
            "purposes": len(self.purpose_sessions),
            "purpose_stats": purpose_stats,
            "overall_stats": self.session_manager.get_stats()
        }