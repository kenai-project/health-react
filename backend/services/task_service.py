"""TaskService — Abstracted background task execution.

Initially uses FastAPI BackgroundTasks.
Future: swap to Celery, RQ, or APScheduler without changing calling code.
"""

import logging
from typing import Callable, Any
from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


class TaskService:
    """
    Abstracted background task execution.

    Usage:
        task_service = TaskService()
        task_service.submit(background_tasks, my_task, arg1, arg2)
    """

    def __init__(self):
        self._implementation = "background_tasks"
        # Future: self._implementation = "celery" | "rq" | "apscheduler"

    def submit(self, background_tasks: BackgroundTasks, task: Callable, *args, **kwargs) -> str:
        """
        Submit a task for background execution.

        Args:
            background_tasks: FastAPI BackgroundTasks instance
            task: Callable to execute
            *args, **kwargs: Arguments for the task

        Returns:
            task_id: Identifier for the task
        """
        task_id = f"task_{id(task)}_{hash(str(args))}"

        if self._implementation == "background_tasks":
            background_tasks.add_task(self._run_task, task, task_id, *args, **kwargs)
        # Future: elif self._implementation == "celery":
        #     celery_task.delay(*args, **kwargs)

        logger.info("Task submitted: %s (%s)", task.__name__, task_id)
        return task_id

    def _run_task(self, task: Callable, task_id: str, *args, **kwargs):
        """Wrapper to log task execution."""
        logger.info("Task started: %s (%s)", task.__name__, task_id)
        try:
            result = task(*args, **kwargs)
            logger.info("Task completed: %s (%s)", task.__name__, task_id)
            return result
        except Exception as e:
            logger.error("Task failed: %s (%s): %s", task.__name__, task_id, str(e))
            raise


# Singleton instance
task_service = TaskService()