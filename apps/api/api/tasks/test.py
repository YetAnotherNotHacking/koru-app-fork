from api.core.celery import app


@app.task
def test_task():
    return "And hello from Celery!"
