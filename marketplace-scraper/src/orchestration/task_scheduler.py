"""
Task scheduler for marketplace data collection.

This module provides a scheduler for recurring marketplace data collection tasks,
with specific optimizations for South African market conditions like load shedding.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Callable

# Local imports
from ..common import MarketplaceScraper, NetworkError, LoadSheddingDetectedError


class TaskScheduler:
    """Scheduler for marketplace data collection tasks.
    
    This class manages scheduling and execution of data collection tasks,
    with features for load shedding awareness, prioritization, and adaptive scheduling.
    """
    
    def __init__(self, 
                 scrapers: Dict[str, MarketplaceScraper],
                 max_concurrent_tasks: int = 5,
                 task_interval: float = 1.0):
        """Initialize the task scheduler.
        
        Args:
            scrapers: Dictionary of marketplace scrapers (key: marketplace name)
            max_concurrent_tasks: Maximum number of concurrent tasks
            task_interval: Minimum interval between task starts (in seconds)
        """
        self.scrapers = scrapers
        self.max_concurrent_tasks = max_concurrent_tasks
        self.task_interval = task_interval
        
        # Set up logging
        self.logger = logging.getLogger("task-scheduler")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        # Task tracking
        self.active_tasks = set()
        self.completed_tasks = []
        self.failed_tasks = []
        self.task_queue = asyncio.Queue()
        self.last_task_time = 0
        
        # Load shedding detection
        self.load_shedding_detected = False
        self.load_shedding_until = None
        self.consecutive_failures = 0
        self.failure_threshold = 5  # Number of failures to assume load shedding
        
        # Statistics
        self.tasks_scheduled = 0
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.start_time = datetime.now()
        
    async def schedule_task(self, 
                          task_type: str, 
                          marketplace: str, 
                          params: Dict[str, Any],
                          priority: int = 1) -> str:
        """Schedule a task for execution.
        
        Args:
            task_type: Type of task (discover_products, extract_product, search, etc.)
            marketplace: Marketplace name
            params: Task parameters
            priority: Task priority (1-10, higher is more important)
            
        Returns:
            Task ID
            
        Raises:
            ValueError: If marketplace is not supported or task type is invalid
        """
        if marketplace not in self.scrapers:
            raise ValueError(f"Unsupported marketplace: {marketplace}")
            
        # Generate task ID
        task_id = f"{marketplace}_{task_type}_{int(time.time())}_{self.tasks_scheduled}"
        
        # Create task
        task = {
            "id": task_id,
            "type": task_type,
            "marketplace": marketplace,
            "params": params,
            "priority": priority,
            "scheduled_at": datetime.now().isoformat(),
            "status": "queued"
        }
        
        # Add to queue
        await self.task_queue.put((priority * -1, task))  # Negative priority for heapq
        self.tasks_scheduled += 1
        
        self.logger.info(f"Scheduled task {task_id} ({task_type} for {marketplace})")
        
        return task_id
        
    async def run(self, max_runtime: Optional[float] = None) -> Dict[str, Any]:
        """Run the scheduler.
        
        Args:
            max_runtime: Maximum runtime in seconds (None for unlimited)
            
        Returns:
            Scheduler statistics
        """
        start_time = time.time()
        self.logger.info(f"Starting scheduler with {self.task_queue.qsize()} initial tasks")
        
        # Create worker tasks
        workers = [
            asyncio.create_task(self._worker())
            for _ in range(self.max_concurrent_tasks)
        ]
        
        try:
            # Run until queue is empty or max_runtime is reached
            while not self.task_queue.empty():
                if max_runtime and (time.time() - start_time) > max_runtime:
                    self.logger.info(f"Maximum runtime of {max_runtime}s reached, stopping scheduler")
                    break
                    
                await asyncio.sleep(0.1)
                
            # Cancel workers
            for worker in workers:
                worker.cancel()
                
            # Wait for workers to finish
            await asyncio.gather(*workers, return_exceptions=True)
            
        except asyncio.CancelledError:
            self.logger.info("Scheduler cancelled")
            # Cancel workers
            for worker in workers:
                worker.cancel()
            raise
        except Exception as e:
            self.logger.error(f"Scheduler error: {str(e)}")
            raise
        finally:
            # Return statistics
            return self._get_statistics()
            
    async def _worker(self) -> None:
        """Worker task for processing queued tasks."""
        while True:
            try:
                # Check for load shedding
                if self.load_shedding_detected:
                    if datetime.now() < self.load_shedding_until:
                        # Still in load shedding period, wait
                        self.logger.info(f"Load shedding active, waiting until {self.load_shedding_until.isoformat()}")
                        await asyncio.sleep(60)  # Wait 1 minute before checking again
                        continue
                    else:
                        # Load shedding period over
                        self.logger.info("Load shedding period ended, resuming normal operation")
                        self.load_shedding_detected = False
                        self.consecutive_failures = 0
                
                # Get next task with highest priority
                _, task = await self.task_queue.get()
                
                # Apply rate limiting
                elapsed = time.time() - self.last_task_time
                if elapsed < self.task_interval:
                    await asyncio.sleep(self.task_interval - elapsed)
                
                self.last_task_time = time.time()
                
                # Execute task
                self.logger.info(f"Starting task {task['id']} ({task['type']} for {task['marketplace']})")
                task['status'] = 'running'
                task['started_at'] = datetime.now().isoformat()
                
                # Add to active tasks
                self.active_tasks.add(task['id'])
                
                try:
                    # Get scraper for marketplace
                    scraper = self.scrapers[task['marketplace']]
                    
                    # Execute task
                    result = await self._execute_task(scraper, task['type'], task['params'])
                    
                    # Update task
                    task['status'] = 'completed'
                    task['completed_at'] = datetime.now().isoformat()
                    task['result'] = result
                    
                    # Add to completed tasks
                    self.completed_tasks.append(task)
                    self.tasks_completed += 1
                    
                    # Reset consecutive failures
                    self.consecutive_failures = 0
                    
                except LoadSheddingDetectedError as e:
                    # Handle load shedding
                    self.logger.warning(f"Load shedding detected during task {task['id']}: {str(e)}")
                    task['status'] = 'failed'
                    task['error'] = str(e)
                    task['failed_at'] = datetime.now().isoformat()
                    
                    # Add to failed tasks
                    self.failed_tasks.append(task)
                    self.tasks_failed += 1
                    
                    # Set load shedding flag
                    self.load_shedding_detected = True
                    self.load_shedding_until = datetime.now() + timedelta(hours=2)  # Assume 2 hours of load shedding
                    
                    # Requeue task with delay
                    task['status'] = 'queued'
                    task['requeued_at'] = datetime.now().isoformat()
                    await self.task_queue.put((task['priority'] * -1, task))
                    
                except NetworkError as e:
                    # Handle network error
                    self.logger.error(f"Network error during task {task['id']}: {str(e)}")
                    task['status'] = 'failed'
                    task['error'] = str(e)
                    task['failed_at'] = datetime.now().isoformat()
                    
                    # Add to failed tasks
                    self.failed_tasks.append(task)
                    self.tasks_failed += 1
                    
                    # Increment consecutive failures
                    self.consecutive_failures += 1
                    
                    # Check if we should detect load shedding
                    if self.consecutive_failures >= self.failure_threshold:
                        self.logger.warning(f"Possible load shedding detected after {self.consecutive_failures} consecutive failures")
                        self.load_shedding_detected = True
                        self.load_shedding_until = datetime.now() + timedelta(hours=2)  # Assume 2 hours of load shedding
                    
                    # Requeue task with exponential backoff
                    task['status'] = 'queued'
                    task['retries'] = task.get('retries', 0) + 1
                    task['requeued_at'] = datetime.now().isoformat()
                    
                    # Lower priority for retries
                    retry_priority = max(0, task['priority'] - 1)
                    await self.task_queue.put((retry_priority * -1, task))
                    
                except Exception as e:
                    # Handle other errors
                    self.logger.error(f"Error during task {task['id']}: {str(e)}")
                    task['status'] = 'failed'
                    task['error'] = str(e)
                    task['failed_at'] = datetime.now().isoformat()
                    
                    # Add to failed tasks
                    self.failed_tasks.append(task)
                    self.tasks_failed += 1
                    
                finally:
                    # Remove from active tasks
                    self.active_tasks.discard(task['id'])
                    
                    # Mark task as done
                    self.task_queue.task_done()
                    
            except asyncio.CancelledError:
                self.logger.info("Worker cancelled")
                break
                
            except Exception as e:
                self.logger.error(f"Worker error: {str(e)}")
                await asyncio.sleep(1)  # Prevent tight error loop
                
    async def _execute_task(self, 
                           scraper: MarketplaceScraper, 
                           task_type: str, 
                           params: Dict[str, Any]) -> Any:
        """Execute a specific task.
        
        Args:
            scraper: Marketplace scraper to use
            task_type: Type of task
            params: Task parameters
            
        Returns:
            Task result
            
        Raises:
            ValueError: If task type is not supported
        """
        if task_type == 'discover_products':
            return await scraper.discover_products(
                category=params.get('category'),
                page=params.get('page', 1),
                limit=params.get('limit', 50)
            )
        elif task_type == 'extract_product':
            return await scraper.extract_product_details(
                params.get('product_id') or params.get('url')
            )
        elif task_type == 'search':
            return await scraper.search_products(
                keyword=params.get('keyword'),
                page=params.get('page', 1),
                limit=params.get('limit', 50)
            )
        elif task_type == 'extract_category':
            return await scraper.extract_category(
                params.get('category_id') or params.get('url')
            )
        elif task_type == 'extract_suggestions':
            return await scraper.extract_search_suggestions(
                params.get('prefix')
            )
        elif task_type == 'extract_daily_deals':
            return await scraper.extract_daily_deals()
        else:
            raise ValueError(f"Unsupported task type: {task_type}")
            
    def _get_statistics(self) -> Dict[str, Any]:
        """Get scheduler statistics.
        
        Returns:
            Dictionary with statistics
        """
        runtime = datetime.now() - self.start_time
        
        return {
            "runtime_seconds": runtime.total_seconds(),
            "tasks_scheduled": self.tasks_scheduled,
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "success_rate": (self.tasks_completed / self.tasks_scheduled * 100) if self.tasks_scheduled > 0 else 0,
            "queue_size": self.task_queue.qsize(),
            "active_tasks": len(self.active_tasks),
            "load_shedding_detected": self.load_shedding_detected,
            "load_shedding_until": self.load_shedding_until.isoformat() if self.load_shedding_until else None,
            "consecutive_failures": self.consecutive_failures
        }