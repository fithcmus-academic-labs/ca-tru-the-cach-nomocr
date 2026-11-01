import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from celery import Celery
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    Celery = None

if CELERY_AVAILABLE:
    celery_app = Celery(
        "sinonom_worker",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=["app.workers.tasks"]
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=3600, # 1 hour max per task
        worker_prefetch_multiplier=1
    )
else:
    celery_app = None
    logger.warning("Celery is not installed on this environment.")
