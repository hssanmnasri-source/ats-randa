from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ats_randa",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.cv_tasks", "app.tasks.offer_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Tunis",
    enable_utc=True,
)
