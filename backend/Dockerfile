FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# GeoDjango system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends binutils libproj-dev gdal-bin osmium-tool \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
# entrypoint.sh is bind-mounted from the host checkout; strip Windows CR line endings at
# runtime so a CRLF checkout still works ("set: Illegal option -").
ENTRYPOINT ["sh", "-c", "tr -d '\\r' < ./entrypoint.sh > /tmp/entrypoint.sh && exec sh /tmp/entrypoint.sh \"$@\"", "entrypoint"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
